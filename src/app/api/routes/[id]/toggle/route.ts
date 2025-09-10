import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { RouteService } from '@/lib/services/route.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog, apiResponse } from '@/lib/auth/server'

const routeService = new RouteService(prisma)

/**
 * POST /api/routes/[id]/toggle - 노선 활성화/비활성화 토글
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
        return apiResponse.error('노선 ID가 필요합니다')
      }

      // 기존 상태 조회
      const originalRoute = await routeService.getRouteById(id)
      if (!originalRoute) {
        return apiResponse.error('노선을 찾을 수 없습니다', 404)
      }

      // 상태 토글
      const updatedRoute = await routeService.toggleRouteStatus(id)
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        'UPDATE',
        'RouteTemplate',
        id,
        { 
          isActive: {
            from: originalRoute.isActive,
            to: updatedRoute.isActive
          },
          // 비활성화 시 기본 기사 배정 해제 기록
          ...(originalRoute.isActive && originalRoute.defaultDriver && {
            defaultDriverId: {
              from: originalRoute.defaultDriver.id,
              to: null
            }
          })
        },
        { 
          source: 'web_api',
          action: 'toggle_status'
        }
      )
      
      const message = updatedRoute.isActive 
        ? '노선이 활성화되었습니다' 
        : '노선이 비활성화되었습니다'
      
      return apiResponse.success({ 
        route: updatedRoute,
        message 
      })
    } catch (error) {
      console.error('Failed to toggle route status:', error)
      
      if (error instanceof Error) {
        return apiResponse.error(error.message)
      }
      
      return apiResponse.error('노선 상태 변경 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'routes', action: 'update' }
)