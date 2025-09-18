import { NextRequest, NextResponse } from 'next/server'
import { ZodError, z } from 'zod'
import { prisma } from '@/lib/prisma'
import { PricingService } from '@/lib/services/pricing.service'
import { withAuth } from '@/lib/auth/rbac'

const pricingService = new PricingService(prisma)

// 요금 계산 요청 스키마
const QuoteRequestSchema = z.object({
  centerId: z.string().min(1, '센터 ID는 필수입니다'),
  vehicleType: z.string().min(1, '차량 타입은 필수입니다'),
  regions: z.array(z.string().min(1)).min(1, '지역 정보는 필수입니다'),
  stopCount: z.number().int().min(1, '총착수는 1 이상이어야 합니다'),
  extras: z.object({
    regionMove: z.number().int().min(0).optional(),
    stopExtra: z.number().int().min(0).optional(),
    misc: z.number().int().min(0).optional()
  }).optional().default({}),
  isNegotiated: z.boolean().default(false),
  negotiatedFare: z.number().int().min(0).optional()
})

export const runtime = 'nodejs'

/**
 * POST /api/charters/requests/quote - 용차 요금 계산
 */
export const POST = withAuth(
  async (req: NextRequest) => {
    try {
      // 요청 데이터 검증
      const body = await req.json()
      const data = QuoteRequestSchema.parse(body)
      
      // 입력 검증
      if (data.stopCount !== data.regions.length) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '총착수와 지역 수가 일치하지 않습니다'
          }
        }, { status: 400 })
      }

      // 중복 지역 확인
      const uniqueRegions = [...new Set(data.regions)]
      if (uniqueRegions.length !== data.regions.length) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '중복된 지역이 있습니다'
          }
        }, { status: 400 })
      }

      // 협의금액 검증
      if (data.isNegotiated && (data.negotiatedFare === undefined || data.negotiatedFare < 0)) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '협의금액이 설정되었지만 유효하지 않습니다'
          }
        }, { status: 400 })
      }

      // 센터 존재 확인
      const center = await prisma.loadingPoint.findUnique({
        where: { id: data.centerId }
      })

      if (!center) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'NOT_FOUND',
            message: '존재하지 않는 센터입니다'
          }
        }, { status: 404 })
      }

      if (!center.isActive) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'BUSINESS_ERROR',
            message: '비활성화된 센터입니다'
          }
        }, { status: 400 })
      }

      // 요금 계산
      const pricingInput = {
        centerId: data.centerId,
        vehicleType: data.vehicleType,
        regions: data.regions,
        stopCount: data.stopCount,
        extras: data.extras || {},
        isNegotiated: data.isNegotiated,
        negotiatedFare: data.negotiatedFare
      }

      const result = await pricingService.quoteCenterFare(pricingInput)
      
      // 요율 누락 시 422 상태 코드로 응답
      if (result.metadata.missingRates.length > 0 && !data.isNegotiated) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'MISSING_RATES',
            message: '등록되지 않은 요율이 있습니다',
            details: {
              missingRegions: result.metadata.missingRates,
              centerName: center.centerName,
              vehicleType: data.vehicleType
            }
          },
          data: result // 부분 계산 결과도 함께 반환
        }, { status: 422 })
      }
      
      return NextResponse.json({
        ok: true,
        data: result
      })
    } catch (error) {
      console.error('Failed to calculate quote:', error)
      
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
          message: '요금 계산 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'charters', action: 'read' }
)