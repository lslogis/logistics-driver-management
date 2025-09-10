import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SettlementApiService } from '@/lib/services/settlement-api.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog, apiResponse } from '@/lib/auth/server'
import { z } from 'zod'

const settlementApiService = new SettlementApiService(prisma)

const finalizeSettlementSchema = z.object({
  settlementId: z
    .string()
    .uuid('올바른 정산 ID가 아닙니다'),
  remarks: z
    .string()
    .max(1000, '비고는 1000자 이하로 입력해주세요')
    .optional()
})

/**
 * POST /api/settlements/finalize - 정산 확정 (월락)
 */
export const POST = withAuth(
  async (req: NextRequest) => {
    try {
      const user = await getCurrentUser(req)
      if (!user) {
        return apiResponse.unauthorized()
      }

      // 요청 데이터 검증
      const body = await req.json()
      const { settlementId, remarks } = finalizeSettlementSchema.parse(body)
      
      // 정산 확정 처리
      const settlement = await settlementApiService.finalizeSettlement(settlementId, user.id, remarks)
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        'UPDATE',
        'Settlement',
        settlement.id,
        { action: 'finalize', remarks },
        { source: 'web_api', previousStatus: 'DRAFT', newStatus: 'CONFIRMED' }
      )
      
      return apiResponse.success(settlement)
    } catch (error) {
      console.error('Failed to finalize settlement:', error)
      
      if (error instanceof Error) {
        return apiResponse.error(error.message)
      }
      
      return apiResponse.error('정산 확정 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'settlements', action: 'update' }
)