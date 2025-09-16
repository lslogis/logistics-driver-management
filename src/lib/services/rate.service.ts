import { PrismaClient, RateDetailType } from '@prisma/client'
import { CreateRateData, UpdateRateData, GetRatesQuery, CalculateRateQuery, RateSuggestions, RateImpactSimulationQuery, RateImpactSimulationResponse, RateImpactCenterAnalysis, RateImpactOutlier } from '@/lib/validations/rate'

export class RateService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 요금 마스터 목록 조회
   */
  async getRates(query: GetRatesQuery) {
    const { page, limit, search, tonnage, isActive, sortBy, sortOrder } = query
    const offset = (page - 1) * limit

    // Where 조건 구성
    const where: any = {}
    
    if (search) {
      where.centerName = {
        contains: search,
        mode: 'insensitive'
      }
    }
    
    if (tonnage !== undefined) {
      where.tonnage = tonnage
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive
    }

    // 총 개수 조회
    const total = await this.prisma.rateMaster.count({ where })
    
    // 데이터 조회
    const rateMasters = await this.prisma.rateMaster.findMany({
      where,
      include: {
        rateDetails: {
          where: { isActive: true },
          orderBy: [
            { type: 'asc' },
            { region: 'asc' }
          ]
        },
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip: offset,
      take: limit
    })

    const totalPages = Math.ceil(total / limit)

    return {
      rateMasters,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  }

  /**
   * 요금 마스터 단일 조회
   */
  async getRate(id: string) {
    const rateMaster = await this.prisma.rateMaster.findUnique({
      where: { id },
      include: {
        rateDetails: {
          where: { isActive: true },
          orderBy: [
            { type: 'asc' },
            { region: 'asc' }
          ]
        },
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!rateMaster) {
      throw new Error(`ID ${id}에 해당하는 요금 정보를 찾을 수 없습니다`)
    }

    return rateMaster
  }

  /**
   * 요금 마스터 생성
   */
  async createRate(data: CreateRateData & { createdBy: string }) {
    const { centerName, tonnage, rateDetails, createdBy } = data

    // 중복 체크
    const existingRate = await this.prisma.rateMaster.findUnique({
      where: {
        unique_center_tonnage: {
          centerName,
          tonnage
        }
      }
    })

    if (existingRate) {
      throw new Error(`${centerName} (${tonnage}톤) 요금 정보가 이미 존재합니다`)
    }

    // 트랜잭션으로 생성
    return await this.prisma.$transaction(async (tx) => {
      const rateMaster = await tx.rateMaster.create({
        data: {
          centerName,
          tonnage,
          createdBy,
          rateDetails: {
            create: rateDetails.map(detail => ({
              type: detail.type,
              region: detail.region,
              amount: detail.amount,
              conditions: detail.conditions,
              isActive: detail.isActive
            }))
          }
        },
        include: {
          rateDetails: true,
          creator: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      return rateMaster
    })
  }

  /**
   * 요금 마스터 수정
   */
  async updateRate(id: string, data: UpdateRateData) {
    const existingRate = await this.getRate(id)

    return await this.prisma.$transaction(async (tx) => {
      // 기본 정보 업데이트
      const updateData: any = {}
      if (data.centerName !== undefined) updateData.centerName = data.centerName
      if (data.tonnage !== undefined) updateData.tonnage = data.tonnage
      if (data.isActive !== undefined) updateData.isActive = data.isActive

      // 중복 체크 (centerName이나 tonnage가 변경된 경우)
      if (data.centerName || data.tonnage) {
        const centerName = data.centerName || existingRate.centerName
        const tonnage = data.tonnage || existingRate.tonnage
        
        const duplicateCheck = await tx.rateMaster.findUnique({
          where: {
            unique_center_tonnage: {
              centerName,
              tonnage
            }
          }
        })

        if (duplicateCheck && duplicateCheck.id !== id) {
          throw new Error(`${centerName} (${tonnage}톤) 요금 정보가 이미 존재합니다`)
        }
      }

      const rateMaster = await tx.rateMaster.update({
        where: { id },
        data: updateData,
        include: {
          rateDetails: true,
          creator: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      // rateDetails 업데이트 (제공된 경우)
      if (data.rateDetails) {
        // 기존 rateDetails 삭제 후 재생성 (단순화)
        await tx.rateDetail.deleteMany({
          where: { rateMasterId: id }
        })

        await tx.rateDetail.createMany({
          data: data.rateDetails.map(detail => ({
            rateMasterId: id,
            type: detail.type,
            region: detail.region,
            amount: detail.amount,
            conditions: detail.conditions,
            isActive: detail.isActive ?? true
          }))
        })

        // 업데이트된 데이터 다시 조회
        return await tx.rateMaster.findUnique({
          where: { id },
          include: {
            rateDetails: {
              where: { isActive: true },
              orderBy: [
                { type: 'asc' },
                { region: 'asc' }
              ]
            },
            creator: {
              select: {
                id: true,
                name: true
              }
            }
          }
        })
      }

      return rateMaster
    })
  }

  /**
   * 요금 마스터 활성화/비활성화
   */
  async toggleRateStatus(id: string, isActive: boolean) {
    const rateMaster = await this.prisma.rateMaster.update({
      where: { id },
      data: { isActive },
      include: {
        rateDetails: true,
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return rateMaster
  }

  /**
   * 요금 계산
   */
  async calculateRate(query: CalculateRateQuery & { totalStops?: number; distinctRegions?: number }) {
    const { center: centerName, tonnage, regions, date, totalStops, distinctRegions } = query
    const requestDate = date || new Date()

    // 매칭되는 요금 마스터 찾기
    const rateMaster = await this.prisma.rateMaster.findFirst({
      where: {
        centerName: {
          equals: centerName,
          mode: 'insensitive'
        },
        tonnage,
        isActive: true
      },
      include: {
        rateDetails: {
          where: { 
            isActive: true,
            AND: [
              {
                OR: [
                  { validFrom: null },
                  { validFrom: { lte: requestDate } }
                ]
              },
              {
                OR: [
                  { validTo: null },
                  { validTo: { gte: requestDate } }
                ]
              }
            ]
          }
        }
      }
    })

    if (!rateMaster) {
      throw new Error(`${centerName} (${tonnage}톤) 요금 정보를 찾을 수 없습니다`)
    }

    // Check if we have any valid rate details
    if (rateMaster.rateDetails.length === 0) {
      throw new Error(`${centerName} (${tonnage}톤) 요금 정보가 해당 날짜(${requestDate.toISOString().split('T')[0]})에 유효하지 않습니다`)
    }

    // 요금 계산 (새로운 총착수/경유 로직 적용)
    const breakdown = this.calculateBreakdown(rateMaster.rateDetails, regions, totalStops, distinctRegions)
    const calculation = this.getCalculationDetails(rateMaster.rateDetails, regions, totalStops, distinctRegions)

    return {
      rateMaster: {
        id: rateMaster.id,
        centerName: rateMaster.centerName,
        tonnage: rateMaster.tonnage
      },
      breakdown,
      calculation,
      calculatedFor: requestDate.toISOString()
    }
  }

  /**
   * 요금 제안 (매칭되지 않는 경우)
   */
  async getRateSuggestions(centerName: string, tonnage: number): Promise<RateSuggestions> {
    // 사용 가능한 센터명 조회
    const availableCenters = await this.prisma.rateMaster.findMany({
      where: { isActive: true },
      select: { centerName: true },
      distinct: ['centerName'],
      orderBy: { centerName: 'asc' }
    })

    // 사용 가능한 톤수 조회
    const availableTonnages = await this.prisma.rateMaster.findMany({
      where: { isActive: true },
      select: { tonnage: true },
      distinct: ['tonnage'],
      orderBy: { tonnage: 'asc' }
    })

    return {
      availableCenters: availableCenters.map(r => r.centerName),
      availableTonnages: availableTonnages.map(r => r.tonnage)
    }
  }

  /**
   * 요금 분석 계산 (새로운 총착수/경유 로직)
   */
  private calculateBreakdown(rateDetails: any[], regions?: string[], totalStops?: number, distinctRegions?: number) {
    let baseFare = 0
    let callFee = 0  
    let waypointFee = 0
    const specialFees: Array<{type: string; amount: number; description: string}> = []

    // 총착수와 경유 수 계산
    const effectiveTotalStops = totalStops || 1
    const effectiveDistinctRegions = distinctRegions || (regions ? regions.length : 0)
    const effectiveWaypoints = Math.max(effectiveDistinctRegions - 1, 0)

    // 기본요금에서 가장 높은 지역 요금 찾기
    const baseRates = rateDetails.filter(d => d.type === 'BASE')
    if (baseRates.length > 0) {
      if (regions && regions.length > 0) {
        // 지역별 기본요금이 있는 경우 해당 지역의 요금 사용
        for (const region of regions) {
          const regionRate = baseRates.find(r => r.region && r.region.toLowerCase().trim() === region.toLowerCase().trim())
          if (regionRate) {
            baseFare = Math.max(baseFare, Number(regionRate.amount))
          }
        }
        // 지역별 기본요금이 없으면 일반 기본요금 사용
        if (baseFare === 0) {
          const generalBase = baseRates.find(r => !r.region)
          baseFare = generalBase ? Number(generalBase.amount) : 0
        }
      } else {
        // 지역 정보가 없으면 일반 기본요금 사용
        const generalBase = baseRates.find(r => !r.region)
        baseFare = generalBase ? Number(generalBase.amount) : 0
      }
    }

    // 착지비 계산: max(총착수-1, 0) * 착지비율
    const callRates = rateDetails.filter(d => d.type === 'CALL_FEE')
    if (callRates.length > 0) {
      const callRate = callRates[0] // 첫 번째 착지비율 사용
      callFee = Math.max(effectiveTotalStops - 1, 0) * Number(callRate.amount)
    }

    // 경유비 계산: max(고유지역수-1, 0) * 경유비율
    const waypointRates = rateDetails.filter(d => d.type === 'WAYPOINT_FEE')
    if (waypointRates.length > 0) {
      const waypointRate = waypointRates[0] // 첫 번째 경유비율 사용
      waypointFee = effectiveWaypoints * Number(waypointRate.amount)
    }

    // 특수요금은 기존 로직 유지
    for (const detail of rateDetails) {
      if (detail.type === 'SPECIAL') {
        specialFees.push({
          type: detail.type,
          amount: Number(detail.amount),
          description: detail.conditions || `특수요금 (${detail.region || '전체'})`
        })
      }
    }

    const specialTotal = specialFees.reduce((sum, fee) => sum + fee.amount, 0)
    
    return {
      baseFare,
      callFee,
      waypointFee,
      specialFees,
      total: baseFare + callFee + waypointFee + specialTotal
    }
  }

  /**
   * 계산 세부사항 반환 (새로운 총착수/경유 로직)
   */
  private getCalculationDetails(rateDetails: any[], regions?: string[], totalStops?: number, distinctRegions?: number) {
    const effectiveTotalStops = totalStops || 1
    const effectiveDistinctRegions = distinctRegions || (regions ? regions.length : 0)
    
    const baseRate = rateDetails.find(d => d.type === 'BASE')
    const callRate = rateDetails.find(d => d.type === 'CALL_FEE')
    const waypointRates = rateDetails
      .filter(d => d.type === 'WAYPOINT_FEE')
      .map(d => ({
        region: d.region || '전체',
        rate: d,
        appliedCount: Math.max(effectiveDistinctRegions - 1, 0)
      }))
    const specialRates = rateDetails.filter(d => d.type === 'SPECIAL')

    return {
      baseRate,
      callRate,
      waypointRates,
      specialRates,
      calculationMeta: {
        effectiveTotalStops,
        effectiveDistinctRegions,
        callCount: Math.max(effectiveTotalStops - 1, 0),
        waypointCount: Math.max(effectiveDistinctRegions - 1, 0)
      }
    }
  }

  /**
   * 요금 마스터 삭제
   */
  async deleteRate(id: string) {
    // Cascade delete가 설정되어 있어 rateDetails도 함께 삭제됨
    await this.prisma.rateMaster.delete({
      where: { id }
    })
  }

  /**
   * 요금 변화 영향 분석 (시뮬레이션)
   * TODO: Implement proper rate impact simulation with CharterRequest data
   */
  async simulateRateImpact(query: RateImpactSimulationQuery): Promise<RateImpactSimulationResponse> {
    const { from, to, center, tonnage } = query
    
    // TODO: Implement proper rate impact simulation with CharterRequest data
    // 현재는 기본 구조만 반환 (Trip 모델이 없으므로 임시 구현)
    
    return {
      deltaBilling: 0,
      deltaDriver: 0,
      byCenter: [],
      outliers: [],
      summary: {
        periodsCompared: `${from} vs ${to}`,
        totalTrips: 0,
        centersAffected: 0,
        netImpactPercent: 0,
        avgRateChangePercent: 0,
        totalVolumeChange: 0
      }
    }
  }

  /**
   * 운행 데이터에서 센터-톤수 키 추출
   */
  private getCenterTonnageKey(trip: any, centerFilter?: string): string | null {
    // routeTemplate에서 센터 정보 추출 (실제 구현 시 데이터 구조에 맞게 조정)
    let centerName = ''
    
    if (trip.routeTemplate?.loadingPointRef?.name) {
      centerName = trip.routeTemplate.loadingPointRef.name
    } else if (trip.routeTemplate?.loadingPoint) {
      centerName = trip.routeTemplate.loadingPoint
    } else if (trip.customRoute) {
      // customRoute JSON에서 센터 정보 추출
      try {
        const customRouteData = typeof trip.customRoute === 'string' ? 
          JSON.parse(trip.customRoute) : trip.customRoute
        centerName = customRouteData.centerName || customRouteData.name || customRouteData.loadingPoint || ''
      } catch {
        return null
      }
    }

    if (!centerName || (centerFilter && centerName !== centerFilter)) {
      return null
    }

    const tonnage = trip.vehicle?.capacity || 0
    return `${centerName}|${tonnage}`
  }

  /**
   * 센터-톤수 키 파싱
   */
  private parseCenterTonnageKey(key: string): { centerName: string; tonnage: number } {
    const [centerName, tonnageStr] = key.split('|')
    return {
      centerName,
      tonnage: parseFloat(tonnageStr) || 0
    }
  }

  /**
   * 요금 상세에서 총 요금 계산
   */
  private calculateTotalRate(rateDetails: any[]): number {
    return rateDetails
      .filter(detail => detail.isActive)
      .reduce((total, detail) => {
        if (detail.type === 'BASE' || detail.type === 'CALL_FEE') {
          return total + Number(detail.amount)
        }
        return total
      }, 0)
  }
}