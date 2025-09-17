import { prisma } from '@/lib/prisma'

export interface FareCalculationInput {
  centerCarNo: string
  vehicleTon: number
  regions: string[]
  stops: number
  extraAdjustment?: number
}

export interface FareCalculationResult {
  baseFare: number
  extraStopFare: number
  extraRegionFare: number
  subtotal: number
  extraAdjustment: number
  totalFare: number
  calculationBreakdown: {
    appliedRate?: {
      id: string
      centerName: string
      vehicleType: string
      region?: string
      fareType: string
    }
    baseFareCalculation: string
    extraStopCalculation: string
    extraRegionCalculation: string
  }
  warnings: string[]
}

export class FareCalculationService {
  /**
   * Calculate fare for a request using center fares system
   */
  static async calculateFare(input: FareCalculationInput): Promise<FareCalculationResult> {
    const { centerCarNo, vehicleTon, regions, stops, extraAdjustment = 0 } = input
    
    const warnings: string[] = []
    let baseFare = 0
    let extraStopFare = 0
    let extraRegionFare = 0
    let appliedRate: any = null

    try {
      // Extract center name from centerCarNo (e.g., "C001" -> "C")
      const centerName = this.extractCenterName(centerCarNo)
      
      // Determine vehicle type from tonnage
      const vehicleType = this.getVehicleTypeFromTonnage(vehicleTon)
      
      // Find applicable rate - try exact region match first
      const primaryRegion = regions[0] || ''
      appliedRate = await this.findApplicableRate(centerName, vehicleType, primaryRegion)
      
      if (!appliedRate) {
        // Try finding a general rate without region specificity
        appliedRate = await this.findApplicableRate(centerName, vehicleType, null)
      }
      
      if (!appliedRate) {
        warnings.push(`No rate found for center: ${centerName}, vehicle: ${vehicleType}, region: ${primaryRegion}`)
        // Use fallback calculation
        baseFare = this.calculateFallbackFare(vehicleTon, regions.length, stops)
      } else {
        // Calculate using found rate
        const calculation = this.calculateUsingRate(appliedRate, regions.length, stops)
        baseFare = calculation.baseFare
        extraStopFare = calculation.extraStopFare
        extraRegionFare = calculation.extraRegionFare
      }

      const subtotal = baseFare + extraStopFare + extraRegionFare
      const totalFare = subtotal + extraAdjustment

      return {
        baseFare,
        extraStopFare,
        extraRegionFare,
        subtotal,
        extraAdjustment,
        totalFare,
        calculationBreakdown: {
          appliedRate: appliedRate ? {
            id: appliedRate.id,
            centerName: appliedRate.centerName,
            vehicleType: appliedRate.vehicleType,
            region: appliedRate.region,
            fareType: appliedRate.fareType
          } : undefined,
          baseFareCalculation: appliedRate 
            ? `기본료: ${appliedRate.baseFare || 0}원`
            : `예상료: ${baseFare}원 (${vehicleTon}톤 기준)`,
          extraStopCalculation: extraStopFare > 0 
            ? `추가 착지료: ${stops - 1} × ${extraStopFare / Math.max(1, stops - 1)} = ${extraStopFare}원`
            : '추가 착지료: 없음',
          extraRegionCalculation: extraRegionFare > 0
            ? `추가 지역료: ${regions.length - 1} × ${extraRegionFare / Math.max(1, regions.length - 1)} = ${extraRegionFare}원`
            : '추가 지역료: 없음'
        },
        warnings
      }
    } catch (error) {
      console.error('Fare calculation error:', error)
      warnings.push('계산 중 오류가 발생했습니다')
      
      // Return fallback calculation
      const fallbackFare = this.calculateFallbackFare(vehicleTon, regions.length, stops)
      return {
        baseFare: fallbackFare,
        extraStopFare: 0,
        extraRegionFare: 0,
        subtotal: fallbackFare,
        extraAdjustment,
        totalFare: fallbackFare + extraAdjustment,
        calculationBreakdown: {
          baseFareCalculation: `예상료: ${fallbackFare}원 (시스템 계산)`,
          extraStopCalculation: '추가 착지료: 없음',
          extraRegionCalculation: '추가 지역료: 없음'
        },
        warnings
      }
    }
  }

