import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SettlementApiService } from '@/lib/services/settlement-api.service'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog, apiResponse } from '@/lib/auth/server'
import { updateSettlementSchema } from '@/lib/validations/settlement'

const settlementApiService = new SettlementApiService(prisma)

/**
 * GET /api/settlements/[id] - 정산 상세 조회
 */
export const GET = withAuth(
  async (req: NextRequest, context: { params?: any } = {}) => {
    try {
      const { id } = context.params || {}
      
      if (!id) {
        return apiResponse.error('정산 ID가 필요합니다')
      }
      
      const settlement = await settlementApiService.getSettlementById(id)
      
      if (!settlement) {
        return apiResponse.error('정산을 찾을 수 없습니다', 404)
      }
      
      return apiResponse.success(settlement)
    } catch (error) {
      console.error('Failed to get settlement:', error)
      return apiResponse.error('정산 조회 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'settlements', action: 'read' }
)

/**
 * PUT /api/settlements/[id] - 정산 정보 수정
 */
export const PUT = withAuth(
  async (req: NextRequest, context: { params?: any } = {}) => {
    try {
      const user = await getCurrentUser(req)
      if (!user) {
        return apiResponse.unauthorized()
      }

      const { id } = context.params || {}
      
      if (!id) {
        return apiResponse.error('정산 ID가 필요합니다')
      }

      // 기존 데이터 조회 (감사 로그용)
      const originalSettlement = await settlementApiService.getSettlementById(id)
      if (!originalSettlement) {
        return apiResponse.error('정산을 찾을 수 없습니다', 404)
      }

      // 요청 데이터 검증
      const body = await req.json()
      const data = updateSettlementSchema.parse(body)
      
      // 정산 정보 수정
      const updatedSettlement = await settlementApiService.updateSettlement(id, data)
      
      // 감사 로그 기록 (변경된 필드만)
      const changes: any = {}
      Object.keys(data).forEach(key => {
        const oldValue = (originalSettlement as any)[key]
        const newValue = (data as any)[key]
        
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changes[key] = { from: oldValue, to: newValue }
        }
      })

      if (Object.keys(changes).length > 0) {
        await createAuditLog(
          user,
          'UPDATE',
          'Settlement',
          id,
          changes,
          { source: 'web_api' }
        )
      }
      
      return apiResponse.success(updatedSettlement)
    } catch (error) {
      console.error('Failed to update settlement:', error)
      
      if (error instanceof Error) {
        return apiResponse.error(error.message)
      }
      
      return apiResponse.error('정산 정보 수정 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'settlements', action: 'update' }
)

/**
 * DELETE /api/settlements/[id] - 정산 삭제 (임시저장만 가능)
 */
export const DELETE = withAuth(
  async (req: NextRequest, context: { params?: any } = {}) => {
    try {
      const user = await getCurrentUser(req)
      if (!user) {
        return apiResponse.unauthorized()
      }

      const { id } = context.params || {}
      
      if (!id) {
        return apiResponse.error('정산 ID가 필요합니다')
      }

      // 기존 데이터 조회 (감사 로그용)
      const originalSettlement = await settlementApiService.getSettlementById(id)
      if (!originalSettlement) {
        return apiResponse.error('정산을 찾을 수 없습니다', 404)
      }

      // 정산 삭제
      await settlementApiService.deleteSettlement(id)
      
      // 감사 로그 기록
      await createAuditLog(
        user,
        'DELETE',
        'Settlement',
        id,
        { 
          deleted: true
        },
        { 
          source: 'web_api',
          originalData: originalSettlement
        }
      )
      
      return apiResponse.success({ message: '정산이 삭제되었습니다' })
    } catch (error) {
      console.error('Failed to delete settlement:', error)
      
      if (error instanceof Error) {
        return apiResponse.error(error.message)
      }
      
      return apiResponse.error('정산 삭제 중 오류가 발생했습니다', 500)
    }
  },
  { resource: 'settlements', action: 'delete' }
)