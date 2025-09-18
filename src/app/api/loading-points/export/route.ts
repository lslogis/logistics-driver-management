import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import * as ExcelJS from 'exceljs'

/**
 * 상차지 목록 내보내기 (ExcelJS 사용으로 완벽한 스타일링)
 * GET /api/loading-points/export?format=excel|csv
 */
export async function GET(request: NextRequest) {
  // 임시로 인증 우회
  try {
      const url = new URL(request.url)
      const format = url.searchParams.get('format') || 'excel'
      
      if (!['excel', 'csv'].includes(format)) {
        return NextResponse.json(
          { ok: false, error: { code: 'BAD_REQUEST', message: '지원하지 않는 파일 형식입니다' } },
          { status: 400 }
        )
      }

      // 모든 상차지 데이터 조회 (실제 스키마에 맞게 수정)
      const loadingPoints = await prisma.loadingPoint.findMany({
        select: {
          id: true,
          centerName: true,
          loadingPointName: true,
          lotAddress: true,
          roadAddress: true,
          manager1: true,
          manager2: true,
          phone1: true,
          phone2: true,
          remarks: true,
          isActive: true,
        },
        orderBy: [
          { isActive: 'desc' },
          { centerName: 'asc' },
          { loadingPointName: 'asc' }
        ]
      })

      if (format === 'excel') {
        // ExcelJS로 완벽한 스타일링이 적용된 Excel 파일 생성
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('상차지목록')

        // 헤더 정의 (등록일/수정일 제외, DB 자동생성이므로, 순서 변경)
        const headers = [
          { key: 'centerName', header: '센터명', required: true },
          { key: 'loadingPointName', header: '상차지명', required: true },
          { key: 'lotAddress', header: '지번주소', required: false },
          { key: 'roadAddress', header: '도로명주소', required: false },
          { key: 'manager1', header: '담당자1', required: false },
          { key: 'phone1', header: '연락처1', required: false },
          { key: 'manager2', header: '담당자2', required: false },
          { key: 'phone2', header: '연락처2', required: false },
          { key: 'remarks', header: '비고', required: false },
          { key: 'status', header: '상태', required: false }
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
            // 필수 항목: 초록색, 선택 항목: 연한 회색
            fgColor: { argb: isRequired ? 'FF28A745' : 'FFF8F9FA' }
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

        // 데이터 행 추가 (헤더 순서와 일치)
        loadingPoints.forEach(point => {
          const rowData = [
            point.centerName,
            point.loadingPointName,
            point.lotAddress || '-',
            point.roadAddress || '-',
            point.manager1 || '-',
            point.phone1 || '-',
            point.manager2 || '-',
            point.phone2 || '-',
            point.remarks || '-',
            point.isActive ? '활성' : '비활성'
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
          if (!column) return
          
          const headerInfo = headers[index]
          let maxLength = 0
          
          // 기본 자동 크기 계산
          if (column.eachCell) {
            column.eachCell({ includeEmpty: true }, (cell) => {
              const cellLength = cell.value ? cell.value.toString().length : 0
              if (cellLength > maxLength) {
                maxLength = cellLength
              }
            })
          }
          
          // 기본 너비 계산 (최소 8, 최대 50)
          let calculatedWidth = Math.min(Math.max(maxLength + 2, 8), 50)
          
          // 특정 필드들 크기 조정
          if (headerInfo?.key === 'centerName') {
            calculatedWidth = Math.max(calculatedWidth, 15) // 센터명: 최소 15
          } else if (headerInfo?.key === 'loadingPointName') {
            calculatedWidth = Math.max(calculatedWidth, 25) // 상차지명: 최소 25
          } else if (headerInfo?.key === 'lotAddress') {
            calculatedWidth = Math.max(calculatedWidth, 35) // 지번주소: 최소 35
          } else if (headerInfo?.key === 'roadAddress') {
            calculatedWidth = Math.max(calculatedWidth, 35) // 도로명주소: 최소 35
          } else if (headerInfo?.key === 'manager1' || headerInfo?.key === 'manager2') {
            calculatedWidth = Math.max(calculatedWidth, 12) // 담당자: 최소 12
          } else if (headerInfo?.key === 'phone1' || headerInfo?.key === 'phone2') {
            calculatedWidth = Math.max(calculatedWidth, 15) // 연락처: 최소 15
          } else if (headerInfo?.key === 'remarks') {
            calculatedWidth = Math.max(calculatedWidth, 40) // 비고: 최소 40
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
        
        const filename = `상차지목록_${new Date().toISOString().split('T')[0]}.xlsx`
        
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`
          }
        })
        
      } else {
        // CSV 형식 (등록일/수정일 제외, 순서 변경)
        const csvHeaders = [
          '센터명', '상차지명', '지번주소', '도로명주소', '담당자1', '연락처1',
          '담당자2', '연락처2', '비고', '상태'
        ]
        
        const csvData = loadingPoints.map(point => [
          point.centerName,
          point.loadingPointName,
          point.lotAddress || '-',
          point.roadAddress || '-',
          point.manager1 || '-',
          point.phone1 || '-',
          point.manager2 || '-',
          point.phone2 || '-',
          point.remarks || '-',
          point.isActive ? '활성' : '비활성'
        ])
        
        const csvContent = [csvHeaders, ...csvData]
          .map(row => row.map(cell => `"${cell}"`).join(','))
          .join('\n')
        
        const filename = `상차지목록_${new Date().toISOString().split('T')[0]}.csv`
        
        return new NextResponse(csvContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`
          }
        })
      }
      
  } catch (error) {
    console.error('Loading point export error:', error)
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_SERVER_ERROR', message: '상차지 목록 내보내기에 실패했습니다' } },
      { status: 500 }
    )
  }
}