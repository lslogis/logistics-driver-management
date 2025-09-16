import { NextRequest, NextResponse } from 'next/server'
import Papa from 'papaparse'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser } from '@/lib/auth/server'

// 지원하는 템플릿 타입
const TEMPLATE_TYPES = ['drivers', 'vehicles', 'routes', 'trips', 'fixed-routes', 'fixed-contracts'] as const
type TemplateType = typeof TEMPLATE_TYPES[number]

// CSV Injection 방지 함수
function sanitizeForCSV(value: string | number): string {
  if (typeof value === 'number') {
    return value.toString()
  }
  
  const str = value.toString()
  // =, +, -, @ 문자로 시작하는 경우 앞에 ' 추가하여 공식 실행 방지
  if (/^[=+\-@]/.test(str)) {
    return `'${str}`
  }
  
  return str
}

// 템플릿 메타데이터
const TEMPLATE_INFO: Record<TemplateType, { filename: string; description: string }> = {
  drivers: {
    filename: 'drivers.csv',
    description: '기사 정보 임포트 템플릿'
  },
  vehicles: {
    filename: 'vehicles.csv', 
    description: '차량 정보 임포트 템플릿'
  },
  routes: {
    filename: 'routes.csv',
    description: '노선 템플릿 임포트 템플릿'
  },
  trips: {
    filename: 'trips.csv',
    description: '운행 기록 임포트 템플릿'
  },
  'fixed-routes': {
    filename: 'fixed-routes.csv',
    description: '고정노선 임포트 템플릿'
  },
  'fixed-contracts': {
    filename: 'fixed-contracts.csv',
    description: '고정계약 임포트 템플릿'
  }
}

// 템플릿 데이터 생성 함수들 (9-column structure)
function generateDriversTemplate() {
  const headers = ['성함', '연락처', '차량번호', '사업상호', '대표자', '사업번호', '계좌은행', '계좌번호', '특이사항']
  const data = [
    {
      '성함': sanitizeForCSV('홍길동'),
      '연락처': sanitizeForCSV('010-1234-5678'),
      '차량번호': sanitizeForCSV('12가3456'),
      '사업상호': sanitizeForCSV('길동운송'),
      '대표자': sanitizeForCSV('홍길동'),
      '사업번호': sanitizeForCSV('123-45-67890'),
      '계좌은행': sanitizeForCSV('국민은행'),
      '계좌번호': sanitizeForCSV('123456-78-901234'),
      '특이사항': sanitizeForCSV('샘플 데이터')
    },
    {
      '성함': sanitizeForCSV('김철수'),
      '연락처': sanitizeForCSV('010-9876-5432'),
      '차량번호': sanitizeForCSV('34나5678'),
      '사업상호': sanitizeForCSV(''),
      '대표자': sanitizeForCSV(''),
      '사업번호': sanitizeForCSV(''),
      '계좌은행': sanitizeForCSV('신한은행'),
      '계좌번호': sanitizeForCSV('987-654-321098'),
      '특이사항': sanitizeForCSV('')
    }
  ]
  return Papa.unparse({ fields: headers, data })
}

function generateVehiclesTemplate() {
  const headers = ['차량번호', '차종', '톤수', '소유구분', '배정기사전화번호', '적재량', '연식', '비고']
  const data = [
    {
      '차량번호': sanitizeForCSV('12가3456'),
      '차종': sanitizeForCSV('탑차'),
      '톤수': sanitizeForCSV('5'),
      '소유구분': sanitizeForCSV('고정'),
      '배정기사전화번호': sanitizeForCSV('010-1234-5678'),
      '적재량': sanitizeForCSV('5000'),
      '연식': sanitizeForCSV('2020'),
      '비고': sanitizeForCSV('샘플 데이터')
    },
    {
      '차량번호': sanitizeForCSV('78나9012'),
      '차종': sanitizeForCSV('냉동차'),
      '톤수': sanitizeForCSV('3.5'),
      '소유구분': sanitizeForCSV('용차'),
      '배정기사전화번호': sanitizeForCSV('010-9876-5432'),
      '적재량': sanitizeForCSV('3500'),
      '연식': sanitizeForCSV('2019'),
      '비고': sanitizeForCSV('냉동 기능 포함')
    }
  ]
  return Papa.unparse({ fields: headers, data })
}

