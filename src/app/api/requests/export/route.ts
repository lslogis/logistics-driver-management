import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { calculateProfitability } from '@/lib/services/profitability.service'
import * as XLSX from 'xlsx'

const ExportQuerySchema = z.object({
  startDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  centerCarNo: z.string().optional(),
  format: z.enum(['xlsx', 'csv']).default('xlsx'),
  includeDispatches: z.string().optional().transform((val) => val === 'true'),
  template: z.enum(['detailed', 'summary']).default('detailed')
})

// POST /api/requests/export - Export selected requests to Excel
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { requestIds } = body as { requestIds: string[] }

    if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
      return NextResponse.json(
        { error: 'Request IDs are required' },
        { status: 400 }
      )
    }

    const requests = await prisma.request.findMany({
      where: {
        id: { in: requestIds }
      },
      include: {
        loadingPoint: {
          select: { id: true, centerName: true, loadingPointName: true, lotAddress: true, roadAddress: true }
        },
        driver: {
          select: { id: true, name: true, phone: true, vehicleType: true, vehicleNumber: true }
        }
      },
      orderBy: { requestDate: 'desc' }
    })

    return generateDetailedExport(requests, 'xlsx')
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}

// GET /api/requests/export - Export requests to Excel/CSV
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    const validatedQuery = ExportQuerySchema.parse(query)

    const where: any = {}
    
    if (validatedQuery.startDate || validatedQuery.endDate) {
      where.requestDate = {}
      if (validatedQuery.startDate) where.requestDate.gte = validatedQuery.startDate
      if (validatedQuery.endDate) where.requestDate.lte = validatedQuery.endDate
    }
    
    if (validatedQuery.centerCarNo) {
      where.centerCarNo = {
        contains: validatedQuery.centerCarNo,
        mode: 'insensitive'
      }
    }

    const requests = await prisma.request.findMany({
      where,
      include: {
        loadingPoint: {
          select: { id: true, centerName: true, loadingPointName: true, lotAddress: true, roadAddress: true }
        },
        driver: {
          select: { id: true, name: true, phone: true, vehicleType: true, vehicleNumber: true }
        }
      },
      orderBy: { requestDate: 'desc' }
    })

    if (validatedQuery.template === 'summary') {
      return generateSummaryExport(requests, validatedQuery.format)
    } else {
      return generateDetailedExport(requests, validatedQuery.format)
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}

async function generateDetailedExport(requests: any[], format: string) {
  const rows: any[] = []

  for (const request of requests) {
    // Calculate profitability using the centralized service
    const profitability = calculateProfitability(request)
    const hasDriver = !!(request.driverId || request.driverName)

    rows.push({
      '센터명': request.loadingPoint?.centerName || '',
      '상차지명': request.loadingPoint?.loadingPointName || '',
      '요청ID': request.id,
      '요청일': request.requestDate.toISOString().split('T')[0],
      '호차번호': request.centerCarNo,
      '톤수': parseFloat(request.vehicleTon.toString()),
      '배송지역': Array.isArray(request.regions) ? request.regions.join(',') : request.regions,
      '착지수': request.stops,
      '메모': request.notes || '',
      
      // 요금 정보
      '기본운임': request.baseFare || 0,
      '착지수당': request.extraStopFee || 0,
      '지역운임': request.extraRegionFee || 0,
      '추가조정': request.extraAdjustment || 0,
      '조정사유': request.adjustmentReason || '',
      '센터청구금액': profitability.centerBilling,
      
      // 기사 정보
      '기사ID': request.driverId || '',
      '기사명': request.driverName || '',
      '기사연락처': request.driverPhone || '',
      '기사차량': request.driverVehicle || '',
      '배송시간': request.deliveryTime || '',
      '기사운임': request.driverFee || 0,
      '기사메모': request.driverNotes || '',
      '배정일시': request.dispatchedAt ? new Date(request.dispatchedAt).toLocaleString('ko-KR') : '',
      
      // 수익성 분석
      '마진금액': profitability.margin,
      '마진율': `${profitability.marginRate.toFixed(1)}%`,
      '수익성상태': profitability.statusLabel,
      
      // 상태 정보
      '배정상태': hasDriver ? '배정완료' : '미배정',
      '등록기사여부': request.driver ? 'Y' : 'N',
      '생성일시': request.createdAt.toLocaleString('ko-KR'),
      '수정일시': request.updatedAt.toLocaleString('ko-KR')
    })
  }

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(rows)

  // Set column widths to match new structure
  const columnWidths = [
    { wch: 15 }, // 센터명
    { wch: 15 }, // 상차지명
    { wch: 12 }, // 요청ID
    { wch: 12 }, // 요청일
    { wch: 15 }, // 호차번호
    { wch: 8 },  // 톤수
    { wch: 30 }, // 배송지역
    { wch: 8 },  // 착지수
    { wch: 20 }, // 메모
    { wch: 12 }, // 기본운임
    { wch: 12 }, // 착지수당
    { wch: 12 }, // 지역운임
    { wch: 12 }, // 추가조정
    { wch: 15 }, // 조정사유
    { wch: 15 }, // 센터청구금액
    { wch: 12 }, // 기사ID
    { wch: 15 }, // 기사명
    { wch: 15 }, // 기사연락처
    { wch: 15 }, // 기사차량
    { wch: 12 }, // 배송시간
    { wch: 12 }, // 기사운임
    { wch: 20 }, // 기사메모
    { wch: 18 }, // 배정일시
    { wch: 12 }, // 마진금액
    { wch: 10 }, // 마진율
    { wch: 12 }, // 수익성상태
    { wch: 12 }, // 배정상태
    { wch: 12 }, // 등록기사여부
    { wch: 18 }, // 생성일시
    { wch: 18 }  // 수정일시
  ]
  worksheet['!cols'] = columnWidths

  XLSX.utils.book_append_sheet(workbook, worksheet, '요청상세')

  const today = new Date().toISOString().split('T')[0]
  const filename = `requests_detailed_${today}`

  if (format === 'csv') {
    const csv = XLSX.utils.sheet_to_csv(worksheet)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}.csv"`
      }
    })
  } else {
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}.xlsx"`
      }
    })
  }
}

