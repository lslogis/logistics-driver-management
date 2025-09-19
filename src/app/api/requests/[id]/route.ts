import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const UpdateRequestSchema = z.object({
  requestDate: z.string().transform((str) => new Date(str)).optional(),
  centerCarNo: z.string().min(1).max(50).optional(),
  vehicleTon: z.number().min(0.1).max(999.9).optional(),
  regions: z.array(z.string()).min(1).max(10).optional(),
  stops: z.number().int().min(1).max(50).optional(),
  notes: z.string().optional(),
  baseFare: z.number().int().nullable().optional(),
  extraStopFee: z.number().int().nullable().optional(),
  extraRegionFee: z.number().int().nullable().optional(),
  extraAdjustment: z.number().int().optional(),
  adjustmentReason: z.string().max(200).optional(),
})

// GET /api/requests/[id] - Get request by ID with full details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const requestData = await prisma.request.findUnique({
      where: { id },
      include: {
        dispatches: {
          include: {
            driver: {
              select: { id: true, name: true, phone: true, vehicleNumber: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
    })

    if (!requestData) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    // Calculate financial summary
    const totalDriverFees = requestData.dispatches.reduce(
      (sum, dispatch) => sum + dispatch.driverFee,
      0
    )
    
    // Calculate center billing from stored fare calculation or default to 0
    const centerBilling = (requestData.baseFare || 0) + 
                         (requestData.extraStopFee || 0) + 
                         (requestData.extraRegionFee || 0) + 
                         (requestData.extraAdjustment || 0)
    
    const totalMargin = centerBilling - totalDriverFees
    const marginPercentage = centerBilling > 0 ? (totalMargin / centerBilling) * 100 : 0

    const response = {
      ...requestData,
      financialSummary: {
        centerBilling,
        totalDriverFees,
        totalMargin,
        marginPercentage,
        dispatchCount: requestData.dispatches.length
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching request:', error)
    return NextResponse.json(
      { error: 'Failed to fetch request' },
      { status: 500 }
    )
  }
}

// PUT /api/requests/[id] - Update request
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const validatedData = UpdateRequestSchema.parse(body)

    // Business rule validation
    if (
      validatedData.extraAdjustment !== undefined &&
      validatedData.extraAdjustment !== 0 &&
      !validatedData.adjustmentReason
    ) {
      return NextResponse.json(
        { error: 'Adjustment reason is required when extra adjustment is not zero' },
        { status: 400 }
      )
    }

    const updatedRequest = await prisma.request.update({
      where: { id },
      data: validatedData,
      include: {
        dispatches: {
          include: {
            driver: {
              select: { id: true, name: true, phone: true, vehicleNumber: true }
            }
          }
        }
      },
    })

    return NextResponse.json(updatedRequest)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating request:', error)
    return NextResponse.json(
      { error: 'Failed to update request' },
      { status: 500 }
    )
  }
}

// DELETE /api/requests/[id] - Delete request with cascade
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Check if request exists
    const existingRequest = await prisma.request.findUnique({
      where: { id },
      include: { dispatches: true }
    })

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    // Delete request (dispatches will be cascade deleted)
    await prisma.request.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Request deleted successfully',
      deletedDispatches: existingRequest.dispatches.length
    })
  } catch (error) {
    console.error('Error deleting request:', error)
    return NextResponse.json(
      { error: 'Failed to delete request' },
      { status: 500 }
    )
  }
}