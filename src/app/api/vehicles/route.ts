import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { VehicleService } from '@/lib/services/vehicle.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'
import { createVehicleSchema, getVehiclesQuerySchema } from '@/lib/validations/vehicle'

const vehicleService = new VehicleService(prisma)

/**
 * GET /api/vehicles - 차량 목록 조회
 */
export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url)
      const query = getVehiclesQuerySchema.parse({
        page: searchParams.get('page') || '1',
        limit: searchParams.get('limit') || '20',
        search: searchParams.get('search') || undefined,
        vehicleType: searchParams.get('vehicleType') || undefined,
        ownership: searchParams.get('ownership') || undefined,
        isActive: searchParams.get('isActive') || undefined,
        driverId: searchParams.get('driverId') || undefined,
        sortBy: searchParams.get('sortBy') || 'createdAt',
        sortOrder: searchParams.get('sortOrder') || 'desc'
      })
      
      const result = await vehicleService.getVehicles(query)
      return NextResponse.json({ ok: true, data: result })
    } catch (error) {
      console.error('Failed to get vehicles:', error)
      
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
          message: '차량 목록 조회 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'vehicles', action: 'read' }
)

/**
 * POST /api/vehicles - 차량 등록
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
      const data = createVehicleSchema.parse(body)
      
      // 차량 생성
      const vehicle = await vehicleService.createVehicle(data)
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        'CREATE',
        'Vehicle',
        vehicle.id,
        data,
        { source: 'web_api' }
      )
      
      return NextResponse.json({ ok: true, data: vehicle }, { status: 201 })
    } catch (error) {
      console.error('Failed to create vehicle:', error)
      
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
        // 중복 차량번호 체크
        if (error.message.includes('unique') || error.message.includes('Unique')) {
          return NextResponse.json({
            ok: false,
            error: {
              code: 'DUPLICATE_PLATE_NUMBER',
              message: '이미 등록된 차량번호입니다'
            }
          }, { status: 409 })
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
          message: '차량 등록 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'vehicles', action: 'create' }
)