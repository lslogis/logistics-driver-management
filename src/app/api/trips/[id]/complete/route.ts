import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TripService } from '@/lib/services/trip.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog, apiResponse } from '@/lib/auth/server'

const tripService = new TripService(prisma)

/**
 * POST /api/trips/[id]/complete - 운행 완료 처리
 */
export const POST = withAuth(
  async (req: NextRequest, context: { params?: any } = {}) => {
    try {
      const user = await getCurrentUser(req)
      if (!user) {
        return apiResponse.unauthorized()
      }

      const { id } = context.params || {}
      
      if (!id) {
        return apiResponse.error('운행 ID가 필요합니다')
      }

      // 기존 상태 조회
      const originalTrip = await tripService.getTripById(id)
      if (!originalTrip) {
        return apiResponse.error('운행을 찾을 수 없습니다', 404)
      }

      // 운행 완료 처리
      const updatedTrip = await tripService.completeTrip(id)
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        'UPDATE',
        'Trip',
        id,
        { 
          status: {
            from: originalTrip.status,
            to: 'COMPLETED'
          }
        },
        { 
          source: 'web_api',
          action: 'complete_trip'
        }
      )
      
      return apiResponse.success({ 
        trip: updatedTrip,
        message: '운행이 완료 처리되었습니다' 
      })
    } catch (error) {
      console.error('Failed to complete trip:', error)
      
      if (error instanceof Error) {
        return apiResponse.error(error.message)
      }
      
      return apiResponse.error('운행 완료 처리 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'trips', action: 'update' }
)