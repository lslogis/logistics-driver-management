import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { RouteService } from '@/lib/services/route.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog, apiResponse } from '@/lib/auth/server'

const routeService = new RouteService(prisma)

// 기본 기사 배정 스키마
const assignDriverSchema = z.object({
  driverId: z.string().uuid('올바른 기사 ID가 아닙니다')
})

/**
 * POST /api/routes/[id]/assign - 노선에 기본 기사 배정
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

      // 요청 데이터 검증
      const body = await req.json()
      const { driverId } = assignDriverSchema.parse(body)
      
      // 기본 기사 배정
      const updatedRoute = await routeService.assignDefaultDriverToRoute(id, driverId)
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        'UPDATE',
        'RouteTemplate',
        id,
        { 
          defaultDriverId: {
            from: originalRoute.defaultDriver?.id || null,
            to: driverId
          }
        },
        { 
          source: 'web_api',
          action: 'assign_default_driver'
        }
      )
      
      return apiResponse.success({ 
        route: updatedRoute,
        message: '기본 기사가 노선에 배정되었습니다' 
      })
    } catch (error) {
      console.error('Failed to assign default driver to route:', error)
      
      if (error instanceof Error) {
        return apiResponse.error(error.message)
      }
      
      return apiResponse.error('기본 기사 배정 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'routes', action: 'update' }
)

/**
 * DELETE /api/routes/[id]/assign - 노선에서 기본 기사 배정 해제
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
        return apiResponse.error('노선 ID가 필요합니다')
      }

      // 기존 상태 조회
      const originalRoute = await routeService.getRouteById(id)
      if (!originalRoute) {
        return apiResponse.error('노선을 찾을 수 없습니다', 404)
      }

      // 기본 기사 배정 해제
      const updatedRoute = await routeService.unassignDefaultDriverFromRoute(id)
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        'UPDATE',
        'RouteTemplate',
        id,
        { 
          defaultDriverId: {
            from: originalRoute.defaultDriver?.id || null,
            to: null
          }
        },
        { 
          source: 'web_api',
          action: 'unassign_default_driver'
        }
      )
      
      return apiResponse.success({ 
        route: updatedRoute,
        message: '기본 기사 배정이 해제되었습니다' 
      })
    } catch (error) {
      console.error('Failed to unassign default driver from route:', error)
      
      if (error instanceof Error) {
        return apiResponse.error(error.message)
      }
      
      return apiResponse.error('기본 기사 배정 해제 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'routes', action: 'update' }
)