import { PrismaClient, TripStatus } from '@prisma/client'
import { CreateTripData, UpdateTripData, GetTripsQuery, TripResponse, TripsListResponse, UpdateTripStatusData } from '@/lib/validations/trip'

export class TripService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 운행 목록 조회 (검색, 필터링, 페이지네이션)
   */
  async getTrips(query: GetTripsQuery): Promise<TripsListResponse> {
    const { page, limit, search, status, driverId, vehicleId, routeTemplateId, dateFrom, dateTo, sortBy, sortOrder } = query

    // 검색 조건 구성
    const where: any = {}
    
    if (search) {
      where.OR = [
        { driver: { name: { contains: search, mode: 'insensitive' } } },
        { vehicle: { plateNumber: { contains: search, mode: 'insensitive' } } },
        { routeTemplate: { name: { contains: search, mode: 'insensitive' } } },
        { absenceReason: { contains: search, mode: 'insensitive' } },
        { remarks: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status) {
      where.status = status
    }

    if (driverId) {
      where.driverId = driverId
    }

    if (vehicleId) {
      where.vehicleId = vehicleId
    }

    if (routeTemplateId) {
      where.routeTemplateId = routeTemplateId
    }

    // 날짜 범위 필터
    if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) {
        where.date.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.date.lte = new Date(dateTo)
      }
    }

    // 정렬 조건
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    // 총 개수 조회
    const total = await this.prisma.trip.count({ where })

    // 운행 목록 조회
    const trips = await this.prisma.trip.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        vehicle: {
          select: {
            id: true,
            plateNumber: true,
            vehicleType: true
          }
        },
        routeTemplate: {
          select: {
            id: true,
            name: true,
            loadingPoint: true,
            unloadingPoint: true
          }
        },
        substituteDriver: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    })

    // 페이지네이션 정보
    const totalPages = Math.ceil(total / limit)
    const pagination = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }

    return {
      trips: trips.map(this.formatTripResponse),
      pagination
    }
  }

  /**
   * 운행 상세 조회
   */
  async getTripById(id: string): Promise<TripResponse | null> {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        vehicle: {
          select: {
            id: true,
            plateNumber: true,
            vehicleType: true
          }
        },
        routeTemplate: {
          select: {
            id: true,
            name: true,
            loadingPoint: true,
            unloadingPoint: true
          }
        },
        substituteDriver: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    })

    if (!trip) {
      return null
    }

    return this.formatTripResponse(trip)
  }

  /**
   * 운행 생성
   */
  async createTrip(data: CreateTripData): Promise<TripResponse> {
    // 기사 존재 및 활성화 상태 확인
    const driver = await this.prisma.driver.findUnique({
      where: { id: data.driverId }
    })

    if (!driver) {
      throw new Error('존재하지 않는 기사입니다')
    }

    if (!driver.isActive) {
      throw new Error('비활성화된 기사에게는 운행을 배정할 수 없습니다')
    }

    // 차량 존재 및 활성화 상태 확인
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: data.vehicleId }
    })

    if (!vehicle) {
      throw new Error('존재하지 않는 차량입니다')
    }

    if (!vehicle.isActive) {
      throw new Error('비활성화된 차량으로는 운행할 수 없습니다')
    }

    // 노선 템플릿 확인 (고정 노선인 경우)
    if (data.routeType === 'fixed' && data.routeTemplateId) {
      const routeTemplate = await this.prisma.routeTemplate.findUnique({
        where: { id: data.routeTemplateId }
      })

      if (!routeTemplate) {
        throw new Error('존재하지 않는 노선입니다')
      }

      if (!routeTemplate.isActive) {
        throw new Error('비활성화된 노선으로는 운행할 수 없습니다')
      }
    }

    // 대차 기사 확인 (대차인 경우)
    if (data.status === 'SUBSTITUTE' && data.substituteDriverId) {
      const substituteDriver = await this.prisma.driver.findUnique({
        where: { id: data.substituteDriverId }
      })

      if (!substituteDriver) {
        throw new Error('존재하지 않는 대차 기사입니다')
      }

      if (!substituteDriver.isActive) {
        throw new Error('비활성화된 기사는 대차 기사로 설정할 수 없습니다')
      }
    }

    // 동일 날짜의 기사-차량 조합 중복 확인
    const existingTrip = await this.prisma.trip.findFirst({
      where: {
        date: new Date(data.date),
        driverId: data.driverId,
        vehicleId: data.vehicleId,
        status: { in: ['SCHEDULED', 'COMPLETED'] }
      }
    })

    if (existingTrip) {
      throw new Error('동일 날짜에 같은 기사-차량 조합의 운행이 이미 존재합니다')
    }

    const trip = await this.prisma.trip.create({
      data: {
        ...data,
        date: new Date(data.date)
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        vehicle: {
          select: {
            id: true,
            plateNumber: true,
            vehicleType: true
          }
        },
        routeTemplate: {
          select: {
            id: true,
            name: true,
            loadingPoint: true,
            unloadingPoint: true
          }
        },
        substituteDriver: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    })

    return this.formatTripResponse(trip)
  }

  /**
   * 운행 정보 수정
   */
  async updateTrip(id: string, data: UpdateTripData): Promise<TripResponse> {
    // 운행 존재 확인
    const existingTrip = await this.prisma.trip.findUnique({
      where: { id }
    })

    if (!existingTrip) {
      throw new Error('운행을 찾을 수 없습니다')
    }

    // 완료된 운행은 수정 불가
    if (existingTrip.status === 'COMPLETED') {
      throw new Error('완료된 운행은 수정할 수 없습니다')
    }

    // 기사 변경 시 검증
    if (data.driverId && data.driverId !== existingTrip.driverId) {
      const driver = await this.prisma.driver.findUnique({
        where: { id: data.driverId }
      })

      if (!driver || !driver.isActive) {
        throw new Error('유효하지 않은 기사입니다')
      }
    }

    // 차량 변경 시 검증
    if (data.vehicleId && data.vehicleId !== existingTrip.vehicleId) {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: data.vehicleId }
      })

      if (!vehicle || !vehicle.isActive) {
        throw new Error('유효하지 않은 차량입니다')
      }
    }

    // 노선 템플릿 변경 시 검증
    if (data.routeTemplateId && data.routeTemplateId !== existingTrip.routeTemplateId) {
      const routeTemplate = await this.prisma.routeTemplate.findUnique({
        where: { id: data.routeTemplateId }
      })

      if (!routeTemplate || !routeTemplate.isActive) {
        throw new Error('유효하지 않은 노선입니다')
      }
    }

    // 대차 기사 변경 시 검증
    if (data.substituteDriverId) {
      const substituteDriver = await this.prisma.driver.findUnique({
        where: { id: data.substituteDriverId }
      })

      if (!substituteDriver || !substituteDriver.isActive) {
        throw new Error('유효하지 않은 대차 기사입니다')
      }
    }

    const trip = await this.prisma.trip.update({
      where: { id },
      data,
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        vehicle: {
          select: {
            id: true,
            plateNumber: true,
            vehicleType: true
          }
        },
        routeTemplate: {
          select: {
            id: true,
            name: true,
            loadingPoint: true,
            unloadingPoint: true
          }
        },
        substituteDriver: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    })

    return this.formatTripResponse(trip)
  }

  /**
   * 운행 상태 변경 (결행/대차 처리)
   */
  async updateTripStatus(id: string, data: UpdateTripStatusData): Promise<TripResponse> {
    const existingTrip = await this.prisma.trip.findUnique({
      where: { id }
    })

    if (!existingTrip) {
      throw new Error('운행을 찾을 수 없습니다')
    }

    // 완료된 운행은 상태 변경 불가
    if (existingTrip.status === 'COMPLETED') {
      throw new Error('완료된 운행의 상태는 변경할 수 없습니다')
    }

    // 대차 기사 검증
    if (data.status === 'SUBSTITUTE' && data.substituteDriverId) {
      const substituteDriver = await this.prisma.driver.findUnique({
        where: { id: data.substituteDriverId }
      })

      if (!substituteDriver || !substituteDriver.isActive) {
        throw new Error('유효하지 않은 대차 기사입니다')
      }

      if (data.substituteDriverId === existingTrip.driverId) {
        throw new Error('대차 기사는 원래 기사와 달라야 합니다')
      }
    }

    // 상태별 필드 정리
    const updateData: any = {
      status: data.status,
      remarks: data.remarks
    }

    if (data.status === 'ABSENCE') {
      updateData.absenceReason = data.absenceReason
      updateData.deductionAmount = data.deductionAmount
      // 결행 시 대차 관련 필드 제거
      updateData.substituteDriverId = null
      updateData.substituteFare = null
    } else if (data.status === 'SUBSTITUTE') {
      updateData.substituteDriverId = data.substituteDriverId
      updateData.substituteFare = data.substituteFare
      // 대차 시 결행 관련 필드 제거
      updateData.absenceReason = null
      updateData.deductionAmount = null
    } else {
      // SCHEDULED 또는 COMPLETED 상태인 경우 모든 특수 필드 제거
      updateData.absenceReason = null
      updateData.deductionAmount = null
      updateData.substituteDriverId = null
      updateData.substituteFare = null
    }

    const trip = await this.prisma.trip.update({
      where: { id },
      data: updateData,
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        vehicle: {
          select: {
            id: true,
            plateNumber: true,
            vehicleType: true
          }
        },
        routeTemplate: {
          select: {
            id: true,
            name: true,
            loadingPoint: true,
            unloadingPoint: true
          }
        },
        substituteDriver: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    })

    return this.formatTripResponse(trip)
  }

  /**
   * 운행 삭제 (예정 상태만 가능)
   */
  async deleteTrip(id: string): Promise<void> {
    const existingTrip = await this.prisma.trip.findUnique({
      where: { id }
    })

    if (!existingTrip) {
      throw new Error('운행을 찾을 수 없습니다')
    }

    // 예정 상태의 운행만 삭제 가능
    if (existingTrip.status !== 'SCHEDULED') {
      throw new Error('예정 상태의 운행만 삭제할 수 있습니다')
    }

    await this.prisma.trip.delete({
      where: { id }
    })
  }

  /**
   * 운행 완료 처리
   */
  async completeTrip(id: string): Promise<TripResponse> {
    const existingTrip = await this.prisma.trip.findUnique({
      where: { id }
    })

    if (!existingTrip) {
      throw new Error('운행을 찾을 수 없습니다')
    }

    if (existingTrip.status === 'COMPLETED') {
      throw new Error('이미 완료된 운행입니다')
    }

    if (existingTrip.status === 'ABSENCE') {
      throw new Error('결행된 운행은 완료 처리할 수 없습니다')
    }

    const trip = await this.prisma.trip.update({
      where: { id },
      data: { status: 'COMPLETED' },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        vehicle: {
          select: {
            id: true,
            plateNumber: true,
            vehicleType: true
          }
        },
        routeTemplate: {
          select: {
            id: true,
            name: true,
            loadingPoint: true,
            unloadingPoint: true
          }
        },
        substituteDriver: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    })

    return this.formatTripResponse(trip)
  }

  /**
   * 날짜별 운행 통계
   */
  async getTripStatsByDateRange(dateFrom: string, dateTo: string): Promise<any> {
    const stats = await this.prisma.trip.groupBy({
      by: ['status'],
      where: {
        date: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo)
        }
      },
      _count: {
        id: true
      },
      _sum: {
        driverFare: true,
        billingFare: true
      }
    })

    return stats.reduce((acc, stat) => {
      acc[stat.status] = {
        count: stat._count.id,
        totalDriverFare: stat._sum.driverFare?.toString() || '0',
        totalBillingFare: stat._sum.billingFare?.toString() || '0'
      }
      return acc
    }, {} as any)
  }

  /**
   * 기사별 운행 목록 조회
   */
  async getTripsByDriver(driverId: string, dateFrom?: string, dateTo?: string): Promise<TripResponse[]> {
    const where: any = {
      OR: [
        { driverId },
        { substituteDriverId: driverId }
      ]
    }

    if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) where.date.gte = new Date(dateFrom)
      if (dateTo) where.date.lte = new Date(dateTo)
    }

    const trips = await this.prisma.trip.findMany({
      where,
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        vehicle: {
          select: {
            id: true,
            plateNumber: true,
            vehicleType: true
          }
        },
        routeTemplate: {
          select: {
            id: true,
            name: true,
            loadingPoint: true,
            unloadingPoint: true
          }
        },
        substituteDriver: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      },
      orderBy: { date: 'desc' }
    })

    return trips.map(this.formatTripResponse)
  }

  /**
   * 운행 응답 포맷팅
   */
  private formatTripResponse(trip: any): TripResponse {
    return {
      id: trip.id,
      date: trip.date.toISOString().split('T')[0], // Date only
      routeType: trip.routeType,
      status: trip.status,
      driverFare: trip.driverFare.toString(),
      billingFare: trip.billingFare.toString(),
      absenceReason: trip.absenceReason,
      deductionAmount: trip.deductionAmount?.toString() || null,
      substituteFare: trip.substituteFare?.toString() || null,
      remarks: trip.remarks,
      createdAt: trip.createdAt.toISOString(),
      updatedAt: trip.updatedAt.toISOString(),
      driver: trip.driver,
      vehicle: trip.vehicle,
      routeTemplate: trip.routeTemplate,
      customRoute: trip.customRoute || null,
      substituteDriver: trip.substituteDriver
    }
  }
}