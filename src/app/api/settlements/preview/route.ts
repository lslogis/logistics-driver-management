import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SettlementApiService } from '@/lib/services/settlement-api.service'
import { withAuth } from '@/lib/auth/rbac'
import { apiResponse } from '@/lib/auth/server'
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
      
      return apiResponse.success(preview)
    } catch (error) {
      console.error('Failed to preview settlement:', error)
      
      if (error instanceof Error) {
        return apiResponse.error(error.message)
      }
      
      return apiResponse.error('정산 미리보기 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'settlements', action: 'read' }
)