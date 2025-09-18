import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// Request validation schema
const CreateRequestSchema = z.object({
  centerId: z.number().int().min(1),
  requestDate: z.string().transform((str) => new Date(str)),
  centerCarNo: z.string().min(1).max(50),
  vehicleTon: z.number().min(0.1).max(999.9),
  regions: z.array(z.string()).min(1).max(10),
  stops: z.number().int().min(1).max(50),
  notes: z.string().optional(),
  extraAdjustment: z.number().int().default(0),
  adjustmentReason: z.string().max(200).optional(),
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
    const centerId = searchParams.get('centerId')
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

    if (centerId) {
      where.centerId = parseInt(centerId, 10)
    }

    const [requests, total] = await Promise.all([
      prisma.request.findMany({
        where,
        include: {
          center: {
            select: { id: true, name: true, location: true }
          },
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
    const body = await request.json()
    const validatedData = CreateRequestSchema.parse(body)

    // Business rule validation
    if (validatedData.extraAdjustment !== 0 && !validatedData.adjustmentReason) {
      return NextResponse.json(
        { error: 'Adjustment reason is required when extra adjustment is not zero' },
        { status: 400 }
      )
    }

    // Validate center exists
    const center = await prisma.center.findUnique({
      where: { id: validatedData.centerId }
    })

    if (!center) {
      return NextResponse.json(
        { error: 'Center not found' },
        { status: 400 }
      )
    }

    if (!center.isActive) {
      return NextResponse.json(
        { error: 'Center is not active' },
        { status: 400 }
      )
    }

    const newRequest = await prisma.request.create({
      data: validatedData,
      include: {
        center: {
          select: { id: true, name: true, location: true }
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