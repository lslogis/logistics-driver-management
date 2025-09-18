import { PrismaClient, Prisma, FareType } from '@prisma/client'
import { normalizeVehicleTypeName } from '@/lib/utils/vehicle-types'

type PrismaCenterFare = Prisma.CenterFareGetPayload<{
  include: {
    loadingPoint: {
      select: {
        id: true
        name: true
        centerName: true
        loadingPointName: true
        isActive: true
      }
    }
  }
}>

export type CreateCenterFareRequest = {
  loadingPointId: string
  vehicleType: string
  region: string | null
  fareType: FareType
  baseFare?: number
  extraStopFee?: number
  extraRegionFee?: number
}

export type UpdateCenterFareRequest = {
  loadingPointId?: string
  vehicleType?: string
  region?: string | null
  fareType?: FareType
  baseFare?: number
  extraStopFee?: number
  extraRegionFee?: number
}

export type GetCenterFaresQuery = {
  page?: number
  limit?: number
  search?: string
  loadingPointId?: string
  vehicleType?: string
  region?: string
  fareType?: FareType
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CenterFareResponse {
  id: string
  loadingPointId: string
  loadingPoint?: {
    id: string
    centerName: string
    loadingPointName: string
    isActive: boolean
  } | null
  vehicleType: string
  region: string | null
  fareType: FareType
  baseFare: number | null
  extraStopFee: number | null
  extraRegionFee: number | null
  createdAt: Date
  updatedAt: Date
}

export class CenterFareService {
  constructor(private prisma: PrismaClient) {}

  private includeLoadingPoint() {
    return {
      loadingPoint: {
        select: {
          id: true,
          centerName: true,
          loadingPointName: true,
          isActive: true,
        },
      },
    }
  }

  private formatCenterFare(fare: PrismaCenterFare): CenterFareResponse {
    return {
      id: fare.id,
      loadingPointId: fare.loadingPointId,
      loadingPoint: fare.loadingPoint ?? null,
      vehicleType: fare.vehicleType,
      region: fare.region ?? null,
      fareType: fare.fareType,
      baseFare: fare.baseFare ?? null,
      extraStopFee: fare.extraStopFee ?? null,
      extraRegionFee: fare.extraRegionFee ?? null,
      createdAt: fare.createdAt,
      updatedAt: fare.updatedAt,
    }
  }

  async getCenterFares(query: GetCenterFaresQuery) {
    const {
      page = 1,
      limit = 20,
      search,
      loadingPointId,
      vehicleType,
      region,
      fareType,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query

    const skip = (page - 1) * limit

    const where: Prisma.CenterFareWhereInput = {}

    if (search) {
      where.OR = [
        { vehicleType: { contains: search, mode: 'insensitive' } },
        { region: { contains: search, mode: 'insensitive' } },
        {
          loadingPoint: {
            OR: [
              { centerName: { contains: search, mode: 'insensitive' } },
              { loadingPointName: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ]
    }

    if (loadingPointId) {
      where.loadingPointId = loadingPointId
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

    const [fares, totalCount] = await Promise.all([
      this.prisma.centerFare.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: this.includeLoadingPoint(),
      }),
      this.prisma.centerFare.count({ where }),
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return {
      fares: fares.map(fare => this.formatCenterFare(fare)),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }
  }

  async getCenterFareById(id: string): Promise<CenterFareResponse | null> {
    const fare = await this.prisma.centerFare.findUnique({
      where: { id },
      include: this.includeLoadingPoint(),
    })

    return fare ? this.formatCenterFare(fare) : null
  }

  async createCenterFare(data: CreateCenterFareRequest): Promise<CenterFareResponse> {
    const loadingPoint = await this.prisma.loadingPoint.findUnique({
      where: { id: data.loadingPointId },
    })

    if (!loadingPoint) {
      throw new Error('존재하지 않는 상차지입니다')
    }

    const normalizedRegion = data.fareType === 'STOP_FEE'
      ? null
      : (data.region?.trim() || '')

    const canonicalVehicleType = normalizeVehicleTypeName(data.vehicleType) ?? data.vehicleType.trim()


    const duplicate = await this.prisma.centerFare.findFirst({
      where: {
        loadingPointId: data.loadingPointId,
        vehicleType: canonicalVehicleType,
        region: normalizedRegion,
      },
    })

    if (duplicate) {
      throw new Error('이미 등록된 요율입니다')
    }

    if (data.fareType === 'BASIC') {
      if (!data.baseFare || !normalizedRegion) {
        throw new Error('기본운임에는 baseFare와 region이 필수입니다')
      }
    } else {
      if (!data.extraStopFee || !data.extraRegionFee) {
        throw new Error('경유운임에는 extraStopFee와 extraRegionFee가 필수입니다')
      }
    }

    const fare = await this.prisma.centerFare.create({
      data: {
        loadingPointId: data.loadingPointId,
        vehicleType: canonicalVehicleType,
        region: normalizedRegion,
        fareType: data.fareType,
        baseFare: data.fareType === 'BASIC' ? data.baseFare ?? null : null,
        extraStopFee: data.fareType === 'STOP_FEE' ? data.extraStopFee ?? null : null,
        extraRegionFee: data.fareType === 'STOP_FEE' ? data.extraRegionFee ?? null : null,
      },
      include: this.includeLoadingPoint(),
    })

    return this.formatCenterFare(fare)
  }

  async updateCenterFare(id: string, data: UpdateCenterFareRequest): Promise<CenterFareResponse> {
    const existing = await this.prisma.centerFare.findUnique({
      where: { id },
    })

    if (!existing) {
      throw new Error('요율을 찾을 수 없습니다')
    }

    let loadingPointId = existing.loadingPointId

    if (data.loadingPointId) {
      const loadingPoint = await this.prisma.loadingPoint.findUnique({
        where: { id: data.loadingPointId },
      })

      if (!loadingPoint) {
        throw new Error('존재하지 않는 상차지입니다')
      }

      loadingPointId = data.loadingPointId
    }

    const prospectiveRegion = data.region !== undefined ? data.region : existing.region
    const normalizedRegion = data.fareType === 'STOP_FEE'
      ? null
      : (prospectiveRegion?.trim() || null)

    const prospectiveVehicleType = data.vehicleType !== undefined
      ? (normalizeVehicleTypeName(data.vehicleType) ?? data.vehicleType.trim())
      : existing.vehicleType

    const duplicate = await this.prisma.centerFare.findFirst({
      where: {
        id: { not: id },
        loadingPointId,
        vehicleType: prospectiveVehicleType,
        region: normalizedRegion,
      },
    })

    if (duplicate) {
      throw new Error('이미 등록된 요율 조합입니다')
    }

    const updateData: Prisma.CenterFareUpdateInput = {}

    if (data.loadingPointId !== undefined) updateData.loadingPointId = data.loadingPointId
    if (data.vehicleType !== undefined) updateData.vehicleType = prospectiveVehicleType
    if (data.region !== undefined) updateData.region = normalizedRegion
    if (data.fareType !== undefined) updateData.fareType = data.fareType
    if (data.baseFare !== undefined) updateData.baseFare = data.baseFare
    if (data.extraStopFee !== undefined) updateData.extraStopFee = data.extraStopFee
    if (data.extraRegionFee !== undefined) updateData.extraRegionFee = data.extraRegionFee

    const fare = await this.prisma.centerFare.update({
      where: { id },
      data: updateData,
      include: this.includeLoadingPoint(),
    })

    return this.formatCenterFare(fare)
  }

  async deleteCenterFare(id: string): Promise<void> {
    await this.prisma.centerFare.delete({ where: { id } })
  }
}

export type ValidateCenterFareRow = {
  loadingPointId?: string
  loadingPointName?: string
  centerName?: string
  vehicleType: string
  region: string | null
  fareType: 'BASIC' | 'STOP_FEE'
  baseFare?: number | null
  extraStopFee?: number | null
  extraRegionFee?: number | null
}

export type CenterFareDuplicate = {
  index: number
  loadingPointId?: string
  loadingPointName?: string
  centerName?: string
  vehicleType: string
  region: string | null
  fareType: 'BASIC' | 'STOP_FEE'
}

export async function validateCenterFares(
  rows: ValidateCenterFareRow[],
  prisma?: PrismaClient
): Promise<CenterFareDuplicate[]> {
  const duplicates: CenterFareDuplicate[] = []
  const db = prisma || new PrismaClient()

  try {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      let loadingPointId = row.loadingPointId

      if (!loadingPointId && (row.loadingPointName || row.centerName)) {
        const searchNameRaw = row.loadingPointName ?? row.centerName ?? ''
        const searchName = typeof searchNameRaw === 'string' ? searchNameRaw.trim() : ''
        if (searchName) {
          const lp = await db.loadingPoint.findFirst({
            where: {
              OR: [
                { centerName: searchName },
                { loadingPointName: searchName },
              ],
            },
          })
          loadingPointId = lp?.id
        }
      }

      if (!loadingPointId) {
        continue
      }

      const canonicalVehicleType = normalizeVehicleTypeName(row.vehicleType) ?? row.vehicleType

      const duplicate = await db.centerFare.findFirst({
        where: {
          loadingPointId,
          vehicleType: canonicalVehicleType,
          region: row.fareType === 'STOP_FEE' ? null : row.region,
          fareType: row.fareType,
        },
      })

      if (duplicate) {
        duplicates.push({
          index: i,
          loadingPointId,
          loadingPointName: row.loadingPointName,
          centerName: row.centerName,
          vehicleType: canonicalVehicleType,
          region: row.region,
          fareType: row.fareType,
        })
      }
    }

    return duplicates
  } finally {
    if (!prisma) {
      await db.$disconnect()
    }
  }
}
