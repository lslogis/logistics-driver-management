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
  centerBillingTotal: z.number().int().optional(),
  
  // 기사 정보 (선택적)
  driverId: z.string().optional(),
  driverName: z.string().max(100).optional(),
  driverPhone: z.string().regex(/^010-\d{4}-\d{4}$/, 'Invalid phone format').optional(),
  driverVehicle: z.string().max(50).optional(),
  deliveryTime: z.string().max(50).optional(),
  driverFee: z.number().int().min(0).optional(),
  driverNotes: z.string().optional(),
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
        driver: {
          select: { id: true, name: true, phone: true, vehicleNumber: true }
        },
        loadingPoint: {
          select: { id: true, centerName: true, loadingPointName: true, lotAddress: true, roadAddress: true }
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
    const driverFee = requestData.driverFee || 0
    
    // Use stored centerBillingTotal or fallback to calculated value
    const centerBilling = requestData.centerBillingTotal || 
                         ((requestData.baseFare || 0) + 
                          (requestData.extraStopFee || 0) + 
                          (requestData.extraRegionFee || 0) + 
                          (requestData.extraAdjustment || 0))
    
    const totalMargin = centerBilling - driverFee
    const marginPercentage = centerBilling > 0 ? (totalMargin / centerBilling) * 100 : 0

    const response = {
      ...requestData,
      financialSummary: {
        centerBilling,
        totalDriverFees: driverFee,
        totalMargin,
        marginPercentage
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

    // Driver validation - if driver fields are provided, ensure consistency
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

      if (!driver.isActive) {
        return NextResponse.json(
          { error: 'Driver is not active' },
          { status: 400 }
        )
      }

      // Auto-fill driver information if not provided
      if (!validatedData.driverName) validatedData.driverName = driver.name
      if (!validatedData.driverPhone) validatedData.driverPhone = driver.phone
      if (!validatedData.driverVehicle) validatedData.driverVehicle = driver.vehicleNumber
    }

    // Set dispatchedAt if driver is being assigned for the first time
    const updateData = { 
      ...validatedData,
      dispatchedAt: validatedData.driverId ? new Date() : validatedData.dispatchedAt
    }

    const updatedRequest = await prisma.request.update({
      where: { id },
      data: updateData,
      include: {
        driver: {
          select: { id: true, name: true, phone: true, vehicleNumber: true }
        },
        loadingPoint: {
          select: { id: true, centerName: true, loadingPointName: true, lotAddress: true, roadAddress: true }
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

// DELETE /api/requests/[id] - Delete request
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Check if request exists
    const existingRequest = await prisma.request.findUnique({
      where: { id }
    })

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    // Delete request
    await prisma.request.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Request deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting request:', error)
    return NextResponse.json(
      { error: 'Failed to delete request' },
      { status: 500 }
    )
  }
}