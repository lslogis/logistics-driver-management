import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'
import { withAuth } from '@/lib/auth/rbac'

/**
 * POST /api/fixed-routes/[id]/activate - 고정노선 활성화
 */
export const POST = withAuth(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
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

      const { id } = params

      // 고정노선 존재 확인
      const existingRoute = await prisma.routeTemplate.findUnique({
        where: { id },
        select: { id: true, name: true, isActive: true }
      })

      if (!existingRoute) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'NOT_FOUND',
            message: '고정노선을 찾을 수 없습니다'
          }
        }, { status: 404 })
      }

      if (existingRoute.isActive) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'ALREADY_ACTIVE',
            message: '이미 활성화된 고정노선입니다'
          }
        }, { status: 400 })
      }

      // 활성화
      await prisma.routeTemplate.update({
        where: { id },
        data: { isActive: true }
      })

      // 감사 로그
      await createAuditLog(
        user,
        'ACTIVATE',
        'FixedRoute',
        id,
        {
          action: 'activate',
          routeName: existingRoute.name
        },
        {
          source: 'fixed_route_activate'
        }
      )

      return NextResponse.json({
        ok: true,
        data: {
          message: '고정노선이 활성화되었습니다'
        }
      })

    } catch (error) {
      console.error('Fixed route activation error:', error)
      
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '고정노선 활성화 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'fixed_routes', action: 'update' }
)