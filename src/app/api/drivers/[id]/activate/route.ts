import { NextRequest, NextResponse } from 'next/server'
import { DriverService } from '@/lib/services/driver.service'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/rbac'

const driverService = new DriverService(prisma)

/**
 * 기사 활성화
 * POST /api/drivers/[id]/activate
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { ok: false, error: { code: 'MISSING_ID', message: '기사 ID가 필요합니다' } },
        { status: 400 }
      )
    }

    // 기사 활성화
    const updatedDriver = await driverService.activateDriver(id)

    // 감사 로그 기록 (임시로 시스템 사용자로)
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'Driver',
        entityId: id,
        userId: 'system', // 임시
        userName: 'System User',
        changes: {
          isActive: { from: false, to: true }
        }
      }
    })

    return NextResponse.json({
      ok: true,
      data: updatedDriver
    })
  } catch (error) {
    console.error('Driver activation error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { ok: false, error: { code: 'BUSINESS_ERROR', message: error.message } },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_SERVER_ERROR', message: '기사 활성화에 실패했습니다' } },
      { status: 500 }
    )
  }
}