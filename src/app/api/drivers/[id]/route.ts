import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { DriverService } from '@/lib/services/driver.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'
import { updateDriverSchema } from '@/lib/validations/driver'

const driverService = new DriverService(prisma)

/**
 * GET /api/drivers/[id] - 기사 상세 조회
 */
export const GET = withAuth(
  async (req: NextRequest, context: { params?: any } = {}) => {
    try {
      const { id } = context.params || {}
      
      if (!id) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'MISSING_ID',
            message: '기사 ID가 필요합니다'
          }
        }, { status: 400 })
      }
      
      const driver = await driverService.getDriverById(id)
      
      if (!driver) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'NOT_FOUND',
            message: '기사를 찾을 수 없습니다'
          }
        }, { status: 404 })
      }
      
      return NextResponse.json({ ok: true, data: driver })
    } catch (error) {
      console.error('Failed to get driver:', error)
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '기사 조회 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'drivers', action: 'read' }
)

/**
 * PUT /api/drivers/[id] - 기사 정보 수정
 */
export const PUT = withAuth(
  async (req: NextRequest, context: { params?: any } = {}) => {
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

      const { id } = context.params || {}
      
      if (!id) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'MISSING_ID',
            message: '기사 ID가 필요합니다'
          }
        }, { status: 400 })
      }

      // 기존 데이터 조회 (감사 로그용)
      const originalDriver = await driverService.getDriverById(id)
      if (!originalDriver) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'NOT_FOUND',
            message: '기사를 찾을 수 없습니다'
          }
        }, { status: 404 })
      }

      // 요청 데이터 검증
      const body = await req.json()
      const data = updateDriverSchema.parse(body)
      
      // 기사 정보 수정
      const updatedDriver = await driverService.updateDriver(id, data)
      
      // 감사 로그 기록 (변경된 필드만)
      const changes: any = {}
      Object.keys(data).forEach(key => {
        const oldValue = (originalDriver as any)[key]
        const newValue = (data as any)[key]
        if (oldValue !== newValue) {
          changes[key] = { from: oldValue, to: newValue }
        }
      })

      if (Object.keys(changes).length > 0) {
        await createAuditLog(
          user,
          'UPDATE',
          'Driver',
          id,
          changes,
          { source: 'web_api' }
        )
      }
      
      return NextResponse.json({ ok: true, data: updatedDriver })
    } catch (error) {
      console.error('Failed to update driver:', error)
      
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
          message: '기사 정보 수정 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'drivers', action: 'update' }
)

/**
 * DELETE /api/drivers/[id] - 기사 삭제 (소프트 삭제 또는 하드 삭제)
 */
export async function DELETE(
  req: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {

    const { id } = params
    const url = new URL(req.url)
    const isHardDelete = url.searchParams.get('hard') === 'true'
      
      if (!id) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'MISSING_ID',
            message: '기사 ID가 필요합니다'
          }
        }, { status: 400 })
      }

      // 기존 데이터 조회 (감사 로그용)
      const originalDriver = await driverService.getDriverById(id)
      if (!originalDriver) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'NOT_FOUND',
            message: '기사를 찾을 수 없습니다'
          }
        }, { status: 404 })
      }

      if (isHardDelete) {
        // 하드 삭제 - DB에서 완전 삭제
        await driverService.hardDeleteDriver(id)
        
        // 감사 로그 기록 (임시)
        await prisma.auditLog.create({
          data: {
            action: 'DELETE',
            entityType: 'Driver',
            entityId: id,
            userId: 'system', // 임시
            userName: 'System User',
            changes: { 
              permanently_deleted: true
            }
          }
        })
        
        return NextResponse.json({ 
          ok: true, 
          data: { message: '기사가 완전히 삭제되었습니다' }
        })
      } else {
        // 소프트 삭제 - isActive를 false로 변경
        await driverService.deleteDriver(id)
        
        // 감사 로그 기록 (임시로 건너뛰기)
        // await prisma.auditLog.create({
        //   data: {
        //     action: 'DELETE',
        //     entityType: 'Driver',
        //     entityId: id,
        //     userId: 'system',
        //     userName: 'System User',
        //     changes: { 
        //       deactivated: {
        //         from: originalDriver.isActive,
        //         to: false
        //       }
        //     }
        //   }
        // })
        
        return NextResponse.json({ 
          ok: true, 
          data: { message: '기사가 비활성화되었습니다' }
        })
      }
    } catch (error) {
      console.error('Failed to delete driver:', error)
      
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
          message: '기사 삭제 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
}