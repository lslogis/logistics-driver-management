import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { LoadingPointService } from '@/lib/services/loading-point.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'
import { createLoadingPointSchema, getLoadingPointsQuerySchema } from '@/lib/validations/loading-point'

// LoadingPointService 초기화는 런타임에서 처리

// Server-side cache for center names (5 minute TTL)
interface CacheEntry {
  data: string[]
  timestamp: number
  ttl: number
}

const centerNamesCache = new Map<string, CacheEntry>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds

function getCachedCenterNames(): string[] | null {
  const cacheKey = 'distinct_center_names'
  const cached = centerNamesCache.get(cacheKey)
  
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data
  }
  
  // Clean expired cache
  if (cached) {
    centerNamesCache.delete(cacheKey)
  }
  
  return null
}

function setCachedCenterNames(data: string[]): void {
  const cacheKey = 'distinct_center_names'
  centerNamesCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttl: CACHE_TTL
  })
}

/**
 * GET /api/loading-points - 상차지 목록 조회
 */
export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url)
      const queryParams = Object.fromEntries(searchParams.entries())
      
      // 기본값 설정
      const queryWithDefaults = {
        page: '1',
        limit: '10',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ...queryParams
      }
      
      // 쿼리 파라미터 검증
      const query = getLoadingPointsQuerySchema.parse(queryWithDefaults)
      
      // Distinct centerName 요청 처리 (with caching)
      if (queryParams.field === 'centerName' && queryParams.distinct === 'true') {
        // Check cache first
        let items = getCachedCenterNames()
        
        if (!items) {
          // Cache miss - fetch from database
          const distinctCenters = await prisma.$queryRaw`
            SELECT DISTINCT "centerName"
            FROM loading_points 
            WHERE "centerName" IS NOT NULL 
            AND "centerName" != ''
            AND "isActive" = true
            ORDER BY "centerName" ASC
          ` as Array<{centerName: string}>
          
          items = distinctCenters
            .map(row => row.centerName.trim())
            .filter(name => name.length > 0)
          
          // Cache the result for 5 minutes
          setCachedCenterNames(items)
        }
        
        // Set cache headers for client-side caching
        const response = NextResponse.json({ ok: true, data: { items } })
        response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60')
        return response
      }
      
      // 상차지 목록 조회 (Raw SQL - 비활성화 항목도 포함)
      const offset = (query.page - 1) * query.limit
      
      // 검색 및 필터 조건 구성
      let whereClause = 'WHERE 1=1'
      const queryValues: any[] = []
      let paramIndex = 1
      
      if (query.search) {
        whereClause += ` AND (
          "centerName" ILIKE $${paramIndex} OR 
          "loadingPointName" ILIKE $${paramIndex + 1} OR 
          "lotAddress" ILIKE $${paramIndex + 2} OR 
          "roadAddress" ILIKE $${paramIndex + 3}
        )`
        const searchPattern = `%${query.search}%`
        queryValues.push(searchPattern, searchPattern, searchPattern, searchPattern)
        paramIndex += 4
      }
      
      if (query.status) {
        const isActive = query.status === 'active'
        whereClause += ` AND "isActive" = $${paramIndex}`
        queryValues.push(isActive)
        paramIndex++
      }
      
      // 전체 개수 조회
      const countQuery = `SELECT COUNT(*) as count FROM loading_points ${whereClause}`
      const countResult = await prisma.$queryRawUnsafe(countQuery, ...queryValues) as any[]
      const totalCount = Number(countResult[0].count)
      
      console.log('Loading Points API:', {
        whereClause,
        queryValues,
        totalCount,
        query
      })
      
      // 데이터 조회
      const dataQuery = `
        SELECT 
          "id", "centerName", "loadingPointName", "lotAddress", "roadAddress", 
          "manager1", "manager2", "phone1", "phone2", "remarks", "isActive", 
          "createdAt", "updatedAt"
        FROM loading_points 
        ${whereClause}
        ORDER BY "createdAt" DESC
        LIMIT ${query.limit} OFFSET ${offset}
      `
      const loadingPoints = await prisma.$queryRawUnsafe(dataQuery, ...queryValues)
      
      const result = {
        items: loadingPoints,
        totalCount,
        pageCount: Math.ceil(totalCount / query.limit),
        currentPage: query.page
      }
      
      return NextResponse.json({ ok: true, data: result })
    } catch (error) {
      console.error('Failed to get loading points:', error)
      
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
          message: '상차지 목록 조회 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'routes', action: 'read' } // 노선 관련 권한으로 설정
)

/**
 * POST /api/loading-points - 상차지 생성
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
      const data = createLoadingPointSchema.parse(body)
      
      // Prisma ORM을 사용한 데이터 생성
      const loadingPoint = await prisma.loadingPoint.create({
        data: {
          centerName: data.centerName,
          loadingPointName: data.loadingPointName,
          lotAddress: data.lotAddress || null,
          roadAddress: data.roadAddress || null,
          manager1: data.manager1 || null,
          manager2: data.manager2 || null,
          phone1: data.phone1 || null,
          phone2: data.phone2 || null,
          remarks: data.remarks || null,
          isActive: true
        }
      })
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        'CREATE',
        'LoadingPoint',
        loadingPoint.id,
        { created: data },
        { source: 'web_api' }
      )
      
      return NextResponse.json({ ok: true, data: loadingPoint }, { status: 201 })
    } catch (error) {
      console.error('Failed to create loading point:', error)
      
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
        // 중복 센터명-상차지명 조합 체크
        if (error.message.includes('이미 등록된 센터명-상차지명 조합입니다')) {
          return NextResponse.json({
            ok: false,
            error: {
              code: 'DUPLICATE_NAME',
              message: '이미 등록된 센터명-상차지명 조합입니다'
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
          message: '상차지 생성 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'routes', action: 'create' } // 노선 관련 권한으로 설정
)