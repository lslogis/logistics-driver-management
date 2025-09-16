import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { FixedContractService } from '@/lib/services/fixed-contract.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'
import { 
  CreateFixedContractSchema, 
  GetFixedContractsQuerySchema 
} from '@/lib/validations/fixedContract'

const fixedContractService = new FixedContractService(prisma)

export const runtime = 'nodejs'

/**
 * GET /api/fixed-contracts - 고정계약 목록 조회
 */
export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url)
      const queryParams = Object.fromEntries(searchParams.entries())
      
      // 쿼리 파라미터 검증
      const query = GetFixedContractsQuerySchema.parse(queryParams)
      
      // 고정계약 목록 조회
      const result = await fixedContractService.getFixedContracts(query)
      
      return NextResponse.json({ ok: true, data: result })
    } catch (error) {
      console.error('Failed to get fixed contracts:', error)
      
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
            code: 'INTERNAL_ERROR',
            message: error.message
          }
        }, { status: 500 })
      }
      
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '고정계약 목록 조회 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'fixed_contracts', action: 'read' }
)

/**
 * POST /api/fixed-contracts - 고정계약 생성
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
      const data = CreateFixedContractSchema.parse(body)
      
      // 고정계약 생성
      const fixedContract = await fixedContractService.createFixedContract(data, user.id)
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        'CREATE',
        'FixedContract',
        fixedContract.id,
        { created: data },
        { source: 'web_api' }
      )
      
      return NextResponse.json({ ok: true, data: fixedContract }, { status: 201 })
    } catch (error) {
      console.error('Failed to create fixed contract:', error)
      
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
        if (error.message.includes('찾을 수 없습니다') || error.message.includes('비활성화된')) {
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
          message: '고정계약 생성 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'fixed_contracts', action: 'create' }
)
