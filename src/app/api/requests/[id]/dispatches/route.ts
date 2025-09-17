import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const CreateDispatchSchema = z.object({
  driverId: z.string().optional(),
  driverName: z.string().min(1).max(100),
  driverPhone: z.string().regex(/^010-\d{4}-\d{4}$/, 'Invalid phone format'),
  driverVehicle: z.string().min(1).max(50),
  deliveryTime: z.string().max(50).optional(),
  driverFee: z.number().int().min(0),
  driverNotes: z.string().optional(),
})

// GET /api/requests/[id]/dispatches - Get all dispatches for a request
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: requestId } = params

    // Verify request exists
    const requestExists = await prisma.request.findUnique({
      where: { id: requestId }
    })

    if (!requestExists) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    const dispatches = await prisma.dispatch.findMany({
      where: { requestId },
      include: {
        driver: {
          select: { id: true, name: true, phone: true, vehicleNumber: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(dispatches)
  } catch (error) {
    console.error('Error fetching dispatches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dispatches' },
      { status: 500 }
    )
  }
}

// POST /api/requests/[id]/dispatches - Create new dispatch
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: requestId } = params
    const body = await request.json()
    const validatedData = CreateDispatchSchema.parse(body)

    // Verify request exists
    const requestExists = await prisma.request.findUnique({
      where: { id: requestId }
    })

    if (!requestExists) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    // If driverId is provided, verify driver exists and validate consistency
    if (validatedData.driverId) {
      const driver = await prisma.driver.findUnique({
        where: { id: validatedData.driverId }
      })

      if (!driver) {
        return NextResponse.json(
          { error: 'Driver not found' },
          { status: 400 }
        )
      }

      // Optionally validate driver information consistency
      if (driver.name !== validatedData.driverName) {
        console.warn('Driver name mismatch - using provided name')
      }
    }

    const newDispatch = await prisma.dispatch.create({
      data: {
        ...validatedData,
        requestId,
      },
      include: {
        driver: {
          select: { id: true, name: true, phone: true, vehicleNumber: true }
        }
      },
    })

    return NextResponse.json(newDispatch, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating dispatch:', error)
    return NextResponse.json(
      { error: 'Failed to create dispatch' },
      { status: 500 }
    )
  }
}