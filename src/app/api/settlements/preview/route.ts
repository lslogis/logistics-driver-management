import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { SettlementApiService } from '@/lib/services/settlement-api.service'
import { withAuth } from '@/lib/auth/rbac'
import { previewSettlementSchema } from '@/lib/validations/settlement'

const settlementApiService = new SettlementApiService(prisma)

/**
 * POST /api/settlements/preview - 정산 미리보기
 */
export const POST = withAuth(
  async (req: NextRequest) => {
    try {
      // 요청 데이터 검증
      const body = await req.json()
      const data = previewSettlementSchema.parse(body)
      
      // 정산 미리보기 생성
      const preview = await settlementApiService.previewSettlement(data)
      
      return NextResponse.json({ ok: true, data: preview })
    } catch (error) {
      console.error('Failed to preview settlement:', error)
      
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
        // 미래 월 차단
        if (error.message.includes('미래')) {
          return NextResponse.json({
            ok: false,
            error: {
              code: 'INVALID_MONTH',
              message: error.message
            }
          }, { status: 400 })
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
          message: '정산 미리보기 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'settlements', action: 'read' }
)