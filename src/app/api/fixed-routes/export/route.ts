import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/server'
import * as XLSX from 'xlsx'

/**
 * 고정노선 목록 내보내기
 * GET /api/fixed-routes/export?format=excel|csv
 */
export async function GET(request: NextRequest) {
  return withAuth(async (user) => {
    try {
      // 권한 확인 - 모든 로그인 사용자 허용
      const url = new URL(request.url)
      const format = url.searchParams.get('format') || 'excel'
      
      if (!['excel', 'csv'].includes(format)) {
        return NextResponse.json(
          { ok: false, error: { code: 'BAD_REQUEST', message: '지원하지 않는 파일 형식입니다' } },
          { status: 400 }
        )
      }

      // 모든 고정노선 데이터 조회
      const routes = await prisma.routeTemplate.findMany({
        select: {
          id: true,
          routeName: true,
          centerName: true,
          contractType: true,
          departureTime: true,
          departureLocation: true,
          arrivalLocation: true,
          distance: true,
          fare: true,
          tollFee: true,
          oilFee: true,
          dailyWage: true,
          operatingDays: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              trips: true
            }
          }
        },
        orderBy: [
          { isActive: 'desc' },
          { routeName: 'asc' }
        ]
      })

      // 내보내기용 데이터 변환
      const exportData = routes.map(route => ({
        '노선명': route.routeName,
        '센터명': route.centerName,
        '계약형태': route.contractType,
        '출발시간': route.departureTime || '',
        '출발지': route.departureLocation || '',
        '도착지': route.arrivalLocation || '',
        '거리(km)': route.distance ? route.distance.toString() : '',
        '운임': route.fare ? route.fare.toString() : '',
        '톨비': route.tollFee ? route.tollFee.toString() : '',
        '기름비': route.oilFee ? route.oilFee.toString() : '',
        '일당': route.dailyWage ? route.dailyWage.toString() : '',
        '운행요일': route.operatingDays ? route.operatingDays.join(',') : '',
        '상태': route.isActive ? '활성' : '비활성',
        '운행수': route._count.trips,
        '등록일': route.createdAt.toISOString().split('T')[0],
        '수정일': route.updatedAt.toISOString().split('T')[0]
      }))

      // 워크북 생성
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(exportData)

      // 컬럼 너비 설정
      const colWidths = [
        { wch: 20 }, // 노선명
        { wch: 15 }, // 센터명
        { wch: 12 }, // 계약형태
        { wch: 10 }, // 출발시간
        { wch: 20 }, // 출발지
        { wch: 20 }, // 도착지
        { wch: 10 }, // 거리
        { wch: 10 }, // 운임
        { wch: 10 }, // 톨비
        { wch: 10 }, // 기름비
        { wch: 10 }, // 일당
        { wch: 20 }, // 운행요일
        { wch: 8 },  // 상태
        { wch: 8 },  // 운행수
        { wch: 12 }, // 등록일
        { wch: 12 }  // 수정일
      ]
      ws['!cols'] = colWidths

      // 시트 추가
      XLSX.utils.book_append_sheet(wb, ws, '고정노선목록')

      // 파일 생성
      const buffer = XLSX.write(wb, { 
        bookType: format === 'excel' ? 'xlsx' : 'csv', 
        type: 'buffer' 
      })

      // 응답 헤더 설정
      const filename = `고정노선목록_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`
      const contentType = format === 'excel' 
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv; charset=utf-8'

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`
        }
      })
    } catch (error) {
      console.error('Fixed route export error:', error)
      return NextResponse.json(
        { ok: false, error: { code: 'INTERNAL_SERVER_ERROR', message: '고정노선 목록 내보내기에 실패했습니다' } },
        { status: 500 }
      )
    }
  })(request)
}