import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/rbac'
import { generateCSV } from '@/lib/services/import.service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 템플릿 헤더 정의 (담당자1-연락처1, 담당자2-연락처2 순서)
const TEMPLATE_HEADERS = ['센터명', '상차지명', '지번주소', '도로명주소', '담당자1', '연락처1', '담당자2', '연락처2', '비고']

/**
 * GET /api/templates/loading-points - 상차지 CSV 템플릿 다운로드
 */
export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      // CSV 템플릿 생성 (담당자1-연락처1, 담당자2-연락처2 순서)
      const csvContent = generateCSV(TEMPLATE_HEADERS, [
        {
          '센터명': '서울물류센터',
          '상차지명': 'A동 1층',
          '지번주소': '서울시 강남구 역삼동 123-45',
          '도로명주소': '서울시 강남구 테헤란로 123',
          '담당자1': '김담당',
          '연락처1': '02-1234-5678',
          '담당자2': '박부담당',
          '연락처2': '010-1234-5678',
          '비고': '샘플 데이터'
        },
        {
          '센터명': '부산물류센터',
          '상차지명': 'B동 지하1층',
          '지번주소': '부산시 해운대구 우동 456-78',
          '도로명주소': '부산시 해운대구 해운대로 456',
          '담당자1': '이담당',
          '연락처1': '051-9876-5432',
          '담당자2': '',
          '연락처2': '',
          '비고': ''
        }
      ])

      // BOM 추가 (Excel에서 한글 인식을 위해)
      const BOM = '\uFEFF'
      const csvWithBOM = BOM + csvContent

      return new Response(csvWithBOM, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="loading_points_template.csv"'
        }
      })
    } catch (error) {
      console.error('Failed to generate template:', error)
      
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '템플릿 생성 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'loading-points', action: 'read' }
)