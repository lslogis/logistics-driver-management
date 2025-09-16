import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { FixedContractService } from '@/lib/services/fixed-contract.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'
import { UpdateFixedContractSchema } from '@/lib/validations/fixedContract'

const fixedContractService = new FixedContractService(prisma)

export const runtime = 'nodejs'

/**
 * GET /api/fixed-contracts/[id] - 고정계약 상세 조회
 */
export const GET = withAuth(
  async (req: NextRequest, context: { params?: { id: string } }) => {
    try {
      const { params } = context
      if (!params) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'MISSING_PARAMS',
            message: 'Missing route parameters'
          }
        }, { status: 400 })
      }
      const { id } = params
      
      if (!id || typeof id !== 'string') {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '유효하지 않은 ID입니다'
          }
        }, { status: 400 })
      }
      
      const fixedContract = await fixedContractService.getFixedContractById(id)
      
      if (!fixedContract) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'NOT_FOUND',
            message: '고정계약을 찾을 수 없습니다'
          }
        }, { status: 404 })
      }
      
      return NextResponse.json({ ok: true, data: fixedContract })
    } catch (error) {
      console.error('Failed to get fixed contract:', error)
      
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '고정계약 조회 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'fixed_routes', action: 'read' }
)

/**
 * PUT /api/fixed-contracts/[id] - 고정계약 수정
 */
export const PUT = withAuth(
  async (req: NextRequest, context: { params?: { id: string } }) => {
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

      const { params } = context
      if (!params) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'MISSING_PARAMS',
            message: 'Missing route parameters'
          }
        }, { status: 400 })
      }
      const { id } = params
      
      if (!id || typeof id !== 'string') {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '유효하지 않은 ID입니다'
          }
        }, { status: 400 })
      }

      // 기존 계약 조회 (감사 로그용)
      const existingContract = await fixedContractService.getFixedContractById(id)
      if (!existingContract) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'NOT_FOUND',
            message: '고정계약을 찾을 수 없습니다'
          }
        }, { status: 404 })
      }

      // 요청 데이터 검증
      const body = await req.json()
      const data = UpdateFixedContractSchema.parse(body)
      
      // 고정계약 수정
      const updatedContract = await fixedContractService.updateFixedContract(id, data)
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        'UPDATE',
        'FixedContract',
        id,
        { 
          before: existingContract,
          after: data,
          changes: data
        },
        { source: 'web_api' }
      )
      
      return NextResponse.json({ ok: true, data: updatedContract })
    } catch (error) {
      console.error('Failed to update fixed contract:', error)
      
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
          message: '고정계약 수정 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'fixed_routes', action: 'update' }
)

/**
 * DELETE /api/fixed-contracts/[id] - 고정계약 삭제 (비활성화)
 */
export const DELETE = withAuth(
  async (req: NextRequest, context: { params?: { id: string } }) => {
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

      const { params } = context
      if (!params) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'MISSING_PARAMS',
            message: 'Missing route parameters'
          }
        }, { status: 400 })
      }
      const { id } = params
      
      if (!id || typeof id !== 'string') {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '유효하지 않은 ID입니다'
          }
        }, { status: 400 })
      }

      // 기존 계약 조회 (감사 로그용)
      const existingContract = await fixedContractService.getFixedContractById(id)
      if (!existingContract) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'NOT_FOUND',
            message: '고정계약을 찾을 수 없습니다'
          }
        }, { status: 404 })
      }

      // 고정계약 완전 삭제 (하드 삭제)
      await fixedContractService.hardDeleteFixedContract(id)
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        'DELETE',
        'FixedContract',
        id,
        { deleted: existingContract },
        { source: 'web_api' }
      )
      
      return NextResponse.json({ 
        ok: true, 
        message: '고정계약이 삭제되었습니다' 
      })
    } catch (error) {
      console.error('Failed to delete fixed contract:', error)
      
      if (error instanceof Error) {
        if (error.message.includes('찾을 수 없습니다')) {
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
            message: error.message
          }
        }, { status: 500 })
      }
      
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '고정계약 삭제 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'fixed_routes', action: 'delete' }
)