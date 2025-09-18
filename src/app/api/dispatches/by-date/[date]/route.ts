import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/dispatches/by-date/[date] - Get dispatches by date
export async function GET(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const { date } = params
    const { searchParams } = new URL(request.url)
    const driverId = searchParams.get('driverId')
    const centerCarNo = searchParams.get('centerCarNo')

    // Validate date format
    const targetDate = new Date(date)
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    const where: any = {
      request: {
        requestDate: targetDate
      }
    }

    if (driverId) {
      where.driverId = driverId
    }

    if (centerCarNo) {
      where.request.centerCarNo = {
        contains: centerCarNo,
        mode: 'insensitive'
      }
    }

    const dispatches = await prisma.dispatch.findMany({
      where,
      include: {
        request: {
          select: {
            id: true,
            requestDate: true,
            centerCarNo: true,
            vehicleTon: true,
            regions: true,
            stops: true,
            extraAdjustment: true,
            adjustmentReason: true
          }
        },
        driver: {
          select: { id: true, name: true, phone: true, vehicleNumber: true }
        }
      },
      orderBy: [
        { request: { centerCarNo: 'asc' } },
        { createdAt: 'asc' }
      ]
    })

    // Calculate daily summary
    const totalDispatches = dispatches.length
    const totalDriverFees = dispatches.reduce((sum, dispatch) => sum + dispatch.driverFee, 0)
    const uniqueDrivers = new Set(dispatches.map(d => d.driverId)).size
    const uniqueRequests = new Set(dispatches.map(d => d.requestId)).size

    const summary = {
      date: targetDate.toISOString().split('T')[0],
      totalDispatches,
      uniqueRequests,
      uniqueDrivers,
      totalDriverFees,
      averageDriverFee: totalDispatches > 0 ? Math.round(totalDriverFees / totalDispatches) : 0
    }

    return NextResponse.json({
      summary,
      dispatches
    })
  } catch (error) {
    console.error('Error fetching dispatches by date:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dispatches by date' },
      { status: 500 }
    )
  }
}