import { NextRequest } from 'next/server'
export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { RouteService } from '@/lib/services/route.service'
import { withAuth } from '@/lib/auth/rbac'
import { apiResponse } from '@/lib/auth/server'

const routeService = new RouteService(prisma)

// 요일 쿼리 스키마
const weekdayQuerySchema = z.object({
  weekday: z
    .string()
    .transform(val => parseInt(val))
    .refine(val => !isNaN(val) && val >= 0 && val <= 6, '요일은 0-6 사이의 숫자여야 합니다 (0=일요일, 6=토요일)'),
  
  activeOnly: z
    .string()
    .transform(val => val === 'true')
    .default('true')
})

/**
 * GET /api/routes/weekday - 특정 요일에 운행하는 노선 조회
 */
export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url)
      const { weekday, activeOnly } = weekdayQuerySchema.parse({
        weekday: searchParams.get('weekday') || '0',
        activeOnly: searchParams.get('activeOnly') || 'true'
      })
      
      const routes = await routeService.getRoutesByWeekday(weekday, activeOnly)
      
      return apiResponse.success({
        weekday,
        weekdayName: ['일', '월', '화', '수', '목', '금', '토'][weekday],
        routes,
        total: routes.length
      })
    } catch (error) {
      console.error('Failed to get routes by weekday:', error)
      
      if (error instanceof Error) {
        return apiResponse.error(error.message)
      }
      
      return apiResponse.error('요일별 노선 조회 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'routes', action: 'read' }
)