function generateRoutesTemplate() {
  const headers = ['노선명', '상차지', '하차지', '거리(km)', '기사운임', '청구운임', '운행요일', '기본배정기사전화번호', '비고']
  const data = [
    {
      '노선명': sanitizeForCSV('서울-부산 정기'),
      '상차지': sanitizeForCSV('서울역'),
      '하차지': sanitizeForCSV('부산역'),
      '거리(km)': sanitizeForCSV('417'),
      '기사운임': sanitizeForCSV('150000'),
      '청구운임': sanitizeForCSV('180000'),
      '운행요일': sanitizeForCSV('월,화,수,목,금'),
      '기본배정기사전화번호': sanitizeForCSV('010-1234-5678'),
      '비고': sanitizeForCSV('정기 노선')
    },
    {
      '노선명': sanitizeForCSV('인천공항-김포공항'),
      '상차지': sanitizeForCSV('인천국제공항'),
      '하차지': sanitizeForCSV('김포국제공항'),
      '거리(km)': sanitizeForCSV('47'),
      '기사운임': sanitizeForCSV('80000'),
      '청구운임': sanitizeForCSV('100000'),
      '운행요일': sanitizeForCSV('월,수,금'),
      '기본배정기사전화번호': sanitizeForCSV('010-9876-5432'),
      '비고': sanitizeForCSV('공항 셔틀')
    }
  ]
  return Papa.unparse({ fields: headers, data })
}

function generateTripsTemplate() {
  const headers = ['날짜', '기사전화번호', '차량번호', '노선명', '상차지', '하차지', '기사요금', '청구요금', '상태', '차감액', '결행사유', '대차기사전화번호', '대차요금', '비고']
  const data = [
    {
      '날짜': sanitizeForCSV('2025-01-15'),
      '기사전화번호': sanitizeForCSV('010-1234-5678'),
      '차량번호': sanitizeForCSV('12가1234'),
      '노선명': sanitizeForCSV('서울-부산 정기'),
      '상차지': sanitizeForCSV('서울역'),
      '하차지': sanitizeForCSV('부산역'),
      '기사요금': sanitizeForCSV(150000),
      '청구요금': sanitizeForCSV(180000),
      '상태': sanitizeForCSV('예정'),
      '차감액': sanitizeForCSV(''),
      '결행사유': sanitizeForCSV(''),
      '대차기사전화번호': sanitizeForCSV(''),
      '대차요금': sanitizeForCSV(''),
      '비고': sanitizeForCSV('샘플 데이터')
    },
    {
      '날짜': sanitizeForCSV('2025-01-16'),
      '기사전화번호': sanitizeForCSV('010-9876-5432'),
      '차량번호': sanitizeForCSV('34나5678'),
      '노선명': sanitizeForCSV(''),
      '상차지': sanitizeForCSV('인천공항'),
      '하차지': sanitizeForCSV('김포공항'),
      '기사요금': sanitizeForCSV(80000),
      '청구요금': sanitizeForCSV(100000),
      '상태': sanitizeForCSV('완료'),
      '차감액': sanitizeForCSV(''),
      '결행사유': sanitizeForCSV(''),
      '대차기사전화번호': sanitizeForCSV(''),
      '대차요금': sanitizeForCSV(''),
      '비고': sanitizeForCSV('커스텀 노선 예시')
    }
  ]
  return Papa.unparse({ fields: headers, data })
}

function generateFixedRoutesTemplate() {
  // 엑셀 내보내기와 동일한 컬럼 순서
  const headers = ['센터명', '노선명', '기사명', '차량번호', '연락처', '운행요일', '센터계약', '센터금액', '기사계약', '기사금액', '시작일자', '종료일자', '비고']
  const data = [
    {
      '센터명': sanitizeForCSV('서울허브센터'),
      '노선명': sanitizeForCSV('서울-부산 고정노선'),
      '기사명': sanitizeForCSV('홍길동'),
      '차량번호': sanitizeForCSV('12가1234'),
      '연락처': sanitizeForCSV('010-1234-5678'),
      '운행요일': sanitizeForCSV('월,화,수,목,금'),
      '센터계약': sanitizeForCSV('고정일대'),
      '센터금액': sanitizeForCSV(180000),
      '기사계약': sanitizeForCSV('고정일대'),
      '기사금액': sanitizeForCSV(150000),
      '시작일자': sanitizeForCSV('2025-01-01'),
      '종료일자': sanitizeForCSV('2025-12-31'),
      '비고': sanitizeForCSV('일대 계약 예시')
    },
    {
      '센터명': sanitizeForCSV('인천물류센터'),
      '노선명': sanitizeForCSV('인천-대전 월대'),
      '기사명': sanitizeForCSV('김철수'),
      '차량번호': sanitizeForCSV('34나5678'),
      '연락처': sanitizeForCSV('010-9876-5432'),
      '운행요일': sanitizeForCSV('월,수,금'),
      '센터계약': sanitizeForCSV('고정월대'),
      '센터금액': sanitizeForCSV(4000000),
      '기사계약': sanitizeForCSV('고정월대'),
      '기사금액': sanitizeForCSV(3500000),
      '시작일자': sanitizeForCSV('2025-02-01'),
      '종료일자': sanitizeForCSV(''),
      '비고': sanitizeForCSV('월대 계약 예시')
    }
  ]
  return Papa.unparse({ fields: headers, data })
}

