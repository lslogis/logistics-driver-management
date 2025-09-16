import { PrismaClient } from '@prisma/client'

/**
 * 요금 계산 입력 타입
 */
export type PricingInput = {
  centerId: string
  vehicleType: string
  regions: string[]        // 목적지 목록(시/군)
  stopCount: number        // = regions.length (검증)
  extras: { 
    regionMove?: number    // 지역이동비 (2개 지역 이상)
    stopExtra?: number     // 콜 추가비 (2개 콜 이상)
    misc?: number          // 기타 추가비
  }
  isNegotiated: boolean
  negotiatedFare?: number
}

export type QuoteRequestData = {
  centerId: string
  vehicleType: string
  destinations: Array<{
    region: string
    order: number
  }>
}

/**
 * 요금 계산 출력 타입
 */
export type PricingOutput = {
  baseFare: number
  regionFare: number
  stopFare: number
  extraFare: number
  totalFare: number
  metadata: {
    baseRegion: string | null
    uniqueRegions: string[]
    maxFareRegion: string | null
    missingRates: string[]
  }
}

/**
 * 센터별 요율 서비스
 */
export class PricingService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 센터별 요금 계산
   */
  async quoteCenterFare(input: PricingInput): Promise<PricingOutput> {
    // 1) 입력 검증
    this.validateInput(input)

    // 2) 협의금액인 경우 바로 반환
    if (input.isNegotiated && input.negotiatedFare !== undefined) {
      return {
        baseFare: 0,
        regionFare: 0,
        stopFare: 0,
        extraFare: 0,
        totalFare: input.negotiatedFare,
        metadata: {
          baseRegion: null,
          uniqueRegions: input.regions,
          maxFareRegion: null,
          missingRates: []
        }
      }
    }

    // 3) 일반 계산 로직
    const uniqueRegions = [...new Set(input.regions)].sort()
    
    // 각 지역별 요율 조회
    const centerFares = await this.prisma.centerFare.findMany({
      where: {
        centerId: input.centerId,
        vehicleType: input.vehicleType,
        region: { in: uniqueRegions },
        isActive: true
      }
    })

    // 요율이 있는 지역과 없는 지역 분리
    const faresByRegion = new Map(centerFares.map(fare => [fare.region, fare.fare]))
    const missingRates = uniqueRegions.filter(region => !faresByRegion.has(region))

    // 기본료: 조회된 요율 중 최댓값
    let baseFare = 0
    let maxFareRegion: string | null = null
    
    if (centerFares.length > 0) {
      const maxFare = Math.max(...centerFares.map(f => f.fare))
      baseFare = maxFare
      maxFareRegion = centerFares.find(f => f.fare === maxFare)?.region || null
    }

    // 지역이동비: 지역이 2개 이상인 경우
    const regionFare = uniqueRegions.length >= 2 ? (input.extras.regionMove || 0) : 0

    // 콜 추가비: 총 콜 수가 2개 이상인 경우
    const stopFare = input.stopCount >= 2 ? (input.extras.stopExtra || 0) : 0

    // 기타비
    const extraFare = input.extras.misc || 0

    // 총합
    const totalFare = baseFare + regionFare + stopFare + extraFare

    return {
      baseFare,
      regionFare,
      stopFare,
      extraFare,
      totalFare,
      metadata: {
        baseRegion: maxFareRegion,
        uniqueRegions,
        maxFareRegion,
        missingRates
      }
    }
  }

  /**
   * 입력값 검증
   */
  private validateInput(input: PricingInput): void {
    if (!input.centerId) {
      throw new Error('센터 ID는 필수입니다')
    }

    if (!input.vehicleType) {
      throw new Error('차량 타입은 필수입니다')
    }

    if (!Array.isArray(input.regions) || input.regions.length === 0) {
      throw new Error('지역 정보는 필수입니다')
    }

    if (input.stopCount !== input.regions.length) {
      throw new Error('총착수와 지역 수가 일치하지 않습니다')
    }

    if (input.isNegotiated && (input.negotiatedFare === undefined || input.negotiatedFare < 0)) {
      throw new Error('협의금액이 설정되었지만 유효하지 않습니다')
    }

    // 중복 지역 제거 후 검증
    const uniqueRegions = [...new Set(input.regions)]
    if (uniqueRegions.length !== input.regions.length) {
      throw new Error('중복된 지역이 있습니다')
    }
  }

  /**
   * 센터별 요율표 조회
   */
  async getCenterFaresByCenter(centerId: string, vehicleType?: string): Promise<any[]> {
    const where: any = {
      centerId,
      isActive: true
    }

    if (vehicleType) {
      where.vehicleType = vehicleType
    }

    return this.prisma.centerFare.findMany({
      where,
      orderBy: [
        { vehicleType: 'asc' },
        { region: 'asc' }
      ]
    })
  }

  /**
   * 요율 등록/수정
   */
  async upsertCenterFare(data: {
    centerId: string
    vehicleType: string
    region: string
    fare: number
  }): Promise<any> {
    return this.prisma.centerFare.upsert({
      where: {
        unique_center_vehicle_region: {
          centerId: data.centerId,
          vehicleType: data.vehicleType,
          region: data.region
        }
      },
      update: {
        fare: data.fare,
        updatedAt: new Date()
      },
      create: {
        centerId: data.centerId,
        vehicleType: data.vehicleType,
        region: data.region,
        fare: data.fare
      }
    })
  }

  /**
   * 요율 삭제 (비활성화)
   */
  async deactivateCenterFare(id: string): Promise<void> {
    await this.prisma.centerFare.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    })
  }
}