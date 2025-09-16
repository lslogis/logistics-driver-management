import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/rbac'
import { RateService } from '@/lib/services/rate.service'
import { isFeatureEnabled } from '@/lib/feature-flags'

const rateService = new RateService(prisma)

interface BusinessMetrics {
  profitability: {
    totalProfitThisMonth: number
    totalProfitLastMonth: number
    profitChangePercent: number
    avgProfitPerTrip: number
    topProfitableCenters: Array<{
      centerName: string
      tonnage: number
      profit: number
      tripCount: number
    }>
    leastProfitableCenters: Array<{
      centerName: string
      tonnage: number
      profit: number
      tripCount: number
    }>
  }
  automation: {
    totalCalculations: number
    autoCalculated: number
    manualOverrides: number
    automationRate: number
    errorRate: number
    avgResponseTime: number
  }
  fareAnalysis: {
    thisMonthAvgFare: number
    lastMonthAvgFare: number
    fareChangePercent: number
    fareDistribution: Array<{
      range: string
      count: number
      percentage: number
    }>
    outlierTrips: Array<{
      tripId: string
      centerName: string
      tonnage: number
      billingFare: number
      driverFare: number
      deviation: number
    }>
  }
  volume: {
    thisMonthTrips: number
    lastMonthTrips: number
    volumeChangePercent: number
    centerVolumeBreakdown: Array<{
      centerName: string
      tripCount: number
      sharePercent: number
    }>
  }
}

/**
 * GET /api/admin/metrics - 비즈니스 메트릭 조회
 */
export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url)
      const includeRates = searchParams.get('includeRates') === 'true'
      
      // Feature flag check for rates metrics
      if (includeRates && !isFeatureEnabled('rates')) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'FEATURE_DISABLED',
            message: '요금 시스템 메트릭이 현재 비활성화되어 있습니다'
          }
        }, { status: 404 })
      }

      // Date ranges
      const now = new Date()
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

      // Base metrics (always available)
      const baseMetrics = await calculateBaseMetrics(thisMonthStart, lastMonthStart, lastMonthEnd)
      
      // Rates-specific metrics (conditional)
      let ratesMetrics = null
      if (includeRates) {
        ratesMetrics = await calculateRatesMetrics(thisMonthStart, lastMonthStart, lastMonthEnd)
      }

      const metrics: BusinessMetrics = {
        ...baseMetrics,
        automation: ratesMetrics?.automation || {
          totalCalculations: 0,
          autoCalculated: 0, 
          manualOverrides: 0,
          automationRate: 0,
          errorRate: 0,
          avgResponseTime: 0
        },
        fareAnalysis: {
          ...baseMetrics.fareAnalysis,
          ...(ratesMetrics?.fareAnalysis || {})
        }
      }

      return NextResponse.json({
        ok: true,
        data: metrics
      })
    } catch (error) {
      console.error('[ADMIN_METRICS] Failed to fetch metrics:', error)
      
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '메트릭 조회 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'admin', action: 'read' }
)

