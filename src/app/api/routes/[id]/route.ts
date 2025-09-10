import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { RouteService } from '@/lib/services/route.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'
import { updateRouteSchema } from '@/lib/validations/route'

const routeService = new RouteService(prisma)

/**
 * GET /api/routes/[id] - 노선 상세 조회
 */
export const GET = withAuth(
  async (req: NextRequest, context: { params?: any } = {}) => {
    try {
      const { id } = context.params || {}
      
      if (!id) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'BAD_REQUEST',
            message: '노선 ID가 필요합니다'
          }
        }, { status: 400 })
      }
      
      const route = await routeService.getRouteById(id)
      
      if (!route) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'NOT_FOUND',
            message: '노선을 찾을 수 없습니다'
          }
        }, { status: 404 })
      }
      
      return NextResponse.json({ ok: true, data: route })
    } catch (error) {
      console.error('Failed to get route:', error)
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '노선 조회 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'routes', action: 'read' }
)

/**
 * PUT /api/routes/[id] - 노선 정보 수정
 */
export const PUT = withAuth(
  async (req: NextRequest, context: { params?: any } = {}) => {
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
      
      if (!id) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'BAD_REQUEST',
            message: '노선 ID가 필요합니다'
          }
        }, { status: 400 })
      }

      // 기존 데이터 조회 (감사 로그용)
      const originalRoute = await routeService.getRouteById(id)
      if (!originalRoute) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'NOT_FOUND',
            message: '노선을 찾을 수 없습니다'
          }
        }, { status: 404 })
      }

      // 요청 데이터 검증
      const body = await req.json()
      const data = updateRouteSchema.parse(body)
      
      // 노선 정보 수정
      const updatedRoute = await routeService.updateRoute(id, data)
      
      // 감사 로그 기록 (변경된 필드만)
      const changes: any = {}
      Object.keys(data).forEach(key => {
        const oldValue = (originalRoute as any)[key]
        const newValue = (data as any)[key]
        
        // Decimal 값은 문자열로 비교
        const oldValueForComparison = key === 'driverFare' || key === 'billingFare' 
          ? oldValue 
          : oldValue
        const newValueForComparison = key === 'driverFare' || key === 'billingFare' 
          ? newValue 
          : newValue
        
        if (JSON.stringify(oldValueForComparison) !== JSON.stringify(newValueForComparison)) {
          changes[key] = { from: oldValue, to: newValue }
        }
      })

      if (Object.keys(changes).length > 0) {
        await createAuditLog(
          user,
          'UPDATE',
          'RouteTemplate',
          id,
          changes,
          { source: 'web_api' }
        )
      }
      
      return NextResponse.json({ ok: true, data: updatedRoute })
    } catch (error) {
      console.error('Failed to update route:', error)
      
      if (error instanceof ZodError) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '입력값이 올바르지 않습니다',
            details: error.errors
          }
        }, { status: 400 })
      }
      
      if (error instanceof Error) {
        if (error.message.includes('이미 등록된')) {
          return NextResponse.json({
            ok: false,
            error: {
              code: 'CONFLICT',
              message: error.message
            }
          }, { status: 409 })
        }
        
        return NextResponse.json({
          ok: false,
          error: {
            code: 'BAD_REQUEST',
            message: error.message
          }
        }, { status: 400 })
      }
      
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '노선 정보 수정 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'routes', action: 'update' }
)

/**
 * DELETE /api/routes/[id] - 노선 삭제 (소프트 삭제)
 */
export const DELETE = withAuth(
  async (req: NextRequest, context: { params?: any } = {}) => {
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
      
      if (!id) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'BAD_REQUEST',
            message: '노선 ID가 필요합니다'
          }
        }, { status: 400 })
      }

      // 기존 데이터 조회 (감사 로그용)
      const originalRoute = await routeService.getRouteById(id)
      if (!originalRoute) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'NOT_FOUND',
            message: '노선을 찾을 수 없습니다'
          }
        }, { status: 404 })
      }

      // 노선 삭제 (소프트 삭제)
      await routeService.deleteRoute(id)
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        'DELETE',
        'RouteTemplate',
        id,
        { 
          deactivated: {
            from: originalRoute.isActive,
            to: false
          }
        },
        { 
          source: 'web_api',
          originalData: originalRoute
        }
      )
      
      return NextResponse.json({ 
        ok: true, 
        data: { 
          id, 
          isActive: false,
          message: '노선이 비활성화되었습니다' 
        }
      })
    } catch (error) {
      console.error('Failed to delete route:', error)
      
      if (error instanceof Error) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'BAD_REQUEST',
            message: error.message
          }
        }, { status: 400 })
      }
      
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '노선 삭제 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'routes', action: 'delete' }
)