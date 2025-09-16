import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DriverService } from '@/lib/services/driver.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog, apiResponse } from '@/lib/auth/server'

const driverService = new DriverService(prisma)

/**
 * POST /api/drivers/[id]/toggle - 기사 활성화/비활성화 토글
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
        return apiResponse.error('기사 ID가 필요합니다')
      }

      // 기존 상태 조회
      const originalDriver = await driverService.getDriverById(id)
      if (!originalDriver) {
        return apiResponse.error('기사를 찾을 수 없습니다', 404)
      }

      // 상태 토글
      const updatedDriver = await driverService.toggleDriverStatus(id)
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        'UPDATE',
        'Driver',
        id,
        { 
          isActive: {
            from: originalDriver.isActive,
            to: updatedDriver.isActive
          }
        },
        { 
          source: 'web_api',
          action: 'toggle_status'
        }
      )
      
      const message = updatedDriver.isActive 
        ? '기사가 활성화되었습니다' 
        : '기사가 비활성화되었습니다'
      
      return apiResponse.success({ 
        driver: updatedDriver,
        message 
      })
    } catch (error) {
      console.error('Failed to toggle driver status:', error)
      
      if (error instanceof Error) {
        return apiResponse.error(error.message)
      }
      
      return apiResponse.error('기사 상태 변경 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'drivers', action: 'update' }
)