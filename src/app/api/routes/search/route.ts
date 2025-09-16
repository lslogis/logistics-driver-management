import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { RouteService } from '@/lib/services/route.service'
import { withAuth } from '@/lib/auth/rbac'
import { apiResponse } from '@/lib/auth/server'

const routeService = new RouteService(prisma)

// 검색 쿼리 스키마
const searchQuerySchema = z.object({
  q: z.string().min(1, '검색어를 입력해주세요').max(100, '검색어는 100자 이하로 입력해주세요'),
  limit: z.string().transform(val => parseInt(val)).refine(val => !isNaN(val) && val > 0 && val <= 50, '제한값은 1-50 사이여야 합니다').default('10')
})

/**
 * GET /api/routes/search - 노선 검색 (자동완성용)
 */
export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url)
      const { q, limit } = searchQuerySchema.parse({
        q: searchParams.get('q') || '',
        limit: searchParams.get('limit') || '10'
      })
      
      const routes = await routeService.searchRoutes(q, limit)
      return apiResponse.success(routes)
    } catch (error) {
      console.error('Failed to search routes:', error)
      
      if (error instanceof Error) {
        return apiResponse.error(error.message)
      }
      
      return apiResponse.error('노선 검색 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'routes', action: 'read' }
)