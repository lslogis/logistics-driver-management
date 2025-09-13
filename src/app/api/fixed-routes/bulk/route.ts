import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FixedRouteService } from '@/lib/services/fixed-route.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'
import { z } from 'zod'

const fixedRouteService = new FixedRouteService(prisma)

export const runtime = 'nodejs'

// Bulk action request schema
const bulkActionSchema = z.object({
  ids: z.array(z.string()).min(1),
  action: z.enum(['activate', 'deactivate']).optional()
})

/**
 * POST /api/fixed-routes/bulk - 고정노선 일괄 활성화/비활성화
 */
export const POST = withAuth(
  async (req: NextRequest) => {
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

      const body = await req.json()
      const { ids, action } = bulkActionSchema.parse(body)

      if (!action) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'MISSING_ACTION',
            message: 'action 필드가 필요합니다'
          }
        }, { status: 400 })
      }

      const isActive = action === 'activate'

      // 일괄 상태 업데이트
      const result = await fixedRouteService.bulkUpdateStatus(ids, isActive)

      // Audit log for bulk operation
      await createAuditLog(
        user,
        isActive ? 'ACTIVATE' : 'DEACTIVATE',
        'FixedRoute',
        'bulk_operation',
        {
          action: `bulk_${action}`,
          affectedIds: ids,
          count: result.count
        },
        {
          source: 'bulk_operation'
        }
      )

      const actionText = isActive ? '활성화' : '비활성화'
      
      return NextResponse.json({
        ok: true,
        data: {
          message: `${result.count}개 고정노선이 ${actionText}되었습니다`,
          count: result.count,
          action
        }
      })

    } catch (error) {
      console.error('Bulk fixed routes operation error:', error)
      
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '잘못된 요청 데이터입니다',
            details: error.errors
          }
        }, { status: 400 })
      }
      
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '일괄 작업 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'fixed_routes', action: 'update' }
)

/**
 * DELETE /api/fixed-routes/bulk - 고정노선 일괄 하드 삭제
 */
export const DELETE = withAuth(
  async (req: NextRequest) => {
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

      const body = await req.json()
      const { ids } = z.object({
        ids: z.array(z.string()).min(1)
      }).parse(body)

      // 일괄 하드 삭제
      const result = await fixedRouteService.bulkHardDelete(ids)

      // Audit log for bulk deletion
      await createAuditLog(
        user,
        'DELETE',
        'FixedRoute',
        'bulk_hard_delete',
        {
          action: 'bulk_hard_delete',
          deletedIds: ids,
          count: result.count
        },
        {
          source: 'bulk_hard_delete'
        }
      )
      
      return NextResponse.json({
        ok: true,
        data: {
          message: `${result.count}개 고정노선이 완전히 삭제되었습니다`,
          count: result.count
        }
      })

    } catch (error) {
      console.error('Bulk delete fixed routes error:', error)
      
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '잘못된 요청 데이터입니다',
            details: error.errors
          }
        }, { status: 400 })
      }
      
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '일괄 삭제 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'fixed_routes', action: 'delete' }
)