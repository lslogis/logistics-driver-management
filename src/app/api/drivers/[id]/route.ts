import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DriverService } from '@/lib/services/driver.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog, apiResponse } from '@/lib/auth/server'
import { updateDriverSchema } from '@/lib/validations/driver'

const driverService = new DriverService(prisma)

/**
 * GET /api/drivers/[id] - 기사 상세 조회
 */
export const GET = withAuth(
  async (req: NextRequest, context: { params?: any } = {}) => {
    try {
      const { id } = context.params || {}
      
      if (!id) {
        return apiResponse.error('기사 ID가 필요합니다')
      }
      
      const driver = await driverService.getDriverById(id)
      
      if (!driver) {
        return apiResponse.error('기사를 찾을 수 없습니다', 404)
      }
      
      return apiResponse.success(driver)
    } catch (error) {
      console.error('Failed to get driver:', error)
      return apiResponse.error('기사 조회 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'drivers', action: 'read' }
)

/**
 * PUT /api/drivers/[id] - 기사 정보 수정
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
        return apiResponse.error('기사 ID가 필요합니다')
      }

      // 기존 데이터 조회 (감사 로그용)
      const originalDriver = await driverService.getDriverById(id)
      if (!originalDriver) {
        return apiResponse.error('기사를 찾을 수 없습니다', 404)
      }

      // 요청 데이터 검증
      const body = await req.json()
      const data = updateDriverSchema.parse(body)
      
      // 기사 정보 수정
      const updatedDriver = await driverService.updateDriver(id, data)
      
      // 감사 로그 기록 (변경된 필드만)
      const changes: any = {}
      Object.keys(data).forEach(key => {
        const oldValue = (originalDriver as any)[key]
        const newValue = (data as any)[key]
        if (oldValue !== newValue) {
          changes[key] = { from: oldValue, to: newValue }
        }
      })

      if (Object.keys(changes).length > 0) {
        await createAuditLog(
          user,
          'UPDATE',
          'Driver',
          id,
          changes,
          { source: 'web_api' }
        )
      }
      
      return apiResponse.success(updatedDriver)
    } catch (error) {
      console.error('Failed to update driver:', error)
      
      if (error instanceof Error) {
        return apiResponse.error(error.message)
      }
      
      return apiResponse.error('기사 정보 수정 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'drivers', action: 'update' }
)

/**
 * DELETE /api/drivers/[id] - 기사 삭제 (소프트 삭제)
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
        return apiResponse.error('기사 ID가 필요합니다')
      }

      // 기존 데이터 조회 (감사 로그용)
      const originalDriver = await driverService.getDriverById(id)
      if (!originalDriver) {
        return apiResponse.error('기사를 찾을 수 없습니다', 404)
      }

      // 기사 삭제 (소프트 삭제)
      await driverService.deleteDriver(id)
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        'DELETE',
        'Driver',
        id,
        { 
          deactivated: {
            from: originalDriver.isActive,
            to: false
          }
        },
        { 
          source: 'web_api',
          originalData: originalDriver
        }
      )
      
      return apiResponse.success({ message: '기사가 비활성화되었습니다' })
    } catch (error) {
      console.error('Failed to delete driver:', error)
      
      if (error instanceof Error) {
        return apiResponse.error(error.message)
      }
      
      return apiResponse.error('기사 삭제 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'drivers', action: 'delete' }
)