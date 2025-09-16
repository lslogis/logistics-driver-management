import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DriverService } from '@/lib/services/driver.service'
import { withAuth } from '@/lib/auth/rbac'
import { apiResponse } from '@/lib/auth/server'

const driverService = new DriverService(prisma)

/**
 * GET /api/drivers/search - 기사 검색 (자동완성용)
 */
export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url)
      const query = searchParams.get('q') || ''
      const limit = parseInt(searchParams.get('limit') || '10')
      
      if (!query.trim()) {
        return apiResponse.error('검색어를 입력해주세요')
      }
      
      if (query.length < 2) {
        return apiResponse.error('검색어는 2자 이상 입력해주세요')
      }
      
      const drivers = await driverService.searchDrivers(query, Math.min(limit, 50))
      
      return apiResponse.success(drivers)
    } catch (error) {
      console.error('Failed to search drivers:', error)
      return apiResponse.error('기사 검색 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'drivers', action: 'read' }
)