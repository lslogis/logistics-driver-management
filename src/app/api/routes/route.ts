import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { RouteService } from '@/lib/services/route.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'
import { createRouteSchema, getRoutesQuerySchema } from '@/lib/validations/route'

const routeService = new RouteService(prisma)

/**
 * GET /api/routes - 노선 목록 조회
 */
export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url)
      const query = getRoutesQuerySchema.parse({
        page: searchParams.get('page') || '1',
        limit: searchParams.get('limit') || '20',
        search: searchParams.get('search') || undefined,
        isActive: searchParams.get('isActive') || undefined,
        defaultDriverId: searchParams.get('defaultDriverId') || undefined,
        weekday: searchParams.get('weekday') || undefined,
        sortBy: searchParams.get('sortBy') || 'createdAt',
        sortOrder: searchParams.get('sortOrder') || 'desc'
      })
      
      const result = await routeService.getRoutes(query)
      return NextResponse.json({ ok: true, data: result })
    } catch (error) {
      console.error('Failed to get routes:', error)
      
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
      
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '노선 목록 조회 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'routes', action: 'read' }
)

/**
 * POST /api/routes - 노선 등록
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

      // 요청 데이터 검증
      const body = await req.json()
      const data = createRouteSchema.parse(body)
      
      // 노선 생성
      const route = await routeService.createRoute(data)
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        'CREATE',
        'RouteTemplate',
        route.id,
        data,
        { source: 'web_api' }
      )
      
      return NextResponse.json({ ok: true, data: route }, { status: 201 })
    } catch (error) {
      console.error('Failed to create route:', error)
      
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
          message: '노선 등록 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'routes', action: 'create' }
)