export const GET = withAuth(
  async (request: NextRequest, context: { params?: { type: string } } = {}) => {
    const { params } = context
    if (!params?.type) {
      return NextResponse.json(
        { 
          ok: false,
          error: {
            code: 'MISSING_PARAMS',
            message: '템플릿 타입이 지정되지 않았습니다'
          }
        },
        { status: 400 }
      )
    }
    try {
      const user = await getCurrentUser(request)
      if (!user) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: 'UNAUTHORIZED',
              message: '로그인이 필요합니다'
            }
          },
          { status: 401 }
        )
      }

      const type = params.type as TemplateType

      // 템플릿 타입 검증
      if (!TEMPLATE_TYPES.includes(type)) {
        return NextResponse.json(
          { 
            ok: false,
            error: {
              code: 'INVALID_TEMPLATE_TYPE',
              message: `지원하지 않는 템플릿 타입입니다. 지원 타입: ${TEMPLATE_TYPES.join(', ')}`
            }
          },
          { status: 400 }
        )
      }

      // 템플릿 생성
      let csvContent: string
      
      switch (type) {
        case 'drivers':
          csvContent = generateDriversTemplate()
          break
        case 'vehicles':
          csvContent = generateVehiclesTemplate()
          break
        case 'routes':
          csvContent = generateRoutesTemplate()
          break
        case 'trips':
          csvContent = generateTripsTemplate()
          break
        case 'fixed-routes':
          csvContent = generateFixedRoutesTemplate()
          break
        case 'fixed-contracts':
          csvContent = generateFixedRoutesTemplate() // 같은 템플릿 사용
          break
        default:
          throw new Error('지원하지 않는 템플릿 타입입니다')
      }

      // 한글 지원을 위한 BOM 추가
      const csvWithBOM = '\uFEFF' + csvContent

      // 다운로드 응답 생성
      return new Response(csvWithBOM, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${type}_template.csv"`,
          'Cache-Control': 'no-cache, no-store, max-age=0'
        }
      })

    } catch (error) {
      console.error('Template download error:', error)
      return NextResponse.json(
        { 
          ok: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: '템플릿 다운로드 중 오류가 발생했습니다.'
          }
        },
        { status: 500 }
      )
    }
  },
  { resource: 'templates', action: 'read' }
)

// 템플릿 목록 조회 (OPTIONS /api/templates/[type])
export const OPTIONS = withAuth(
  async (request: NextRequest, context: { params?: { type: string } } = {}) => {
    const { params } = context
    if (!params?.type) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'MISSING_PARAMS',
            message: '템플릿 타입이 지정되지 않았습니다'
          }
        },
        { status: 400 }
      )
    }
    try {
      const user = await getCurrentUser(request)
      if (!user) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: 'UNAUTHORIZED',
              message: '로그인이 필요합니다'
            }
          },
          { status: 401 }
        )
      }

      const type = params.type as TemplateType

      if (!TEMPLATE_TYPES.includes(type)) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: 'INVALID_TEMPLATE_TYPE',
              message: `지원하지 않는 템플릿 타입입니다. 지원 타입: ${TEMPLATE_TYPES.join(', ')}`
            }
          },
          { status: 400 }
        )
      }

      return NextResponse.json({
        ok: true,
        data: {
          type,
          filename: TEMPLATE_INFO[type].filename,
          description: TEMPLATE_INFO[type].description,
          downloadUrl: `/api/templates/${type}`,
          fields: getTemplateFields(type)
        }
      })

    } catch (error) {
      console.error('Template info error:', error)
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: '템플릿 정보 조회 중 오류가 발생했습니다.'
          }
        },
        { status: 500 }
      )
    }
  },
  { resource: 'templates', action: 'read' }
)

