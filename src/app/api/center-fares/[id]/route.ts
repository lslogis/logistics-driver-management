import { NextRequest, NextResponse } from 'next/server'
import { ZodError, z } from 'zod'
import { prisma } from '@/lib/prisma'
import { CenterFareService } from '@/lib/services/center-fare.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'

const centerFareService = new CenterFareService(prisma)

// 센터 요율 수정 스키마
const UpdateCenterFareSchema = z.object({
  centerId: z.string().min(1).optional(),
  vehicleType: z.string().min(1).optional(),
  region: z.string().min(1).optional(),
  fare: z.number().int().min(0).optional(),
  isActive: z.boolean().optional()
})

export const runtime = 'nodejs'

/**
 * GET /api/center-fares/[id] - 센터 요율 상세 조회
 */
export const GET = withAuth(
  async (req: NextRequest, context: { params?: { id: string } }) => {
    try {
      const { params } = context
      if (!params) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'MISSING_PARAMS',
            message: 'Missing route parameters'
          }
        }, { status: 400 })
      }
      const { id } = params
      
      if (!id || typeof id !== 'string') {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '유효하지 않은 ID입니다'
          }
        }, { status: 400 })
      }
      
      const centerFare = await centerFareService.getCenterFareById(id)
      
      if (!centerFare) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'NOT_FOUND',
            message: '센터 요율을 찾을 수 없습니다'
          }
        }, { status: 404 })
      }
      
      return NextResponse.json({ ok: true, data: centerFare })
    } catch (error) {
      console.error('Failed to get center fare:', error)
      
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
 * PATCH /api/center-fares/[id] - 센터 요율 수정
 */
export const PATCH = withAuth(
  async (req: NextRequest, context: { params?: { id: string } }) => {
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

      const { params } = context
      if (!params) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'MISSING_PARAMS',
            message: 'Missing route parameters'
          }
        }, { status: 400 })
      }
      const { id } = params
      
      if (!id || typeof id !== 'string') {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '유효하지 않은 ID입니다'
          }
        }, { status: 400 })
      }

      // 기존 요율 조회 (감사 로그용)
      const existingFare = await centerFareService.getCenterFareById(id)
      if (!existingFare) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'NOT_FOUND',
            message: '센터 요율을 찾을 수 없습니다'
          }
        }, { status: 404 })
      }

      // 요청 데이터 검증
      const body = await req.json()
      const data = UpdateCenterFareSchema.parse(body)
      
      // 센터 요율 수정
      const updatedFare = await centerFareService.updateCenterFare(id, data)
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        'UPDATE',
        'CenterFare',
        id,
        { 
          before: existingFare,
          after: data,
          changes: data
        },
        { source: 'web_api' }
      )
      
      return NextResponse.json({ ok: true, data: updatedFare })
    } catch (error) {
      console.error('Failed to update center fare:', error)
      
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
        // 중복 체크
        if (error.message.includes('이미 등록된') || error.message.includes('중복')) {
          return NextResponse.json({
            ok: false,
            error: {
              code: 'DUPLICATE_ERROR',
              message: error.message
            }
          }, { status: 409 })
        }
        
        // 비즈니스 로직 오류
        if (error.message.includes('찾을 수 없습니다') || error.message.includes('비활성화된')) {
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
          message: '센터 요율 수정 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'charters', action: 'update' }
)

/**
 * DELETE /api/center-fares/[id] - 센터 요율 삭제 (비활성화)
 */
export const DELETE = withAuth(
  async (req: NextRequest, context: { params?: { id: string } }) => {
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

      const { params } = context
      if (!params) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'MISSING_PARAMS',
            message: 'Missing route parameters'
          }
        }, { status: 400 })
      }
      const { id } = params
      
      if (!id || typeof id !== 'string') {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '유효하지 않은 ID입니다'
          }
        }, { status: 400 })
      }

      // 기존 요율 조회 (감사 로그용)
      const existingFare = await centerFareService.getCenterFareById(id)
      if (!existingFare) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'NOT_FOUND',
            message: '센터 요율을 찾을 수 없습니다'
          }
        }, { status: 404 })
      }

      // 센터 요율 삭제 (비활성화)
      await centerFareService.deleteCenterFare(id)
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        'DELETE',
        'CenterFare',
        id,
        { deleted: existingFare },
        { source: 'web_api' }
      )
      
      return NextResponse.json({ 
        ok: true, 
        message: '센터 요율이 삭제되었습니다' 
      })
    } catch (error) {
      console.error('Failed to delete center fare:', error)
      
      if (error instanceof Error) {
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
            code: 'INTERNAL_ERROR',
            message: error.message
          }
        }, { status: 500 })
      }
      
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '센터 요율 삭제 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'charters', action: 'delete' }
)