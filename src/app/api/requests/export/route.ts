import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
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
          select: { id: true, name: true, centerName: true, loadingPointName: true, lotAddress: true, roadAddress: true }
        },
        dispatches: {
          include: {
            driver: {
              select: { id: true, name: true, phone: true, vehicleNumber: true }
            }
          },
          orderBy: { createdAt: 'asc' }
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
          select: { id: true, name: true, centerName: true, loadingPointName: true, lotAddress: true, roadAddress: true }
        },
        dispatches: {
          include: {
            driver: {
              select: { id: true, name: true, phone: true, vehicleNumber: true }
            }
          },
          orderBy: { createdAt: 'asc' }
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
    if (request.dispatches.length === 0) {
      // Request without dispatches
      rows.push({
        '상차지명': request.loadingPoint?.name || request.loadingPoint?.loadingPointName || '',
        '요청ID': request.id,
        '요청일': request.requestDate.toISOString().split('T')[0],
        '호차번호': request.centerCarNo,
        '톤수': parseFloat(request.vehicleTon.toString()),
        '배송지역': Array.isArray(request.regions) ? request.regions.join(',') : request.regions,
        '착지수': request.stops,
        '메모': request.notes || '',
        '추가조정': request.extraAdjustment,
        '조정사유': request.adjustmentReason || '',
        '배차ID': '',
        '기사명': '',
        '기사연락처': '',
        '기사차량': '',
        '배송시간': '',
        '기사운임': '',
        '기사메모': '',
        '마진': '',
        '마진율': ''
      })
    } else {
      // Request with dispatches
      for (const dispatch of request.dispatches) {
        // Calculate margin (placeholder - will be enhanced with fare calculation)
        const centerBilling = 0 // TODO: Get from fare calculation
        const margin = centerBilling - dispatch.driverFee
        const marginPercentage = centerBilling > 0 ? (margin / centerBilling) * 100 : 0

        rows.push({
          '상차지명': request.loadingPoint?.name || request.loadingPoint?.loadingPointName || '',
          '요청ID': request.id,
          '요청일': request.requestDate.toISOString().split('T')[0],
          '호차번호': request.centerCarNo,
          '톤수': parseFloat(request.vehicleTon.toString()),
          '배송지역': Array.isArray(request.regions) ? request.regions.join(',') : request.regions,
          '착지수': request.stops,
          '메모': request.notes || '',
          '추가조정': request.extraAdjustment,
          '조정사유': request.adjustmentReason || '',
          '배차ID': dispatch.id,
          '기사명': dispatch.driverName,
          '기사연락처': dispatch.driverPhone,
          '기사차량': dispatch.driverVehicle,
          '배송시간': dispatch.deliveryTime || '',
          '기사운임': dispatch.driverFee,
          '기사메모': dispatch.driverNotes || '',
          '마진': margin,
          '마진율': `${marginPercentage.toFixed(1)}%`
        })
      }
    }
  }

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(rows)

  // Set column widths
  const columnWidths = [
    { wch: 15 }, // 상차지명
    { wch: 10 }, // 요청ID
    { wch: 12 }, // 요청일
    { wch: 15 }, // 호차번호
    { wch: 8 },  // 톤수
    { wch: 30 }, // 배송지역
    { wch: 8 },  // 착지수
    { wch: 20 }, // 메모
    { wch: 12 }, // 추가조정
    { wch: 15 }, // 조정사유
    { wch: 10 }, // 배차ID
    { wch: 15 }, // 기사명
    { wch: 15 }, // 기사연락처
    { wch: 15 }, // 기사차량
    { wch: 12 }, // 배송시간
    { wch: 12 }, // 기사운임
    { wch: 20 }, // 기사메모
    { wch: 12 }, // 마진
    { wch: 10 }  // 마진율
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
    dispatchCount: number
    totalDriverFees: number
    uniqueDrivers: Set<string>
    centerCars: Set<string>
  }>()

  for (const request of requests) {
    const dateKey = request.requestDate.toISOString().split('T')[0]
    
    if (!dailySummary.has(dateKey)) {
      dailySummary.set(dateKey, {
        date: dateKey,
        requestCount: 0,
        dispatchCount: 0,
        totalDriverFees: 0,
        uniqueDrivers: new Set(),
        centerCars: new Set()
      })
    }

    const summary = dailySummary.get(dateKey)!
    summary.requestCount++
    summary.centerCars.add(request.centerCarNo)

    for (const dispatch of request.dispatches) {
      summary.dispatchCount++
      summary.totalDriverFees += dispatch.driverFee
      if (dispatch.driverId) {
        summary.uniqueDrivers.add(dispatch.driverId)
      }
    }
  }

  const rows = Array.from(dailySummary.values()).map(summary => ({
    '요청일': summary.date,
    '요청수': summary.requestCount,
    '배차수': summary.dispatchCount,
    '총기사운임': summary.totalDriverFees,
    '평균기사운임': summary.dispatchCount > 0 ? Math.round(summary.totalDriverFees / summary.dispatchCount) : 0,
    '참여기사수': summary.uniqueDrivers.size,
    '센터차량수': summary.centerCars.size
  }))

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(rows)

  // Set column widths
  const columnWidths = [
    { wch: 12 }, // 요청일
    { wch: 10 }, // 요청수
    { wch: 10 }, // 배차수
    { wch: 15 }, // 총기사운임
    { wch: 15 }, // 평균기사운임
    { wch: 12 }, // 참여기사수
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
