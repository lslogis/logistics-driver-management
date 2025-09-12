import { NextRequest, NextResponse } from 'next/server'
import { ZodError, z } from 'zod'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/rbac'
import { getCurrentUser, createAuditLog } from '@/lib/auth/server'

// 쿼리 파라미터 스키마
const exportQuerySchema = z.object({
  format: z.enum(['excel', 'csv']).default('excel'),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  driverIds: z.string().optional(),
  vehicleIds: z.string().optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'ABSENCE', 'SUBSTITUTE']).optional()
})

/**
 * GET /api/export/trips - 운행 기록 내보내기
 * Query params:
 * - format: 'excel' | 'csv' (기본값: excel)
 * - dateFrom: 시작날짜 (YYYY-MM-DD, 필수)
 * - dateTo: 종료날짜 (YYYY-MM-DD, 필수)
 * - driverIds: 쉼표로 구분된 기사 ID 목록 (선택사항)
 * - vehicleIds: 쉼표로 구분된 차량 ID 목록 (선택사항)
 * - status: 운행 상태 필터 (선택사항)
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

      // 쿼리 파라미터 파싱
      const { searchParams } = new URL(req.url)
      const queryData = {
        format: searchParams.get('format') || 'excel',
        dateFrom: searchParams.get('dateFrom'),
        dateTo: searchParams.get('dateTo'),
        driverIds: searchParams.get('driverIds') || undefined,
        vehicleIds: searchParams.get('vehicleIds') || undefined,
        status: searchParams.get('status') as any || undefined
      }

      // 날짜 필수 체크
      if (!queryData.dateFrom || !queryData.dateTo) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'MISSING_DATES',
            message: 'dateFrom과 dateTo 파라미터가 필요합니다 (YYYY-MM-DD 형식)'
          }
        }, { status: 400 })
      }
      
      const { format, dateFrom, dateTo, driverIds, vehicleIds, status } = exportQuerySchema.parse(queryData)

      // 날짜 범위 검증
      const startDate = new Date(dateFrom + 'T00:00:00Z')
      const endDate = new Date(dateTo + 'T23:59:59Z')

      if (startDate > endDate) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'INVALID_DATE_RANGE',
            message: '시작날짜는 종료날짜보다 이전이어야 합니다'
          }
        }, { status: 400 })
      }

      // 너무 긴 기간 제한 (최대 1년)
      const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      if (daysDiff > 366) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'DATE_RANGE_TOO_LONG',
            message: '조회 기간은 최대 1년까지 가능합니다'
          }
        }, { status: 400 })
      }

      // 필터링 조건 생성
      const where: any = {
        date: {
          gte: startDate,
          lte: endDate
        }
      }

      // 기사 필터
      if (driverIds) {
        const ids = driverIds.split(',').filter(id => id.trim())
        if (ids.length > 0) {
          where.driverId = { in: ids }
        }
      }

      // 차량 필터
      if (vehicleIds) {
        const ids = vehicleIds.split(',').filter(id => id.trim())
        if (ids.length > 0) {
          where.vehicleId = { in: ids }
        }
      }

      // 상태 필터
      if (status) {
        where.status = status
      }

      // 운행 기록 조회
      const trips = await prisma.trip.findMany({
        where,
        include: {
          driver: {
            select: {
              name: true,
              phone: true
            }
          },
          vehicle: {
            select: {
              plateNumber: true,
              vehicleType: true
            }
          },
          routeTemplate: {
            select: {
              name: true,
              loadingPoint: true,
              unloadingPoint: true
            }
          },
          substituteDriver: {
            select: {
              name: true,
              phone: true
            }
          }
        },
        orderBy: [
          { date: 'desc' },
          { driver: { name: 'asc' } }
        ]
      })

      if (trips.length === 0) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'NO_DATA',
            message: '해당 조건의 운행 데이터가 없습니다'
          }
        }, { status: 404 })
      }

      // 상태 한글 매핑
      const statusMap: Record<string, string> = {
        'SCHEDULED': '예정',
        'COMPLETED': '완료',
        'ABSENCE': '결행',
        'SUBSTITUTE': '대차'
      }

      // 데이터 포맷팅 (한글 헤더)
      const exportData = trips.map(trip => {
        // 노선 정보 결정 (템플릿 vs 커스텀)
        const routeName = trip.routeTemplate?.name || '커스텀 노선'
        const loadingPoint = trip.routeTemplate?.loadingPoint || 
          (trip.customRoute as any)?.loadingPoint || ''
        const unloadingPoint = trip.routeTemplate?.unloadingPoint || 
          (trip.customRoute as any)?.unloadingPoint || ''

        return {
          'ID': trip.id,
          '운행일': trip.date.toISOString().split('T')[0],
          '기사명': trip.driver.name,
          '기사연락처': trip.driver.phone,
          '차량번호': trip.vehicle.plateNumber,
          '차종': trip.vehicle.vehicleType,
          '노선명': routeName,
          '상차지': loadingPoint,
          '하차지': unloadingPoint,
          '상태': statusMap[trip.status] || trip.status,
          '기사운임': trip.driverFare ? Number(trip.driverFare) : '',
          '청구운임': trip.billingFare ? Number(trip.billingFare) : '',
          '차감액': trip.deductionAmount ? Number(trip.deductionAmount) : '',
          '결행사유': trip.absenceReason || '',
          '대차기사': trip.substituteDriver?.name || '',
          '대차기사연락처': trip.substituteDriver?.phone || '',
          '대차비': trip.substituteFare ? Number(trip.substituteFare) : '',
          '비고': trip.remarks || '',
          '등록일': trip.createdAt.toISOString().split('T')[0],
          '수정일': trip.updatedAt.toISOString().split('T')[0]
        }
      })

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16)

      // 감사 로그 기록
      await createAuditLog(
        user,
        'EXPORT',
        'Trip',
        'export_' + timestamp,
        { 
          action: 'export',
          format,
          tripCount: trips.length,
          dateRange: { from: dateFrom, to: dateTo },
          filters: {
            driverIds: driverIds ? driverIds.split(',').length : 'all',
            vehicleIds: vehicleIds ? vehicleIds.split(',').length : 'all',
            status
          }
        },
        { source: 'web_api' }
      )

      if (format === 'csv') {
        // CSV 내보내기
        const csvContent = Papa.unparse(exportData, {
          header: true,
        })

        const BOM = '\uFEFF' // Excel 한글 지원
        const csvWithBOM = BOM + csvContent

        return new Response(csvWithBOM, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="trips_export_${dateFrom}_${dateTo}_${timestamp}.csv"`,
            'Cache-Control': 'no-cache'
          }
        })
      } else {
        // Excel 내보내기 - 2개 시트 생성 (요약 + 상세)
        
        // 시트 1: 운행 상세 내역
        const detailWorksheet = XLSX.utils.json_to_sheet(exportData)
        
        // 시트 2: 요약 통계
        const summary = {
          총운행건수: trips.length,
          완료건수: trips.filter(t => t.status === 'COMPLETED').length,
          결행건수: trips.filter(t => t.status === 'ABSENCE').length,
          대차건수: trips.filter(t => t.status === 'SUBSTITUTE').length,
          총기사운임: trips.reduce((sum, t) => sum + (t.driverFare ? Number(t.driverFare) : 0), 0),
          총청구운임: trips.reduce((sum, t) => sum + (t.billingFare ? Number(t.billingFare) : 0), 0),
          총차감액: trips.reduce((sum, t) => sum + (t.deductionAmount ? Number(t.deductionAmount) : 0), 0),
          조회기간: `${dateFrom} ~ ${dateTo}`,
          내보낸일시: new Date().toLocaleString('ko-KR')
        }

        const summaryData = Object.entries(summary).map(([key, value]) => ({
          '항목': key,
          '값': value
        }))

        const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData)
        
        // 컬럼 너비 자동 조정
        const detailColWidths = Object.keys(exportData[0] || {}).map(key => ({
          wch: Math.max(
            key.length,
            ...exportData.map(row => String(row[key as keyof typeof row] || '').length)
          )
        }))
        detailWorksheet['!cols'] = detailColWidths
        summaryWorksheet['!cols'] = [{ wch: 15 }, { wch: 30 }]

        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, summaryWorksheet, '요약')
        XLSX.utils.book_append_sheet(workbook, detailWorksheet, '운행상세')

        // 워크북 메타데이터
        workbook.Props = {
          Title: `운행 기록 (${dateFrom} ~ ${dateTo})`,
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
            'Content-Disposition': `attachment; filename="trips_export_${dateFrom}_${dateTo}_${timestamp}.xlsx"`,
            'Cache-Control': 'no-cache'
          }
        })
      }

    } catch (error) {
      console.error('Failed to export trips:', error)
      
      if (error instanceof ZodError) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '쿼리 파라미터가 올바르지 않습니다',
            details: error.errors
          }
        }, { status: 400 })
      }
      
      if (error instanceof Error) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'EXPORT_ERROR',
            message: error.message
          }
        }, { status: 500 })
      }
      
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '운행 기록 내보내기 중 오류가 발생했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'trips', action: 'read' }
)