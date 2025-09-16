import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/rbac'

/**
 * POST /api/import/vehicles - 차량 CSV 일괄 등록 (비활성화)
 * 
 * 차량 모델이 제거되고 상차지 관리 시스템으로 변경되어 비활성화되었습니다.
 */
export const POST = withAuth(
  async (req: NextRequest) => {
    return NextResponse.json({
      ok: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: '차량 가져오기 기능은 더 이상 지원되지 않습니다. 상차지 관리 시스템을 사용해주세요.'
      }
    }, { status: 501 })
  },
  { resource: 'vehicles', action: 'create' }
)

/**
 * GET /api/import/vehicles/template - CSV 템플릿 다운로드 (비활성화)
 */
export const GET = withAuth(
  async (req: NextRequest) => {
    return NextResponse.json({
      ok: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: '차량 템플릿 다운로드는 더 이상 지원되지 않습니다.'
      }
    }, { status: 501 })
  },
  { resource: 'vehicles', action: 'read' }
)