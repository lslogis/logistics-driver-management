import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'
import { z } from 'zod'

// 일괄 작업 스키마
const BulkDriverActionSchema = z.object({
  ids: z.array(z.string()).min(1, '최소 1개 이상의 기사를 선택해주세요'),
  action: z.enum(['activate', 'deactivate', 'delete'])
})

/**
 * 기사 일괄 작업
 * POST /api/drivers/bulk
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    
    if (!user) {
      return NextResponse.json({ ok: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } }, { status: 401 })
    }

    const body = await request.json()
    const { ids, action } = BulkDriverActionSchema.parse(body)

      let result: any
      let message: string

      switch (action) {
        case 'activate':
          // 비활성화된 기사만 필터링
          const inactiveDrivers = await prisma.driver.findMany({
            where: { 
              id: { in: ids },
              isActive: false
            },
            select: { id: true, name: true }
          })

          if (inactiveDrivers.length === 0) {
            return NextResponse.json(
              { ok: false, error: { code: 'BAD_REQUEST', message: '활성화할 수 있는 기사가 없습니다' } },
              { status: 400 }
            )
          }

          const inactiveIds = inactiveDrivers.map(d => d.id)

          result = await prisma.driver.updateMany({
            where: { id: { in: inactiveIds } },
            data: { isActive: true }
          })

          // 감사 로그 기록 (임시로 건너뛰기)
          // await Promise.all(inactiveIds.map(id => 
          //   prisma.auditLog.create({
          //     data: {
          //       action: 'UPDATE',
          //       entityType: 'Driver',
          //       entityId: id,
          //       userId: 'system',
          //       userName: 'System User',
          //       changes: {
          //         isActive: { from: false, to: true }
          //       }
          //     }
          //   })
          // ))

          message = `${result.count}개 기사가 활성화되었습니다`
          break

        case 'deactivate':
          // 활성화된 기사만 필터링
          const activeDrivers = await prisma.driver.findMany({
            where: { 
              id: { in: ids },
              isActive: true
            },
            select: { id: true, name: true }
          })

          if (activeDrivers.length === 0) {
            return NextResponse.json(
              { ok: false, error: { code: 'BAD_REQUEST', message: '비활성화할 수 있는 기사가 없습니다' } },
              { status: 400 }
            )
          }

          const activeIds = activeDrivers.map(d => d.id)

          // 체크 로직 제거 - 나중에 필요시 추가

          result = await prisma.driver.updateMany({
            where: { id: { in: activeIds } },
            data: { isActive: false }
          })

          // 감사 로그 기록 (임시로 건너뛰기)
          // await Promise.all(activeIds.map(id => 
          //   prisma.auditLog.create({
          //     data: {
          //       action: 'UPDATE',
          //       entityType: 'Driver',
          //       entityId: id,
          //       userId: 'system',
          //       userName: 'System User',
          //       changes: {
          //         isActive: { from: true, to: false }
          //       }
          //     }
          //   })
          // ))

          message = `${result.count}개 기사가 비활성화되었습니다`
          break

        case 'delete':
          // 완전 삭제
          const driversToDelete = await prisma.driver.findMany({
            where: { id: { in: ids } },
            select: { id: true, name: true }
          })

          if (driversToDelete.length === 0) {
            return NextResponse.json(
              { ok: false, error: { code: 'BAD_REQUEST', message: '삭제할 수 있는 기사가 없습니다' } },
              { status: 400 }
            )
          }

          const deleteIds = driversToDelete.map(d => d.id)

          // 감사 로그 먼저 기록
          await Promise.all(deleteIds.map(id => 
            createAuditLog(
              user,
              'DELETE',
              'Driver',
              id,
              { deleted: true },
              { source: 'bulk_delete' }
            )
          ))

          result = await prisma.driver.deleteMany({
            where: { id: { in: deleteIds } }
          })

          message = `${result.count}개 기사가 완전히 삭제되었습니다`
          break

        default:
          return NextResponse.json(
            { ok: false, error: { code: 'BAD_REQUEST', message: '지원하지 않는 작업입니다' } },
            { status: 400 }
          )
      }

      return NextResponse.json({
        ok: true,
        data: {
          action,
          processed: result.count,
          message
        }
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { ok: false, error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } },
          { status: 400 }
        )
      }

      console.error('Bulk driver action error:', error)
      return NextResponse.json(
        { ok: false, error: { code: 'INTERNAL_SERVER_ERROR', message: '일괄 작업에 실패했습니다' } },
        { status: 500 }
      )
    }
}