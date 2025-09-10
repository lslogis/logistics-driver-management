import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { VehicleService } from '@/lib/services/vehicle.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog, apiResponse } from '@/lib/auth/server'
import { updateVehicleSchema } from '@/lib/validations/vehicle'

const vehicleService = new VehicleService(prisma)

/**
 * GET /api/vehicles/[id] - 차량 상세 조회
 */
export const GET = withAuth(
  async (req: NextRequest, context: { params?: any } = {}) => {
    try {
      const { id } = context.params || {}
      
      if (!id) {
        return apiResponse.error('차량 ID가 필요합니다')
      }
      
      const vehicle = await vehicleService.getVehicleById(id)
      
      if (!vehicle) {
        return apiResponse.error('차량을 찾을 수 없습니다', 404)
      }
      
      return apiResponse.success(vehicle)
    } catch (error) {
      console.error('Failed to get vehicle:', error)
      return apiResponse.error('차량 조회 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'vehicles', action: 'read' }
)

/**
 * PUT /api/vehicles/[id] - 차량 정보 수정
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
        return apiResponse.error('차량 ID가 필요합니다')
      }

      // 기존 데이터 조회 (감사 로그용)
      const originalVehicle = await vehicleService.getVehicleById(id)
      if (!originalVehicle) {
        return apiResponse.error('차량을 찾을 수 없습니다', 404)
      }

      // 요청 데이터 검증
      const body = await req.json()
      const data = updateVehicleSchema.parse(body)
      
      // 차량 정보 수정
      const updatedVehicle = await vehicleService.updateVehicle(id, data)
      
      // 감사 로그 기록 (변경된 필드만)
      const changes: any = {}
      Object.keys(data).forEach(key => {
        const oldValue = (originalVehicle as any)[key]
        const newValue = (data as any)[key]
        if (oldValue !== newValue) {
          changes[key] = { from: oldValue, to: newValue }
        }
      })

      if (Object.keys(changes).length > 0) {
        await createAuditLog(
          user,
          'UPDATE',
          'Vehicle',
          id,
          changes,
          { source: 'web_api' }
        )
      }
      
      return apiResponse.success(updatedVehicle)
    } catch (error) {
      console.error('Failed to update vehicle:', error)
      
      if (error instanceof Error) {
        return apiResponse.error(error.message)
      }
      
      return apiResponse.error('차량 정보 수정 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'vehicles', action: 'update' }
)

/**
 * DELETE /api/vehicles/[id] - 차량 삭제 (소프트 삭제)
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

      // 기존 데이터 조회 (감사 로그용)
      const originalVehicle = await vehicleService.getVehicleById(id)
      if (!originalVehicle) {
        return apiResponse.error('차량을 찾을 수 없습니다', 404)
      }

      // 차량 삭제 (소프트 삭제)
      await vehicleService.deleteVehicle(id)
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        'DELETE',
        'Vehicle',
        id,
        { 
          deactivated: {
            from: originalVehicle.isActive,
            to: false
          }
        },
        { 
          source: 'web_api',
          originalData: originalVehicle
        }
      )
      
      return apiResponse.success({ message: '차량이 비활성화되었습니다' })
    } catch (error) {
      console.error('Failed to delete vehicle:', error)
      
      if (error instanceof Error) {
        return apiResponse.error(error.message)
      }
      
      return apiResponse.error('차량 삭제 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'vehicles', action: 'delete' }
)