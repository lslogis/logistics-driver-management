import { NextRequest, NextResponse } from 'next/server'
import { ZodError, z } from 'zod'
import { prisma } from '@/lib/prisma'
import { SettlementApiService } from '@/lib/services/settlement-api.service'
import { CharterSettlementService } from '@/lib/services/settlement-charter.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const settlementApiService = new SettlementApiService(prisma)
const settlementService = new CharterSettlementService(prisma)

const finalizeSettlementSchema = z.object({
  driverId: z
    .string()
    .uuid('올바른 기사 ID가 아닙니다'),
  yearMonth: z
    .string()
    .regex(/^\d{4}-\d{2}$/, '월 형식은 YYYY-MM 이어야 합니다'),
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
      const { driverId, yearMonth, remarks } = finalizeSettlementSchema.parse(body)
      
      // 미래 월 차단
      const [year, month] = yearMonth.split('-').map(Number)
      const targetMonth = new Date(year, month - 1)
      const currentMonth = new Date()
      currentMonth.setDate(1)
      currentMonth.setHours(0, 0, 0, 0)
      
      if (targetMonth > currentMonth) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'INVALID_MONTH',
            message: '미래 월의 정산은 확정할 수 없습니다'
          }
        }, { status: 400 })
      }
      
      // 기존 정산 확인 (중복 락 방지)
      const existing = await prisma.settlement.findUnique({
        where: {
          unique_driver_yearmonth: {
            driverId,
            yearMonth
          }
        }
      })
      
      if (existing && existing.status === 'CONFIRMED') {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'ALREADY_CONFIRMED',
            message: '이미 확정된 정산입니다'
          }
        }, { status: 409 })
      }
      
      // 정산 계산 및 저장
      const calculation = await settlementService.calculateMonthlySettlement(driverId, yearMonth)
      
      // 빈 데이터 처리
      if (calculation.totalTrips === 0) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'NO_DATA',
            message: '해당 월에 운행 기록이 없습니다'
          }
        }, { status: 400 })
      }
      
      // 정산 생성 또는 업데이트
      const settlement = await prisma.settlement.upsert({
        where: {
          unique_driver_yearmonth: {
            driverId,
            yearMonth
          }
        },
        create: {
          driverId,
          yearMonth,
          status: 'CONFIRMED',
          totalTrips: calculation.totalTrips,
          totalBaseFare: calculation.totalBaseFare,
          totalDeductions: calculation.totalDeductions,
          totalAdditions: calculation.totalAdditions,
          finalAmount: calculation.finalAmount,
          confirmedAt: new Date(),
          confirmedBy: user.id,
          createdBy: user.id,
          items: {
            create: calculation.items.map(item => ({
              tripId: item.tripId,
              type: item.type,
              description: item.description,
              amount: item.amount,
              date: item.date
            }))
          }
        },
        update: {
          status: 'CONFIRMED',
          totalTrips: calculation.totalTrips,
          totalBaseFare: calculation.totalBaseFare,
          totalDeductions: calculation.totalDeductions,
          totalAdditions: calculation.totalAdditions,
          finalAmount: calculation.finalAmount,
          confirmedAt: new Date(),
          confirmedBy: user.id
        },
        include: {
          driver: true,
          confirmer: true
        }
      })
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        existing ? 'UPDATE' : 'CREATE',
        'Settlement',
        settlement.id,
        { 
          action: 'finalize', 
          yearMonth,
          driverId,
          finalAmount: calculation.finalAmount.toString(),
          remarks 
        },
        { 
          source: 'web_api', 
          previousStatus: existing?.status || 'NONE',
          newStatus: 'CONFIRMED' 
        }
      )
      
      return NextResponse.json({ 
        ok: true, 
        data: {
          ...settlement,
          totalBaseFare: settlement.totalBaseFare.toString(),
          totalDeductions: settlement.totalDeductions.toString(),
          totalAdditions: settlement.totalAdditions.toString(),
          finalAmount: settlement.finalAmount.toString()
        }
      })
    } catch (error) {
      console.error('Failed to finalize settlement:', error)
      
      if (error instanceof ZodError) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '입력값이 올바르지 않습니다',
            details: error.errors
          }
        }, { status: 400 })
      }
      
      if (error instanceof Error) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'BAD_REQUEST',
            message: error.message
          }
        }, { status: 400 })
      }
      
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '정산 확정 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'settlements', action: 'update' }
)