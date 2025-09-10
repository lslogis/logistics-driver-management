import { PrismaClient } from '@prisma/client'
import { CreateVehicleData, UpdateVehicleData, GetVehiclesQuery, VehicleResponse, VehiclesListResponse } from '@/lib/validations/vehicle'

export class VehicleService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 차량 목록 조회 (검색, 필터링, 페이지네이션)
   */
  async getVehicles(query: GetVehiclesQuery): Promise<VehiclesListResponse> {
    const { page, limit, search, vehicleType, ownership, isActive, driverId, sortBy, sortOrder } = query

    // 검색 조건 구성
    const where: any = {}
    
    if (search) {
      where.OR = [
        { plateNumber: { contains: search, mode: 'insensitive' } },
        { vehicleType: { contains: search, mode: 'insensitive' } },
        { driver: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    if (vehicleType) {
      where.vehicleType = vehicleType
    }

    if (ownership) {
      where.ownership = ownership
    }

    if (isActive !== undefined) {
      where.isActive = isActive
    }

    if (driverId) {
      where.driverId = driverId
    }

    // 정렬 조건
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    // 총 개수 조회
    const total = await this.prisma.vehicle.count({ where })

    // 차량 목록 조회
    const vehicles = await this.prisma.vehicle.findMany({
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
        _count: {
          select: {
            trips: true
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
      vehicles: vehicles.map(this.formatVehicleResponse),
      pagination
    }
  }

  /**
   * 차량 상세 조회
   */
  async getVehicleById(id: string): Promise<VehicleResponse | null> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        _count: {
          select: {
            trips: true
          }
        }
      }
    })

    if (!vehicle) {
      return null
    }

    return this.formatVehicleResponse(vehicle)
  }

  /**
   * 차량 생성
   */
  async createVehicle(data: CreateVehicleData): Promise<VehicleResponse> {
    // 차량번호 중복 확인
    const existingVehicle = await this.prisma.vehicle.findUnique({
      where: { plateNumber: data.plateNumber }
    })

    if (existingVehicle) {
      throw new Error('이미 등록된 차량번호입니다')
    }

    // 기사 ID가 제공된 경우 해당 기사가 존재하고 활성화되어 있는지 확인
    if (data.driverId) {
      const driver = await this.prisma.driver.findUnique({
        where: { id: data.driverId }
      })

      if (!driver) {
        throw new Error('존재하지 않는 기사입니다')
      }

      if (!driver.isActive) {
        throw new Error('비활성화된 기사에게는 차량을 배정할 수 없습니다')
      }
    }

    const vehicle = await this.prisma.vehicle.create({
      data,
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        _count: {
          select: {
            trips: true
          }
        }
      }
    })

    return this.formatVehicleResponse(vehicle)
  }

  /**
   * 차량 정보 수정
   */
  async updateVehicle(id: string, data: UpdateVehicleData): Promise<VehicleResponse> {
    // 차량 존재 확인
    const existingVehicle = await this.prisma.vehicle.findUnique({
      where: { id }
    })

    if (!existingVehicle) {
      throw new Error('차량을 찾을 수 없습니다')
    }

    // 차량번호 중복 확인 (변경하는 경우만)
    if (data.plateNumber && data.plateNumber !== existingVehicle.plateNumber) {
      const plateNumberExists = await this.prisma.vehicle.findUnique({
        where: { plateNumber: data.plateNumber }
      })

      if (plateNumberExists) {
        throw new Error('이미 등록된 차량번호입니다')
      }
    }

    // 기사 ID가 제공된 경우 해당 기사가 존재하고 활성화되어 있는지 확인
    if (data.driverId) {
      const driver = await this.prisma.driver.findUnique({
        where: { id: data.driverId }
      })

      if (!driver) {
        throw new Error('존재하지 않는 기사입니다')
      }

      if (!driver.isActive) {
        throw new Error('비활성화된 기사에게는 차량을 배정할 수 없습니다')
      }
    }

    const vehicle = await this.prisma.vehicle.update({
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
        _count: {
          select: {
            trips: true
          }
        }
      }
    })

    return this.formatVehicleResponse(vehicle)
  }

  /**
   * 차량 삭제 (소프트 삭제)
   */
  async deleteVehicle(id: string): Promise<void> {
    // 차량 존재 확인
    const existingVehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        trips: {
          where: {
            status: { in: ['SCHEDULED', 'COMPLETED'] }
          }
        }
      }
    })

    if (!existingVehicle) {
      throw new Error('차량을 찾을 수 없습니다')
    }

    // 관련 데이터 확인
    if (existingVehicle.trips.length > 0) {
      throw new Error('운행 기록이 있는 차량은 삭제할 수 없습니다. 비활성화 처리해주세요.')
    }

    // 소프트 삭제 (비활성화)
    await this.prisma.vehicle.update({
      where: { id },
      data: { 
        isActive: false,
        driverId: null // 기사 배정 해제
      }
    })
  }

  /**
   * 차량 활성화/비활성화
   */
  async toggleVehicleStatus(id: string): Promise<VehicleResponse> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id }
    })

    if (!vehicle) {
      throw new Error('차량을 찾을 수 없습니다')
    }

    const updatedVehicle = await this.prisma.vehicle.update({
      where: { id },
      data: { 
        isActive: !vehicle.isActive,
        // 비활성화하는 경우 기사 배정 해제
        ...(vehicle.isActive && { driverId: null })
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        _count: {
          select: {
            trips: true
          }
        }
      }
    })

    return this.formatVehicleResponse(updatedVehicle)
  }

  /**
   * 기사에게 차량 배정
   */
  async assignDriverToVehicle(vehicleId: string, driverId: string): Promise<VehicleResponse> {
    // 차량 존재 및 활성화 상태 확인
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId }
    })

    if (!vehicle) {
      throw new Error('차량을 찾을 수 없습니다')
    }

    if (!vehicle.isActive) {
      throw new Error('비활성화된 차량에는 기사를 배정할 수 없습니다')
    }

    // 기사 존재 및 활성화 상태 확인
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId }
    })

    if (!driver) {
      throw new Error('기사를 찾을 수 없습니다')
    }

    if (!driver.isActive) {
      throw new Error('비활성화된 기사에게는 차량을 배정할 수 없습니다')
    }

    const updatedVehicle = await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: { driverId },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        _count: {
          select: {
            trips: true
          }
        }
      }
    })

    return this.formatVehicleResponse(updatedVehicle)
  }

  /**
   * 차량에서 기사 배정 해제
   */
  async unassignDriverFromVehicle(vehicleId: string): Promise<VehicleResponse> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId }
    })

    if (!vehicle) {
      throw new Error('차량을 찾을 수 없습니다')
    }

    const updatedVehicle = await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: { driverId: null },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        _count: {
          select: {
            trips: true
          }
        }
      }
    })

    return this.formatVehicleResponse(updatedVehicle)
  }

  /**
   * 차량 검색 (간단한 자동완성용)
   */
  async searchVehicles(query: string, limit = 10): Promise<Pick<VehicleResponse, 'id' | 'plateNumber' | 'vehicleType' | 'ownership'>[]> {
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        isActive: true,
        plateNumber: { contains: query, mode: 'insensitive' }
      },
      select: {
        id: true,
        plateNumber: true,
        vehicleType: true,
        ownership: true
      },
      take: limit,
      orderBy: { plateNumber: 'asc' }
    })

    return vehicles
  }

  /**
   * 차량 응답 포맷팅
   */
  private formatVehicleResponse(vehicle: any): VehicleResponse {
    return {
      id: vehicle.id,
      plateNumber: vehicle.plateNumber,
      vehicleType: vehicle.vehicleType,
      ownership: vehicle.ownership,
      year: vehicle.year,
      capacity: vehicle.capacity,
      isActive: vehicle.isActive,
      createdAt: vehicle.createdAt.toISOString(),
      updatedAt: vehicle.updatedAt.toISOString(),
      driver: vehicle.driver,
      _count: vehicle._count
    }
  }
}