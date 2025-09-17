import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/server'
import { validateCenterFares } from '@/lib/services/center-fare.service'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// 검증 요청 스키마
const ValidateRowSchema = z.object({
  centerName: z.string(),
  vehicleType: z.string(),
  region: z.string().nullable(),
  fareType: z.enum(['BASIC', 'STOP_FEE']),
  baseFare: z.number().nullable().optional(),
  extraStopFee: z.number().nullable().optional(),
  extraRegionFee: z.number().nullable().optional()
})

const ValidateRequestSchema = z.object({
  rows: z.array(ValidateRowSchema).min(1, '최소 1개 이상의 데이터가 필요합니다')
})

type ValidateRow = z.infer<typeof ValidateRowSchema>

/**
 * POST /api/center-fares/validate - 센터요율 데이터 중복 검증
 */
export async function POST(req: NextRequest) {
  try {
    // 사용자 인증 확인
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

    // 요청 데이터 파싱 및 검증
    let requestData
    try {
      const rawData = await req.json()
      requestData = ValidateRequestSchema.parse(rawData)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '데이터 검증 실패',
            details: error.errors
          }
        }, { status: 400 })
      }
      
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INVALID_DATA',
          message: '잘못된 요청 데이터입니다'
        }
      }, { status: 400 })
    }

    // 중복 검증 수행
    const duplicates = await validateCenterFares(requestData.rows, prisma)

    return NextResponse.json({
      ok: true,
      data: {
        duplicates
      }
    })

  } catch (error) {
    console.error('센터요율 검증 실패:', error)
    return NextResponse.json({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '서버 오류가 발생했습니다'
      }
    }, { status: 500 })
  }
}