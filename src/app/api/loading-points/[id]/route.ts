import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { LoadingPointService } from '@/lib/services/loading-point.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'
import { updateLoadingPointSchema } from '@/lib/validations/loading-point'

const loadingPointService = new LoadingPointService(prisma)

/**
 * GET /api/loading-points/[id] - 상차지 상세 조회
 */
export const GET = withAuth(
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
      const { id } = params
      
      // 상차지 조회 (Raw SQL)
      const result = await prisma.$queryRaw`
        SELECT * FROM loading_points WHERE id = ${id} LIMIT 1
      ` as any[]
      
      if (!result[0]) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'NOT_FOUND',
            message: '상차지를 찾을 수 없습니다'
          }
        }, { status: 404 })
      }
      
      return NextResponse.json({ ok: true, data: result[0] })
    } catch (error) {
      console.error('Failed to get loading point:', error)
      
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '상차지 조회 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'loading-points', action: 'read' }
)

/**
 * PUT /api/loading-points/[id] - 상차지 수정
 */
export const PUT = withAuth(
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

      // 요청 데이터 검증
      const body = await req.json()
      const data = updateLoadingPointSchema.parse(body)
      
      // 상차지 수정 (Raw SQL)
      const updateResult = await prisma.$queryRaw`
        UPDATE loading_points 
        SET 
          "centerName" = ${data.centerName},
          "loadingPointName" = ${data.loadingPointName},
          "lotAddress" = ${data.lotAddress || ''},
          "roadAddress" = ${data.roadAddress || ''},
          "manager1" = ${data.manager1 || ''},
          "manager2" = ${data.manager2 || ''},
          "phone1" = ${data.phone1 || ''},
          "phone2" = ${data.phone2 || ''},
          "remarks" = ${data.remarks || ''},
          "updatedAt" = NOW()
        WHERE id = ${id}
        RETURNING *
      ` as any[]
      
      const updatedLoadingPoint = updateResult[0]
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        'UPDATE',
        'LoadingPoint',
        id,
        { 
          before: existingLoadingPoint,
          after: data 
        },
        { source: 'web_api' }
      )
      
      return NextResponse.json({ ok: true, data: updatedLoadingPoint })
    } catch (error) {
      console.error('Failed to update loading point:', error)
      
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
        if (error.message.includes('이미 등록된 센터명-상차지명 조합입니다')) {
          return NextResponse.json({
            ok: false,
            error: {
              code: 'DUPLICATE_NAME',
              message: '이미 등록된 센터명-상차지명 조합입니다'
            }
          }, { status: 409 })
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
          message: '상차지 수정 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'routes', action: 'update' }
)

/**
 * DELETE /api/loading-points/[id] - 상차지 삭제 (소프트 삭제)
 */
export const DELETE = withAuth(
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
      
      // 상차지 비활성화 (소프트 삭제 - Raw SQL)
      await prisma.$queryRaw`
        UPDATE loading_points 
        SET "isActive" = false, "updatedAt" = NOW()
        WHERE id = ${id}
      `
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        'DELETE',
        'LoadingPoint',
        id,
        { deleted: existingLoadingPoint },
        { source: 'web_api', soft_delete: true }
      )
      
      return NextResponse.json({ 
        ok: true, 
        data: { message: '상차지가 비활성화되었습니다' }
      })
    } catch (error) {
      console.error('Failed to delete loading point:', error)
      
      if (error instanceof Error) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'BUSINESS_RULE_VIOLATION',
            message: error.message
          }
        }, { status: 400 })
      }
      
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '상차지 비활성화 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'routes', action: 'delete' }
)