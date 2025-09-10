import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { VehicleService } from '@/lib/services/vehicle.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog, apiResponse } from '@/lib/auth/server'
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
      return apiResponse.success(result)
    } catch (error) {
      console.error('Failed to get vehicles:', error)
      
      if (error instanceof Error) {
        return apiResponse.error(error.message)
      }
      
      return apiResponse.error('차량 목록 조회 중 오류가 발생했습니다', 500)
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
        return apiResponse.unauthorized()
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
      
      return apiResponse.success(vehicle, 201)
    } catch (error) {
      console.error('Failed to create vehicle:', error)
      
      if (error instanceof Error) {
        return apiResponse.error(error.message)
      }
      
      return apiResponse.error('차량 등록 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'vehicles', action: 'create' }
)