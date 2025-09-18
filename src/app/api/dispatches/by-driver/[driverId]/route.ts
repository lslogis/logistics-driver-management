import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/dispatches/by-driver/[driverId] - Get dispatches by driver
export async function GET(
  request: NextRequest,
  { params }: { params: { driverId: string } }
) {
  try {
    const { driverId } = params
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Verify driver exists
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      select: { id: true, name: true, phone: true, vehicleNumber: true }
    })

    if (!driver) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      )
    }

    const where: any = { driverId }
    
    if (startDate || endDate) {
      where.request = {
        requestDate: {}
      }
      if (startDate) where.request.requestDate.gte = new Date(startDate)
      if (endDate) where.request.requestDate.lte = new Date(endDate)
    }

    const [dispatches, total] = await Promise.all([
      prisma.dispatch.findMany({
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
              extraAdjustment: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.dispatch.count({ where }),
    ])

    // Calculate summary statistics
    const totalFees = dispatches.reduce((sum, dispatch) => sum + dispatch.driverFee, 0)
    const averageFee = dispatches.length > 0 ? totalFees / dispatches.length : 0

    return NextResponse.json({
      driver,
      dispatches,
      summary: {
        totalDispatches: dispatches.length,
        totalFees,
        averageFee: Math.round(averageFee)
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching driver dispatches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch driver dispatches' },
      { status: 500 }
    )
  }
}