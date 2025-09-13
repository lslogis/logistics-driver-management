import { PrismaClient } from '@prisma/client'
import { 
  CreateFixedRouteData, 
  UpdateFixedRouteData, 
  GetFixedRoutesQuery,
  FixedRouteResponse, 
  FixedRoutesListResponse 
} from '@/lib/validations/fixedRoute'

// CUID 생성 함수
function createId() {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substr(2, 8)
  return `fr_${timestamp}_${randomStr}`
}

export class FixedRouteService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 고정노선 목록 조회 (검색, 필터링, 페이지네이션)
   */
  async getFixedRoutes(query: GetFixedRoutesQuery): Promise<FixedRoutesListResponse> {
    const { page, limit, search, isActive, contractType, assignedDriverId, weekday, sortBy, sortOrder } = query

    // 검색 조건 구성
    const where: any = {}
    
    if (search) {
      where.OR = [
        { routeName: { contains: search, mode: 'insensitive' } },
        { loading_points: { centerName: { contains: search, mode: 'insensitive' } } },
        { loading_points: { loadingPointName: { contains: search, mode: 'insensitive' } } },
        { drivers: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    if (isActive !== undefined) {
      where.isActive = isActive
    }

    if (contractType) {
      where.contractType = contractType
    }

    if (assignedDriverId) {
      where.assignedDriverId = assignedDriverId
    }

    if (weekday !== undefined) {
      where.weekdayPattern = {
        has: weekday
      }
    }

    // 정렬 조건
    const orderBy: any = {}
    if (sortBy === 'centerName') {
      orderBy.loading_points = { centerName: sortOrder }
    } else {
      orderBy[sortBy] = sortOrder
    }

    // 총 개수 조회
    const total = await this.prisma.fixedRoute.count({ where })

    // 고정노선 목록 조회
    const fixedRoutes = await this.prisma.fixedRoute.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        drivers: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleNumber: true,
          }
        },
        loading_points: {
          select: {
            id: true,
            centerName: true,
            loadingPointName: true,
          }
        },
        users: {
          select: {
            id: true,
            name: true,
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
      fixedRoutes: fixedRoutes.map(this.formatFixedRouteResponse),
      pagination
    }
  }

  /**
   * 고정노선 상세 조회
   */
  async getFixedRouteById(id: string): Promise<FixedRouteResponse | null> {
    const fixedRoute = await this.prisma.fixedRoute.findUnique({
      where: { id },
      include: {
        drivers: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleNumber: true,
          }
        },
        loading_points: {
          select: {
            id: true,
            centerName: true,
            loadingPointName: true,
          }
        },
        users: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    if (!fixedRoute) {
      return null
    }

    return this.formatFixedRouteResponse(fixedRoute)
  }

  /**
   * 고정노선 생성
   */
  async createFixedRoute(data: CreateFixedRouteData, createdBy?: string): Promise<FixedRouteResponse> {
    // 노선명 중복 확인
    const existingRoute = await this.prisma.fixedRoute.findFirst({
      where: {
        routeName: data.routeName,
        isActive: true
      }
    })

    if (existingRoute) {
      throw new Error('이미 등록된 노선명입니다')
    }

    // 기사 중복 배정 체크 (같은 요일에 이미 다른 노선에 배정된 기사인지)
    if (data.assignedDriverId && data.weekdayPattern) {
      const conflictRoute = await this.prisma.fixedRoute.findFirst({
        where: {
          assignedDriverId: data.assignedDriverId,
          isActive: true,
          weekdayPattern: {
            hasSome: data.weekdayPattern
          }
        }
      })

      if (conflictRoute) {
        throw new Error('해당 기사는 같은 요일에 이미 다른 노선에 배정되어 있습니다')
      }
    }

    // 상차지 존재 확인
    const loadingPoint = await this.prisma.loadingPoint.findUnique({
      where: { id: data.loadingPointId }
    })

    if (!loadingPoint) {
      throw new Error('상차지를 찾을 수 없습니다')
    }

    // 기사 존재 확인 (배정된 경우만)
    if (data.assignedDriverId) {
      const driver = await this.prisma.driver.findUnique({
        where: { id: data.assignedDriverId }
      })

      if (!driver) {
        throw new Error('배정기사를 찾을 수 없습니다')
      }
    }

    // 고정노선 생성 데이터 준비
    const now = new Date()
    const createData: any = {
      id: createId(),
      routeName: data.routeName,
      loadingPointId: data.loadingPointId,
      assignedDriverId: data.assignedDriverId || null,
      contractType: data.contractType,
      weekdayPattern: data.weekdayPattern,
      remarks: data.remarks || null,
      isActive: true,
      createdBy: null, // 임시로 null 설정
      createdAt: now,
      updatedAt: now
    }

    // 수익/비용 필드 추가 (실제 DB 스키마 기준)
    if (data.revenueMonthlyWithExpense !== undefined) {
      createData.revenueMonthlyWithExpense = data.revenueMonthlyWithExpense
    }
    if (data.revenueDaily !== undefined) {
      createData.revenueDaily = data.revenueDaily
    }
    if (data.revenueMonthly !== undefined) {
      createData.revenueMonthly = data.revenueMonthly
    }
    if (data.costMonthlyWithExpense !== undefined) {
      createData.costMonthlyWithExpense = data.costMonthlyWithExpense
    }
    if (data.costDaily !== undefined) {
      createData.costDaily = data.costDaily
    }
    if (data.costMonthly !== undefined) {
      createData.costMonthly = data.costMonthly
    }

    const fixedRoute = await this.prisma.fixedRoute.create({
      data: createData,
      include: {
        drivers: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleNumber: true,
          }
        },
        loading_points: {
          select: {
            id: true,
            centerName: true,
            loadingPointName: true,
          }
        },
        users: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    return this.formatFixedRouteResponse(fixedRoute)
  }

  /**
   * 고정노선 정보 수정
   */
  async updateFixedRoute(id: string, data: UpdateFixedRouteData): Promise<FixedRouteResponse> {
    // 고정노선 존재 확인
    const existingRoute = await this.prisma.fixedRoute.findUnique({
      where: { id }
    })

    if (!existingRoute) {
      throw new Error('고정노선을 찾을 수 없습니다')
    }

    // 노선명 중복 확인 (변경하는 경우만)
    if (data.routeName && data.routeName !== existingRoute.routeName) {
      const nameExists = await this.prisma.fixedRoute.findFirst({
        where: {
          routeName: data.routeName,
          isActive: true,
          id: { not: id }
        }
      })

      if (nameExists) {
        throw new Error('이미 등록된 노선명입니다')
      }
    }

    // 기사 중복 배정 체크
    if (data.assignedDriverId && data.weekdayPattern) {
      const conflictRoute = await this.prisma.fixedRoute.findFirst({
        where: {
          assignedDriverId: data.assignedDriverId,
          isActive: true,
          weekdayPattern: {
            hasSome: data.weekdayPattern
          },
          id: { not: id }
        }
      })

      if (conflictRoute) {
        throw new Error('해당 기사는 같은 요일에 이미 다른 노선에 배정되어 있습니다')
      }
    }

    // 수정 데이터 준비
    const updateData: any = {
      updatedAt: new Date()
    }

    if (data.routeName !== undefined) updateData.routeName = data.routeName
    if (data.loadingPointId !== undefined) updateData.loadingPointId = data.loadingPointId
    if (data.assignedDriverId !== undefined) updateData.assignedDriverId = data.assignedDriverId
    if (data.weekdayPattern !== undefined) updateData.weekdayPattern = data.weekdayPattern
    if (data.contractType !== undefined) updateData.contractType = data.contractType
    if (data.remarks !== undefined) updateData.remarks = data.remarks

    // 수익/비용 필드 업데이트 (실제 DB 스키마 기준)
    if (data.revenueMonthlyWithExpense !== undefined) {
      updateData.revenueMonthlyWithExpense = data.revenueMonthlyWithExpense
    }
    if (data.revenueDaily !== undefined) {
      updateData.revenueDaily = data.revenueDaily
    }
    if (data.revenueMonthly !== undefined) {
      updateData.revenueMonthly = data.revenueMonthly
    }
    if (data.costMonthlyWithExpense !== undefined) {
      updateData.costMonthlyWithExpense = data.costMonthlyWithExpense
    }
    if (data.costDaily !== undefined) {
      updateData.costDaily = data.costDaily
    }
    if (data.costMonthly !== undefined) {
      updateData.costMonthly = data.costMonthly
    }

    // 상차지 존재 확인 (변경하는 경우만)
    if (data.loadingPointId) {
      const loadingPoint = await this.prisma.loadingPoint.findUnique({
        where: { id: data.loadingPointId }
      })

      if (!loadingPoint) {
        throw new Error('상차지를 찾을 수 없습니다')
      }
    }

    // 기사 존재 확인 (변경하는 경우만)
    if (data.assignedDriverId) {
      const driver = await this.prisma.driver.findUnique({
        where: { id: data.assignedDriverId }
      })

      if (!driver) {
        throw new Error('배정기사를 찾을 수 없습니다')
      }
    }

    const fixedRoute = await this.prisma.fixedRoute.update({
      where: { id },
      data: updateData,
      include: {
        drivers: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleNumber: true,
          }
        },
        loading_points: {
          select: {
            id: true,
            centerName: true,
            loadingPointName: true,
          }
        },
        users: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    return this.formatFixedRouteResponse(fixedRoute)
  }

  /**
   * 고정노선 삭제 (소프트 삭제)
   */
  async deleteFixedRoute(id: string): Promise<void> {
    // 고정노선 존재 확인
    const existingRoute = await this.prisma.fixedRoute.findUnique({
      where: { id }
    })

    if (!existingRoute) {
      throw new Error('고정노선을 찾을 수 없습니다')
    }

    // 소프트 삭제 (비활성화)
    await this.prisma.fixedRoute.update({
      where: { id },
      data: { 
        isActive: false,
        updatedAt: new Date()
      }
    })
  }

  /**
   * 고정노선 완전 삭제 (하드 삭제)
   */
  async hardDeleteFixedRoute(id: string): Promise<void> {
    const existingRoute = await this.prisma.fixedRoute.findUnique({
      where: { id }
    })

    if (!existingRoute) {
      throw new Error('고정노선을 찾을 수 없습니다')
    }

    // 하드 삭제 - DB에서 완전 제거
    await this.prisma.fixedRoute.delete({
      where: { id }
    })
  }

  /**
   * 고정노선 활성화/비활성화
   */
  async toggleFixedRouteStatus(id: string): Promise<FixedRouteResponse> {
    const fixedRoute = await this.prisma.fixedRoute.findUnique({
      where: { id }
    })

    if (!fixedRoute) {
      throw new Error('고정노선을 찾을 수 없습니다')
    }

    const updatedRoute = await this.prisma.fixedRoute.update({
      where: { id },
      data: { 
        isActive: !fixedRoute.isActive,
        updatedAt: new Date()
      },
      include: {
        drivers: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleNumber: true,
          }
        },
        loading_points: {
          select: {
            id: true,
            centerName: true,
            loadingPointName: true,
          }
        },
        users: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    return this.formatFixedRouteResponse(updatedRoute)
  }

  /**
   * 고정노선 활성화
   */
  async activateFixedRoute(id: string): Promise<FixedRouteResponse> {
    const fixedRoute = await this.prisma.fixedRoute.findUnique({
      where: { id }
    })

    if (!fixedRoute) {
      throw new Error('고정노선을 찾을 수 없습니다')
    }

    if (fixedRoute.isActive) {
      // 이미 활성화된 경우 현재 상태 그대로 반환
      const current = await this.prisma.fixedRoute.findUnique({
        where: { id },
        include: {
          drivers: {
            select: {
              id: true,
              name: true,
              phone: true,
              vehicleNumber: true,
            }
          },
          loading_points: {
            select: {
              id: true,
              centerName: true,
              loadingPointName: true,
            }
          },
          users: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      })
      return this.formatFixedRouteResponse(current!)
    }

    const updatedRoute = await this.prisma.fixedRoute.update({
      where: { id },
      data: { 
        isActive: true,
        updatedAt: new Date()
      },
      include: {
        drivers: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleNumber: true,
          }
        },
        loading_points: {
          select: {
            id: true,
            centerName: true,
            loadingPointName: true,
          }
        },
        users: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    return this.formatFixedRouteResponse(updatedRoute)
  }

  /**
   * 고정노선 검색 (간단한 자동완성용)
   */
  async searchFixedRoutes(query: string, limit = 10): Promise<Pick<FixedRouteResponse, 'id' | 'routeName' | 'centerName'>[]> {
    const fixedRoutes = await this.prisma.fixedRoute.findMany({
      where: {
        isActive: true,
        OR: [
          { routeName: { contains: query, mode: 'insensitive' } },
          { loading_points: { centerName: { contains: query, mode: 'insensitive' } } }
        ]
      },
      select: {
        id: true,
        routeName: true,
        loading_points: {
          select: {
            centerName: true
          }
        }
      },
      take: limit,
      orderBy: { routeName: 'asc' }
    })

    return fixedRoutes.map(route => ({
      id: route.id,
      routeName: route.routeName,
      centerName: route.loading_points?.centerName || ''
    }))
  }

  /**
   * 일괄 활성화/비활성화
   */
  async bulkUpdateStatus(ids: string[], isActive: boolean): Promise<{ count: number }> {
    // 존재하는 고정노선들 확인
    const existingRoutes = await this.prisma.fixedRoute.findMany({
      where: { id: { in: ids } },
      select: { id: true }
    })

    if (existingRoutes.length !== ids.length) {
      throw new Error('일부 고정노선을 찾을 수 없습니다')
    }

    const result = await this.prisma.fixedRoute.updateMany({
      where: { id: { in: ids } },
      data: { 
        isActive,
        updatedAt: new Date()
      }
    })

    return { count: result.count }
  }

  /**
   * 일괄 하드 삭제
   */
  async bulkHardDelete(ids: string[]): Promise<{ count: number }> {
    // 존재하는 고정노선들 확인
    const existingRoutes = await this.prisma.fixedRoute.findMany({
      where: { id: { in: ids } },
      select: { id: true }
    })

    if (existingRoutes.length !== ids.length) {
      throw new Error('일부 고정노선을 찾을 수 없습니다')
    }

    const result = await this.prisma.fixedRoute.deleteMany({
      where: { id: { in: ids } }
    })

    return { count: result.count }
  }

  /**
   * 고정노선 응답 포맷팅 (실제 DB 스키마 기반)
   */
  private formatFixedRouteResponse(fixedRoute: any): FixedRouteResponse {
    return {
      id: fixedRoute.id,
      routeName: fixedRoute.routeName,
      loadingPointId: fixedRoute.loadingPointId,
      assignedDriverId: fixedRoute.assignedDriverId,
      weekdayPattern: fixedRoute.weekdayPattern,
      contractType: fixedRoute.contractType,
      revenueMonthlyWithExpense: fixedRoute.revenueMonthlyWithExpense,
      revenueDaily: fixedRoute.revenueDaily,
      revenueMonthly: fixedRoute.revenueMonthly,
      costMonthlyWithExpense: fixedRoute.costMonthlyWithExpense,
      costDaily: fixedRoute.costDaily,
      costMonthly: fixedRoute.costMonthly,
      remarks: fixedRoute.remarks,
      isActive: fixedRoute.isActive,
      createdAt: fixedRoute.createdAt.toISOString(),
      updatedAt: fixedRoute.updatedAt.toISOString(),
      createdBy: fixedRoute.createdBy,
      
      // 관계 데이터 (실제 관계명 사용)
      loading_points: fixedRoute.loading_points,
      drivers: fixedRoute.drivers,
      users: fixedRoute.users,
      
      // 계산된 필드들 (UI 편의용)
      centerName: fixedRoute.loading_points?.centerName,
      loadingPointName: fixedRoute.loading_points?.loadingPointName,
      assignedDriverName: fixedRoute.drivers?.name,
      driverPhone: fixedRoute.drivers?.phone,
      vehicleNumber: fixedRoute.drivers?.vehicleNumber,
    }
  }
}