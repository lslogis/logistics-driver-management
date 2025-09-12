import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/server'
import * as XLSX from 'xlsx'

/**
 * 기사 목록 내보내기
 * GET /api/drivers/export?format=excel|csv
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

      // 모든 기사 데이터 조회
      const drivers = await prisma.driver.findMany({
        select: {
          id: true,
          name: true,
          phone: true,
          vehicleNumber: true,
          businessName: true,
          representative: true,
          businessNumber: true,
          bankName: true,
          accountNumber: true,
          remarks: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              vehicles: true,
              trips: true,
              settlements: true
            }
          }
        },
        orderBy: [
          { isActive: 'desc' },
          { name: 'asc' }
        ]
      })

      // 내보내기용 데이터 변환
      const exportData = drivers.map(driver => ({
        '성함': driver.name,
        '연락처': driver.phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3'),
        '차량번호': driver.vehicleNumber || '',
        '사업상호': driver.businessName || '',
        '대표자': driver.representative || '',
        '사업자번호': driver.businessNumber || '',
        '계좌은행': driver.bankName || '',
        '계좌번호': driver.accountNumber || '',
        '특이사항': driver.remarks || '',
        '상태': driver.isActive ? '활성' : '비활성',
        '차량수': driver._count.vehicles,
        '운행수': driver._count.trips,
        '정산수': driver._count.settlements,
        '등록일': driver.createdAt.toISOString().split('T')[0],
        '수정일': driver.updatedAt.toISOString().split('T')[0]
      }))

      // 워크북 생성
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(exportData)

      // 컬럼 너비 설정
      const colWidths = [
        { wch: 10 }, // 성함
        { wch: 15 }, // 연락처
        { wch: 12 }, // 차량번호
        { wch: 20 }, // 사업상호
        { wch: 10 }, // 대표자
        { wch: 15 }, // 사업자번호
        { wch: 12 }, // 계좌은행
        { wch: 20 }, // 계좌번호
        { wch: 30 }, // 특이사항
        { wch: 8 },  // 상태
        { wch: 8 },  // 차량수
        { wch: 8 },  // 운행수
        { wch: 8 },  // 정산수
        { wch: 12 }, // 등록일
        { wch: 12 }  // 수정일
      ]
      ws['!cols'] = colWidths

      // 시트 추가
      XLSX.utils.book_append_sheet(wb, ws, '기사목록')

      // 파일 생성
      const buffer = XLSX.write(wb, { 
        bookType: format === 'excel' ? 'xlsx' : 'csv', 
        type: 'buffer' 
      })

      // 응답 헤더 설정
      const filename = `기사목록_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`
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
      console.error('Driver export error:', error)
      return NextResponse.json(
        { ok: false, error: { code: 'INTERNAL_SERVER_ERROR', message: '기사 목록 내보내기에 실패했습니다' } },
        { status: 500 }
      )
    }
  })(request)
}