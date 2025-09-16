import { NextRequest, NextResponse } from 'next/server'
import { ZodError, z } from 'zod'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'

const exportSettlementsSchema = z.object({
  yearMonth: z
    .string()
    .regex(/^\d{4}-\d{2}$/, '월 형식은 YYYY-MM 이어야 합니다'),
  driverIds: z
    .array(z.string().uuid())
    .optional(),
  format: z.enum(['excel', 'csv']).default('excel')
})

/**
 * POST /api/settlements/export - 정산 내역 엑셀/CSV 내보내기
 */
export const POST = withAuth(
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

      // 요청 데이터 검증
      const body = await req.json()
      const { yearMonth, driverIds, format } = exportSettlementsSchema.parse(body)

      // 필터링 조건 생성
      const where: any = { yearMonth }

      if (driverIds && driverIds.length > 0) {
        where.driverId = { in: driverIds }
      }

      // 정산 데이터 조회
      const settlements = await prisma.settlement.findMany({
        where,
        include: {
          driver: {
            select: {
              name: true,
              phone: true,
              bankName: true,
              accountNumber: true
            }
          },
          items: {
            include: {
              trip: {
                select: {
                  date: true,
                  center: {
                    select: {
                      centerName: true
                    }
                  },
                  routeType: true,
                  centerName: true,
                  tonnage: true,
                  vehicleNumber: true,
                  regions: true
                }
              }
            },
            orderBy: {
              trip: {
                date: 'asc'
              }
            }
          }
        },
        orderBy: {
          driver: {
            name: 'asc'
          }
        }
      })

      if (settlements.length === 0) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'NO_DATA',
            message: '해당 월의 정산 데이터가 없습니다'
          }
        }, { status: 404 })
      }

      // 상태 한글 매핑
      const statusMap: Record<string, string> = {
        'DRAFT': '작성중',
        'CONFIRMED': '확정',
        'PAID': '지급완료'
      }

      // 정산 요약 데이터
      const summaryData = settlements.map(settlement => ({
        'ID': settlement.id,
        '기사명': settlement.driver.name,
        '연락처': settlement.driver.phone,
        '은행명': settlement.driver.bankName || '',
        '계좌번호': settlement.driver.accountNumber || '',
        '정산월': settlement.yearMonth,
        '총운행건수': settlement.totalTrips,
        '완료운행건수': settlement.totalTrips, // TODO: 완료 건수 별도 조회
        '결행건수': 0, // TODO: 결행 건수 별도 조회
        '대차건수': 0, // TODO: 대차 건수 별도 조회
        '총기사운임': settlement.totalBaseFare ? Number(settlement.totalBaseFare) : 0,
        '총차감액': settlement.totalDeductions ? Number(settlement.totalDeductions) : 0,
        '실지급액': settlement.finalAmount ? Number(settlement.finalAmount) : 0,
        '상태': statusMap[settlement.status] || settlement.status,
        '확정일': settlement.confirmedAt ? settlement.confirmedAt.toISOString().split('T')[0] : '',
        '지급일': settlement.paidAt ? settlement.paidAt.toISOString().split('T')[0] : ''
      }))

      // 정산 상세 데이터 (항목별)
      const detailData: any[] = []
      settlements.forEach(settlement => {
        settlement.items.forEach(item => {
          const routeName = item.trip?.centerName ? 
            `${item.trip.centerName} (${item.trip.regions?.join(', ') || '지역미정'})` : 
            item.trip?.routeType || '정보없음'

          detailData.push({
            '기사명': settlement.driver.name,
            '정산월': settlement.yearMonth,
            '운행일': item.trip?.date.toISOString().split('T')[0] || '',
            '센터명': item.trip?.center?.centerName || '',
            '차량번호': item.trip?.vehicleNumber || '',
            '톤수': item.trip?.tonnage || '',
            '노선': routeName,
            '운임': item.amount ? Number(item.amount) : 0,
            '차감액': item.type === 'DEDUCTION' ? Number(item.amount) : 0,
            '실지급액': item.type === 'TRIP' ? Number(item.amount) : 0,
            '비고': item.description || ''
          })
        })
      })

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16)

      // 감사 로그 기록
      await createAuditLog(
        user,
        'EXPORT',
        'Settlement',
        'export_' + yearMonth + '_' + timestamp,
        { 
          action: 'export', 
          format,
          yearMonth, 
          settlementCount: settlements.length,
          driverCount: driverIds?.length || 'all' 
        },
        { source: 'web_api' }
      )

      if (format === 'csv') {
        // CSV는 요약 데이터만 내보내기
        const csvContent = Papa.unparse(summaryData, {
          header: true,
        })

        const BOM = '\uFEFF' // Excel 한글 지원
        const csvWithBOM = BOM + csvContent

        return new Response(csvWithBOM, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="settlements_${yearMonth}_${timestamp}.csv"`,
            'Cache-Control': 'no-cache'
          }
        })
      } else {
        // Excel - 3개 시트: 요약, 상세, 통계
        
        // 시트 1: 정산 요약
        const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData)
        
        // 시트 2: 정산 상세
        const detailWorksheet = XLSX.utils.json_to_sheet(detailData)
        
        // 시트 3: 전체 통계
        const stats = {
          정산월: yearMonth,
          총정산건수: settlements.length,
          총운행건수: settlements.reduce((sum, s) => sum + s.totalTrips, 0),
          총완료운행: settlements.reduce((sum, s) => sum + s.totalTrips, 0), // TODO: 완료 건수 별도 조회
          총결행건수: 0, // TODO: 결행 건수 별도 조회
          총대차건수: 0, // TODO: 대차 건수 별도 조회
          총기사운임: settlements.reduce((sum, s) => sum + (Number(s.totalBaseFare) || 0), 0),
          총차감액: settlements.reduce((sum, s) => sum + (Number(s.totalDeductions) || 0), 0),
          총실지급액: settlements.reduce((sum, s) => sum + (Number(s.finalAmount) || 0), 0),
          작성중: settlements.filter(s => s.status === 'DRAFT').length,
          확정완료: settlements.filter(s => s.status === 'CONFIRMED').length,
          지급완료: settlements.filter(s => s.status === 'PAID').length,
          내보낸일시: new Date().toLocaleString('ko-KR')
        }

        const statsData = Object.entries(stats).map(([key, value]) => ({
          '항목': key,
          '값': value
        }))

        const statsWorksheet = XLSX.utils.json_to_sheet(statsData)

        // 컬럼 너비 자동 조정
        const summaryColWidths = Object.keys(summaryData[0] || {}).map(key => ({
          wch: Math.max(
            key.length,
            ...summaryData.map(row => String(row[key as keyof typeof row] || '').length)
          )
        }))
        summaryWorksheet['!cols'] = summaryColWidths

        if (detailData.length > 0) {
          const detailColWidths = Object.keys(detailData[0] || {}).map(key => ({
            wch: Math.max(
              key.length,
              ...detailData.map(row => String(row[key as keyof typeof row] || '').length)
            )
          }))
          detailWorksheet['!cols'] = detailColWidths
        }

        statsWorksheet['!cols'] = [{ wch: 15 }, { wch: 30 }]

        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, statsWorksheet, '통계')
        XLSX.utils.book_append_sheet(workbook, summaryWorksheet, '정산요약')
        if (detailData.length > 0) {
          XLSX.utils.book_append_sheet(workbook, detailWorksheet, '정산상세')
        }

        // 워크북 메타데이터
        workbook.Props = {
          Title: `정산내역 (${yearMonth})`,
          Subject: '운송기사관리시스템 데이터',
          Author: user.name,
          CreatedDate: new Date()
        }

        const excelBuffer = XLSX.write(workbook, { 
          type: 'buffer', 
          bookType: 'xlsx',
          compression: true
        })

        return new Response(excelBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="settlements_${yearMonth}_${timestamp}.xlsx"`,
            'Cache-Control': 'no-cache'
          }
        })
      }

    } catch (error) {
      console.error('Failed to export settlements:', error)
      
      if (error instanceof ZodError) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '입력값이 올바르지 않습니다',
            details: error.errors
          }
        }, { status: 400 })
      }
      
      if (error instanceof Error) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'BAD_REQUEST',
            message: error.message
          }
        }, { status: 400 })
      }
      
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '정산 내역 내보내기 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'settlements', action: 'read' }
)