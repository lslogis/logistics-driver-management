import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/rbac'
import { 
  rateCalculationQuerySchema, 
  normalizeRegions, 
  calculateRateFactors,
  type RateCalculationResponse 
} from '@/lib/validations/rate-simplified'

/**
 * GET /api/rates/calculate - 새로운 단순화된 요금 계산
 * 
 * 계산 로직:
 * 1. baseRegion = regions[0] (첫 번째 지역)
 * 2. baseFare = RateBase lookup (centerName, tonnage, baseRegion)
 * 3. {perStop, perWaypoint} = RateAddons lookup (centerName, tonnage)
 * 4. X = max(stopsTotal - 1, 0), Y = max(distinctRegions - 1, 0)
 * 5. total = baseFare + X*perStop + Y*perWaypoint
 */
export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url)
      const query = rateCalculationQuerySchema.parse({
        centerName: searchParams.get('centerName'),
        tonnage: searchParams.get('tonnage'),
        regions: searchParams.get('regions') || '',
        stopsTotal: searchParams.get('stopsTotal') || '0'
      })

      // Normalize and process regions
      const regions = normalizeRegions(query.regions)
      const baseRegion = regions[0] || null
      
      // Calculate rate factors
      const { X, Y, distinctRegions } = calculateRateFactors(query.stopsTotal, regions)
      
      // Look up base fare (only if baseRegion exists)
      let baseFare = 0
      if (baseRegion) {
        const rateBase = await prisma.rateBase.findFirst({
          where: {
            centerName: query.centerName,
            tonnage: query.tonnage,
            region: baseRegion
          }
        })
        baseFare = rateBase?.baseFare || 0
      }
      
      // Look up addon rates
      const rateAddons = await prisma.rateAddons.findFirst({
        where: {
          centerName: query.centerName,
          tonnage: query.tonnage
        }
      })
      
      const perStop = rateAddons?.perStop || 0
      const perWaypoint = rateAddons?.perWaypoint || 0
      
      // Calculate final amounts
      const callFee = X * perStop
      const waypointFee = Y * perWaypoint
      const total = baseFare + callFee + waypointFee
      
      // Determine missing components
      const missing: string[] = []
      if (baseRegion && baseFare === 0) missing.push('BASE')
      if (perStop === 0) missing.push('CALL')
      if (perWaypoint === 0) missing.push('WAYPOINT')
      
      const response: RateCalculationResponse = {
        baseFare,
        callFee,
        waypointFee,
        total,
        meta: {
          baseRegion,
          X,
          Y,
          perStop,
          perWaypoint,
          distinctRegions,
          missing
        }
      }
      
      return NextResponse.json({ 
        ok: true, 
        data: response
      })
      
    } catch (error) {
      console.error('Failed to calculate rate:', error)
      
      if (error instanceof ZodError) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '요청 파라미터가 올바르지 않습니다',
            details: error.errors
          }
        }, { status: 400 })
      }
      
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '요금 계산 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'rates', action: 'read' }
)