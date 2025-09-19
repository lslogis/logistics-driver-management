import { PrismaClient } from '@prisma/client'
import { CreateDriverData, UpdateDriverData, GetDriversQuery, DriverResponse, DriversListResponse } from '@/lib/validations/driver'

export class DriverService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 기사 목록 조회 (검색, 필터링, 페이지네이션)
   */
  async getDrivers(query: GetDriversQuery): Promise<DriversListResponse> {
    const { page, limit, search, status, isActive, sortBy, sortOrder } = query

    // 검색 조건 구성
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { vehicleNumber: { contains: search, mode: 'insensitive' } }
      ]
    }

    // status 매개변수 처리
    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    // 기존 isActive 매개변수 지원 (하위호환)
    if (isActive !== undefined) {
      where.isActive = isActive
    }

    // 정렬 조건
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    // 총 개수 조회
    const total = await this.prisma.driver.count({ where })

    // 기사 목록 조회 - 목록 테이블에서 요구하는 필드 포함
    const drivers = await this.prisma.driver.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        phone: true,
        vehicleNumber: true,
        businessName: true,
        representative: true,
        businessNumber: true,
        bankName: true,
        accountNumber: true,
        remarks: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
        // _count는 목록에서는 미사용
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
      drivers: drivers.map(this.formatDriverResponse),
      pagination
    }
  }

  /**
   * 기사 상세 조회
   */
  async getDriverById(id: string): Promise<DriverResponse | null> {
    const driver = await this.prisma.driver.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            settlements: true
          }
        }
      }
    })

    if (!driver) {
      return null
    }

    return this.formatDriverResponse(driver)
  }

  /**
   * 기사 생성
   */
  async createDriver(data: CreateDriverData, createdBy?: string): Promise<DriverResponse> {
    // 전화번호 중복 확인
    const existingDriver = await this.prisma.driver.findFirst({
      where: { phone: data.phone }
    })

    if (existingDriver) {
      throw new Error('이미 등록된 전화번호입니다')
    }

    // 사업자번호 중복 확인 (입력된 경우만)
    if (data.businessNumber) {
      const existingBusinessNumber = await this.prisma.driver.findFirst({
        where: { 
          businessNumber: data.businessNumber
        }
      })

      if (existingBusinessNumber) {
        throw new Error('이미 등록된 사업자등록번호입니다')
      }
    }

    const driver = await this.prisma.driver.create({ data })

    return this.formatDriverResponse(driver)
  }

  /**
   * 기사 정보 수정
   */
  async updateDriver(id: string, data: UpdateDriverData): Promise<DriverResponse> {
    // 기사 존재 확인
    const existingDriver = await this.prisma.driver.findUnique({
      where: { id }
    })

    if (!existingDriver) {
      throw new Error('기사를 찾을 수 없습니다')
    }

    // 전화번호 중복 확인 (변경하는 경우만)
    if (data.phone && data.phone !== existingDriver.phone) {
      const phoneExists = await this.prisma.driver.findFirst({
        where: { phone: data.phone }
      })

      if (phoneExists) {
        throw new Error('이미 등록된 전화번호입니다')
      }
    }

    // 사업자번호 중복 확인 (변경하는 경우만)
    if (data.businessNumber && data.businessNumber !== existingDriver.businessNumber) {
      const businessNumberExists = await this.prisma.driver.findFirst({
        where: { 
          businessNumber: data.businessNumber,
          id: { not: id }
        }
      })

      if (businessNumberExists) {
        throw new Error('이미 등록된 사업자등록번호입니다')
      }
    }

    const driver = await this.prisma.driver.update({
      where: { id },
      data
    })

    return this.formatDriverResponse(driver)
  }

  /**
   * 기사 삭제 (소프트 삭제)
   */
  async deleteDriver(id: string): Promise<void> {
    // 기사 존재 확인
    const existingDriver = await this.prisma.driver.findUnique({
      where: { id },
    })

    if (!existingDriver) {
      throw new Error('기사를 찾을 수 없습니다')
    }

    // 관련 데이터 확인 - 용차 요청 및 정산 기록 검사
    const [charterCount, settlementCount] = await Promise.all([
      this.prisma.charterRequest.count({ where: { driverId: id } }),
      this.prisma.settlement.count({ where: { driverId: id } })
    ])

    if (charterCount > 0) {
      throw new Error('용차 요청 기록이 있는 기사는 삭제할 수 없습니다. 비활성화 처리해주세요.')
    }

    if (settlementCount > 0) {
      throw new Error('정산 기록이 있는 기사는 삭제할 수 없습니다. 비활성화 처리해주세요.')
    }

    // 소프트 삭제 (비활성화)
    await this.prisma.driver.update({
      where: { id },
      data: { isActive: false }
    })
  }

  /**
   * 기사 완전 삭제 (하드 삭제)
   */
  async hardDeleteDriver(id: string): Promise<void> {
    const existingDriver = await this.prisma.driver.findUnique({
      where: { id }
    })

    if (!existingDriver) {
      throw new Error('기사를 찾을 수 없습니다')
    }

    // 하드 삭제 - DB에서 완전 제거
    await this.prisma.driver.delete({
      where: { id }
    })
  }

  /**
   * 기사 활성화
   */
  async activateDriver(id: string): Promise<DriverResponse> {
    const driver = await this.prisma.driver.findUnique({
      where: { id }
    })

    if (!driver) {
      throw new Error('기사를 찾을 수 없습니다')
    }

    if (driver.isActive) {
      return this.formatDriverResponse(driver)
    }

    const updatedDriver = await this.prisma.driver.update({
      where: { id },
      data: { isActive: true }
    })

    return this.formatDriverResponse(updatedDriver)
  }

  /**
   * 기사 활성화/비활성화
   */
  async toggleDriverStatus(id: string): Promise<DriverResponse> {
    const driver = await this.prisma.driver.findUnique({
      where: { id }
    })

    if (!driver) {
      throw new Error('기사를 찾을 수 없습니다')
    }

    const updatedDriver = await this.prisma.driver.update({
      where: { id },
      data: { isActive: !driver.isActive }
    })

    return this.formatDriverResponse(updatedDriver)
  }

  /**
   * 기사 검색 (간단한 자동완성용)
   */
  async searchDrivers(query: string, limit = 10): Promise<Pick<DriverResponse, 'id' | 'name' | 'phone'>[]> {
    const drivers = await this.prisma.driver.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } }
        ]
      },
      select: {
        id: true,
        name: true,
        phone: true
      },
      take: limit,
      orderBy: { name: 'asc' }
    })

    return drivers
  }

  /**
   * 기사 응답 포맷팅
   */
  private formatDriverResponse(driver: any): DriverResponse {
    return {
      id: driver.id,
      name: driver.name,
      phone: driver.phone,
      vehicleNumber: driver.vehicleNumber,
      businessName: driver.businessName,
      representative: driver.representative,
      businessNumber: driver.businessNumber,
      bankName: driver.bankName,
      accountNumber: driver.accountNumber,
      remarks: driver.remarks,
      isActive: driver.isActive,
      createdAt: driver.createdAt.toISOString(),
      updatedAt: driver.updatedAt.toISOString(),
      _count: driver._count ?? undefined
    }
  }
}
