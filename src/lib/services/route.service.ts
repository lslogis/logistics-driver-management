import { PrismaClient } from '@prisma/client'
import { CreateRouteData, UpdateRouteData, GetRoutesQuery, RouteResponse, RoutesListResponse } from '@/lib/validations/route'

export class RouteService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 노선 목록 조회 (검색, 필터링, 페이지네이션)
   */
  async getRoutes(query: GetRoutesQuery): Promise<RoutesListResponse> {
    const { page, limit, search, isActive, defaultDriverId, weekday, sortBy, sortOrder } = query

    // 검색 조건 구성
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { loadingPoint: { contains: search, mode: 'insensitive' } },
        { unloadingPoint: { contains: search, mode: 'insensitive' } },
        { defaultDriver: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    if (isActive !== undefined) {
      where.isActive = isActive
    }

    if (defaultDriverId) {
      where.defaultDriverId = defaultDriverId
    }

    // 특정 요일에 운행하는 노선 필터
    if (weekday !== undefined) {
      where.weekdayPattern = {
        has: weekday
      }
    }

    // 정렬 조건
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    // 총 개수 조회
    const total = await this.prisma.routeTemplate.count({ where })

    // 노선 목록 조회
    const routes = await this.prisma.routeTemplate.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        defaultDriver: {
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
      routes: routes.map(this.formatRouteResponse),
      pagination
    }
  }

  /**
   * 노선 상세 조회
   */
  async getRouteById(id: string): Promise<RouteResponse | null> {
    const route = await this.prisma.routeTemplate.findUnique({
      where: { id },
      include: {
        defaultDriver: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    })

    if (!route) {
      return null
    }

    return this.formatRouteResponse(route)
  }

  /**
   * 노선 생성
   */
  async createRoute(data: CreateRouteData): Promise<RouteResponse> {
    // 노선명 중복 확인
    const existingRoute = await this.prisma.routeTemplate.findUnique({
      where: { name: data.name }
    })

    if (existingRoute) {
      throw new Error('이미 등록된 노선명입니다')
    }

    // 기본 기사 ID가 제공된 경우 해당 기사가 존재하고 활성화되어 있는지 확인
    if (data.defaultDriverId) {
      const driver = await this.prisma.driver.findUnique({
        where: { id: data.defaultDriverId }
      })

      if (!driver) {
        throw new Error('존재하지 않는 기사입니다')
      }

      if (!driver.isActive) {
        throw new Error('비활성화된 기사는 기본 기사로 설정할 수 없습니다')
      }
    }

    const route = await this.prisma.routeTemplate.create({
      data,
      include: {
        defaultDriver: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    })

    return this.formatRouteResponse(route)
  }

  /**
   * 노선 정보 수정
   */
  async updateRoute(id: string, data: UpdateRouteData): Promise<RouteResponse> {
    // 노선 존재 확인
    const existingRoute = await this.prisma.routeTemplate.findUnique({
      where: { id }
    })

    if (!existingRoute) {
      throw new Error('노선을 찾을 수 없습니다')
    }

    // 노선명 중복 확인 (변경하는 경우만)
    if (data.name && data.name !== existingRoute.name) {
      const nameExists = await this.prisma.routeTemplate.findUnique({
        where: { name: data.name }
      })

      if (nameExists) {
        throw new Error('이미 등록된 노선명입니다')
      }
    }

    // 기본 기사 ID가 제공된 경우 해당 기사가 존재하고 활성화되어 있는지 확인
    if (data.defaultDriverId) {
      const driver = await this.prisma.driver.findUnique({
        where: { id: data.defaultDriverId }
      })

      if (!driver) {
        throw new Error('존재하지 않는 기사입니다')
      }

      if (!driver.isActive) {
        throw new Error('비활성화된 기사는 기본 기사로 설정할 수 없습니다')
      }
    }

    const route = await this.prisma.routeTemplate.update({
      where: { id },
      data,
      include: {
        defaultDriver: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    })

    return this.formatRouteResponse(route)
  }

  /**
   * 노선 삭제 (소프트 삭제)
   */
  async deleteRoute(id: string): Promise<void> {
    // 노선 존재 확인
    const existingRoute = await this.prisma.routeTemplate.findUnique({
      where: { id }
    })

    if (!existingRoute) {
      throw new Error('노선을 찾을 수 없습니다')
    }

    // 고정 계약이 있는지 확인
    const contractCount = await this.prisma.fixedContract.count({
      where: { 
        loadingPointId: existingRoute.loadingPointId || '',
        isActive: true
      }
    })

    if (contractCount > 0) {
      throw new Error('활성 계약이 있는 노선은 삭제할 수 없습니다. 비활성화 처리해주세요.')
    }

    // 소프트 삭제 (비활성화)
    await this.prisma.routeTemplate.update({
      where: { id },
      data: { 
        isActive: false,
        defaultDriverId: null // 기본 기사 배정 해제
      }
    })
  }

  /**
   * 노선 활성화/비활성화
   */
  async toggleRouteStatus(id: string): Promise<RouteResponse> {
    const route = await this.prisma.routeTemplate.findUnique({
      where: { id }
    })

    if (!route) {
      throw new Error('노선을 찾을 수 없습니다')
    }

    const updatedRoute = await this.prisma.routeTemplate.update({
      where: { id },
      data: { 
        isActive: !route.isActive,
        // 비활성화하는 경우 기본 기사 배정 해제
        ...(route.isActive && { defaultDriverId: null })
      },
      include: {
        defaultDriver: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    })

    return this.formatRouteResponse(updatedRoute)
  }

  /**
   * 노선에 기본 기사 배정
   */
  async assignDefaultDriverToRoute(routeId: string, driverId: string): Promise<RouteResponse> {
    // 노선 존재 및 활성화 상태 확인
    const route = await this.prisma.routeTemplate.findUnique({
      where: { id: routeId }
    })

    if (!route) {
      throw new Error('노선을 찾을 수 없습니다')
    }

    if (!route.isActive) {
      throw new Error('비활성화된 노선에는 기사를 배정할 수 없습니다')
    }

    // 기사 존재 및 활성화 상태 확인
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId }
    })

    if (!driver) {
      throw new Error('기사를 찾을 수 없습니다')
    }

    if (!driver.isActive) {
      throw new Error('비활성화된 기사는 기본 기사로 설정할 수 없습니다')
    }

    const updatedRoute = await this.prisma.routeTemplate.update({
      where: { id: routeId },
      data: { defaultDriverId: driverId },
      include: {
        defaultDriver: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    })

    return this.formatRouteResponse(updatedRoute)
  }

  /**
   * 노선에서 기본 기사 배정 해제
   */
  async unassignDefaultDriverFromRoute(routeId: string): Promise<RouteResponse> {
    const route = await this.prisma.routeTemplate.findUnique({
      where: { id: routeId }
    })

    if (!route) {
      throw new Error('노선을 찾을 수 없습니다')
    }

    const updatedRoute = await this.prisma.routeTemplate.update({
      where: { id: routeId },
      data: { defaultDriverId: null },
      include: {
        defaultDriver: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    })

    return this.formatRouteResponse(updatedRoute)
  }

  /**
   * 특정 요일에 운행하는 노선 조회
   */
  async getRoutesByWeekday(weekday: number, activeOnly = true): Promise<RouteResponse[]> {
    const where: any = {
      weekdayPattern: {
        has: weekday
      }
    }

    if (activeOnly) {
      where.isActive = true
    }

    const routes = await this.prisma.routeTemplate.findMany({
      where,
      include: {
        defaultDriver: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return routes.map(this.formatRouteResponse)
  }

  /**
   * 노선 검색 (간단한 자동완성용)
   */
  async searchRoutes(query: string, limit = 10): Promise<Pick<RouteResponse, 'id' | 'name' | 'loadingPoint'>[]> {
    const routes = await this.prisma.routeTemplate.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { loadingPoint: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        loadingPoint: true
      },
      take: limit,
      orderBy: { name: 'asc' }
    })

    return routes
  }

  /**
   * 노선 응답 포맷팅
   */
  private formatRouteResponse(route: any): RouteResponse {
    return {
      id: route.id,
      name: route.name,
      loadingPoint: route.loadingPoint,
      distance: route.distance,
      driverFare: route.driverFare.toString(),
      billingFare: route.billingFare.toString(),
      weekdayPattern: route.weekdayPattern,
      isActive: route.isActive,
      createdAt: route.createdAt.toISOString(),
      updatedAt: route.updatedAt.toISOString(),
      defaultDriver: route.defaultDriver,
      _count: route._count || {}
    }
  }
}