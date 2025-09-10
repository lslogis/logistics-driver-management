import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TripService } from '@/lib/services/trip.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog, apiResponse } from '@/lib/auth/server'
import { createTripSchema, getTripsQuerySchema } from '@/lib/validations/trip'

const tripService = new TripService(prisma)

/**
 * GET /api/trips - 운행 목록 조회
 */
export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url)
      const query = getTripsQuerySchema.parse({
        page: searchParams.get('page') || '1',
        limit: searchParams.get('limit') || '20',
        search: searchParams.get('search') || undefined,
        status: searchParams.get('status') || undefined,
        driverId: searchParams.get('driverId') || undefined,
        vehicleId: searchParams.get('vehicleId') || undefined,
        routeTemplateId: searchParams.get('routeTemplateId') || undefined,
        dateFrom: searchParams.get('dateFrom') || undefined,
        dateTo: searchParams.get('dateTo') || undefined,
        sortBy: searchParams.get('sortBy') || 'date',
        sortOrder: searchParams.get('sortOrder') || 'desc'
      })
      
      const result = await tripService.getTrips(query)
      return apiResponse.success(result)
    } catch (error) {
      console.error('Failed to get trips:', error)
      
      if (error instanceof Error) {
        return apiResponse.error(error.message)
      }
      
      return apiResponse.error('운행 목록 조회 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'trips', action: 'read' }
)

/**
 * POST /api/trips - 운행 등록
 */
export const POST = withAuth(
  async (req: NextRequest) => {
    try {
      const user = await getCurrentUser(req)
      if (!user) {
        return apiResponse.unauthorized()
      }

      // 요청 데이터 검증
      const body = await req.json()
      const data = createTripSchema.parse(body)
      
      // 운행 생성
      const trip = await tripService.createTrip(data)
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        'CREATE',
        'Trip',
        trip.id,
        data,
        { source: 'web_api' }
      )
      
      return apiResponse.success(trip, 201)
    } catch (error) {
      console.error('Failed to create trip:', error)
      
      if (error instanceof Error) {
        return apiResponse.error(error.message)
      }
      
      return apiResponse.error('운행 등록 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'trips', action: 'create' }
)