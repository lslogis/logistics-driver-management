import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { RateService } from '@/lib/services/rate.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'
import { updateRateSchema } from '@/lib/validations/rate'

const rateService = new RateService(prisma)

/**
 * GET /api/rates/[id] - 요금 단일 조회
 */
export const GET = withAuth(
  async (req: NextRequest, context: { params?: any }) => {
    const { params } = context
    if (!params?.id) {
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INVALID_REQUEST',
          message: '요금 ID가 필요합니다'
        }
      }, { status: 400 })
    }
    try {
      const rateMaster = await rateService.getRate(params.id)
      return NextResponse.json({ ok: true, data: rateMaster })
    } catch (error) {
      console.error('Failed to get rate:', error)

      if (error instanceof Error && error.message.includes('찾을 수 없습니다')) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'NOT_FOUND',
            message: error.message
          }
        }, { status: 404 })
      }

      return NextResponse.json({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '요금 조회 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'rates', action: 'read' }
)

/**
 * PUT /api/rates/[id] - 요금 수정
 */
export const PUT = withAuth(
  async (req: NextRequest, context: { params?: any }) => {
    const { params } = context
    if (!params?.id) {
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INVALID_REQUEST',
          message: '요금 ID가 필요합니다'
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

      const body = await req.json()
      const data = updateRateSchema.parse(body)

      const rateMaster = await rateService.updateRate(params.id, data)

      await createAuditLog(
        user,
        'UPDATE',
        'RateMaster',
        params.id,
        data,
        { source: 'web_api' }
      )

      return NextResponse.json({ ok: true, data: rateMaster })
    } catch (error) {
      console.error('Failed to update rate:', error)

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

      if (error instanceof Error && error.message.includes('찾을 수 없습니다')) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'NOT_FOUND',
            message: error.message
          }
        }, { status: 404 })
      }

      if (error instanceof Error && error.message.includes('이미 존재')) {
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
          code: 'INTERNAL_ERROR',
          message: '요금 수정 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'rates', action: 'update' }
)

/**
 * DELETE /api/rates/[id] - 요금 삭제
 */
export const DELETE = withAuth(
  async (req: NextRequest, context: { params?: any }) => {
    const { params } = context
    if (!params?.id) {
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INVALID_REQUEST',
          message: '요금 ID가 필요합니다'
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

      // 삭제 전 데이터 조회 (감사 로그용)
      const existingRate = await rateService.getRate(params.id)
      
      await rateService.deleteRate(params.id)

      await createAuditLog(
        user,
        'DELETE',
        'RateMaster',
        params.id,
        existingRate,
        { source: 'web_api' }
      )

      return NextResponse.json({ ok: true, message: '요금이 삭제되었습니다' })
    } catch (error) {
      console.error('Failed to delete rate:', error)

      if (error instanceof Error && error.message.includes('찾을 수 없습니다')) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'NOT_FOUND',
            message: error.message
          }
        }, { status: 404 })
      }

      return NextResponse.json({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '요금 삭제 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'rates', action: 'delete' }
)