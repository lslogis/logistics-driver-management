import { NextRequest, NextResponse } from 'next/server'
import { ZodError, z } from 'zod'
import { prisma } from '@/lib/prisma'
import { CharterService } from '@/lib/services/charter.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'

const charterService = new CharterService(prisma)

// 용차 요청 수정 스키마
const UpdateCharterRequestSchema = z.object({
  centerId: z.string().min(1).optional(),
  vehicleType: z.string().min(1).optional(),
  date: z.string().min(1).optional(),
  destinations: z.array(z.object({
    region: z.string().min(1),
    order: z.number().int().min(1)
  })).min(1).optional(),
  isNegotiated: z.boolean().optional(),
  negotiatedFare: z.number().int().min(0).optional(),
  baseFare: z.number().int().min(0).optional(),
  regionFare: z.number().int().min(0).optional(),
  stopFare: z.number().int().min(0).optional(),
  extraFare: z.number().int().min(0).optional(),
  totalFare: z.number().int().min(0).optional(),
  driverId: z.string().min(1).optional(),
  driverFare: z.number().int().min(0).optional(),
  notes: z.string().optional()
})

export const runtime = 'nodejs'

/**
 * GET /api/charters/requests/[id] - 용차 요청 상세 조회
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
      
      const charterRequest = await charterService.getCharterRequestById(id)
      
      if (!charterRequest) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'NOT_FOUND',
            message: '용차 요청을 찾을 수 없습니다'
          }
        }, { status: 404 })
      }
      
      return NextResponse.json({ ok: true, data: charterRequest })
    } catch (error) {
      console.error('Failed to get charter request:', error)
      
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
 * PATCH /api/charters/requests/[id] - 용차 요청 수정
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

      // 기존 요청 조회 (감사 로그용)
      const existingRequest = await charterService.getCharterRequestById(id)
      if (!existingRequest) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'NOT_FOUND',
            message: '용차 요청을 찾을 수 없습니다'
          }
        }, { status: 404 })
      }

      // 요청 데이터 검증
      const body = await req.json()
      const data = UpdateCharterRequestSchema.parse(body)
      
      // 목적지 순서 검증 (목적지가 변경되는 경우)
      if (data.destinations) {
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
      }

      // 협의금액 검증 (변경되는 경우)
      if (data.isNegotiated !== undefined || data.negotiatedFare !== undefined || data.totalFare !== undefined) {
        const isNegotiated = data.isNegotiated ?? existingRequest.isNegotiated
        const negotiatedFare = data.negotiatedFare ?? existingRequest.negotiatedFare
        const totalFare = data.totalFare ?? existingRequest.totalFare

        if (isNegotiated && (negotiatedFare === undefined || negotiatedFare !== totalFare)) {
          return NextResponse.json({
            ok: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: '협의금액이 설정되었지만 총 금액과 일치하지 않습니다'
            }
          }, { status: 400 })
        }
      }

      // 용차 요청 수정
      const updatedRequest = await charterService.updateCharterRequest(id, data)
      
      // 감사 로그 기록 (협의금액 사용 시 특별 기록)
      const auditData: any = { 
        before: existingRequest,
        after: data,
        changes: data
      }
      
      if (data.isNegotiated || (data.isNegotiated === undefined && existingRequest.isNegotiated)) {
        auditData.negotiated = {
          fare: data.negotiatedFare ?? existingRequest.negotiatedFare,
          reason: data.notes || existingRequest.notes || '협의금액 수정',
          user: user.name
        }
      }

      await createAuditLog(
        user,
        'UPDATE',
        'CharterRequest',
        id,
        auditData,
        { source: 'web_api' }
      )
      
      return NextResponse.json({ ok: true, data: updatedRequest })
    } catch (error) {
      console.error('Failed to update charter request:', error)
      
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
          message: '용차 요청 수정 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'charters', action: 'update' }
)

/**
 * DELETE /api/charters/requests/[id] - 용차 요청 삭제
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

      // 기존 요청 조회 (감사 로그용)
      const existingRequest = await charterService.getCharterRequestById(id)
      if (!existingRequest) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'NOT_FOUND',
            message: '용차 요청을 찾을 수 없습니다'
          }
        }, { status: 404 })
      }

      // 용차 요청 삭제
      await charterService.deleteCharterRequest(id)
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        'DELETE',
        'CharterRequest',
        id,
        { deleted: existingRequest },
        { source: 'web_api' }
      )
      
      return NextResponse.json({ 
        ok: true, 
        message: '용차 요청이 삭제되었습니다' 
      })
    } catch (error) {
      console.error('Failed to delete charter request:', error)
      
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
          message: '용차 요청 삭제 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'charters', action: 'delete' }
)