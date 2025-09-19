import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import * as ExcelJS from 'exceljs'

/**
 * 고정계약 목록 내보내기
 * GET /api/fixed-contracts/export?format=excel|csv&search=&isActive=
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const format = url.searchParams.get('format') || 'excel'
    const search = url.searchParams.get('search') || ''
    const isActiveParam = url.searchParams.get('isActive')
    
    if (!['excel', 'csv'].includes(format)) {
      return NextResponse.json(
        { ok: false, error: { code: 'BAD_REQUEST', message: '지원하지 않는 파일 형식입니다' } },
        { status: 400 }
      )
    }

    // 검색 조건 구성
    const where: any = {}
    
    if (isActiveParam !== null) {
      where.isActive = isActiveParam === 'true'
    }
    
    if (search) {
      where.OR = [
        { routeName: { contains: search } },
        { loadingPoint: { centerName: { contains: search } } },
        { driver: { name: { contains: search } } }
      ]
    }

    // 고정계약 데이터 조회
    const contracts = await prisma.fixedContract.findMany({
      where,
      include: {
        driver: true,
        loadingPoint: true
      },
      orderBy: [
        { isActive: 'desc' },
        { routeName: 'asc' }
      ]
    })

    // 요일 라벨 정의
    const WEEKDAY_LABELS: { [key: number]: string } = {
      0: '일',
      1: '월',
      2: '화',
      3: '수',
      4: '목',
      5: '금',
      6: '토'
    }

    // 계약 타입 라벨 정의
    const CONTRACT_TYPE_LABELS: { [key: string]: string } = {
      'FIXED_DAILY': '고정(일대)',
      'FIXED_MONTHLY': '고정(월대)',
      'CONSIGNED_MONTHLY': '고정지입',
      'CHARTER_PER_RIDE': '용차운임'
    }

    // 운행요일 포맷팅 함수
    const formatOperatingDays = (days: number[]): string => {
      if (!days || days.length === 0) return '-'
      return days
        .sort()
        .map(day => WEEKDAY_LABELS[day] || `Day${day}`)
        .join(', ')
    }

    // 전화번호 포맷팅 함수
    const formatPhone = (phone: string): string => {
      if (!phone) return '-'
      const cleaned = phone.replace(/[^0-9]/g, '')
      if (cleaned.length === 11) return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
      if (cleaned.length === 10) return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
      return phone
    }

    // 금액 포맷팅 함수 (Decimal 타입 처리)
    const formatCurrency = (amount: any): string => {
      if (amount === null || amount === undefined) return '-'
      // Prisma Decimal 타입을 숫자로 변환
      const numAmount = typeof amount === 'object' && amount !== null ? 
        Number(amount.toString()) : Number(amount)
      return new Intl.NumberFormat('ko-KR').format(numAmount)
    }

    // 날짜 포맷팅 함수
    const formatDate = (dateString: any): string => {
      if (!dateString) return '-'
      
      try {
        const date = new Date(dateString)
        return date.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          timeZone: 'Asia/Seoul'
        }).replace(/\./g, '/').replace(/\s/g, '').replace(/\/$/, '')
      } catch {
        return '-'
      }
    }

    if (format === 'excel') {
      try {
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('고정계약목록')

        // 헤더 정의 (요청된 순서대로)
        const headers = [
          { key: 'centerName', header: '센터명', required: true },
          { key: 'routeName', header: '노선명', required: true },
          { key: 'driverName', header: '기사명', required: true },
          { key: 'vehicleNumber', header: '차량번호', required: true },
          { key: 'phone', header: '연락처', required: true },
          { key: 'operatingDays', header: '운행요일', required: false },
          { key: 'centerContractType', header: '센터계약', required: false },
          { key: 'centerAmount', header: '센터금액', required: false },
          { key: 'driverContractType', header: '기사계약', required: false },
          { key: 'driverAmount', header: '기사금액', required: false },
          { key: 'startDate', header: '시작일자', required: false },
          { key: 'endDate', header: '종료일자', required: false },
          { key: 'remarks', header: '비고', required: false },
          { key: 'status', header: '상태', required: false }
        ]

        // 헤더 행 추가
        const headerRow = worksheet.addRow(headers.map(h => h.header))
        
        // 헤더 스타일링
        headerRow.eachCell((cell, colNumber) => {
          const headerInfo = headers[colNumber - 1]
          const isRequired = headerInfo?.required
          
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: isRequired ? 'FF007BFF' : 'FFF8F9FA' }
          }
          cell.font = {
            bold: true,
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
        contracts.forEach(contract => {
          const rowData = [
            contract.loadingPoint?.centerName || '-',
            contract.routeName,
            contract.driver?.name || '-',
            contract.driver?.vehicleNumber || '-',
            formatPhone(contract.driver?.phone || ''),
            formatOperatingDays(contract.operatingDays as number[]),
            CONTRACT_TYPE_LABELS[(contract as any).centerContractType] || (contract as any).centerContractType || '-',
            formatCurrency(contract.centerAmount),
            CONTRACT_TYPE_LABELS[(contract as any).driverContractType] || (contract as any).driverContractType || '-',
            formatCurrency(contract.driverAmount),
            formatDate((contract as any).startDate),
            formatDate((contract as any).endDate),
            (contract as any).remarks || '-',
            contract.isActive ? '활성' : '비활성'
          ]
          
          const dataRow = worksheet.addRow(rowData)
          
          // 데이터 행 스타일링
          dataRow.eachCell((cell, colNumber) => {
            cell.alignment = {
              horizontal: colNumber === 8 || colNumber === 10 ? 'right' : 'center',
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

        // 컬럼 너비 설정
        worksheet.columns = [
          { width: 20 }, // 센터명
          { width: 25 }, // 노선명
          { width: 12 }, // 기사명
          { width: 15 }, // 차량번호
          { width: 15 }, // 연락처
          { width: 20 }, // 운행요일
          { width: 12 }, // 센터계약
          { width: 15 }, // 센터금액
          { width: 12 }, // 기사계약
          { width: 15 }, // 기사금액
          { width: 12 }, // 시작일자
          { width: 12 }, // 종료일자
          { width: 30 }, // 비고
          { width: 10 }  // 상태
        ]

        // 행 높이 설정
        headerRow.height = 25
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber > 1) {
            row.height = 20
          }
        })

        // Excel 파일 버퍼 생성
        const buffer = await workbook.xlsx.writeBuffer()
        
        const filename = `${new Date().toISOString().split('T')[0]}_고정계약목록.xlsx`
        
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`
          }
        })
      } catch (e) {
        console.error('Fixed contract Excel export failed, falling back to CSV:', e)
      }
    }

    // CSV 형식 (Excel 실패 시 폴백 포함)
    const csvHeaders = [
      '센터명', '노선명', '기사명', '차량번호', '연락처', 
      '운행요일', '센터계약', '센터금액', '기사계약', '기사금액', 
      '시작일자', '종료일자', '비고', '상태'
    ]

    const csvData = contracts.map(contract => [
      contract.loadingPoint?.centerName || '-',
      contract.routeName,
      contract.driver?.name || '-',
      contract.driver?.vehicleNumber || '-',
      formatPhone(contract.driver?.phone || ''),
      formatOperatingDays(contract.operatingDays as number[]),
      CONTRACT_TYPE_LABELS[(contract as any).centerContractType] || (contract as any).centerContractType || '-',
      formatCurrency(contract.centerAmount),
      CONTRACT_TYPE_LABELS[(contract as any).driverContractType] || (contract as any).driverContractType || '-',
      formatCurrency(contract.driverAmount),
      formatDate((contract as any).startDate),
      formatDate((contract as any).endDate),
      (contract as any).remarks || '-',
      contract.isActive ? '활성' : '비활성'
    ])
    
    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    
    const filename = `${new Date().toISOString().split('T')[0]}_고정계약목록.csv`
    
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`
      }
    })
    
  } catch (error) {
    console.error('Fixed contract export error:', error)
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_SERVER_ERROR', message: '고정계약 목록 내보내기에 실패했습니다' } },
      { status: 500 }
    )
  }
}