import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { FixedRouteService } from '@/lib/services/fixed-route.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'
import { UpdateFixedRouteSchema } from '@/lib/validations/fixedRoute'

const fixedRouteService = new FixedRouteService(prisma)

export const runtime = 'nodejs'

/**
 * GET /api/fixed-routes/[id] - 고정노선 상세 조회
 */
export const GET = withAuth(
  async (req: NextRequest, context: { params?: any }) => {
    try {
      const { id } = context.params || {}
      
      const fixedRoute = await fixedRouteService.getFixedRouteById(id)
      
      if (!fixedRoute) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'NOT_FOUND',
            message: '고정노선을 찾을 수 없습니다'
          }
        }, { status: 404 })
      }
      
      return NextResponse.json({ ok: true, data: fixedRoute })
    } catch (error) {
      console.error('Failed to get fixed route:', error)
      
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '고정노선 조회 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'fixed_routes', action: 'read' }
)

/**
 * PUT /api/fixed-routes/[id] - 고정노선 수정
 */
export const PUT = withAuth(
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
      
      // 기존 데이터 조회 (감사 로그용)
      const existingRoute = await fixedRouteService.getFixedRouteById(id)
      if (!existingRoute) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'NOT_FOUND',
            message: '고정노선을 찾을 수 없습니다'
          }
        }, { status: 404 })
      }

      // 요청 데이터 검증
      const body = await req.json()
      const data = UpdateFixedRouteSchema.parse(body)
      
      // 고정노선 수정
      const updatedRoute = await fixedRouteService.updateFixedRoute(id, data)
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        'UPDATE',
        'FixedRoute',
        id,
        {
          before: existingRoute,
          after: data,
          changed: Object.keys(data)
        },
        { source: 'web_api' }
      )
      
      return NextResponse.json({ ok: true, data: updatedRoute })
    } catch (error) {
      console.error('Failed to update fixed route:', error)
      
      if (error instanceof ZodError) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '입력 데이터가 올바르지 않습니다',
            details: error.errors
          }
        }, { status: 400 })
      }
      
      if (error instanceof Error) {
        // 중복 체크
        if (error.message.includes('이미 등록된') || error.message.includes('중복')) {
          return NextResponse.json({
            ok: false,
            error: {
              code: 'DUPLICATE_ERROR',
              message: error.message
            }
          }, { status: 409 })
        }
        
        // 비즈니스 로직 오류
        if (error.message.includes('찾을 수 없습니다') || error.message.includes('배정되어 있습니다')) {
          return NextResponse.json({
            ok: false,
            error: {
              code: 'BUSINESS_ERROR',
              message: error.message
            }
          }, { status: 400 })
        }
        
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
          message: '고정노선 수정 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'fixed_routes', action: 'update' }
)

/**
 * DELETE /api/fixed-routes/[id] - 고정노선 삭제 (소프트 삭제)
 */
export const DELETE = withAuth(
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
      
      // 기존 데이터 조회 (감사 로그용)
      const existingRoute = await fixedRouteService.getFixedRouteById(id)
      if (!existingRoute) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'NOT_FOUND',
            message: '고정노선을 찾을 수 없습니다'
          }
        }, { status: 404 })
      }
      
      // 고정노선 삭제 (소프트 삭제)
      await fixedRouteService.deleteFixedRoute(id)
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        'DELETE',
        'FixedRoute',
        id,
        { deleted: existingRoute },
        { source: 'web_api', type: 'soft_delete' }
      )
      
      return NextResponse.json({
        ok: true,
        data: { message: '고정노선이 삭제되었습니다' }
      })
    } catch (error) {
      console.error('Failed to delete fixed route:', error)
      
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
          message: '고정노선 삭제 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'fixed_routes', action: 'delete' }
)