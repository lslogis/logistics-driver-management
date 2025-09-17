import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'
import * as XLSX from 'xlsx'

export const runtime = 'nodejs'

/**
 * GET /api/center-fares/export - Excel 파일 내보내기
 */
export const GET = withAuth(
  async (req: NextRequest) => {
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

      const { searchParams } = new URL(req.url)
      
      // 필터 적용
      const where: any = {}
      const centerName = searchParams.get('centerName')
      const vehicleType = searchParams.get('vehicleType')
      const fareType = searchParams.get('fareType')
      
      if (centerName) where.centerName = centerName
      if (vehicleType) where.vehicleType = vehicleType
      if (fareType) where.fareType = fareType

      // 데이터 조회 (요율종류 → 센터명 → 차량톤수 → 지역 순서로 정렬)
      const fares = await prisma.centerFare.findMany({
        where,
        orderBy: [
          { fareType: 'asc' },
          { centerName: 'asc' },
          { vehicleType: 'asc' },
          { region: 'asc' }
        ]
      })

      // XLSX 라이브러리로 Excel 생성
      const excelData = fares.map(fare => ({
        '센터명': fare.centerName,
        '차량톤수': fare.vehicleType,
        '지역': fare.region || '',
        '요율종류': fare.fareType === 'BASIC' ? '기본운임' : '경유운임',
        '기본운임': fare.baseFare || 0,
        '경유운임': fare.extraStopFee || 0,
        '지역운임': fare.extraRegionFee || 0,
        '등록일': new Date(fare.createdAt).toLocaleDateString('ko-KR')
      }))

      const ws = XLSX.utils.json_to_sheet(excelData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '센터요율')

      // 컬럼 너비 설정
      const colWidths = [
        { wch: 20 }, // 센터명
        { wch: 12 }, // 차량톤수
        { wch: 15 }, // 지역
        { wch: 12 }, // 요율종류
        { wch: 15 }, // 기본운임
        { wch: 15 }, // 경유운임
        { wch: 15 }, // 지역운임
        { wch: 12 }  // 등록일
      ]
      ws['!cols'] = colWidths

      // Buffer로 변환
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

      // 감사 로그
      try {
        await createAuditLog(
          user,
          'EXPORT',
          'CenterFare',
          null,
          { count: fares.length },
          { source: 'web_api' }
        )
      } catch (error) {
        console.error('Audit log creation failed:', error)
        // 감사 로그 실패가 내보내기를 막지 않도록 계속 진행
      }

      // 파일명 생성
      const fileName = `센터요율_${new Date().toISOString().slice(0, 10)}.xlsx`

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`
        }
      })
    } catch (error) {
      console.error('Failed to export center fares:', error)
      
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '내보내기 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'charters', action: 'read' }
)