// 템플릿별 필드 정보 반환
function getTemplateFields(type: TemplateType): Array<{field: string, required: boolean, description: string}> {
  switch (type) {
    case 'drivers':
      return [
        { field: '성함', required: true, description: '기사명 (필수)' },
        { field: '연락처', required: true, description: '휴대폰 번호 (필수, 010-1234-5678)' },
        { field: '차량번호', required: true, description: '차량번호 (필수, 12가3456)' },
        { field: '사업상호', required: false, description: '사업상호/회사명' },
        { field: '대표자', required: false, description: '대표자 이름' },
        { field: '사업번호', required: false, description: '사업자등록번호 (123-45-67890)' },
        { field: '계좌은행', required: false, description: '계좌 은행명' },
        { field: '계좌번호', required: false, description: '계좌번호 (특수문자 자동 제거됨)' },
        { field: '특이사항', required: false, description: '비고/추가 정보' }
      ]

    case 'vehicles':
      return [
        { field: '차량번호', required: true, description: '차량번호 (12가3456)' },
        { field: '차종', required: true, description: '차량 종류 (탑차, 냉동차, 카고 등)' },
        { field: '톤수', required: false, description: '적재 톤수' },
        { field: '소유구분', required: true, description: '고정/용차/지입' },
        { field: '배정기사', required: false, description: '배정된 기사명' },
        { field: '적재량', required: false, description: '적재량(톤)' },
        { field: '연식', required: false, description: '차량 연식' }
      ]

    case 'routes':
      return [
        { field: '노선명', required: true, description: '노선 이름' },
        { field: '상차지', required: true, description: '상차 지점' },
        { field: '하차지', required: true, description: '하차 지점' },
        { field: '거리(km)', required: false, description: '운행 거리' },
        { field: '기사운임', required: true, description: '기사 지급 운임' },
        { field: '청구운임', required: true, description: '고객 청구 운임' },
        { field: '운행요일', required: true, description: '운행 요일 (월,화,수,목,금)' },
        { field: '기본기사', required: false, description: '기본 배정 기사명' }
      ]

    case 'trips':
      return [
        { field: '운행일', required: true, description: '운행 날짜 (YYYY-MM-DD)' },
        { field: '기사명', required: true, description: '운행 기사명' },
        { field: '차량번호', required: true, description: '운행 차량번호' },
        { field: '노선명', required: false, description: '노선명 (커스텀 운행인 경우 비워둠)' },
        { field: '상태', required: true, description: '완료/결행/대차' },
        { field: '기사운임', required: false, description: '기사 운임 (기본값 사용시 비워둠)' },
        { field: '청구운임', required: false, description: '청구 운임 (기본값 사용시 비워둠)' },
        { field: '결행사유', required: false, description: '결행 시 사유' },
        { field: '대차기사', required: false, description: '대차 운행 기사명' },
        { field: '대차비', required: false, description: '대차 기사 지급액' },
        { field: '공제액', required: false, description: '원 기사 공제액' },
        { field: '비고', required: false, description: '추가 정보' }
      ]

    case 'fixed-routes':
    case 'fixed-contracts':
      return [
        { field: '센터명', required: true, description: '상차지 센터명 (필수)' },
        { field: '노선명', required: true, description: '고정노선 이름 (필수)' },
        { field: '기사명', required: false, description: '배정 기사명' },
        { field: '차량번호', required: false, description: '기사 차량번호' },
        { field: '연락처', required: false, description: '기사 연락처 (010-1234-5678 형식)' },
        { field: '운행요일', required: true, description: '운행 요일 (월,화,수,목,금 형식)' },
        { field: '센터계약', required: true, description: '센터 계약형태 (고정일대, 고정월대, 고정지입)' },
        { field: '센터금액', required: false, description: '센터 계약금액' },
        { field: '기사계약', required: false, description: '기사 계약형태 (고정일대, 고정월대, 고정지입)' },
        { field: '기사금액', required: false, description: '기사 계약금액' },
        { field: '시작일자', required: false, description: '계약 시작일 (YYYY-MM-DD 형식)' },
        { field: '종료일자', required: false, description: '계약 종료일 (YYYY-MM-DD 형식, 비워두면 무기한)' },
        { field: '비고', required: false, description: '추가 정보' }
      ]

    default:
      return []
  }
}