import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'

/**
 * POST /api/loading-points/[id]/activate - 상차지 활성화
 */
export const POST = withAuth(
  async (req: NextRequest, context: { params?: any } = {}) => {
    const { params } = context
    if (!params?.id) {
      return NextResponse.json({
        ok: false,
        error: {
          code: 'MISSING_ID',
          message: '상차지 ID가 필요합니다'
        }
      }, { status: 400 })
    }
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
      
      // 기존 상차지 조회 (Raw SQL)
      const existingResult = await prisma.$queryRaw`
        SELECT * FROM loading_points WHERE id = ${id} LIMIT 1
      ` as any[]
      
      if (!existingResult[0]) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'NOT_FOUND',
            message: '상차지를 찾을 수 없습니다'
          }
        }, { status: 404 })
      }
      
      const existingLoadingPoint = existingResult[0]
      
      // 상차지 활성화 (Raw SQL)
      await prisma.$queryRaw`
        UPDATE loading_points 
        SET "isActive" = true, "updatedAt" = NOW()
        WHERE id = ${id}
      `
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        'ACTIVATE',
        'LoadingPoint',
        id,
        { activated: existingLoadingPoint },
        { source: 'web_api' }
      )
      
      return NextResponse.json({ 
        ok: true, 
        data: { message: '상차지가 활성화되었습니다' }
      })
    } catch (error) {
      console.error('Failed to activate loading point:', error)
      
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '상차지 활성화 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'loading-points', action: 'update' }
)