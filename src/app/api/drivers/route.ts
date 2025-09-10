import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DriverService } from '@/lib/services/driver.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog, apiResponse } from '@/lib/auth/server'
import { createDriverSchema, getDriversQuerySchema } from '@/lib/validations/driver'

const driverService = new DriverService(prisma)

/**
 * GET /api/drivers - 기사 목록 조회
 */
export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url)
      const queryParams = Object.fromEntries(searchParams.entries())
      
      // 쿼리 파라미터 검증
      const query = getDriversQuerySchema.parse(queryParams)
      
      // 기사 목록 조회
      const result = await driverService.getDrivers(query)
      
      return apiResponse.success(result)
    } catch (error) {
      console.error('Failed to get drivers:', error)
      
      if (error instanceof Error) {
        return apiResponse.error(error.message)
      }
      
      return apiResponse.error('기사 목록 조회 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'drivers', action: 'read' }
)

/**
 * POST /api/drivers - 기사 생성
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
      const data = createDriverSchema.parse(body)
      
      // 기사 생성
      const driver = await driverService.createDriver(data)
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        'CREATE',
        'Driver',
        driver.id,
        { created: data },
        { source: 'web_api' }
      )
      
      return apiResponse.success(driver, 201)
    } catch (error) {
      console.error('Failed to create driver:', error)
      
      if (error instanceof Error) {
        return apiResponse.error(error.message)
      }
      
      return apiResponse.error('기사 생성 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'drivers', action: 'create' }
)