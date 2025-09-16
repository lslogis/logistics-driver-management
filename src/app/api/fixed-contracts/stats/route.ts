import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FixedContractService } from '@/lib/services/fixed-contract.service'
import { withAuth } from '@/lib/auth/rbac'

const fixedContractService = new FixedContractService(prisma)

export const runtime = 'nodejs'

/**
 * GET /api/fixed-contracts/stats - 고정계약 통계 조회
 */
export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      const stats = await fixedContractService.getContractStats()
      
      return NextResponse.json({ ok: true, data: stats })
    } catch (error) {
      console.error('Failed to get fixed contract stats:', error)
      
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '고정계약 통계 조회 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'fixed_routes', action: 'read' }
)