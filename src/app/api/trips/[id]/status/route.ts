import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TripService } from '@/lib/services/trip.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog, apiResponse } from '@/lib/auth/server'
import { updateTripStatusSchema } from '@/lib/validations/trip'

const tripService = new TripService(prisma)

/**
 * PUT /api/trips/[id]/status - 운행 상태 변경 (결행/대차 처리)
 */
export const PUT = withAuth(
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

      // 요청 데이터 검증
      const body = await req.json()
      const data = updateTripStatusSchema.parse(body)
      
      // 운행 상태 변경
      const updatedTrip = await tripService.updateTripStatus(id, data)
      
      // 감사 로그 기록
      const changes: any = {
        status: {
          from: originalTrip.status,
          to: updatedTrip.status
        }
      }

      // 상태별 세부 변경사항 기록
      if (updatedTrip.status === 'ABSENCE') {
        if (updatedTrip.absenceReason !== originalTrip.absenceReason) {
          changes.absenceReason = {
            from: originalTrip.absenceReason,
            to: updatedTrip.absenceReason
          }
        }
        if (updatedTrip.deductionAmount !== originalTrip.deductionAmount) {
          changes.deductionAmount = {
            from: originalTrip.deductionAmount,
            to: updatedTrip.deductionAmount
          }
        }
      } else if (updatedTrip.status === 'SUBSTITUTE') {
        if (updatedTrip.substituteDriver?.id !== originalTrip.substituteDriver?.id) {
          changes.substituteDriverId = {
            from: originalTrip.substituteDriver?.id || null,
            to: updatedTrip.substituteDriver?.id || null
          }
        }
        if (updatedTrip.substituteFare !== originalTrip.substituteFare) {
          changes.substituteFare = {
            from: originalTrip.substituteFare,
            to: updatedTrip.substituteFare
          }
        }
      }

      await createAuditLog(
        user,
        'UPDATE',
        'Trip',
        id,
        changes,
        { 
          source: 'web_api',
          action: 'status_change'
        }
      )
      
      const statusMessages = {
        SCHEDULED: '운행이 예정 상태로 변경되었습니다',
        COMPLETED: '운행이 완료 처리되었습니다',
        ABSENCE: '운행이 결행 처리되었습니다',
        SUBSTITUTE: '운행이 대차 처리되었습니다'
      }
      
      return apiResponse.success({ 
        trip: updatedTrip,
        message: statusMessages[updatedTrip.status]
      })
    } catch (error) {
      console.error('Failed to update trip status:', error)
      
      if (error instanceof Error) {
        return apiResponse.error(error.message)
      }
      
      return apiResponse.error('운행 상태 변경 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'trips', action: 'update' }
)