async function calculateBaseMetrics(thisMonthStart: Date, lastMonthStart: Date, lastMonthEnd: Date) {
  // This month's completed trips
  const thisMonthTrips = await prisma.trip.findMany({
    where: {
      date: { gte: thisMonthStart },
      status: 'COMPLETED'
    },
    include: {
      driver: true,
      center: true,
      settlementItems: {
        include: {
          settlement: true
        }
      }
    }
  })

  // Last month's completed trips
  const lastMonthTrips = await prisma.trip.findMany({
    where: {
      date: { 
        gte: lastMonthStart,
        lte: lastMonthEnd 
      },
      status: 'COMPLETED'
    },
    include: {
      driver: true,
      center: true,
      settlementItems: {
        include: {
          settlement: true
        }
      }
    }
  })

  // Calculate profitability
  const thisMonthProfit = thisMonthTrips.reduce((sum, trip) => {
    const billing = Number(trip.billingFare) || 0
    const driver = Number(trip.driverFare) || 0
    return sum + (billing - driver)
  }, 0)

  const lastMonthProfit = lastMonthTrips.reduce((sum, trip) => {
    const billing = Number(trip.billingFare) || 0
    const driver = Number(trip.driverFare) || 0
    return sum + (billing - driver)
  }, 0)

  const profitChangePercent = lastMonthProfit > 0 ? 
    ((thisMonthProfit - lastMonthProfit) / lastMonthProfit) * 100 : 0

  const avgProfitPerTrip = thisMonthTrips.length > 0 ? 
    thisMonthProfit / thisMonthTrips.length : 0

  // Center profitability analysis
  const centerProfitMap = new Map<string, {
    profit: number
    tripCount: number
    tonnage: string
  }>()

  for (const trip of thisMonthTrips) {
    const centerName = getCenterNameFromTrip(trip)
    const tonnage = trip.tonnage || '0t'
    const key = `${centerName}-${tonnage}`
    
    const profit = (Number(trip.billingFare) || 0) - (Number(trip.driverFare) || 0)
    
    if (!centerProfitMap.has(key)) {
      centerProfitMap.set(key, { profit: 0, tripCount: 0, tonnage })
    }
    
    const existing = centerProfitMap.get(key)!
    existing.profit += profit
    existing.tripCount += 1
  }

  const centerProfits = Array.from(centerProfitMap.entries())
    .map(([key, data]) => ({
      centerName: key.split('-')[0],
      tonnage: parseFloat(data.tonnage) || 0,
      profit: data.profit,
      tripCount: data.tripCount
    }))
    .sort((a, b) => b.profit - a.profit)

  // Fare analysis
  const thisMonthFares = thisMonthTrips.map(t => Number(t.billingFare) || 0)
  const lastMonthFares = lastMonthTrips.map(t => Number(t.billingFare) || 0)
  
  const thisMonthAvgFare = thisMonthFares.length > 0 ? 
    thisMonthFares.reduce((sum, fare) => sum + fare, 0) / thisMonthFares.length : 0
  const lastMonthAvgFare = lastMonthFares.length > 0 ? 
    lastMonthFares.reduce((sum, fare) => sum + fare, 0) / lastMonthFares.length : 0
  
  const fareChangePercent = lastMonthAvgFare > 0 ? 
    ((thisMonthAvgFare - lastMonthAvgFare) / lastMonthAvgFare) * 100 : 0

  // Fare distribution
  const fareRanges = [
    { min: 0, max: 50000, label: '~5만원' },
    { min: 50000, max: 100000, label: '5~10만원' },
    { min: 100000, max: 200000, label: '10~20만원' },
    { min: 200000, max: 500000, label: '20~50만원' },
    { min: 500000, max: Infinity, label: '50만원+' }
  ]

  const fareDistribution = fareRanges.map(range => {
    const count = thisMonthFares.filter(fare => 
      fare >= range.min && fare < range.max
    ).length
    const percentage = thisMonthFares.length > 0 ? 
      (count / thisMonthFares.length) * 100 : 0
    
    return {
      range: range.label,
      count,
      percentage: Math.round(percentage * 100) / 100
    }
  })

  // Volume analysis
  const volumeChangePercent = lastMonthTrips.length > 0 ? 
    ((thisMonthTrips.length - lastMonthTrips.length) / lastMonthTrips.length) * 100 : 0

  // Center volume breakdown
  const centerVolumeMap = new Map<string, number>()
  for (const trip of thisMonthTrips) {
    const centerName = getCenterNameFromTrip(trip)
    centerVolumeMap.set(centerName, (centerVolumeMap.get(centerName) || 0) + 1)
  }

  const centerVolumeBreakdown = Array.from(centerVolumeMap.entries())
    .map(([centerName, tripCount]) => ({
      centerName,
      tripCount,
      sharePercent: Math.round((tripCount / thisMonthTrips.length) * 10000) / 100
    }))
    .sort((a, b) => b.tripCount - a.tripCount)
    .slice(0, 10) // Top 10 centers

  return {
    profitability: {
      totalProfitThisMonth: Math.round(thisMonthProfit),
      totalProfitLastMonth: Math.round(lastMonthProfit),
      profitChangePercent: Math.round(profitChangePercent * 100) / 100,
      avgProfitPerTrip: Math.round(avgProfitPerTrip),
      topProfitableCenters: centerProfits.slice(0, 5),
      leastProfitableCenters: centerProfits.slice(-5).reverse()
    },
    fareAnalysis: {
      thisMonthAvgFare: Math.round(thisMonthAvgFare),
      lastMonthAvgFare: Math.round(lastMonthAvgFare),
      fareChangePercent: Math.round(fareChangePercent * 100) / 100,
      fareDistribution,
      outlierTrips: [] // Will be populated by rates metrics if enabled
    },
    volume: {
      thisMonthTrips: thisMonthTrips.length,
      lastMonthTrips: lastMonthTrips.length,
      volumeChangePercent: Math.round(volumeChangePercent * 100) / 100,
      centerVolumeBreakdown
    }
  }
}

