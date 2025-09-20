import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Request validation schema
const CreateRequestSchema = z.object({
  loadingPointId: z.string().min(1),
  requestDate: z.string().transform((str) => new Date(str)),
  centerCarNo: z.string().optional(),
  vehicleTon: z.number().min(0.1).max(999.9),
  regions: z.array(z.string()).min(1).max(10),
  stops: z.number().int().min(1).max(50),
  notes: z.string().optional(),
  baseFare: z.number().int().nullable().optional(),
  extraStopFee: z.number().int().nullable().optional(),
  extraRegionFee: z.number().int().nullable().optional(),
  extraAdjustment: z.number().int().default(0),
  adjustmentReason: z.string().max(200).optional(),
  centerBillingTotal: z.number().int().default(0),
})

const UpdateRequestSchema = CreateRequestSchema.partial()

// GET /api/requests - List requests with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const centerCarNo = searchParams.get('centerCarNo')
    const loadingPointId = searchParams.get('loadingPointId')
    const skip = (page - 1) * limit

    const where: any = {}
    
    if (startDate || endDate) {
      where.requestDate = {}
      if (startDate) where.requestDate.gte = new Date(startDate)
      if (endDate) where.requestDate.lte = new Date(endDate)
    }
    
    if (centerCarNo) {
      where.centerCarNo = {
        contains: centerCarNo,
        mode: 'insensitive'
      }
    }

    if (loadingPointId) {
      where.loadingPointId = loadingPointId
    }

    const [requestRows, total] = await Promise.all([
      prisma.request.findMany({
        where,
        include: {
          dispatches: {
            include: {
              driver: {
                select: { id: true, name: true, phone: true, vehicleNumber: true }
              }
            }
          }
        },
        orderBy: { requestDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.request.count({ where }),
    ])

    const loadingPointIds = Array.from(new Set(requestRows.map(request => request.loadingPointId)))
    const loadingPointMap = new Map<string, {
      id: string
      centerName: string
      loadingPointName: string
      lotAddress: string | null
      roadAddress: string | null
    }>()

    if (loadingPointIds.length > 0) {
      const loadingPoints = await prisma.loadingPoint.findMany({
        where: { id: { in: loadingPointIds } },
        select: {
          id: true,
          centerName: true,
          loadingPointName: true,
          lotAddress: true,
          roadAddress: true
        }
      })

      for (const loadingPoint of loadingPoints) {
        loadingPointMap.set(loadingPoint.id, loadingPoint)
      }

      if (loadingPointIds.length > loadingPointMap.size) {
        const missingIds = loadingPointIds.filter(id => !loadingPointMap.has(id))
        console.warn('Requests referencing missing loading points', missingIds)
      }
    }

    const requests = requestRows.map(request => ({
      ...request,
      loadingPoint: loadingPointMap.get(request.loadingPointId) ?? null
    }))

    return NextResponse.json({
      data: requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    )
  }
}

// POST /api/requests - Create new request
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = CreateRequestSchema.parse(body)

    // Business rule validation
    if (validatedData.extraAdjustment !== 0 && !validatedData.adjustmentReason) {
      return NextResponse.json(
        { error: 'Adjustment reason is required when extra adjustment is not zero' },
        { status: 400 }
      )
    }

    // Validate loadingPoint exists
    const loadingPoint = await prisma.loadingPoint.findUnique({
      where: { id: validatedData.loadingPointId }
    })

    if (!loadingPoint) {
      return NextResponse.json(
        { error: 'Loading point not found' },
        { status: 400 }
      )
    }

    if (!loadingPoint.isActive) {
      return NextResponse.json(
        { error: 'Loading point is not active' },
        { status: 400 }
      )
    }

    const newRequest = await prisma.request.create({
      data: {
        ...validatedData,
        createdBy: user.id
      },
      include: {
        loadingPoint: {
          select: { id: true, centerName: true, loadingPointName: true, lotAddress: true, roadAddress: true }
        },
        dispatches: {
          include: {
            driver: {
              select: { id: true, name: true, phone: true, vehicleNumber: true }
            }
          }
        }
      },
    })

    return NextResponse.json(newRequest, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating request:', error)
    return NextResponse.json(
      { error: 'Failed to create request' },
      { status: 500 }
    )
  }
}
