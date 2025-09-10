import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SettlementApiService } from '@/lib/services/settlement-api.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog, apiResponse } from '@/lib/auth/server'
import { confirmSettlementSchema } from '@/lib/validations/settlement'

const settlementApiService = new SettlementApiService(prisma)

/**
 * POST /api/settlements/[id]/confirm - 정산 확정
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

      // 요청 데이터 검증
      const body = await req.json()
      const data = confirmSettlementSchema.parse(body)
      
      // 정산 확정
      const confirmedSettlement = await settlementApiService.confirmSettlement(id, user.id, data)
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        'CONFIRM',
        'Settlement',
        id,
        { 
          status: {
            from: originalSettlement.status,
            to: 'CONFIRMED'
          },
          confirmedBy: user.id,
          confirmedAt: new Date().toISOString(),
          finalAmount: confirmedSettlement.finalAmount
        },
        { 
          source: 'web_api',
          action: 'confirm_settlement'
        }
      )
      
      return apiResponse.success({ 
        settlement: confirmedSettlement,
        message: '정산이 확정되었습니다' 
      })
    } catch (error) {
      console.error('Failed to confirm settlement:', error)
      
      if (error instanceof Error) {
        return apiResponse.error(error.message)
      }
      
      return apiResponse.error('정산 확정 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'settlements', action: 'confirm' }
)