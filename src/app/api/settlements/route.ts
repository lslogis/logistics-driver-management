import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SettlementApiService } from '@/lib/services/settlement-api.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog, apiResponse } from '@/lib/auth/server'
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
      return apiResponse.success(result)
    } catch (error) {
      console.error('Failed to get settlements:', error)
      
      if (error instanceof Error) {
        return apiResponse.error(error.message)
      }
      
      return apiResponse.error('정산 목록 조회 중 오류가 발생했습니다', 500)
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
        return apiResponse.unauthorized()
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
      
      return apiResponse.success(settlement, 201)
    } catch (error) {
      console.error('Failed to create settlement:', error)
      
      if (error instanceof Error) {
        return apiResponse.error(error.message)
      }
      
      return apiResponse.error('정산 생성 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'settlements', action: 'create' }
)