async function generateSummaryExport(requests: any[], format: string) {
  // Group by date
  const dailySummary = new Map<string, {
    date: string
    requestCount: number
    assignedCount: number
    totalRevenue: number
    totalDriverFees: number
    totalMargin: number
    uniqueDrivers: Set<string>
    centerCars: Set<string>
    centers: Set<string>
  }>()

  for (const request of requests) {
    const dateKey = request.requestDate.toISOString().split('T')[0]
    const profitability = calculateProfitability(request)
    const hasDriver = !!(request.driverId || request.driverName)
    
    if (!dailySummary.has(dateKey)) {
      dailySummary.set(dateKey, {
        date: dateKey,
        requestCount: 0,
        assignedCount: 0,
        totalRevenue: 0,
        totalDriverFees: 0,
        totalMargin: 0,
        uniqueDrivers: new Set(),
        centerCars: new Set(),
        centers: new Set()
      })
    }

    const summary = dailySummary.get(dateKey)!
    summary.requestCount++
    summary.totalRevenue += profitability.centerBilling
    summary.centerCars.add(request.centerCarNo)
    
    if (request.loadingPoint?.centerName) {
      summary.centers.add(request.loadingPoint.centerName)
    }

    if (hasDriver) {
      summary.assignedCount++
      summary.totalDriverFees += request.driverFee || 0
      summary.totalMargin += profitability.margin
      if (request.driverId) {
        summary.uniqueDrivers.add(request.driverId)
      } else if (request.driverName) {
        summary.uniqueDrivers.add(request.driverName)
      }
    }
  }

  const rows = Array.from(dailySummary.values()).map(summary => ({
    '요청일': summary.date,
    '총요청수': summary.requestCount,
    '배정완료': summary.assignedCount,
    '미배정': summary.requestCount - summary.assignedCount,
    '배정률': summary.requestCount > 0 ? `${((summary.assignedCount / summary.requestCount) * 100).toFixed(1)}%` : '0%',
    '총매출': summary.totalRevenue,
    '총기사운임': summary.totalDriverFees,
    '총마진': summary.totalMargin,
    '평균마진율': summary.totalRevenue > 0 ? `${((summary.totalMargin / summary.totalRevenue) * 100).toFixed(1)}%` : '0%',
    '평균기사운임': summary.assignedCount > 0 ? Math.round(summary.totalDriverFees / summary.assignedCount) : 0,
    '참여기사수': summary.uniqueDrivers.size,
    '참여센터수': summary.centers.size,
    '센터차량수': summary.centerCars.size
  }))

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(rows)

  // Set column widths for summary
  const columnWidths = [
    { wch: 12 }, // 요청일
    { wch: 10 }, // 총요청수
    { wch: 10 }, // 배정완료
    { wch: 10 }, // 미배정
    { wch: 10 }, // 배정률
    { wch: 15 }, // 총매출
    { wch: 15 }, // 총기사운임
    { wch: 15 }, // 총마진
    { wch: 12 }, // 평균마진율
    { wch: 15 }, // 평균기사운임
    { wch: 12 }, // 참여기사수
    { wch: 12 }, // 참여센터수
    { wch: 12 }  // 센터차량수
  ]
  worksheet['!cols'] = columnWidths

  XLSX.utils.book_append_sheet(workbook, worksheet, '요청요약')

  const today = new Date().toISOString().split('T')[0]
  const filename = `requests_summary_${today}`

  if (format === 'csv') {
    const csv = XLSX.utils.sheet_to_csv(worksheet)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}.csv"`
      }
    })
  } else {
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}.xlsx"`
      }
    })
  }
}
