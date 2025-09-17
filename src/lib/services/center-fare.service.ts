import { PrismaClient, CenterFare, Prisma, FareType } from '@prisma/client'

export type CreateCenterFareRequest = {
  centerName: string
  vehicleType: string
  region: string
  fareType: FareType
  baseFare?: number
  extraStopFee?: number
  extraRegionFee?: number
}

export type UpdateCenterFareRequest = {
  centerName?: string
  vehicleType?: string
  region?: string
  fareType?: FareType
  baseFare?: number
  extraStopFee?: number
  extraRegionFee?: number
}

export type GetCenterFaresQuery = {
  page?: number
  limit?: number
  search?: string
  centerName?: string
  vehicleType?: string
  region?: string
  fareType?: FareType
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export type CenterFareResponse = CenterFare

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
      centerName,
      vehicleType,
      region,
      fareType,
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
          { centerName: { contains: search, mode: 'insensitive' } }
        ]
      })
    }

    if (centerName) {
      where.centerName = centerName
    }

    if (vehicleType) {
      where.vehicleType = vehicleType
    }

    if (region) {
      where.region = region
    }

    if (fareType) {
      where.fareType = fareType
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
    // 센터 존재 확인 (LoadingPoint에서 centerName 확인)
    const center = await this.prisma.loadingPoint.findFirst({
      where: { 
        centerName: data.centerName,
        isActive: true 
      }
    })

    if (!center) {
      throw new Error('존재하지 않는 센터입니다')
    }

    // 중복 확인
    const existing = await this.prisma.centerFare.findUnique({
      where: {
        unique_center_vehicle_region: {
          centerName: data.centerName,
          vehicleType: data.vehicleType,
          region: data.region || ''
        }
      }
    })

    if (existing) {
      throw new Error('이미 등록된 요율입니다')
    }

    // 요율 종류에 따른 데이터 검증
    if (data.fareType === 'BASIC') {
      if (!data.baseFare || !data.region) {
        throw new Error('기본운임에는 baseFare와 region이 필수입니다')
      }
    } else if (data.fareType === 'STOP_FEE') {
      if (!data.extraStopFee || !data.extraRegionFee) {
        throw new Error('경유운임에는 extraStopFee와 extraRegionFee가 필수입니다')
      }
      // 경유운임은 region이 빈 문자열이어야 함
      data.region = ''
    }

    // 요율 생성
    const fare = await this.prisma.centerFare.create({
      data: {
        centerName: data.centerName,
        vehicleType: data.vehicleType,
        region: data.region || '',
        fareType: data.fareType,
        baseFare: data.fareType === 'BASIC' ? data.baseFare : null,
        extraStopFee: data.fareType === 'STOP_FEE' ? data.extraStopFee : null,
        extraRegionFee: data.fareType === 'STOP_FEE' ? data.extraRegionFee : null
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
    if (data.centerName && data.centerName !== existing.centerName) {
      const center = await this.prisma.loadingPoint.findFirst({
        where: { 
          centerName: data.centerName,
          isActive: true 
        }
      })

      if (!center) {
        throw new Error('존재하지 않는 센터입니다')
      }
    }

    // 중복 확인 (centerName, vehicleType, region 중 하나라도 변경되는 경우)
    if (data.centerName || data.vehicleType || data.region !== undefined) {
      const checkCenterName = data.centerName || existing.centerName
      const checkVehicleType = data.vehicleType || existing.vehicleType
      const checkRegion = data.region !== undefined ? data.region : existing.region

      const duplicate = await this.prisma.centerFare.findFirst({
        where: {
          id: { not: id },
          centerName: checkCenterName,
          vehicleType: checkVehicleType,
          region: checkRegion
        }
      })

      if (duplicate) {
        throw new Error('이미 등록된 요율 조합입니다')
      }
    }

    // 수정 데이터 준비
    const updateData: Prisma.CenterFareUpdateInput = {}

    if (data.centerName !== undefined) updateData.centerName = data.centerName
    if (data.vehicleType !== undefined) updateData.vehicleType = data.vehicleType
    if (data.region !== undefined) updateData.region = data.region
    if (data.fareType !== undefined) updateData.fareType = data.fareType
    if (data.baseFare !== undefined) updateData.baseFare = data.baseFare
    if (data.extraStopFee !== undefined) updateData.extraStopFee = data.extraStopFee
    if (data.extraRegionFee !== undefined) updateData.extraRegionFee = data.extraRegionFee

    const fare = await this.prisma.centerFare.update({
      where: { id },
      data: updateData,
    })

    return fare as CenterFareResponse
  }

  /**
   * 센터 요율 삭제 (하드 딜리트)
   */
  async deleteCenterFare(id: string): Promise<void> {
    const existing = await this.prisma.centerFare.findUnique({
      where: { id }
    })

    if (!existing) {
      throw new Error('요율을 찾을 수 없습니다')
    }

    await this.prisma.centerFare.delete({
      where: { id }
    })
  }


  /**
   * 센터별 요율 통계
   */
  async getCenterFareStats() {
    const [
      totalFares,
      faresByVehicleType,
      recentFares
    ] = await Promise.all([
      this.prisma.centerFare.count(),
      this.prisma.centerFare.groupBy({
        by: ['vehicleType'],
        _count: { vehicleType: true }
      }),
      this.prisma.centerFare.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 최근 30일
          }
        }
      })
    ])

    return {
      totalFares,
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
      baseFare?: number
      extraStopFee?: number
      extraRegionFee?: number
    }>
  ): Promise<number> {
    let updatedCount = 0

    for (const item of data) {
      try {
        await this.updateCenterFare(item.id, {
          baseFare: item.baseFare,
          extraStopFee: item.extraStopFee,
          extraRegionFee: item.extraRegionFee
        })
        updatedCount++
      } catch (error) {
        console.error(`Failed to update center fare ${item.id}:`, error)
      }
    }

    return updatedCount
  }
}

