import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { VehicleService } from '@/lib/services/vehicle.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog, apiResponse } from '@/lib/auth/server'

const vehicleService = new VehicleService(prisma)

/**
 * POST /api/vehicles/[id]/toggle - 차량 활성화/비활성화 토글
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

      // 상태 토글
      const updatedVehicle = await vehicleService.toggleVehicleStatus(id)
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        'UPDATE',
        'Vehicle',
        id,
        { 
          isActive: {
            from: originalVehicle.isActive,
            to: updatedVehicle.isActive
          },
          // 비활성화 시 기사 배정 해제 기록
          ...(originalVehicle.isActive && originalVehicle.driver && {
            driverId: {
              from: originalVehicle.driver.id,
              to: null
            }
          })
        },
        { 
          source: 'web_api',
          action: 'toggle_status'
        }
      )
      
      const message = updatedVehicle.isActive 
        ? '차량이 활성화되었습니다' 
        : '차량이 비활성화되었습니다'
      
      return apiResponse.success({ 
        vehicle: updatedVehicle,
        message 
      })
    } catch (error) {
      console.error('Failed to toggle vehicle status:', error)
      
      if (error instanceof Error) {
        return apiResponse.error(error.message)
      }
      
      return apiResponse.error('차량 상태 변경 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'vehicles', action: 'update' }
)