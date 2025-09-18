import { NextRequest, NextResponse } from 'next/server'
import { ZodError, z } from 'zod'
import { prisma } from '@/lib/prisma'
import { CenterFareService } from '@/lib/services/center-fare.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'

const centerFareService = new CenterFareService(prisma)

// 센터 요율 생성 스키마
const CreateCenterFareSchema = z.object({
  loadingPointId: z.string().min(1, '상차지는 필수입니다'),
  vehicleType: z.string().min(1, '차량 타입은 필수입니다'),
  region: z.string().optional().nullable(),
  fareType: z.enum(['BASIC', 'STOP_FEE']),
  baseFare: z.number().int().positive().optional(),
  extraStopFee: z.number().int().positive().optional(),
  extraRegionFee: z.number().int().positive().optional(),
}).refine(data => {
  if (data.fareType === 'BASIC') {
    return data.baseFare !== undefined && typeof data.region === 'string' && data.region.trim().length > 0
  }
  if (data.fareType === 'STOP_FEE') {
    return data.extraStopFee !== undefined && 
           data.extraRegionFee !== undefined
  }
  return false
}, {
  message: '요율 종류에 맞는 필수 필드를 입력하세요'
})

export const runtime = 'nodejs'

/**
 * GET /api/center-fares - 센터 요율 목록 조회
 */
export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url)
      
      const query = {
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '20'),
        search: searchParams.get('search') || undefined,
        loadingPointId: searchParams.get('loadingPointId') || undefined,
        vehicleType: searchParams.get('vehicleType') || undefined,
        region: searchParams.get('region') || undefined,
        fareType: searchParams.get('fareType') as any || undefined,
        sortBy: searchParams.get('sortBy') || 'createdAt',
        sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'
      }

      const result = await centerFareService.getCenterFares(query)
      
      return NextResponse.json({
        ok: true,
        data: result
      })
    } catch (error) {
      console.error('Failed to get center fares:', error)
      
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '센터 요율 조회 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'charters', action: 'read' }
)

/**
 * POST /api/center-fares - 센터 요율 생성
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
      const parsed = CreateCenterFareSchema.parse(body)
      const data = {
        ...parsed,
        region: parsed.fareType === 'BASIC'
          ? (parsed.region ? parsed.region.trim() : '')
          : null,
      }

      // 센터 요율 생성
      const centerFare = await centerFareService.createCenterFare(data)
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        'CREATE',
        'CenterFare',
        centerFare.id,
        { created: centerFare },
        { source: 'web_api' }
      )
      
      return NextResponse.json({
        ok: true,
        data: centerFare
      }, { status: 201 })
    } catch (error) {
      console.error('Failed to create center fare:', error)
      
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
        // 중복 요율 체크
        if (error.message.includes('이미 등록된')) {
          return NextResponse.json({
            ok: false,
            error: {
              code: 'DUPLICATE_ERROR',
              message: error.message
            }
          }, { status: 409 })
        }
        
        // 비즈니스 로직 오류
        if (error.message.includes('존재하지 않는') || error.message.includes('비활성화된')) {
          return NextResponse.json({
            ok: false,
            error: {
              code: 'BUSINESS_ERROR',
              message: error.message
            }
          }, { status: 400 })
        }
        
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
          message: '센터 요율 생성 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'charters', action: 'create' }
)
