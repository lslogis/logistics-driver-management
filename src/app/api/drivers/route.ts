import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { DriverService } from '@/lib/services/driver.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'
import { createDriverSchema, getDriversQuerySchema } from '@/lib/validations/driver'

const driverService = new DriverService(prisma)

/**
 * GET /api/drivers - 기사 목록 조회 (최적화됨)
 */
export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url)
      const queryParams = Object.fromEntries(searchParams.entries())
      
      // Search term validation - minimum 2 characters (shape aligned with consumers)
      if (queryParams.search && queryParams.search.length < 2) {
        return NextResponse.json({
          ok: true,
          data: {
            drivers: [],
            pagination: {
              page: 1,
              limit: Math.min(parseInt(queryParams.limit || '10'), 50),
              total: 0,
              totalPages: 0,
              hasNext: false,
              hasPrev: false
            }
          }
        })
      }
      
      // Limit parameter validation - max 50
      const limit = Math.min(parseInt(queryParams.limit || '10'), 50)
      queryParams.limit = limit.toString()
      
      // 쿼리 파라미터 검증
      const query = getDriversQuerySchema.parse(queryParams)
      
      // 기사 목록 조회 (원래 소비자 기대 형태 유지)
      const result = await driverService.getDrivers(query)
      return NextResponse.json({ ok: true, data: result })
    } catch (error) {
      console.error('Failed to get drivers:', error)
      
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
          message: '기사 목록 조회 중 오류가 발생했습니다'
        }
      }, { status: 500 })
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
      
      return NextResponse.json({ ok: true, data: driver }, { status: 201 })
    } catch (error) {
      console.error('Failed to create driver:', error)
      
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
        // 중복 전화번호 체크
        if (error.message.includes('unique') || error.message.includes('Unique')) {
          return NextResponse.json({
            ok: false,
            error: {
              code: 'DUPLICATE_PHONE',
              message: '이미 등록된 전화번호입니다'
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
          message: '기사 생성 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'drivers', action: 'create' }
)
