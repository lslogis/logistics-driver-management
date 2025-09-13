import { PrismaClient } from '@prisma/client'
import { 
  CreateLoadingPointData, 
  UpdateLoadingPointData, 
  GetLoadingPointsQuery,
  LoadingPointSuggestionsQuery,
  LoadingPointResponse, 
  LoadingPointsListResponse,
  LoadingPointSuggestionResponse
} from '@/lib/validations/loading-point'

export class LoadingPointService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 상차지 목록 조회 (검색, 필터링, 페이지네이션)
   */
  async getLoadingPoints(query: GetLoadingPointsQuery): Promise<LoadingPointsListResponse> {
    const { page, limit, search, isActive, sortBy, sortOrder } = query

    // 검색 조건 구성
    const where: any = {}
    
    if (search) {
      where.OR = [
        { centerName: { contains: search, mode: 'insensitive' } },
        { loadingPointName: { contains: search, mode: 'insensitive' } },
        { lotAddress: { contains: search, mode: 'insensitive' } },
        { roadAddress: { contains: search, mode: 'insensitive' } },
        { manager1: { contains: search, mode: 'insensitive' } },
        { manager2: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (isActive !== undefined) {
      where.isActive = isActive
    }

    // 정렬 조건
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    // 총 개수 조회 (raw SQL 사용)
    let countQuery = `SELECT COUNT(*) as count FROM "loading_points" WHERE 1=1`
    const countParams: any[] = []
    
    if (search) {
      countQuery += ` AND ("centerName" ILIKE $${countParams.length + 1} OR "loadingPointName" ILIKE $${countParams.length + 2} OR "lotAddress" ILIKE $${countParams.length + 3} OR "roadAddress" ILIKE $${countParams.length + 4} OR "manager1" ILIKE $${countParams.length + 5} OR "manager2" ILIKE $${countParams.length + 6})`
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`)
    }
    if (isActive !== undefined) {
      countQuery += ` AND "isActive" = $${countParams.length + 1}`
      countParams.push(isActive)
    }
    
    const countResult = await this.prisma.$queryRawUnsafe<{count: bigint}[]>(countQuery, ...countParams)
    const total = Number(countResult[0]?.count || 0)

    // 상차지 목록 조회 (raw SQL 사용)
    let selectQuery = `
      SELECT lp.*, COALESCE(rt_count.count, 0) as route_count
      FROM "loading_points" lp
      LEFT JOIN (
        SELECT "loadingPointId", COUNT(*) as count 
        FROM "route_templates" 
        WHERE "loadingPointId" IS NOT NULL 
        GROUP BY "loadingPointId"
      ) rt_count ON lp.id = rt_count."loadingPointId"
      WHERE 1=1
    `
    const selectParams: any[] = []
    
    if (search) {
      selectQuery += ` AND (lp."centerName" ILIKE $${selectParams.length + 1} OR lp."loadingPointName" ILIKE $${selectParams.length + 2} OR lp."lotAddress" ILIKE $${selectParams.length + 3} OR lp."roadAddress" ILIKE $${selectParams.length + 4} OR lp."manager1" ILIKE $${selectParams.length + 5} OR lp."manager2" ILIKE $${selectParams.length + 6})`
      selectParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`)
    }
    if (isActive !== undefined) {
      selectQuery += ` AND lp."isActive" = $${selectParams.length + 1}`
      selectParams.push(isActive)
    }
    
    selectQuery += ` ORDER BY lp."${sortBy}" ${sortOrder.toUpperCase()}`
    selectQuery += ` LIMIT $${selectParams.length + 1} OFFSET $${selectParams.length + 2}`
    selectParams.push(limit, (page - 1) * limit)
    
    const loadingPoints = await this.prisma.$queryRawUnsafe<any[]>(selectQuery, ...selectParams)

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
      loadingPoints: loadingPoints.map(lp => ({
        id: lp.id,
        centerName: lp.centerName,
        loadingPointName: lp.loadingPointName,
        lotAddress: lp.lotAddress,
        roadAddress: lp.roadAddress,
        manager1: lp.manager1,
        manager2: lp.manager2,
        phone1: lp.phone1,
        phone2: lp.phone2,
        remarks: lp.remarks,
        isActive: lp.isActive,
        createdAt: lp.createdAt.toISOString(),
        updatedAt: lp.updatedAt.toISOString(),
        _count: {
          routeTemplates: Number(lp.route_count || 0)
        }
      })),
      pagination
    }
  }

  /**
   * 상차지 상세 조회
   */
  async getLoadingPointById(id: string): Promise<LoadingPointResponse | null> {
    const loadingPoint = await this.prisma.loadingPoint.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            routeTemplates: true
          }
        }
      }
    })

    if (!loadingPoint) {
      return null
    }

    return this.formatLoadingPointResponse(loadingPoint)
  }

  /**
   * 상차지 생성
   */
  async createLoadingPoint(data: CreateLoadingPointData): Promise<LoadingPointResponse> {
    // 센터명+상차지명 조합 중복 확인
    const existingLoadingPoint = await this.prisma.loadingPoint.findFirst({
      where: { 
        centerName: data.centerName,
        loadingPointName: data.loadingPointName 
      }
    })

    if (existingLoadingPoint) {
      throw new Error('이미 등록된 센터명-상차지명 조합입니다')
    }

    const loadingPoint = await this.prisma.loadingPoint.create({
      data,
      include: {
        _count: {
          select: {
            routeTemplates: true
          }
        }
      }
    })

    return this.formatLoadingPointResponse(loadingPoint)
  }

  /**
   * 상차지 정보 수정
   */
  async updateLoadingPoint(id: string, data: UpdateLoadingPointData): Promise<LoadingPointResponse> {
    // 상차지 존재 확인
    const existingLoadingPoint = await this.prisma.loadingPoint.findUnique({
      where: { id }
    })

    if (!existingLoadingPoint) {
      throw new Error('상차지를 찾을 수 없습니다')
    }

    // 센터명-상차지명 조합 중복 확인 (변경하는 경우만)
    if ((data.centerName && data.centerName !== existingLoadingPoint.centerName) ||
        (data.loadingPointName && data.loadingPointName !== existingLoadingPoint.loadingPointName)) {
      const nameExists = await this.prisma.loadingPoint.findFirst({
        where: { 
          centerName: data.centerName || existingLoadingPoint.centerName,
          loadingPointName: data.loadingPointName || existingLoadingPoint.loadingPointName
        }
      })

      if (nameExists && nameExists.id !== id) {
        throw new Error('이미 등록된 센터명-상차지명 조합입니다')
      }
    }

    const loadingPoint = await this.prisma.loadingPoint.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            routeTemplates: true
          }
        }
      }
    })

    return this.formatLoadingPointResponse(loadingPoint)
  }

  /**
   * 상차지 삭제 (소프트 삭제)
   */
  async deleteLoadingPoint(id: string): Promise<void> {
    // 상차지 존재 확인
    const existingLoadingPoint = await this.prisma.loadingPoint.findUnique({
      where: { id },
      include: {
        routeTemplates: {
          where: {
            isActive: true
          }
        }
      }
    })

    if (!existingLoadingPoint) {
      throw new Error('상차지를 찾을 수 없습니다')
    }

    // 관련 데이터 확인
    if (existingLoadingPoint.routeTemplates.length > 0) {
      throw new Error('사용 중인 노선이 있는 상차지는 삭제할 수 없습니다. 비활성화 처리해주세요.')
    }

    // 소프트 삭제 (비활성화)
    await this.prisma.loadingPoint.update({
      where: { id },
      data: { isActive: false }
    })
  }

  /**
   * 상차지 완전 삭제 (하드 삭제)
   */
  async hardDeleteLoadingPoint(id: string): Promise<void> {
    const existingLoadingPoint = await this.prisma.loadingPoint.findUnique({
      where: { id },
      include: {
        routeTemplates: true
      }
    })

    if (!existingLoadingPoint) {
      throw new Error('상차지를 찾을 수 없습니다')
    }

    if (existingLoadingPoint.routeTemplates.length > 0) {
      throw new Error('연결된 노선이 있는 상차지는 삭제할 수 없습니다')
    }

    // 하드 삭제 - DB에서 완전 제거
    await this.prisma.loadingPoint.delete({
      where: { id }
    })
  }

  /**
   * 상차지 활성화/비활성화
   */
  async toggleLoadingPointStatus(id: string): Promise<LoadingPointResponse> {
    const loadingPoint = await this.prisma.loadingPoint.findUnique({
      where: { id }
    })

    if (!loadingPoint) {
      throw new Error('상차지를 찾을 수 없습니다')
    }

    const updatedLoadingPoint = await this.prisma.loadingPoint.update({
      where: { id },
      data: { isActive: !loadingPoint.isActive },
      include: {
        _count: {
          select: {
            routeTemplates: true
          }
        }
      }
    })

    return this.formatLoadingPointResponse(updatedLoadingPoint)
  }

  /**
   * 상차지 자동완성 검색
   */
  async searchLoadingPoints(query: LoadingPointSuggestionsQuery): Promise<LoadingPointSuggestionResponse[]> {
    const { query: searchQuery, limit } = query

    const where: any = {
      isActive: true,
      OR: [
        { centerName: { contains: searchQuery, mode: 'insensitive' } },
        { loadingPointName: { contains: searchQuery, mode: 'insensitive' } }
      ]
    }

    const loadingPoints = await this.prisma.loadingPoint.findMany({
      where,
      select: {
        id: true,
        centerName: true,
        loadingPointName: true
      },
      take: limit,
      orderBy: [
        { centerName: 'asc' },
        { loadingPointName: 'asc' }
      ]
    })

    return loadingPoints
  }



  /**
   * 상차지 응답 포맷팅
   */
  private formatLoadingPointResponse(loadingPoint: any): LoadingPointResponse {
    return {
      id: loadingPoint.id,
      centerName: loadingPoint.centerName,
      loadingPointName: loadingPoint.loadingPointName,
      lotAddress: loadingPoint.lotAddress,
      roadAddress: loadingPoint.roadAddress,
      manager1: loadingPoint.manager1,
      manager2: loadingPoint.manager2,
      phone1: loadingPoint.phone1,
      phone2: loadingPoint.phone2,
      remarks: loadingPoint.remarks,
      isActive: loadingPoint.isActive,
      createdAt: loadingPoint.createdAt.toISOString(),
      updatedAt: loadingPoint.updatedAt.toISOString(),
      _count: loadingPoint._count
    }
  }
}