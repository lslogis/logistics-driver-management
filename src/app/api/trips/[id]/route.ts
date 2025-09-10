import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TripService } from '@/lib/services/trip.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog, apiResponse } from '@/lib/auth/server'
import { updateTripSchema } from '@/lib/validations/trip'

const tripService = new TripService(prisma)

/**
 * GET /api/trips/[id] - 운행 상세 조회
 */
export const GET = withAuth(
  async (req: NextRequest, context: { params?: any } = {}) => {
    try {
      const { id } = context.params || {}
      
      if (!id) {
        return apiResponse.error('운행 ID가 필요합니다')
      }
      
      const trip = await tripService.getTripById(id)
      
      if (!trip) {
        return apiResponse.error('운행을 찾을 수 없습니다', 404)
      }
      
      return apiResponse.success(trip)
    } catch (error) {
      console.error('Failed to get trip:', error)
      return apiResponse.error('운행 조회 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'trips', action: 'read' }
)

/**
 * PUT /api/trips/[id] - 운행 정보 수정
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

      // 기존 데이터 조회 (감사 로그용)
      const originalTrip = await tripService.getTripById(id)
      if (!originalTrip) {
        return apiResponse.error('운행을 찾을 수 없습니다', 404)
      }

      // 요청 데이터 검증
      const body = await req.json()
      const data = updateTripSchema.parse(body)
      
      // 운행 정보 수정
      const updatedTrip = await tripService.updateTrip(id, data)
      
      // 감사 로그 기록 (변경된 필드만)
      const changes: any = {}
      Object.keys(data).forEach(key => {
        const oldValue = (originalTrip as any)[key]
        const newValue = (data as any)[key]
        
        // Decimal 값은 문자열로 비교
        const oldValueForComparison = key === 'driverFare' || key === 'billingFare' || key === 'deductionAmount' || key === 'substituteFare'
          ? oldValue 
          : oldValue
        const newValueForComparison = key === 'driverFare' || key === 'billingFare' || key === 'deductionAmount' || key === 'substituteFare'
          ? newValue 
          : newValue
        
        if (JSON.stringify(oldValueForComparison) !== JSON.stringify(newValueForComparison)) {
          changes[key] = { from: oldValue, to: newValue }
        }
      })

      if (Object.keys(changes).length > 0) {
        await createAuditLog(
          user,
          'UPDATE',
          'Trip',
          id,
          changes,
          { source: 'web_api' }
        )
      }
      
      return apiResponse.success(updatedTrip)
    } catch (error) {
      console.error('Failed to update trip:', error)
      
      if (error instanceof Error) {
        return apiResponse.error(error.message)
      }
      
      return apiResponse.error('운행 정보 수정 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'trips', action: 'update' }
)

/**
 * DELETE /api/trips/[id] - 운행 삭제 (예정 상태만 가능)
 */
export const DELETE = withAuth(
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

      // 기존 데이터 조회 (감사 로그용)
      const originalTrip = await tripService.getTripById(id)
      if (!originalTrip) {
        return apiResponse.error('운행을 찾을 수 없습니다', 404)
      }

      // 운행 삭제
      await tripService.deleteTrip(id)
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        'DELETE',
        'Trip',
        id,
        { 
          deleted: true
        },
        { 
          source: 'web_api',
          originalData: originalTrip
        }
      )
      
      return apiResponse.success({ message: '운행이 삭제되었습니다' })
    } catch (error) {
      console.error('Failed to delete trip:', error)
      
      if (error instanceof Error) {
        return apiResponse.error(error.message)
      }
      
      return apiResponse.error('운행 삭제 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'trips', action: 'delete' }
)