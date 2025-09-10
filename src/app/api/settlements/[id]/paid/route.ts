import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SettlementApiService } from '@/lib/services/settlement-api.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog, apiResponse } from '@/lib/auth/server'

const settlementApiService = new SettlementApiService(prisma)

/**
 * POST /api/settlements/[id]/paid - 정산 지급 완료 처리
 */
export const POST = withAuth(
  async (req: NextRequest, context: { params?: any } = {}) => {
    try {
      const user = await getCurrentUser(req)
      if (!user) {
        return apiResponse.unauthorized()
      }

      const { id } = context.params || {}
      
      if (!id) {
        return apiResponse.error('정산 ID가 필요합니다')
      }

      // 기존 상태 조회
      const originalSettlement = await settlementApiService.getSettlementById(id)
      if (!originalSettlement) {
        return apiResponse.error('정산을 찾을 수 없습니다', 404)
      }

      // 정산 지급 완료 처리
      const paidSettlement = await settlementApiService.markSettlementAsPaid(id)
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        'UPDATE',
        'Settlement',
        id,
        { 
          status: {
            from: originalSettlement.status,
            to: 'PAID'
          },
          paidBy: user.id,
          paidAt: new Date().toISOString(),
          finalAmount: paidSettlement.finalAmount
        },
        { 
          source: 'web_api',
          action: 'mark_as_paid'
        }
      )
      
      return apiResponse.success({ 
        settlement: paidSettlement,
        message: '정산이 지급 완료 처리되었습니다' 
      })
    } catch (error) {
      console.error('Failed to mark settlement as paid:', error)
      
      if (error instanceof Error) {
        return apiResponse.error(error.message)
      }
      
      return apiResponse.error('정산 지급 처리 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'settlements', action: 'update' }
)