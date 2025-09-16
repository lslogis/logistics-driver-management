import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { RateService } from '@/lib/services/rate.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'
import { createRateSchema, getRatesQuerySchema } from '@/lib/validations/rate'

const rateService = new RateService(prisma)

/**
 * GET /api/rates - 요금 목록 조회
 */
export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url)
      const query = getRatesQuerySchema.parse({
        page: searchParams.get('page') || '1',
        limit: searchParams.get('limit') || '20',
        search: searchParams.get('search') || undefined,
        tonnage: searchParams.get('tonnage') || undefined,
        isActive: searchParams.get('isActive') || undefined,
        sortBy: searchParams.get('sortBy') || 'createdAt',
        sortOrder: searchParams.get('sortOrder') || 'desc'
      })

      const result = await rateService.getRates(query)
      return NextResponse.json({ ok: true, data: result })
    } catch (error) {
      console.error('Failed to get rates:', error)

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
          message: '요금 목록 조회 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'rates', action: 'read' }
)

/**
 * POST /api/rates - 요금 등록
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
      const data = createRateSchema.parse(body)

      const rateMaster = await rateService.createRate({
        ...data,
        createdBy: user.id
      })

      await createAuditLog(
        user,
        'CREATE',
        'RateMaster',
        rateMaster.id,
        data,
        { source: 'web_api' }
      )

      return NextResponse.json({ ok: true, data: rateMaster }, { status: 201 })
    } catch (error) {
      console.error('Failed to create rate:', error)

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
          message: '요금 등록 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'rates', action: 'create' }
)