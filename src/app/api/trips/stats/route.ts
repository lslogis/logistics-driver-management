import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { TripService } from '@/lib/services/trip.service'
import { withAuth } from '@/lib/auth/rbac'
import { apiResponse } from '@/lib/auth/server'

const tripService = new TripService(prisma)

// 통계 쿼리 스키마
const statsQuerySchema = z.object({
  dateFrom: z
    .string()
    .datetime({ message: '올바른 시작 날짜 형식이 아닙니다' }),
  
  dateTo: z
    .string()
    .datetime({ message: '올바른 종료 날짜 형식이 아닙니다' })
})

/**
 * GET /api/trips/stats - 날짜별 운행 통계
 */
export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url)
      const { dateFrom, dateTo } = statsQuerySchema.parse({
        dateFrom: searchParams.get('dateFrom') || '',
        dateTo: searchParams.get('dateTo') || ''
      })
      
      const stats = await tripService.getTripStatsByDateRange(dateFrom, dateTo)
      
      return apiResponse.success({
        dateFrom,
        dateTo,
        stats,
        summary: {
          total: Object.values(stats).reduce((sum: number, stat: any) => sum + stat.count, 0),
          totalDriverFare: Object.values(stats).reduce((sum: number, stat: any) => sum + parseFloat(stat.totalDriverFare), 0).toString(),
          totalBillingFare: Object.values(stats).reduce((sum: number, stat: any) => sum + parseFloat(stat.totalBillingFare), 0).toString()
        }
      })
    } catch (error) {
      console.error('Failed to get trip stats:', error)
      
      if (error instanceof Error) {
        return apiResponse.error(error.message)
      }
      
      return apiResponse.error('운행 통계 조회 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'trips', action: 'read' }
)