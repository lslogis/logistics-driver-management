import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { LoadingPointService } from '@/lib/services/loading-point.service'
import { withAuth } from '@/lib/auth/rbac'
import { loadingPointSuggestionsQuerySchema } from '@/lib/validations/loading-point'

const loadingPointService = new LoadingPointService(prisma)

export const dynamic = 'force-dynamic'

/**
 * GET /api/loading-points/suggestions - 상차지 자동완성 검색
 * Query params:
 * - query: 검색어 (필수) - 센터명 및 상차지명에서 검색
 * - limit: 결과 개수 (기본값: 10, 최대: 50)
 */
export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url)
      const queryParams = Object.fromEntries(searchParams.entries())
      
      // 쿼리 파라미터 검증
      const query = loadingPointSuggestionsQuerySchema.parse(queryParams)
      
      // 상차지 자동완성 검색
      const suggestions = await loadingPointService.searchLoadingPoints(query)
      
      return NextResponse.json({ ok: true, data: suggestions })
    } catch (error) {
      console.error('Failed to get loading point suggestions:', error)
      
      if (error instanceof ZodError) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '요청 파라미터가 올바르지 않습니다',
            details: error.errors
          }
        }, { status: 400 })
      }
      
      if (error instanceof Error) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message
          }
        }, { status: 500 })
      }
      
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '상차지 자동완성 검색 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'routes', action: 'read' }
)