import { PrismaClient, CharterRequest, CharterDestination, Prisma } from '@prisma/client'

export type CreateCharterRequestData = {
  centerId: string
  vehicleType: string
  date: string | Date
  destinations: Array<{
    region: string
    order: number
  }>
  isNegotiated: boolean
  negotiatedFare?: number
  baseFare?: number
  regionFare?: number
  stopFare?: number
  extraFare?: number
  totalFare: number
  driverId: string
  driverFare: number
  notes?: string
}

export type UpdateCharterRequestData = {
  centerId?: string
  vehicleType?: string
  date?: string | Date
  destinations?: Array<{
    region: string
    order: number
  }>
  isNegotiated?: boolean
  negotiatedFare?: number
  baseFare?: number
  regionFare?: number
  stopFare?: number
  extraFare?: number
  totalFare?: number
  driverId?: string
  driverFare?: number
  notes?: string
}

export type GetCharterRequestsQuery = {
  page?: number
  limit?: number
  search?: string
  centerId?: string
  driverId?: string
  vehicleType?: string
  dateFrom?: string
  dateTo?: string
  isNegotiated?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export type CharterRequestResponse = CharterRequest & {
  center: {
    id: string
    centerName: string
  }
  driver: {
    id: string
    name: string
    phone: string
    vehicleNumber: string
  }
  creator?: {
    id: string
    name: string
  }
  destinations: CharterDestination[]
}

export class CharterService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 용차 요청 목록 조회 (페이지네이션)
   */
  async getCharterRequests(query: GetCharterRequestsQuery) {
    const {
      page = 1,
      limit = 20,
      search,
      centerId,
      driverId,
      vehicleType,
      dateFrom,
      dateTo,
      isNegotiated,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = query

    const skip = (page - 1) * limit

    // Where 조건 구성
    const where: Prisma.CharterRequestWhereInput = {}
    const andConditions: Prisma.CharterRequestWhereInput[] = []

    if (search) {
      andConditions.push({
        OR: [
          { driver: { name: { contains: search, mode: 'insensitive' } } },
          { driver: { phone: { contains: search } } },
          { driver: { vehicleNumber: { contains: search, mode: 'insensitive' } } },
          { center: { centerName: { contains: search, mode: 'insensitive' } } },
          { vehicleType: { contains: search, mode: 'insensitive' } },
          { destinations: { some: { region: { contains: search, mode: 'insensitive' } } } }
        ]
      })
    }

    if (centerId) {
      where.centerId = centerId
    }

    if (driverId) {
      where.driverId = driverId
    }

    if (vehicleType) {
      where.vehicleType = vehicleType
    }

    if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) {
        where.date.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.date.lte = new Date(dateTo)
      }
    }

    if (isNegotiated !== undefined) {
      where.isNegotiated = isNegotiated
    }

    if (andConditions.length > 0) {
      where.AND = andConditions
    }

    // 병렬 실행
    const [requests, totalCount] = await Promise.all([
      this.prisma.charterRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          center: {
            select: {
              id: true,
              centerName: true
            }
          },
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
              vehicleNumber: true
            }
          },
          creator: {
            select: {
              id: true,
              name: true
            }
          },
          destinations: {
            orderBy: { order: 'asc' }
          }
        }
      }),
      this.prisma.charterRequest.count({ where })
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return {
      requests: requests as CharterRequestResponse[],
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
   * 용차 요청 단일 조회
   */
  async getCharterRequestById(id: string): Promise<CharterRequestResponse | null> {
    const request = await this.prisma.charterRequest.findUnique({
      where: { id },
      include: {
        center: {
          select: {
            id: true,
            centerName: true
          }
        },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleNumber: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true
          }
        },
        destinations: {
          orderBy: { order: 'asc' }
        }
      }
    })

    return request as CharterRequestResponse | null
  }

  /**
   * 용차 요청 생성
   */
  async createCharterRequest(
    data: CreateCharterRequestData,
    createdBy: string
  ): Promise<CharterRequestResponse> {
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

    // 기사 존재 확인
    const driver = await this.prisma.driver.findUnique({
      where: { id: data.driverId }
    })

    if (!driver) {
      throw new Error('존재하지 않는 기사입니다')
    }

    if (!driver.isActive) {
      throw new Error('비활성화된 기사입니다')
    }

    // 목적지 검증
    if (!data.destinations || data.destinations.length === 0) {
      throw new Error('목적지 정보가 필요합니다')
    }

    // 목적지 순서 검증
    const orders = data.destinations.map(d => d.order).sort((a, b) => a - b)
    const expectedOrders = Array.from({length: orders.length}, (_, i) => i + 1)
    if (JSON.stringify(orders) !== JSON.stringify(expectedOrders)) {
      throw new Error('목적지 순서가 올바르지 않습니다')
    }

    // 트랜잭션으로 생성
    const request = await this.prisma.$transaction(async (tx) => {
      // 용차 요청 생성
      const charterRequest = await tx.charterRequest.create({
        data: {
          centerId: data.centerId,
          vehicleType: data.vehicleType,
          date: new Date(data.date),
          isNegotiated: data.isNegotiated,
          negotiatedFare: data.negotiatedFare,
          baseFare: data.baseFare,
          regionFare: data.regionFare,
          stopFare: data.stopFare,
          extraFare: data.extraFare,
          totalFare: data.totalFare,
          driverId: data.driverId,
          driverFare: data.driverFare,
          notes: data.notes,
          createdBy
        }
      })

      // 목적지 생성
      await tx.charterDestination.createMany({
        data: data.destinations.map(dest => ({
          requestId: charterRequest.id,
          region: dest.region,
          order: dest.order
        }))
      })

      return charterRequest
    })

    // 생성된 데이터 다시 조회 (관계 포함)
    return this.getCharterRequestById(request.id) as Promise<CharterRequestResponse>
  }

  /**
   * 용차 요청 수정
   */
  async updateCharterRequest(
    id: string,
    data: UpdateCharterRequestData
  ): Promise<CharterRequestResponse> {
    // 기존 요청 확인
    const existing = await this.prisma.charterRequest.findUnique({
      where: { id },
      include: {
        destinations: true
      }
    })

    if (!existing) {
      throw new Error('용차 요청을 찾을 수 없습니다')
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

    // 기사 변경 시 확인
    if (data.driverId && data.driverId !== existing.driverId) {
      const driver = await this.prisma.driver.findUnique({
        where: { id: data.driverId }
      })

      if (!driver) {
        throw new Error('존재하지 않는 기사입니다')
      }

      if (!driver.isActive) {
        throw new Error('비활성화된 기사입니다')
      }
    }

    // 목적지 검증 (변경되는 경우)
    if (data.destinations) {
      if (data.destinations.length === 0) {
        throw new Error('목적지 정보가 필요합니다')
      }

      const orders = data.destinations.map(d => d.order).sort((a, b) => a - b)
      const expectedOrders = Array.from({length: orders.length}, (_, i) => i + 1)
      if (JSON.stringify(orders) !== JSON.stringify(expectedOrders)) {
        throw new Error('목적지 순서가 올바르지 않습니다')
      }
    }

    // 트랜잭션으로 수정
    await this.prisma.$transaction(async (tx) => {
      // 수정 데이터 준비
      const updateData: Prisma.CharterRequestUpdateInput = {}

      if (data.centerId !== undefined) updateData.center = { connect: { id: data.centerId } }
      if (data.vehicleType !== undefined) updateData.vehicleType = data.vehicleType
      if (data.date !== undefined) updateData.date = new Date(data.date)
      if (data.isNegotiated !== undefined) updateData.isNegotiated = data.isNegotiated
      if (data.negotiatedFare !== undefined) updateData.negotiatedFare = data.negotiatedFare
      if (data.baseFare !== undefined) updateData.baseFare = data.baseFare
      if (data.regionFare !== undefined) updateData.regionFare = data.regionFare
      if (data.stopFare !== undefined) updateData.stopFare = data.stopFare
      if (data.extraFare !== undefined) updateData.extraFare = data.extraFare
      if (data.totalFare !== undefined) updateData.totalFare = data.totalFare
      if (data.driverId !== undefined && data.driverId) updateData.driver = { connect: { id: data.driverId } }
      if (data.driverFare !== undefined) updateData.driverFare = data.driverFare
      if (data.notes !== undefined) updateData.notes = data.notes

      // 용차 요청 수정
      await tx.charterRequest.update({
        where: { id },
        data: updateData
      })

      // 목적지 수정 (변경되는 경우)
      if (data.destinations) {
        // 기존 목적지 삭제
        await tx.charterDestination.deleteMany({
          where: { requestId: id }
        })

        // 새 목적지 생성
        await tx.charterDestination.createMany({
          data: data.destinations.map(dest => ({
            requestId: id,
            region: dest.region,
            order: dest.order
          }))
        })
      }
    })

    // 수정된 데이터 다시 조회
    return this.getCharterRequestById(id) as Promise<CharterRequestResponse>
  }

  /**
   * 용차 요청 삭제
   */
  async deleteCharterRequest(id: string): Promise<void> {
    const existing = await this.prisma.charterRequest.findUnique({
      where: { id }
    })

    if (!existing) {
      throw new Error('용차 요청을 찾을 수 없습니다')
    }

    // 트랜잭션으로 삭제 (Cascade로 목적지도 함께 삭제됨)
    await this.prisma.charterRequest.delete({
      where: { id }
    })
  }

  /**
   * 기사별 용차 요청 조회
   */
  async getCharterRequestsByDriver(driverId: string): Promise<CharterRequestResponse[]> {
    const requests = await this.prisma.charterRequest.findMany({
      where: { driverId },
      include: {
        center: {
          select: {
            id: true,
            centerName: true
          }
        },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleNumber: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true
          }
        },
        destinations: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return requests as CharterRequestResponse[]
  }

  /**
   * 센터별 용차 요청 조회
   */
  async getCharterRequestsByCenter(centerId: string): Promise<CharterRequestResponse[]> {
    const requests = await this.prisma.charterRequest.findMany({
      where: { centerId },
      include: {
        center: {
          select: {
            id: true,
            centerName: true
          }
        },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleNumber: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true
          }
        },
        destinations: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return requests as CharterRequestResponse[]
  }

  /**
   * 용차 요청 통계
   */
  async getCharterRequestStats() {
    const [
      totalRequests,
      negotiatedRequests,
      requestsByVehicleType,
      recentRequests
    ] = await Promise.all([
      this.prisma.charterRequest.count(),
      this.prisma.charterRequest.count({ where: { isNegotiated: true } }),
      this.prisma.charterRequest.groupBy({
        by: ['vehicleType'],
        _count: { vehicleType: true }
      }),
      this.prisma.charterRequest.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 최근 30일
          }
        }
      })
    ])

    return {
      totalRequests,
      negotiatedRequests,
      calculatedRequests: totalRequests - negotiatedRequests,
      requestsByVehicleType: requestsByVehicleType.reduce((acc: any, item: any) => {
        acc[item.vehicleType] = item._count.vehicleType
        return acc
      }, {}),
      recentRequests
    }
  }
}

// Simple quote service for optimistic calculations
export const quoteService = {
  async calculateQuote(data: any, options?: { signal?: AbortSignal }) {
    // Mock implementation for now - replace with actual calculation logic
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return {
      baseFare: 45000,
      regionFare: 5000,
      stopFare: 3000,
      extraFare: 2000,
      totalFare: 55000,
      metadata: {
        baseRegion: null,
        uniqueRegions: data.destinations?.map((d: any) => d.region) || [],
        maxFareRegion: null,
        missingRates: []
      }
    }
  }
}