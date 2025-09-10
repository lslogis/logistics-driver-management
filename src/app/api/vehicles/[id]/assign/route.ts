import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { VehicleService } from '@/lib/services/vehicle.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog, apiResponse } from '@/lib/auth/server'

const vehicleService = new VehicleService(prisma)

// 기사 배정 스키마
const assignDriverSchema = z.object({
  driverId: z.string().uuid('올바른 기사 ID가 아닙니다')
})

/**
 * POST /api/vehicles/[id]/assign - 차량에 기사 배정
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
        return apiResponse.error('차량 ID가 필요합니다')
      }

      // 기존 상태 조회
      const originalVehicle = await vehicleService.getVehicleById(id)
      if (!originalVehicle) {
        return apiResponse.error('차량을 찾을 수 없습니다', 404)
      }

      // 요청 데이터 검증
      const body = await req.json()
      const { driverId } = assignDriverSchema.parse(body)
      
      // 기사 배정
      const updatedVehicle = await vehicleService.assignDriverToVehicle(id, driverId)
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        'UPDATE',
        'Vehicle',
        id,
        { 
          driverId: {
            from: originalVehicle.driver?.id || null,
            to: driverId
          }
        },
        { 
          source: 'web_api',
          action: 'assign_driver'
        }
      )
      
      return apiResponse.success({ 
        vehicle: updatedVehicle,
        message: '기사가 차량에 배정되었습니다' 
      })
    } catch (error) {
      console.error('Failed to assign driver to vehicle:', error)
      
      if (error instanceof Error) {
        return apiResponse.error(error.message)
      }
      
      return apiResponse.error('기사 배정 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'vehicles', action: 'update' }
)

/**
 * DELETE /api/vehicles/[id]/assign - 차량에서 기사 배정 해제
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
        return apiResponse.error('차량 ID가 필요합니다')
      }

      // 기존 상태 조회
      const originalVehicle = await vehicleService.getVehicleById(id)
      if (!originalVehicle) {
        return apiResponse.error('차량을 찾을 수 없습니다', 404)
      }

      // 기사 배정 해제
      const updatedVehicle = await vehicleService.unassignDriverFromVehicle(id)
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        'UPDATE',
        'Vehicle',
        id,
        { 
          driverId: {
            from: originalVehicle.driver?.id || null,
            to: null
          }
        },
        { 
          source: 'web_api',
          action: 'unassign_driver'
        }
      )
      
      return apiResponse.success({ 
        vehicle: updatedVehicle,
        message: '기사 배정이 해제되었습니다' 
      })
    } catch (error) {
      console.error('Failed to unassign driver from vehicle:', error)
      
      if (error instanceof Error) {
        return apiResponse.error(error.message)
      }
      
      return apiResponse.error('기사 배정 해제 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'vehicles', action: 'update' }
)