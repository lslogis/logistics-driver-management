import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { LoadingPointService } from '@/lib/services/loading-point.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'

const loadingPointService = new LoadingPointService(prisma)

/**
 * POST /api/loading-points/[id]/toggle - 상차지 활성화/비활성화 토글
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
      
      // 기존 상태 조회
      const existingLoadingPoint = await loadingPointService.getLoadingPointById(id)
      if (!existingLoadingPoint) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'NOT_FOUND',
            message: '상차지를 찾을 수 없습니다'
          }
        }, { status: 404 })
      }
      
      // 상태 토글
      const updatedLoadingPoint = await loadingPointService.toggleLoadingPointStatus(id)
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        'UPDATE',
        'LoadingPoint',
        id,
        { 
          status_changed: {
            from: existingLoadingPoint.isActive,
            to: updatedLoadingPoint.isActive
          }
        },
        { 
          source: 'web_api',
          action_type: 'status_toggle'
        }
      )
      
      return NextResponse.json({ ok: true, data: updatedLoadingPoint })
    } catch (error) {
      console.error('Failed to toggle loading point status:', error)
      
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
          message: '상차지 상태 변경 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'routes', action: 'update' }
)