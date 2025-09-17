import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { FareCalculationService } from '@/lib/services/fare-calculation.service'

const FareCalculationSchema = z.object({
  centerCarNo: z.string().optional(),
  vehicleTon: z.number().optional(),
  regions: z.array(z.string()).optional(),
  stops: z.number().int().optional(),
  extraAdjustment: z.number().int().optional(),
})

// POST /api/requests/[id]/calculate-fare - Calculate fare for request
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: requestId } = params
    const body = await request.json()
    const overrides = FareCalculationSchema.parse(body)

    // Get request data
    const requestData = await prisma.request.findUnique({
      where: { id: requestId },
      select: {
        centerCarNo: true,
        vehicleTon: true,
        regions: true,
        stops: true,
        extraAdjustment: true
      }
    })

    if (!requestData) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    // Use overrides if provided, otherwise use request data
    const calculationInput = {
      centerCarNo: overrides.centerCarNo || requestData.centerCarNo,
      vehicleTon: overrides.vehicleTon || parseFloat(requestData.vehicleTon.toString()),
      regions: overrides.regions || (requestData.regions as string[]),
      stops: overrides.stops || requestData.stops,
      extraAdjustment: overrides.extraAdjustment !== undefined 
        ? overrides.extraAdjustment 
        : requestData.extraAdjustment
    }

    const calculation = await FareCalculationService.calculateFare(calculationInput)

    return NextResponse.json({
      requestId,
      input: calculationInput,
      calculation,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error calculating fare:', error)
    return NextResponse.json(
      { error: 'Failed to calculate fare' },
      { status: 500 }
    )
  }
}

// GET /api/requests/[id]/calculate-fare - Calculate fare using current request data
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: requestId } = params

    // Get request data
    const requestData = await prisma.request.findUnique({
      where: { id: requestId },
      select: {
        centerCarNo: true,
        vehicleTon: true,
        regions: true,
        stops: true,
        extraAdjustment: true
      }
    })

    if (!requestData) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    const calculationInput = {
      centerCarNo: requestData.centerCarNo,
      vehicleTon: parseFloat(requestData.vehicleTon.toString()),
      regions: requestData.regions as string[],
      stops: requestData.stops,
      extraAdjustment: requestData.extraAdjustment
    }

    const calculation = await FareCalculationService.calculateFare(calculationInput)

    return NextResponse.json({
      requestId,
      input: calculationInput,
      calculation,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error calculating fare:', error)
    return NextResponse.json(
      { error: 'Failed to calculate fare' },
      { status: 500 }
    )
  }
}