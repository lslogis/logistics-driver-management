import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser } from '@/lib/auth/server'
import { createRateBaseSchema } from '@/lib/validations/rate-simplified'

/**
 * POST /api/rates/base - 기본료 등록
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
      const data = createRateBaseSchema.parse(body)
      
      try {
        // Attempt to create the rate base record
        const rateBase = await prisma.rateBase.create({
          data: {
            centerName: data.centerName,
            tonnage: data.tonnage,
            region: data.region,
            baseFare: data.baseFare
          }
        })
        
        return NextResponse.json({ 
          ok: true, 
          data: rateBase 
        }, { status: 201 })
        
      } catch (error: any) {
        // Handle unique constraint violation
        if (error.code === 'P2002' && error.meta?.target?.includes('rate_base_unique')) {
          return NextResponse.json({
            ok: true,
            skipped: true,
            message: `이미 등록된 요율입니다 (${data.centerName} - ${data.tonnage} - ${data.region})`
          }, { status: 200 })
        }
        
        throw error // Re-throw other database errors
      }
    } catch (error) {
      console.error('Failed to create rate base:', error)
      
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
      
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '기본료 등록 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'rates', action: 'create' }
)

/**
 * GET /api/rates/base - 기본료 목록 조회
 */
export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url)
      const centerName = searchParams.get('centerName') || undefined
      const tonnage = searchParams.get('tonnage') || undefined
      const region = searchParams.get('region') || undefined
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '50')
      
      const skip = (page - 1) * limit
      
      // Build where clause
      const where: any = {}
      if (centerName) where.centerName = { contains: centerName, mode: 'insensitive' }
      if (tonnage) where.tonnage = tonnage
      if (region) where.region = { contains: region, mode: 'insensitive' }
      
      // Get records and total count
      const [rateBases, total] = await Promise.all([
        prisma.rateBase.findMany({
          where,
          skip,
          take: limit,
          orderBy: [
            { centerName: 'asc' },
            { tonnage: 'asc' },
            { region: 'asc' }
          ]
        }),
        prisma.rateBase.count({ where })
      ])
      
      return NextResponse.json({
        ok: true,
        data: {
          rateBases,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: skip + limit < total,
            hasPrev: page > 1
          }
        }
      })
    } catch (error) {
      console.error('Failed to get rate bases:', error)
      
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '기본료 목록 조회 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'rates', action: 'read' }
)