/**
 * 센터요율 검증 데이터 타입
 */
export type ValidateCenterFareRow = {
  centerName: string
  vehicleType: string
  region: string | null
  fareType: 'BASIC' | 'STOP_FEE'
  baseFare?: number | null
  extraStopFee?: number | null
  extraRegionFee?: number | null
}

export type CenterFareDuplicate = {
  index: number
  centerName: string
  vehicleType: string
  region: string | null
  fareType: 'BASIC' | 'STOP_FEE'
}

/**
 * 센터요율 중복 검증 함수
 */
export async function validateCenterFares(
  rows: ValidateCenterFareRow[],
  prisma?: PrismaClient
): Promise<CenterFareDuplicate[]> {
  const duplicates: CenterFareDuplicate[] = []
  
  // Prisma 인스턴스가 없으면 새로 생성
  const db = prisma || new PrismaClient()
  
  try {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      
      // DB에서 중복 확인
      let existingFare
      
      if (row.fareType === 'STOP_FEE') {
        // STOP_FEE: (centerName, vehicleType) 조합만 확인
        existingFare = await db.centerFare.findFirst({
          where: {
            centerName: row.centerName,
            vehicleType: row.vehicleType,
            fareType: 'STOP_FEE'
          }
        })
      } else if (row.fareType === 'BASIC') {
        // BASIC: (centerName, vehicleType, region) 조합 확인
        existingFare = await db.centerFare.findFirst({
          where: {
            centerName: row.centerName,
            vehicleType: row.vehicleType,
            region: row.region,
            fareType: 'BASIC'
          }
        })
      }
      
      if (existingFare) {
        duplicates.push({
          index: i,
          centerName: row.centerName,
          vehicleType: row.vehicleType,
          region: row.region,
          fareType: row.fareType
        })
      }
    }
    
    return duplicates
  } finally {
    // 외부에서 전달받은 prisma가 아닌 경우에만 연결 해제
    if (!prisma) {
      await db.$disconnect()
    }
  }
}