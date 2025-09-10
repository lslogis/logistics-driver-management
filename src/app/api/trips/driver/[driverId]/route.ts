import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { TripService } from '@/lib/services/trip.service'
import { withAuth } from '@/lib/auth/rbac'
import { apiResponse } from '@/lib/auth/server'

const tripService = new TripService(prisma)

// 기사별 운행 조회 쿼리 스키마
const driverTripsQuerySchema = z.object({
  dateFrom: z
    .string()
    .datetime({ message: '올바른 시작 날짜 형식이 아닙니다' })
    .optional(),
  
  dateTo: z
    .string()
    .datetime({ message: '올바른 종료 날짜 형식이 아닙니다' })
    .optional()
})

/**
 * GET /api/trips/driver/[driverId] - 기사별 운행 목록 조회
 */
export const GET = withAuth(
  async (req: NextRequest, context: { params?: any } = {}) => {
    try {
      const { driverId } = context.params || {}
      
      if (!driverId) {
        return apiResponse.error('기사 ID가 필요합니다')
      }

      const { searchParams } = new URL(req.url)
      const { dateFrom, dateTo } = driverTripsQuerySchema.parse({
        dateFrom: searchParams.get('dateFrom') || undefined,
        dateTo: searchParams.get('dateTo') || undefined
      })
      
      // 기사 존재 확인
      const driver = await prisma.driver.findUnique({
        where: { id: driverId },
        select: {
          id: true,
          name: true,
          phone: true,
          isActive: true
        }
      })

      if (!driver) {
        return apiResponse.error('기사를 찾을 수 없습니다', 404)
      }
      
      const trips = await tripService.getTripsByDriver(driverId, dateFrom, dateTo)
      
      // 통계 계산
      const stats = {
        total: trips.length,
        byStatus: trips.reduce((acc, trip) => {
          acc[trip.status] = (acc[trip.status] || 0) + 1
          return acc
        }, {} as any),
        totalDriverFare: trips.reduce((sum, trip) => sum + parseFloat(trip.driverFare), 0).toString(),
        totalBillingFare: trips.reduce((sum, trip) => sum + parseFloat(trip.billingFare), 0).toString(),
        totalSubstituteFare: trips
          .filter(trip => trip.substituteFare)
          .reduce((sum, trip) => sum + parseFloat(trip.substituteFare!), 0).toString()
      }
      
      return apiResponse.success({
        driver,
        trips,
        stats,
        dateRange: { dateFrom, dateTo }
      })
    } catch (error) {
      console.error('Failed to get trips by driver:', error)
      
      if (error instanceof Error) {
        return apiResponse.error(error.message)
      }
      
      return apiResponse.error('기사별 운행 조회 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'trips', action: 'read' }
)