  /**
   * Find applicable rate from center_fares table
   */
  private static async findApplicableRate(
    centerName: string,
    vehicleType: string,
    region: string | null
  ) {
    return await prisma.centerFare.findFirst({
      where: {
        centerName,
        vehicleType,
        region: region || null
      },
      orderBy: [
        { fareType: 'asc' }, // BASIC first, then STOP_FEE
        { createdAt: 'desc' }
      ]
    })
  }

  /**
   * Calculate fare using found rate
   */
  private static calculateUsingRate(
    rate: any,
    regionCount: number,
    stopCount: number
  ) {
    const baseFare = rate.baseFare || 0
    
    // Calculate extra stop fare (stops beyond first one)
    const extraStops = Math.max(0, stopCount - 1)
    const extraStopFare = extraStops * (rate.extraStopFee || 0)
    
    // Calculate extra region fare (regions beyond first one)
    const extraRegions = Math.max(0, regionCount - 1)
    const extraRegionFare = extraRegions * (rate.extraRegionFee || 0)

    return { baseFare, extraStopFare, extraRegionFare }
  }

  /**
   * Extract center name from center car number
   */
  private static extractCenterName(centerCarNo: string): string {
    // Extract alphabetic part (e.g., "C001" -> "C", "ABC123" -> "ABC")
    const match = centerCarNo.match(/^([A-Za-z]+)/)
    return match ? match[1].toUpperCase() : centerCarNo.charAt(0).toUpperCase()
  }

  /**
   * Determine vehicle type from tonnage
   */
  private static getVehicleTypeFromTonnage(tonnage: number): string {
    if (tonnage <= 1.0) return '1톤'
    if (tonnage <= 2.5) return '2.5톤'
    if (tonnage <= 3.5) return '3.5톤'
    if (tonnage <= 5.0) return '5톤'
    if (tonnage <= 8.0) return '8톤'
    if (tonnage <= 11.0) return '11톤'
    return '대형'
  }

  /**
   * Fallback calculation when no rate is found
   */
  private static calculateFallbackFare(
    tonnage: number,
    regionCount: number,
    stopCount: number
  ): number {
    // Basic fare by tonnage
    let baseFare = 100000 // Default base
    
    if (tonnage <= 1.0) baseFare = 80000
    else if (tonnage <= 2.5) baseFare = 120000
    else if (tonnage <= 3.5) baseFare = 150000
    else if (tonnage <= 5.0) baseFare = 200000
    else if (tonnage <= 8.0) baseFare = 300000
    else baseFare = 400000

    // Add extra for additional regions and stops
    const extraRegionFare = Math.max(0, regionCount - 1) * 20000
    const extraStopFare = Math.max(0, stopCount - 1) * 15000

    return baseFare + extraRegionFare + extraStopFare
  }

  /**
   * Batch recalculate fares for multiple requests
   */
  static async batchRecalculateFares(requestIds: string[]): Promise<{
    success: number
    failed: number
    errors: Array<{ requestId: string, error: string }>
  }> {
    let success = 0
    let failed = 0
    const errors: Array<{ requestId: string, error: string }> = []

    for (const requestId of requestIds) {
      try {
        const request = await prisma.request.findUnique({
          where: { id: requestId },
          select: {
            centerCarNo: true,
            vehicleTon: true,
            regions: true,
            stops: true,
            extraAdjustment: true
          }
        })

        if (!request) {
          errors.push({ requestId, error: 'Request not found' })
          failed++
          continue
        }

        const calculation = await this.calculateFare({
          centerCarNo: request.centerCarNo,
          vehicleTon: parseFloat(request.vehicleTon.toString()),
          regions: request.regions as string[],
          stops: request.stops,
          extraAdjustment: request.extraAdjustment
        })

        // Update request with new calculation
        await prisma.request.update({
          where: { id: requestId },
          data: {
            // Store calculation metadata for auditing
            notes: request.notes ? 
              `${request.notes}\n[자동 재계산: ${new Date().toISOString()}]` :
              `[자동 재계산: ${new Date().toISOString()}]`
          }
        })

        success++
      } catch (error) {
        errors.push({ 
          requestId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
        failed++
      }
    }

    return { success, failed, errors }
  }
}