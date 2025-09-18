import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/rbac'
import { isFeatureEnabled } from '@/lib/feature-flags'

interface BusinessMetrics {
  systemStatus: {
    activeDrivers: number
    totalDrivers: number
    activeLoadingPoints: number
    totalLoadingPoints: number
    centerFareRules: number
    totalDispatches: number
    lastUpdated: string
  }
  requestAnalysis: {
    thisMonthRequests: number
    lastMonthRequests: number
    requestChangePercent: number
    avgDispatchesPerRequest: number
    dispatchRate: number
    topRequestedRoutes: Array<{
      centerCarNo: string
      requestCount: number
      dispatchCount: number
    }>
  }
  dispatchAnalysis: {
    thisMonthDispatches: number
    lastMonthDispatches: number
    dispatchChangePercent: number
    avgDriverFee: number
    topDrivers: Array<{
      driverName: string
      dispatchCount: number
      totalFees: number
    }>
  }
  fareAnalysis: {
    totalRules: number
    basicRules: number
    stopFeeRules: number
    avgBaseFare: number
    avgExtraFee: number
    centerBreakdown: Array<{
      centerName: string
      ruleCount: number
      avgFare: number
    }>
  }
  volume: {
    thisMonthRequests: number
    lastMonthRequests: number
    volumeChangePercent: number
    centerVolumeBreakdown: Array<{
      centerName: string
      requestCount: number
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

      // Calculate metrics based on current system data
      const metrics = await calculateCurrentMetrics(thisMonthStart, lastMonthStart, lastMonthEnd, includeRates)

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

async function calculateCurrentMetrics(thisMonthStart: Date, lastMonthStart: Date, lastMonthEnd: Date, includeRates: boolean): Promise<BusinessMetrics> {
  // System status metrics
  const [totalDrivers, activeDrivers] = await Promise.all([
    prisma.driver.count(),
    prisma.driver.count({ where: { isActive: true } })
  ])

  const [totalLoadingPoints, activeLoadingPoints] = await Promise.all([
    prisma.loadingPoint.count(),
    prisma.loadingPoint.count({ where: { isActive: true } })
  ])

  const centerFareRules = await prisma.centerFare.count()
  const totalDispatches = await prisma.dispatch.count()

  // Request analysis
  const thisMonthRequests = await prisma.request.findMany({
    where: {
      requestDate: { gte: thisMonthStart }
    },
    include: {
      _count: {
        select: { dispatches: true }
      }
    }
  })

  const lastMonthRequests = await prisma.request.findMany({
    where: {
      requestDate: {
        gte: lastMonthStart,
        lte: lastMonthEnd
      }
    },
    include: {
      _count: {
        select: { dispatches: true }
      }
    }
  })

  const thisMonthRequestCount = thisMonthRequests.length
  const lastMonthRequestCount = lastMonthRequests.length
  
  const requestChangePercent = lastMonthRequestCount > 0 ? 
    ((thisMonthRequestCount - lastMonthRequestCount) / lastMonthRequestCount) * 100 : 0

  // Calculate dispatch statistics
  const thisMonthDispatchCount = thisMonthRequests.reduce((sum, req) => sum + req._count.dispatches, 0)
  const avgDispatchesPerRequest = thisMonthRequestCount > 0 ? 
    thisMonthDispatchCount / thisMonthRequestCount : 0
  
  const dispatchRate = thisMonthRequestCount > 0 ?
    (thisMonthRequests.filter(r => r._count.dispatches > 0).length / thisMonthRequestCount) * 100 : 0

  // Top requested routes
  const routeMap = new Map<string, { requestCount: number, dispatchCount: number }>()
  for (const request of thisMonthRequests) {
    const key = request.centerCarNo
    if (!routeMap.has(key)) {
      routeMap.set(key, { requestCount: 0, dispatchCount: 0 })
    }
    const route = routeMap.get(key)!
    route.requestCount += 1
    route.dispatchCount += request._count.dispatches
  }

  const topRequestedRoutes = Array.from(routeMap.entries())
    .map(([centerCarNo, data]) => ({
      centerCarNo,
      requestCount: data.requestCount,
      dispatchCount: data.dispatchCount
    }))
    .sort((a, b) => b.requestCount - a.requestCount)
    .slice(0, 10)

  // Dispatch analysis
  const thisMonthDispatches = await prisma.dispatch.findMany({
    where: {
      request: {
        requestDate: { gte: thisMonthStart }
      }
    }
  })

  const lastMonthDispatches = await prisma.dispatch.findMany({
    where: {
      request: {
        requestDate: {
          gte: lastMonthStart,
          lte: lastMonthEnd
        }
      }
    }
  })

  const thisMonthDispatchTotal = thisMonthDispatches.length
  const lastMonthDispatchTotal = lastMonthDispatches.length
  
  const dispatchChangePercent = lastMonthDispatchTotal > 0 ?
    ((thisMonthDispatchTotal - lastMonthDispatchTotal) / lastMonthDispatchTotal) * 100 : 0

  const avgDriverFee = thisMonthDispatches.length > 0 ?
    thisMonthDispatches.reduce((sum, d) => sum + (d.driverFee || 0), 0) / thisMonthDispatches.length : 0

  // Top drivers by dispatch count
  const driverMap = new Map<string, { dispatchCount: number, totalFees: number }>()
  for (const dispatch of thisMonthDispatches) {
    const key = dispatch.driverName
    if (!driverMap.has(key)) {
      driverMap.set(key, { dispatchCount: 0, totalFees: 0 })
    }
    const driver = driverMap.get(key)!
    driver.dispatchCount += 1
    driver.totalFees += dispatch.driverFee || 0
  }

  const topDrivers = Array.from(driverMap.entries())
    .map(([driverName, data]) => ({
      driverName,
      dispatchCount: data.dispatchCount,
      totalFees: data.totalFees
    }))
    .sort((a, b) => b.dispatchCount - a.dispatchCount)
    .slice(0, 10)

  // Center fare analysis
  const centerFares = await prisma.centerFare.findMany({
    include: {
      loadingPoint: {
        select: {
          centerName: true
        }
      }
    }
  })

  const fareAnalysis = calculateFareAnalysis(centerFares)

  // Center volume breakdown using actual Request data
  const centerVolumeMap = new Map<string, number>()
  
  // Get requests with loading point data if available
  const requestsWithCenter = await prisma.request.findMany({
    where: {
      requestDate: { gte: thisMonthStart }
    },
    include: {
      loadingPoint: {
        select: { centerName: true }
      }
    }
  })

  // Count requests per center
  for (const request of requestsWithCenter) {
    const centerName = request.loadingPoint?.centerName || '기타'
    centerVolumeMap.set(centerName, (centerVolumeMap.get(centerName) || 0) + 1)
  }

  const totalRequests = requestsWithCenter.length
  const centerVolumeBreakdown = Array.from(centerVolumeMap.entries())
    .map(([centerName, requestCount]) => ({
      centerName,
      requestCount,
      sharePercent: totalRequests > 0 ? Math.round((requestCount / totalRequests) * 10000) / 100 : 0
    }))
    .sort((a, b) => b.requestCount - a.requestCount)
    .slice(0, 10)

  return {
    systemStatus: {
      activeDrivers,
      totalDrivers,
      activeLoadingPoints,
      totalLoadingPoints,
      centerFareRules,
      totalDispatches,
      lastUpdated: new Date().toISOString()
    },
    requestAnalysis: {
      thisMonthRequests: thisMonthRequestCount,
      lastMonthRequests: lastMonthRequestCount,
      requestChangePercent: Math.round(requestChangePercent * 100) / 100,
      avgDispatchesPerRequest: Math.round(avgDispatchesPerRequest * 100) / 100,
      dispatchRate: Math.round(dispatchRate * 100) / 100,
      topRequestedRoutes
    },
    dispatchAnalysis: {
      thisMonthDispatches: thisMonthDispatchTotal,
      lastMonthDispatches: lastMonthDispatchTotal,
      dispatchChangePercent: Math.round(dispatchChangePercent * 100) / 100,
      avgDriverFee: Math.round(avgDriverFee),
      topDrivers
    },
    fareAnalysis,
    volume: {
      thisMonthRequests: thisMonthRequestCount,
      lastMonthRequests: lastMonthRequestCount,
      volumeChangePercent: Math.round(requestChangePercent * 100) / 100,
      centerVolumeBreakdown
    }
  }
}

function calculateFareAnalysis(centerFares: any[]): BusinessMetrics['fareAnalysis'] {
  const basicRules = centerFares.filter(f => f.fareType === 'BASIC').length
  const stopFeeRules = centerFares.filter(f => f.fareType === 'STOP_FEE').length
  
  // Calculate average fares
  const basicFares = centerFares.filter(f => f.fareType === 'BASIC' && f.baseFare).map(f => f.baseFare)
  const avgBaseFare = basicFares.length > 0 ? 
    Math.round(basicFares.reduce((sum, fare) => sum + fare, 0) / basicFares.length) : 0

  const extraFees = centerFares.filter(f => f.fareType === 'STOP_FEE' && f.extraStopFee).map(f => f.extraStopFee)
  const avgExtraFee = extraFees.length > 0 ?
    Math.round(extraFees.reduce((sum, fee) => sum + fee, 0) / extraFees.length) : 0

  // Center breakdown
  const centerMap = new Map<string, { ruleCount: number, totalFare: number, fareCount: number }>()
  
  for (const fare of centerFares) {
    const centerName = fare.loadingPoint?.centerName || '기타'
    if (!centerMap.has(centerName)) {
      centerMap.set(centerName, { ruleCount: 0, totalFare: 0, fareCount: 0 })
    }
    
    const center = centerMap.get(centerName)!
    center.ruleCount += 1
    
    const fareValue = fare.baseFare || fare.extraStopFee || 0
    if (fareValue > 0) {
      center.totalFare += fareValue
      center.fareCount += 1
    }
  }

  const centerBreakdown = Array.from(centerMap.entries())
    .map(([centerName, data]) => ({
      centerName,
      ruleCount: data.ruleCount,
      avgFare: data.fareCount > 0 ? Math.round(data.totalFare / data.fareCount) : 0
    }))
    .sort((a, b) => b.ruleCount - a.ruleCount)
    .slice(0, 10)

  return {
    totalRules: centerFares.length,
    basicRules,
    stopFeeRules,
    avgBaseFare,
    avgExtraFee,
    centerBreakdown
  }
}