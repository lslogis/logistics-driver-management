import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FixedRouteService } from '@/lib/services/fixed-route.service'
import { withAuth } from '@/lib/auth/rbac'
import * as ExcelJS from 'exceljs'

const fixedRouteService = new FixedRouteService(prisma)

export const runtime = 'nodejs'

/**
 * 고정노선 목록 내보내기 (ExcelJS 사용으로 완벽한 스타일링)
 * GET /api/fixed-routes/export?format=excel|csv
 */
export const GET = withAuth(
  async (request: NextRequest) => {
    try {
      const url = new URL(request.url)
      const format = url.searchParams.get('format') || 'excel'
      
      if (!['excel', 'csv'].includes(format)) {
        return NextResponse.json(
          { ok: false, error: { code: 'BAD_REQUEST', message: '지원하지 않는 파일 형식입니다' } },
          { status: 400 }
        )
      }

      // 모든 고정노선 데이터 조회 (서비스 계층 사용)
      const { fixedRoutes: routes } = await fixedRouteService.getFixedRoutes({
        page: 1,
        limit: 10000, // 모든 데이터 조회
        sortBy: 'routeName',
        sortOrder: 'asc'
      })

      // 요일 패턴을 한국어로 변환하는 함수
      const getWeekdayText = (weekdayPattern: number[]) => {
        const weekdays = ['일', '월', '화', '수', '목', '금', '토']
        return weekdayPattern.map(day => weekdays[day]).join(',')
      }

      // ContractType 한글 변환
      const getContractTypeLabel = (contractType: string) => {
        const labels: { [key: string]: string } = {
          'FIXED_DAILY': '고정(일대)',
          'FIXED_MONTHLY': '고정(월대)',
          'CONSIGNED_MONTHLY': '고정(지입)'
        }
        return labels[contractType] || contractType
      }

      if (format === 'excel') {
        // ExcelJS로 완벽한 스타일링이 적용된 Excel 파일 생성
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('고정노선목록')

        // 헤더 정의 (임포트 템플릿과 동일한 양식)
        const headers = [
          { key: 'routeName', header: '노선명', required: true },
          { key: 'centerName', header: '센터명', required: true },
          { key: 'weekdayPattern', header: '운행요일', required: true },
          { key: 'contractType', header: '계약형태', required: true },
          { key: 'assignedDriverName', header: '배정기사명', required: false },
          { key: 'revenueDaily', header: '일매출', required: false },
          { key: 'costDaily', header: '일매입', required: false },
          { key: 'revenueMonthly', header: '월매출', required: false },
          { key: 'costMonthly', header: '월매입', required: false },
          { key: 'revenueMonthlyWithExpense', header: '월매출(비용포함)', required: false },
          { key: 'costMonthlyWithExpense', header: '월매입(비용포함)', required: false },
          { key: 'remarks', header: '비고', required: false }
        ]

        // 헤더 행 추가
        const headerRow = worksheet.addRow(headers.map(h => h.header))
        
        // 헤더 스타일링 - 필수/선택 항목별 다른 색상 (가시성 개선)
        headerRow.eachCell((cell, colNumber) => {
          const headerInfo = headers[colNumber - 1]
          const isRequired = headerInfo?.required
          
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            // 필수 항목: 주황색, 선택 항목: 연한 회색
            fgColor: { argb: isRequired ? 'FFFD7E14' : 'FFF8F9FA' }
          }
          cell.font = {
            bold: true,
            // 필수 항목: 흰색 글씨, 선택 항목: 검은색 글씨
            color: { argb: isRequired ? 'FFFFFFFF' : 'FF212529' },
            size: 11
          }
          cell.alignment = {
            horizontal: 'center',
            vertical: 'middle'
          }
          cell.border = {
            top: { style: 'medium', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'medium', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          }
        })

        // 데이터 행 추가
        routes.forEach(route => {
          const rowData = [
            route.routeName,
            route.centerName || '-',
            route.weekdayPattern ? getWeekdayText(route.weekdayPattern) : '-',
            getContractTypeLabel(route.contractType),
            route.assignedDriverName || '-',
            route.revenueDaily ? Number(route.revenueDaily).toLocaleString() : '-',
            route.costDaily ? Number(route.costDaily).toLocaleString() : '-',
            route.revenueMonthly ? Number(route.revenueMonthly).toLocaleString() : '-',
            route.costMonthly ? Number(route.costMonthly).toLocaleString() : '-',
            route.revenueMonthlyWithExpense ? Number(route.revenueMonthlyWithExpense).toLocaleString() : '-',
            route.costMonthlyWithExpense ? Number(route.costMonthlyWithExpense).toLocaleString() : '-',
            route.remarks || '-'
          ]
          
          const dataRow = worksheet.addRow(rowData)
          
          // 데이터 행 스타일링
          dataRow.eachCell((cell, colNumber) => {
            cell.alignment = {
              horizontal: 'center',
              vertical: 'middle'
            }
            cell.border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } }
            }
            cell.font = {
              size: 10
            }
          })
        })

        // 컬럼 너비 설정 (자동 + 특정 필드 크기 조정)
        worksheet.columns.forEach((column, index) => {
          if (!column || !column.eachCell) return
          
          const headerInfo = headers[index]
          let maxLength = 0
          
          // 기본 자동 크기 계산
          column.eachCell({ includeEmpty: true }, (cell) => {
            const cellLength = cell.value ? cell.value.toString().length : 0
            if (cellLength > maxLength) {
              maxLength = cellLength
            }
          })
          
          // 기본 너비 계산 (최소 8, 최대 50)
          let calculatedWidth = Math.min(Math.max(maxLength + 2, 8), 50)
          
          // 특정 필드들 크기 조정
          if (headerInfo?.key === 'routeName') {
            calculatedWidth = Math.max(calculatedWidth, 20) // 노선명: 최소 20
          } else if (headerInfo?.key === 'centerName') {
            calculatedWidth = Math.max(calculatedWidth, 15) // 센터명: 최소 15
          } else if (headerInfo?.key === 'weekdayPattern') {
            calculatedWidth = Math.max(calculatedWidth, 15) // 운행요일: 최소 15
          } else if (headerInfo?.key === 'assignedDriverName') {
            calculatedWidth = Math.max(calculatedWidth, 12) // 배정기사명: 최소 12
          } else if (headerInfo?.key.includes('revenue') || headerInfo?.key.includes('cost')) {
            calculatedWidth = Math.max(calculatedWidth, 15) // 금액 필드: 최소 15
          }
          
          column.width = calculatedWidth
        })

        // 행 높이 설정
        headerRow.height = 25
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber > 1) {
            row.height = 20
          }
        })

        // Excel 파일 버퍼 생성
        const buffer = await workbook.xlsx.writeBuffer()
        
        const filename = `고정노선목록_${new Date().toISOString().split('T')[0]}.xlsx`
        
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`
          }
        })
        
      } else {
        // CSV 형식 (임포트 템플릿과 동일한 양식)
        const csvHeaders = [
          '노선명', '센터명', '운행요일', '계약형태', '배정기사명',
          '일매출', '일매입', '월매출', '월매입', '월매출(비용포함)', '월매입(비용포함)', '비고'
        ]
        
        const csvData = routes.map(route => [
          route.routeName,
          route.centerName || '-',
          route.weekdayPattern ? getWeekdayText(route.weekdayPattern) : '-',
          getContractTypeLabel(route.contractType),
          route.assignedDriverName || '-',
          route.revenueDaily ? Number(route.revenueDaily).toLocaleString() : '-',
          route.costDaily ? Number(route.costDaily).toLocaleString() : '-',
          route.revenueMonthly ? Number(route.revenueMonthly).toLocaleString() : '-',
          route.costMonthly ? Number(route.costMonthly).toLocaleString() : '-',
          route.revenueMonthlyWithExpense ? Number(route.revenueMonthlyWithExpense).toLocaleString() : '-',
          route.costMonthlyWithExpense ? Number(route.costMonthlyWithExpense).toLocaleString() : '-',
          route.remarks || '-'
        ])
        
        const csvContent = [csvHeaders, ...csvData]
          .map(row => row.map(cell => `"${cell}"`).join(','))
          .join('\n')
        
        const filename = `고정노선목록_${new Date().toISOString().split('T')[0]}.csv`
        
        return new NextResponse(csvContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`
          }
        })
      }
      
    } catch (error) {
      console.error('Fixed route export error:', error)
      
      if (error instanceof Error) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message
          }
        }, { status: 500 })
      }
      
      return NextResponse.json({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '고정노선 목록 내보내기에 실패했습니다'
        }
      }, { status: 500 })
    }
  },
  { resource: 'fixed_routes', action: 'read' }
)