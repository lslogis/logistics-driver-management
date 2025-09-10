import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { SettlementApiService } from '@/lib/services/settlement-api.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'
import { createSettlementSchema, getSettlementsQuerySchema } from '@/lib/validations/settlement'

const settlementApiService = new SettlementApiService(prisma)

/**
 * GET /api/settlements - 정산 목록 조회
 */
export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url)
      const query = getSettlementsQuerySchema.parse({
        page: searchParams.get('page') || '1',
        limit: searchParams.get('limit') || '20',
        search: searchParams.get('search') || undefined,
        status: searchParams.get('status') || undefined,
        driverId: searchParams.get('driverId') || undefined,
        yearMonth: searchParams.get('yearMonth') || undefined,
        confirmedBy: searchParams.get('confirmedBy') || undefined,
        sortBy: searchParams.get('sortBy') || 'yearMonth',
        sortOrder: searchParams.get('sortOrder') || 'desc'
      })
      
      const result = await settlementApiService.getSettlements(query)
      return NextResponse.json({ ok: true, data: result })
    } catch (error) {
      console.error('Failed to get settlements:', error)
      
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
          message: '정산 목록 조회 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'settlements', action: 'read' }
)

/**
 * POST /api/settlements - 정산 생성
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
      const data = createSettlementSchema.parse(body)
      
      // 정산 생성
      const settlement = await settlementApiService.createSettlement(data)
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        'CREATE',
        'Settlement',
        settlement.id,
        data,
        { source: 'web_api' }
      )
      
      return NextResponse.json({ ok: true, data: settlement }, { status: 201 })
    } catch (error) {
      console.error('Failed to create settlement:', error)
      
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
          message: '정산 생성 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'settlements', action: 'create' }
)