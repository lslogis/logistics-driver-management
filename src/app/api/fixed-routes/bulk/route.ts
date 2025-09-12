import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'
import { z } from 'zod'

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

      // Check if all routes exist
      const existingRoutes = await prisma.routeTemplate.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true, isActive: true }
      })

      if (existingRoutes.length !== ids.length) {
        const foundIds = existingRoutes.map(r => r.id)
        const missingIds = ids.filter(id => !foundIds.includes(id))
        
        return NextResponse.json({
          ok: false,
          error: {
            code: 'ROUTES_NOT_FOUND',
            message: `다음 고정노선을 찾을 수 없습니다: ${missingIds.join(', ')}`
          }
        }, { status: 404 })
      }

      const isActive = action === 'activate'
      const alreadyInState = existingRoutes.filter(route => route.isActive === isActive)
      
      if (alreadyInState.length === existingRoutes.length) {
        const stateText = isActive ? '활성' : '비활성'
        return NextResponse.json({
          ok: false,
          error: {
            code: 'NO_CHANGE_NEEDED',
            message: `선택한 고정노선이 모두 이미 ${stateText} 상태입니다`
          }
        }, { status: 400 })
      }

      // Perform bulk update
      const result = await prisma.routeTemplate.updateMany({
        where: { id: { in: ids } },
        data: { isActive }
      })

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
          source: 'bulk_operation',
          routes: existingRoutes.map(r => ({ id: r.id, name: r.name }))
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

      // Check if all routes exist and get their info
      const existingRoutes = await prisma.routeTemplate.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true, isActive: true }
      })

      if (existingRoutes.length !== ids.length) {
        const foundIds = existingRoutes.map(r => r.id)
        const missingIds = ids.filter(id => !foundIds.includes(id))
        
        return NextResponse.json({
          ok: false,
          error: {
            code: 'ROUTES_NOT_FOUND',
            message: `다음 고정노선을 찾을 수 없습니다: ${missingIds.join(', ')}`
          }
        }, { status: 404 })
      }

      // Perform bulk hard delete
      const result = await prisma.routeTemplate.deleteMany({
        where: { id: { in: ids } }
      })

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
          source: 'bulk_hard_delete',
          deletedRoutes: existingRoutes.map(r => ({ id: r.id, name: r.name }))
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