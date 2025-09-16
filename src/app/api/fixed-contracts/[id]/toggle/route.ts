import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FixedContractService } from '@/lib/services/fixed-contract.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'

const fixedContractService = new FixedContractService(prisma)

export const runtime = 'nodejs'

/**
 * POST /api/fixed-contracts/[id]/toggle - 고정계약 활성화/비활성화 토글
 */
export const POST = withAuth(
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

      // 상태 토글
      const updatedContract = await fixedContractService.toggleFixedContractStatus(id)
      
      // 감사 로그 기록
      const action = updatedContract.isActive ? 'ACTIVATE' : 'DEACTIVATE'
      await createAuditLog(
        user,
        action,
        'FixedContract',
        id,
        { 
          before: { isActive: existingContract.isActive },
          after: { isActive: updatedContract.isActive }
        },
        { source: 'web_api' }
      )
      
      return NextResponse.json({ 
        ok: true, 
        data: updatedContract,
        message: `고정계약이 ${updatedContract.isActive ? '활성화' : '비활성화'}되었습니다`
      })
    } catch (error) {
      console.error('Failed to toggle fixed contract status:', error)
      
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
          message: '고정계약 상태 변경 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'fixed_routes', action: 'update' }
)