import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { TripService } from '@/lib/services/trip.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'
import { createTripSchema, getTripsQuerySchema } from '@/lib/validations/trip'

const tripService = new TripService(prisma)

/**
 * GET /api/trips - 운행 목록 조회
 */
export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url)
      const query = getTripsQuerySchema.parse({
        page: searchParams.get('page') || '1',
        limit: searchParams.get('limit') || '20',
        search: searchParams.get('search') || undefined,
        status: searchParams.get('status') || undefined,
        driverId: searchParams.get('driverId') || undefined,
        vehicleId: searchParams.get('vehicleId') || undefined,
        routeTemplateId: searchParams.get('routeTemplateId') || undefined,
        dateFrom: searchParams.get('dateFrom') || undefined,
        dateTo: searchParams.get('dateTo') || undefined,
        sortBy: searchParams.get('sortBy') || 'date',
        sortOrder: searchParams.get('sortOrder') || 'desc'
      })
      
      const result = await tripService.getTrips(query)
      return NextResponse.json({ ok: true, data: result })
    } catch (error) {
      console.error('Failed to get trips:', error)
      
      if (error instanceof ZodError) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '요청 파라미터가 올바르지 않습니다',
            details: error.errors
          }
        }, { status: 400 })
      }
      
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '운행 목록 조회 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'trips', action: 'read' }
)

/**
 * POST /api/trips - 운행 등록
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
      const data = createTripSchema.parse(body)
      
      // 운행 생성
      const trip = await tripService.createTrip(data)
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        'CREATE',
        'Trip',
        trip.id,
        data,
        { source: 'web_api' }
      )
      
      return NextResponse.json({ ok: true, data: trip }, { status: 201 })
    } catch (error) {
      console.error('Failed to create trip:', error)
      
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
        // Check for unique constraint violation (duplicate trip)
        if (error.message.includes('unique_vehicle_date_driver') || error.message.includes('중복')) {
          return NextResponse.json({
            ok: false,
            error: {
              code: 'CONFLICT',
              message: '같은 날짜에 해당 차량과 기사로 이미 등록된 운행이 있습니다'
            }
          }, { status: 409 })
        }
        
        if (error.message.includes('찾을 수 없습니다')) {
          return NextResponse.json({
            ok: false,
            error: {
              code: 'NOT_FOUND',
              message: error.message
            }
          }, { status: 404 })
        }
        
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
          message: '운행 등록 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'trips', action: 'create' }
)