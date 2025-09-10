import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SettlementApiService } from '@/lib/services/settlement-api.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog, apiResponse } from '@/lib/auth/server'
import { z } from 'zod'

const settlementApiService = new SettlementApiService(prisma)

const exportSettlementsSchema = z.object({
  yearMonth: z
    .string()
    .regex(/^\d{4}-\d{2}$/, '월 형식은 YYYY-MM 이어야 합니다'),
  driverIds: z
    .array(z.string().uuid())
    .optional()
})

/**
 * POST /api/settlements/export - 정산 내역 엑셀 내보내기
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
      const { yearMonth, driverIds } = exportSettlementsSchema.parse(body)
      
      // 정산 데이터 조회 및 Excel 생성
      const excelBuffer = await settlementApiService.exportSettlementsToExcel(yearMonth, driverIds)
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        'READ',
        'Settlement',
        null,
        { action: 'export', yearMonth, driverCount: driverIds?.length || 'all' },
        { source: 'web_api' }
      )
      
      // Excel 파일 응답 헤더 설정
      const fileName = `settlements_${yearMonth}_${new Date().toISOString().slice(0, 10)}.xlsx`
      
      return new Response(excelBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': excelBuffer.length.toString()
        }
      })
    } catch (error) {
      console.error('Failed to export settlements:', error)
      
      if (error instanceof Error) {
        return apiResponse.error(error.message)
      }
      
      return apiResponse.error('정산 내역 내보내기 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'settlements', action: 'read' }
)