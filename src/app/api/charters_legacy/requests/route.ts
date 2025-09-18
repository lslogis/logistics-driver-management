import { NextRequest, NextResponse } from 'next/server'
import { ZodError, z } from 'zod'
import { prisma } from '@/lib/prisma'
import { CharterService } from '@/lib/services/charter.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'


const charterService = new CharterService(prisma)

// 용차 요청 생성 스키마
const CreateCharterRequestSchema = z.object({
  centerId: z.string().min(1, '센터 ID는 필수입니다'),
  vehicleType: z.string().min(1, '차량 타입은 필수입니다'),
  date: z.string().min(1, '운행일은 필수입니다'),
  destinations: z.array(z.object({
    region: z.string().min(1, '지역은 필수입니다'),
    order: z.number().int().min(1, '순서는 1 이상이어야 합니다')
  })).min(1, '목적지 정보는 필수입니다'),
  isNegotiated: z.boolean().default(false),
  negotiatedFare: z.number().int().min(0).optional(),
  baseFare: z.number().int().min(0).optional(),
  regionFare: z.number().int().min(0).optional(),
  stopFare: z.number().int().min(0).optional(),
  extraFare: z.number().int().min(0).optional(),
  totalFare: z.number().int().min(0, '총 금액은 0 이상이어야 합니다'),
  driverId: z.string().min(1, '기사 ID는 필수입니다'),
  driverFare: z.number().int().min(0, '기사 금액은 0 이상이어야 합니다'),
  notes: z.string().optional()
})

export const runtime = 'nodejs'

/**
 * GET /api/charters/requests - 용차 요청 목록 조회
 */
export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url)
      
      const query = {
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '20'),
        search: searchParams.get('search') || undefined,
        centerId: searchParams.get('centerId') || undefined,
        driverId: searchParams.get('driverId') || undefined,
        vehicleType: searchParams.get('vehicleType') || undefined,
        dateFrom: searchParams.get('dateFrom') || undefined,
        dateTo: searchParams.get('dateTo') || undefined,
        isNegotiated: searchParams.get('isNegotiated') ? searchParams.get('isNegotiated') === 'true' : undefined,
        sortBy: searchParams.get('sortBy') || 'createdAt',
        sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'
      }

      // 허용된 정렬 컬럼만 통과시켜 Prisma 런타임 오류 방지
      const allowedSortFields = new Set(['createdAt', 'date', 'totalFare', 'driverFare'])
      if (!allowedSortFields.has(query.sortBy)) {
        query.sortBy = 'createdAt'
      }

      const result = await charterService.getCharterRequests(query)

      // 프론트엔드 기대 스키마에 맞춰 응답 형태 정규화
      return NextResponse.json({
        ok: true,
        data: {
          charterRequests: result.requests,
          totalCount: result.pagination.totalCount,
          pagination: result.pagination,
        }
      })
    } catch (error) {
      console.error('Failed to get charter requests:', error)
      
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '용차 요청 조회 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'charters', action: 'read' }
)

/**
 * POST /api/charters/requests - 용차 요청 생성
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
      const data = CreateCharterRequestSchema.parse(body)
      
      // 목적지 순서 검증
      const orders = data.destinations.map(d => d.order).sort((a, b) => a - b)
      const expectedOrders = Array.from({length: orders.length}, (_, i) => i + 1)
      if (JSON.stringify(orders) !== JSON.stringify(expectedOrders)) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '목적지 순서가 올바르지 않습니다 (1부터 시작하는 연속된 숫자여야 함)'
          }
        }, { status: 400 })
      }

      // 협의금액 검증
      if (data.isNegotiated && (data.negotiatedFare === undefined || data.negotiatedFare !== data.totalFare)) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '협의금액이 설정되었지만 총 금액과 일치하지 않습니다'
          }
        }, { status: 400 })
      }

      // 용차 요청 생성
      const charterRequest = await charterService.createCharterRequest(data, user.id)
      
      // 감사 로그 기록 (협의금액 사용 시 특별 기록)
      const auditData: any = { created: data }
      if (data.isNegotiated) {
        auditData.negotiated = {
          fare: data.negotiatedFare,
          reason: data.notes || '협의금액 적용',
          user: user.name
        }
      }

      await createAuditLog(
        user,
        'CREATE',
        'CharterRequest',
        charterRequest.id,
        auditData,
        { source: 'web_api' }
      )
      
      return NextResponse.json({
        ok: true,
        data: charterRequest
      }, { status: 201 })
    } catch (error) {
      console.error('Failed to create charter request:', error)
      
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
          message: '용차 요청 생성 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'charters', action: 'create' }
)
