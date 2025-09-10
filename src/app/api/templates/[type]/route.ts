import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

// 지원하는 템플릿 타입
const TEMPLATE_TYPES = ['drivers', 'vehicles', 'routes', 'trips'] as const
type TemplateType = typeof TEMPLATE_TYPES[number]

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
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const type = params.type as TemplateType

    // 템플릿 타입 검증
    if (!TEMPLATE_TYPES.includes(type)) {
      return NextResponse.json(
        { 
          error: 'Invalid template type', 
          message: `지원하지 않는 템플릿 타입입니다. 지원 타입: ${TEMPLATE_TYPES.join(', ')}` 
        },
        { status: 400 }
      )
    }

    const templateInfo = TEMPLATE_INFO[type]
    const templatePath = join(process.cwd(), 'public', 'templates', templateInfo.filename)

    try {
      // CSV 파일 읽기
      const csvContent = readFileSync(templatePath, 'utf-8')

      // 한글 지원을 위한 BOM 추가
      const csvWithBOM = '\uFEFF' + csvContent

      // 다운로드 응답 생성
      return new NextResponse(csvWithBOM, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${type}_template.csv"`,
          'Cache-Control': 'no-cache, no-store, max-age=0'
        }
      })

    } catch (fileError) {
      console.error('Template file read error:', fileError)
      return NextResponse.json(
        { 
          error: 'Template file not found', 
          message: '템플릿 파일을 찾을 수 없습니다.' 
        },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error('Template download error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: '템플릿 다운로드 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    )
  }
}

// 템플릿 목록 조회 (GET /api/templates)
export async function OPTIONS() {
  return NextResponse.json({
    templates: Object.entries(TEMPLATE_INFO).map(([type, info]) => ({
      type,
      filename: info.filename,
      description: info.description,
      downloadUrl: `/api/templates/${type}`,
      fields: getTemplateFields(type as TemplateType)
    }))
  })
}

// 템플릿별 필드 정보 반환
function getTemplateFields(type: TemplateType): Array<{field: string, required: boolean, description: string}> {
  switch (type) {
    case 'drivers':
      return [
        { field: '이름', required: true, description: '기사명' },
        { field: '연락처', required: true, description: '휴대폰 번호 (010-1234-5678)' },
        { field: '이메일', required: false, description: '이메일 주소' },
        { field: '사업자번호', required: false, description: '사업자등록번호 (123-45-67890)' },
        { field: '상호명', required: false, description: '회사/상호명' },
        { field: '대표자명', required: false, description: '대표자 이름' },
        { field: '은행명', required: false, description: '계좌 은행명' },
        { field: '계좌번호', required: false, description: '계좌번호' },
        { field: '비고', required: false, description: '추가 정보' }
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

    default:
      return []
  }
}