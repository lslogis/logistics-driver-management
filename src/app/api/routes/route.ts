import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { RouteService } from '@/lib/services/route.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog, apiResponse } from '@/lib/auth/server'
import { createRouteSchema, getRoutesQuerySchema } from '@/lib/validations/route'

const routeService = new RouteService(prisma)

/**
 * GET /api/routes - 노선 목록 조회
 */
export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url)
      const query = getRoutesQuerySchema.parse({
        page: searchParams.get('page') || '1',
        limit: searchParams.get('limit') || '20',
        search: searchParams.get('search') || undefined,
        isActive: searchParams.get('isActive') || undefined,
        defaultDriverId: searchParams.get('defaultDriverId') || undefined,
        weekday: searchParams.get('weekday') || undefined,
        sortBy: searchParams.get('sortBy') || 'createdAt',
        sortOrder: searchParams.get('sortOrder') || 'desc'
      })
      
      const result = await routeService.getRoutes(query)
      return apiResponse.success(result)
    } catch (error) {
      console.error('Failed to get routes:', error)
      
      if (error instanceof Error) {
        return apiResponse.error(error.message)
      }
      
      return apiResponse.error('노선 목록 조회 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'routes', action: 'read' }
)

/**
 * POST /api/routes - 노선 등록
 */
export const POST = withAuth(
  async (req: NextRequest) => {
    try {
      const user = await getCurrentUser(req)
      if (!user) {
        return apiResponse.unauthorized()
      }

      // 요청 데이터 검증
      const body = await req.json()
      const data = createRouteSchema.parse(body)
      
      // 노선 생성
      const route = await routeService.createRoute(data)
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        'CREATE',
        'RouteTemplate',
        route.id,
        data,
        { source: 'web_api' }
      )
      
      return apiResponse.success(route, 201)
    } catch (error) {
      console.error('Failed to create route:', error)
      
      if (error instanceof Error) {
        return apiResponse.error(error.message)
      }
      
      return apiResponse.error('노선 등록 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'routes', action: 'create' }
)