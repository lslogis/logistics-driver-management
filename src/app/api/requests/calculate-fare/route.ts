import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const FareCalculationSchema = z.object({
  loadingPointId: z.string().min(1),
  centerCarNo: z.string().optional(),
  vehicleTon: z.number().min(0.1).max(999.9),
  regions: z.array(z.string()).min(1).max(10),
  stops: z.number().int().min(1).max(50),
  extraAdjustment: z.number().int().default(0),
})

// POST /api/requests/calculate-fare - Calculate fare for new request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = FareCalculationSchema.parse(body)

    // Get LoadingPoint information
    const loadingPoint = await prisma.loadingPoint.findUnique({
      where: { id: data.loadingPointId }
    })

    if (!loadingPoint) {
      return NextResponse.json(
        { error: 'Loading point not found' },
        { status: 400 }
      )
    }

    // Use LoadingPoint centerName to find matching center fare rates
    const centerName = loadingPoint.centerName
    const vehicleTypePattern = `${data.vehicleTon}톤`

    const centerFares = await prisma.centerFare.findMany({
      where: {
        centerName: centerName,
        vehicleType: {
          contains: data.vehicleTon.toString(),
          mode: 'insensitive'
        }
      }
    })

    // Basic calculation logic (can be enhanced with actual fare service)
    const baseFarePerTon = 50000 // 5만원 per ton
    const baseFare = Math.round(baseFarePerTon * data.vehicleTon)
    
    // Extra region fare (2만원 per additional region after first)
    const extraRegionFare = data.regions.length > 1 
      ? (data.regions.length - 1) * 20000 
      : 0
    
    // Extra stop fare (1만원 per additional stop after first)
    const extraStopFare = data.stops > 1 
      ? (data.stops - 1) * 10000 
      : 0
    
    const subtotal = baseFare + extraRegionFare + extraStopFare
    const totalFare = subtotal + data.extraAdjustment

    const calculation = {
      baseFare,
      extraStopFare,
      extraRegionFare,
      subtotal,
      extraAdjustment: data.extraAdjustment,
      totalFare,
      calculationBreakdown: {
        baseFareCalculation: `${data.vehicleTon}톤 × ${baseFarePerTon.toLocaleString()}원 = ${baseFare.toLocaleString()}원`,
        extraStopCalculation: data.stops > 1 
          ? `추가 ${data.stops - 1}개 착지 × 10,000원 = ${extraStopFare.toLocaleString()}원`
          : '추가 착지 없음',
        extraRegionCalculation: data.regions.length > 1
          ? `추가 ${data.regions.length - 1}개 지역 × 20,000원 = ${extraRegionFare.toLocaleString()}원`
          : '추가 지역 없음',
      },
      warnings: []
    }

    // Add warnings if needed
    if (centerFares.length === 0) {
      calculation.warnings.push(`${centerName} 센터의 ${data.vehicleTon}톤 차량에 대한 요율을 찾을 수 없어 기본 요율을 적용했습니다`)
    }

    return NextResponse.json({
      input: data,
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