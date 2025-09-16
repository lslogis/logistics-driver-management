import { PrismaClient, CenterFare, Prisma } from '@prisma/client'

export type CreateCenterFareRequest = {
  centerId: string
  vehicleType: string
  region: string
  fare: number
}

export type UpdateCenterFareRequest = {
  centerId?: string
  vehicleType?: string
  region?: string
  fare?: number
  isActive?: boolean
}

export type GetCenterFaresQuery = {
  page?: number
  limit?: number
  search?: string
  centerId?: string
  vehicleType?: string
  region?: string
  isActive?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export type CenterFareResponse = CenterFare & {
  center?: {
    id: string
    centerName: string
  }
}

export class CenterFareService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 센터 요율 목록 조회 (페이지네이션)
   */
  async getCenterFares(query: GetCenterFaresQuery) {
    const {
      page = 1,
      limit = 20,
      search,
      centerId,
      vehicleType,
      region,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = query

    const skip = (page - 1) * limit

    // Where 조건 구성
    const where: Prisma.CenterFareWhereInput = {}
    const andConditions: Prisma.CenterFareWhereInput[] = []

    if (search) {
      andConditions.push({
        OR: [
          { vehicleType: { contains: search, mode: 'insensitive' } },
          { region: { contains: search, mode: 'insensitive' } },
          { centerId: { contains: search, mode: 'insensitive' } }
        ]
      })
    }

    if (centerId) {
      where.centerId = centerId
    }

    if (vehicleType) {
      where.vehicleType = vehicleType
    }

    if (region) {
      where.region = region
    }

    if (isActive !== undefined) {
      where.isActive = isActive
    }

    if (andConditions.length > 0) {
      where.AND = andConditions
    }

    // 병렬 실행
    const [fares, totalCount] = await Promise.all([
      this.prisma.centerFare.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.centerFare.count({ where })
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return {
      fares: fares as CenterFareResponse[],
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  }

  /**
   * 센터 요율 단일 조회
   */
  async getCenterFareById(id: string): Promise<CenterFareResponse | null> {
    const fare = await this.prisma.centerFare.findUnique({
      where: { id },
    })

    return fare as CenterFareResponse | null
  }

  /**
   * 센터 요율 생성
   */
  async createCenterFare(data: CreateCenterFareRequest): Promise<CenterFareResponse> {
    // 센터 존재 확인
    const center = await this.prisma.loadingPoint.findUnique({
      where: { id: data.centerId }
    })

    if (!center) {
      throw new Error('존재하지 않는 센터입니다')
    }

    if (!center.isActive) {
      throw new Error('비활성화된 센터입니다')
    }

    // 중복 확인
    const existing = await this.prisma.centerFare.findUnique({
      where: {
        unique_center_vehicle_region: {
          centerId: data.centerId,
          vehicleType: data.vehicleType,
          region: data.region
        }
      }
    })

    if (existing) {
      throw new Error('이미 등록된 요율입니다')
    }

    // 요율 생성
    const fare = await this.prisma.centerFare.create({
      data: {
        centerId: data.centerId,
        vehicleType: data.vehicleType,
        region: data.region,
        fare: data.fare
      },
    })

    return fare as CenterFareResponse
  }

  /**
   * 센터 요율 수정
   */
  async updateCenterFare(id: string, data: UpdateCenterFareRequest): Promise<CenterFareResponse> {
    // 기존 요율 확인
    const existing = await this.prisma.centerFare.findUnique({
      where: { id }
    })

    if (!existing) {
      throw new Error('요율을 찾을 수 없습니다')
    }

    // 센터 변경 시 확인
    if (data.centerId && data.centerId !== existing.centerId) {
      const center = await this.prisma.loadingPoint.findUnique({
        where: { id: data.centerId }
      })

      if (!center) {
        throw new Error('존재하지 않는 센터입니다')
      }

      if (!center.isActive) {
        throw new Error('비활성화된 센터입니다')
      }
    }

    // 중복 확인 (centerId, vehicleType, region 중 하나라도 변경되는 경우)
    if (data.centerId || data.vehicleType || data.region) {
      const checkCenterId = data.centerId || existing.centerId
      const checkVehicleType = data.vehicleType || existing.vehicleType
      const checkRegion = data.region || existing.region

      const duplicate = await this.prisma.centerFare.findFirst({
        where: {
          id: { not: id },
          centerId: checkCenterId,
          vehicleType: checkVehicleType,
          region: checkRegion,
          isActive: true
        }
      })

      if (duplicate) {
        throw new Error('이미 등록된 요율 조합입니다')
      }
    }

    // 수정 데이터 준비
    const updateData: Prisma.CenterFareUpdateInput = {}

    if (data.centerId !== undefined) updateData.centerId = data.centerId
    if (data.vehicleType !== undefined) updateData.vehicleType = data.vehicleType
    if (data.region !== undefined) updateData.region = data.region
    if (data.fare !== undefined) updateData.fare = data.fare
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    const fare = await this.prisma.centerFare.update({
      where: { id },
      data: updateData,
    })

    return fare as CenterFareResponse
  }

  /**
   * 센터 요율 삭제 (비활성화)
   */
  async deleteCenterFare(id: string): Promise<void> {
    const existing = await this.prisma.centerFare.findUnique({
      where: { id }
    })

    if (!existing) {
      throw new Error('요율을 찾을 수 없습니다')
    }

    await this.prisma.centerFare.update({
      where: { id },
      data: { isActive: false }
    })
  }

  /**
   * 센터 요율 활성화/비활성화 토글
   */
  async toggleCenterFareStatus(id: string): Promise<CenterFareResponse> {
    const existing = await this.prisma.centerFare.findUnique({
      where: { id }
    })

    if (!existing) {
      throw new Error('요율을 찾을 수 없습니다')
    }

    const fare = await this.prisma.centerFare.update({
      where: { id },
      data: { isActive: !existing.isActive },
    })

    return fare as CenterFareResponse
  }

  /**
   * 센터별 요율 통계
   */
  async getCenterFareStats() {
    const [
      totalFares,
      activeFares,
      faresByVehicleType,
      recentFares
    ] = await Promise.all([
      this.prisma.centerFare.count(),
      this.prisma.centerFare.count({ where: { isActive: true } }),
      this.prisma.centerFare.groupBy({
        by: ['vehicleType'],
        _count: { vehicleType: true },
        where: { isActive: true }
      }),
      this.prisma.centerFare.count({
        where: {
          isActive: true,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 최근 30일
          }
        }
      })
    ])

    return {
      totalFares,
      activeFares,
      inactiveFares: totalFares - activeFares,
      faresByVehicleType: faresByVehicleType.reduce((acc: any, item: any) => {
        acc[item.vehicleType] = item._count.vehicleType
        return acc
      }, {}),
      recentFares
    }
  }

  /**
   * 센터별 요율 벌크 업데이트
   */
  async bulkUpdateCenterFares(
    data: Array<{
      id: string
      fare?: number
      isActive?: boolean
    }>
  ): Promise<number> {
    let updatedCount = 0

    for (const item of data) {
      try {
        await this.updateCenterFare(item.id, {
          fare: item.fare,
          isActive: item.isActive
        })
        updatedCount++
      } catch (error) {
        console.error(`Failed to update center fare ${item.id}:`, error)
      }
    }

    return updatedCount
  }
}