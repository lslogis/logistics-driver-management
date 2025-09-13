import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FixedRouteService } from '@/lib/services/fixed-route.service'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'
import { withAuth } from '@/lib/auth/rbac'

const fixedRouteService = new FixedRouteService(prisma)

export const runtime = 'nodejs'

/**
 * POST /api/fixed-routes/[id]/activate - 고정노선 활성화
 */
export const POST = withAuth(
  async (req: NextRequest, context: { params?: any }) => {
    try {
      const user = await getCurrentUser(req)
      if (!user) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '로그인이 필요합니다'
          }
        }, { status: 401 })
      }

      const { id } = context.params || {}

      // 고정노선 활성화
      const activatedRoute = await fixedRouteService.activateFixedRoute(id)

      // 감사 로그
      await createAuditLog(
        user,
        'ACTIVATE',
        'FixedRoute',
        id,
        {
          action: 'activate',
          routeName: activatedRoute.routeName
        },
        {
          source: 'web_api'
        }
      )

      return NextResponse.json({
        ok: true,
        data: {
          message: '고정노선이 활성화되었습니다',
          fixedRoute: activatedRoute
        }
      })

    } catch (error) {
      console.error('Fixed route activation error:', error)
      
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
          message: '고정노선 활성화 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'fixed_routes', action: 'update' }
)