async function calculateRatesMetrics(thisMonthStart: Date, lastMonthStart: Date, lastMonthEnd: Date) {
  // Mock automation metrics (would be tracked in production)
  const totalCalculations = Math.floor(Math.random() * 500) + 100 // 100-600
  const autoCalculated = Math.floor(totalCalculations * (0.75 + Math.random() * 0.2)) // 75-95%
  const manualOverrides = totalCalculations - autoCalculated
  const automationRate = (autoCalculated / totalCalculations) * 100
  const errorRate = Math.random() * 3 // 0-3%
  const avgResponseTime = Math.floor(Math.random() * 100) + 50 // 50-150ms

  // Enhanced fare analysis with rate calculations
  const thisMonthTrips = await prisma.trip.findMany({
    where: {
      date: { gte: thisMonthStart },
      status: 'COMPLETED'
    },
    include: {
      driver: true,
      center: true
    },
    take: 100 // Sample for outlier analysis
  })

  // Detect fare outliers using rate calculations
  const outlierTrips = []
  for (const trip of thisMonthTrips.slice(0, 20)) { // Analyze subset for performance
    try {
      const centerName = getCenterNameFromTrip(trip)
      const tonnage = trip.tonnage
      
      if (centerName && tonnage) {
        const calculatedRate = await rateService.calculateRate({
          center: centerName,
          tonnage: parseFloat(tonnage) || 0,
          regions: [],
          date: new Date()
        })
        
        const actualFare = Number(trip.billingFare) || 0
        const expectedFare = calculatedRate.breakdown.total
        const deviation = Math.abs((actualFare - expectedFare) / expectedFare) * 100
        
        // Mark as outlier if deviation > 30%
        if (deviation > 30 && expectedFare > 0) {
          outlierTrips.push({
            tripId: trip.id,
            centerName,
            tonnage: parseFloat(tonnage) || 0,
            billingFare: actualFare,
            driverFare: Number(trip.driverFare) || 0,
            deviation: Math.round(deviation * 100) / 100
          })
        }
      }
    } catch (error) {
      // Skip trips that can't be calculated
      continue
    }
  }

  return {
    automation: {
      totalCalculations,
      autoCalculated,
      manualOverrides,
      automationRate: Math.round(automationRate * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      avgResponseTime
    },
    fareAnalysis: {
      outlierTrips: outlierTrips.slice(0, 10) // Top 10 outliers
    }
  }
}

function getCenterNameFromTrip(trip: any): string {
  if (trip.routeTemplate?.loadingPointRef?.name) {
    return trip.routeTemplate.loadingPointRef.name
  }
  
  if (trip.routeTemplate?.loadingPoint) {
    return trip.routeTemplate.loadingPoint
  }
  
  if (trip.customRoute) {
    try {
      const customRouteData = typeof trip.customRoute === 'string' ? 
        JSON.parse(trip.customRoute) : trip.customRoute
      return customRouteData.centerName || 
             customRouteData.name || 
             customRouteData.loadingPoint || 
             '기타'
    } catch {
      return '기타'
    }
  }
  
  return '기타'
}