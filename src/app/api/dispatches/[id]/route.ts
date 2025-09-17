import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const UpdateDispatchSchema = z.object({
  driverId: z.string().optional(),
  driverName: z.string().min(1).max(100).optional(),
  driverPhone: z.string().regex(/^010-\d{4}-\d{4}$/, 'Invalid phone format').optional(),
  driverVehicle: z.string().min(1).max(50).optional(),
  deliveryTime: z.string().max(50).optional(),
  driverFee: z.number().int().min(0).optional(),
  driverNotes: z.string().optional(),
})

// GET /api/dispatches/[id] - Get dispatch by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const dispatch = await prisma.dispatch.findUnique({
      where: { id },
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
        },
        driver: {
          select: { id: true, name: true, phone: true, vehicleNumber: true }
        }
      },
    })

    if (!dispatch) {
      return NextResponse.json(
        { error: 'Dispatch not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(dispatch)
  } catch (error) {
    console.error('Error fetching dispatch:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dispatch' },
      { status: 500 }
    )
  }
}

// PUT /api/dispatches/[id] - Update dispatch
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const validatedData = UpdateDispatchSchema.parse(body)

    // If driverId is provided, verify driver exists
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
    }

    const updatedDispatch = await prisma.dispatch.update({
      where: { id },
      data: validatedData,
      include: {
        request: {
          select: {
            id: true,
            requestDate: true,
            centerCarNo: true,
            vehicleTon: true,
            regions: true,
            stops: true
          }
        },
        driver: {
          select: { id: true, name: true, phone: true, vehicleNumber: true }
        }
      },
    })

    return NextResponse.json(updatedDispatch)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating dispatch:', error)
    return NextResponse.json(
      { error: 'Failed to update dispatch' },
      { status: 500 }
    )
  }
}

// DELETE /api/dispatches/[id] - Delete dispatch
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Check if dispatch exists
    const existingDispatch = await prisma.dispatch.findUnique({
      where: { id }
    })

    if (!existingDispatch) {
      return NextResponse.json(
        { error: 'Dispatch not found' },
        { status: 404 }
      )
    }

    await prisma.dispatch.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Dispatch deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting dispatch:', error)
    return NextResponse.json(
      { error: 'Failed to delete dispatch' },
      { status: 500 }
    )
  }
}