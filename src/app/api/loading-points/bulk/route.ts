import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'

/**
 * POST /api/loading-points/bulk - 상차지 일괄 처리
 */
async function bulkHandler(req: NextRequest) {
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

      const body = await req.json()
      const { ids, action } = body

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'IDs 배열이 필요합니다'
          }
        }, { status: 400 })
      }

      if (!action || !['activate', 'deactivate', 'delete'].includes(action)) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '올바른 action이 필요합니다 (activate, deactivate 또는 delete)'
          }
        }, { status: 400 })
      }

      let result
      
      if (action === 'activate') {
        // 일괄 활성화
        result = await prisma.$executeRaw`
          UPDATE loading_points 
          SET "isActive" = true, "updatedAt" = NOW()
          WHERE id = ANY(${ids}::text[])
        `
        
        // 감사 로그 기록
        await createAuditLog(
          user,
          'ACTIVATE',
          'LoadingPoint',
          ids.join(','),
          { action: 'activate', count: ids.length },
          { source: 'web_api', bulk: true }
        )
        
        return NextResponse.json({ 
          ok: true, 
          data: { 
            message: `${result}개 상차지가 활성화되었습니다`,
            affectedCount: result
          }
        })
        
      } else if (action === 'deactivate') {
        // 일괄 비활성화
        result = await prisma.$executeRaw`
          UPDATE loading_points 
          SET "isActive" = false, "updatedAt" = NOW()
          WHERE id = ANY(${ids}::text[])
        `
        
        // 감사 로그 기록
        await createAuditLog(
          user,
          'DEACTIVATE',
          'LoadingPoint',
          ids.join(','),
          { action: 'deactivate', count: ids.length },
          { source: 'web_api', bulk: true }
        )
        
        return NextResponse.json({ 
          ok: true, 
          data: { 
            message: `${result}개 상차지가 비활성화되었습니다`,
            affectedCount: result
          }
        })
        
      } else if (action === 'delete') {
        // 일괄 완전 삭제
        result = await prisma.$executeRaw`
          DELETE FROM loading_points 
          WHERE id = ANY(${ids}::text[])
        `
        
        // 감사 로그 기록
        await createAuditLog(
          user,
          'DELETE',
          'LoadingPoint',
          ids.join(','),
          { action: 'delete', count: ids.length },
          { source: 'web_api', bulk: true, hard_delete: true }
        )
        
        return NextResponse.json({ 
          ok: true, 
          data: { 
            message: `${result}개 상차지가 완전히 삭제되었습니다`,
            affectedCount: result
          }
        })
      }

      // 예상치 못한 경우에 대한 기본 응답
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INVALID_ACTION',
          message: '지원하지 않는 작업입니다'
        }
      }, { status: 400 })
      
    } catch (error) {
      console.error('Failed to bulk process loading points:', error)
      
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '일괄 처리 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
}

export const POST = withAuth(bulkHandler, { resource: 'routes', action: 'delete' })