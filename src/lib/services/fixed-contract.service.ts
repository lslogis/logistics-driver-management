import { PrismaClient, FixedContract, ContractType, Prisma } from '@prisma/client'
import {
  CreateFixedContractRequest,
  UpdateFixedContractRequest,
  GetFixedContractsQuery,
  FixedContractResponse
} from '@/lib/validations/fixedContract'

export class FixedContractService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get paginated list of fixed contracts with filters
   */
  async getFixedContracts(query: GetFixedContractsQuery) {
    const {
      page = 1,
      limit = 20,
      search,
      driverId,
      loadingPointId,
      contractType,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = query

    const skip = (page - 1) * limit

    // Build where clause
    const where: Prisma.FixedContractWhereInput = {}
    const andConditions: Prisma.FixedContractWhereInput[] = []

    if (search) {
      andConditions.push({
        OR: [
          { routeName: { contains: search, mode: 'insensitive' } },
          { driver: { name: { contains: search, mode: 'insensitive' } } },
          { driver: { phone: { contains: search } } },
          { driver: { vehicleNumber: { contains: search, mode: 'insensitive' } } },
          { loadingPoint: { centerName: { contains: search, mode: 'insensitive' } } },
          { loadingPoint: { loadingPointName: { contains: search, mode: 'insensitive' } } }
        ]
      })
    }

    if (contractType) {
      andConditions.push({
        OR: [
          { centerContractType: contractType },
          { driverContractType: contractType }
        ]
      })
    }

    if (driverId) {
      where.driverId = driverId
    }

    if (loadingPointId) {
      where.loadingPointId = loadingPointId
    }

    if (isActive !== undefined) {
      where.isActive = isActive
    }

    if (andConditions.length > 0) {
      where.AND = andConditions
    }

    // If FixedContract model is not present in Prisma schema, return empty result gracefully
    const hasFixedContractModel = (this.prisma as any).fixedContract && typeof (this.prisma as any).fixedContract.findMany === 'function'
    if (!hasFixedContractModel) {
      return {
        contracts: [],
        pagination: {
          page,
          limit,
          totalCount: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      }
    }

    // Execute queries in parallel
    const [contracts, totalCount] = await Promise.all([
      (this.prisma as any).fixedContract.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
              vehicleNumber: true
            }
          },
          loadingPoint: {
            select: {
              id: true,
              centerName: true,
              loadingPointName: true
            }
          },
          creator: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
      (this.prisma as any).fixedContract.count({ where })
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return {
      contracts: contracts as FixedContractResponse[],
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
   * Get a single fixed contract by ID
   */
  async getFixedContractById(id: string): Promise<FixedContractResponse | null> {
    const contract = await this.prisma.fixedContract.findUnique({
      where: { id },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleNumber: true
          }
        },
        loadingPoint: {
          select: {
            id: true,
            centerName: true,
            loadingPointName: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return contract ? this.formatFixedContractResponse(contract) : null
  }

  /**
   * Create a new fixed contract
   */
  async createFixedContract(
    data: CreateFixedContractRequest, 
    createdBy: string
  ): Promise<FixedContractResponse> {
    // Validate driver exists and is active
    if (data.driverId) {
      const driver = await this.prisma.driver.findFirst({ where: { id: data.driverId } })
      if (!driver) {
        throw new Error('기사를 찾을 수 없습니다')
      }
      if (!driver.isActive) {
        throw new Error('비활성화된 기사는 계약을 등록할 수 없습니다')
      }
    }

    // Validate loading point exists and is active
    const loadingPoint = await this.prisma.loadingPoint.findFirst({
      where: { id: data.loadingPointId }
    })

    if (!loadingPoint) {
      throw new Error('상차지를 찾을 수 없습니다')
    }

    if (!loadingPoint.isActive) {
      throw new Error('비활성화된 상차지는 계약을 등록할 수 없습니다')
    }

    // Check for existing active contract (by loadingPoint + routeName, optionally driver)
    const whereDup: any = {
      loadingPointId: data.loadingPointId,
      routeName: data.routeName,
      isActive: true
    }
    if (data.driverId) whereDup.driverId = data.driverId
    const existingContract = await this.prisma.fixedContract.findFirst({ where: whereDup })

    if (existingContract) {
      throw new Error('이미 동일한 기사와 상차지로 등록된 활성 계약이 있습니다')
    }

    // Validate startDate only (endDate 제거)
    if (data.startDate) {
      const startDate = new Date(data.startDate)
      if (isNaN(startDate.getTime())) {
        throw new Error('시작일 형식이 올바르지 않습니다')
      }
    }

    // Create data. 기사금액(driverAmount)을 계약유형에 따라 매핑
    const contractData: Prisma.FixedContractCreateInput = {
      routeName: data.routeName,
      // Dual contract types
      centerContractType: (data as any).centerContractType,
      driverContractType: (data as any).driverContractType ?? null,
      operatingDays: data.operatingDays,
      centerAmount: new Prisma.Decimal((data as any).centerAmount),
      driverAmount: (data as any).driverAmount !== undefined ? new Prisma.Decimal((data as any).driverAmount) : null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      // endDate 제거
      specialConditions: data.specialConditions,
      remarks: data.remarks,
      ...(data.driverId ? { driver: { connect: { id: data.driverId } } } : {}),
      loadingPoint: {
        connect: { id: data.loadingPointId }
      },
      creator: {
        connect: { id: createdBy }
      }
    }

    const contract = await this.prisma.fixedContract.create({
      data: contractData,
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleNumber: true
          }
        },
        loadingPoint: {
          select: {
            id: true,
            centerName: true,
            loadingPointName: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return this.formatFixedContractResponse(contract)
  }

  /**
   * Update an existing fixed contract
   */
  async updateFixedContract(
    id: string,
    data: UpdateFixedContractRequest
  ): Promise<FixedContractResponse> {
    // Check if contract exists
    const fcUpd = (this.prisma as any).fixedContract
    if (!fcUpd || typeof fcUpd.findUnique !== 'function') {
      throw new Error('고정계약 테이블이 아직 준비되지 않았습니다. prisma migrate를 실행해주세요.')
    }
    const existingContract = await fcUpd.findUnique({
      where: { id }
    })

    if (!existingContract) {
      throw new Error('고정계약을 찾을 수 없습니다')
    }

    // Validate driver if changed
    if (data.driverId && data.driverId !== existingContract.driverId) {
      const driver = await this.prisma.driver.findUnique({
        where: { id: data.driverId }
      })

      if (!driver) {
        throw new Error('기사를 찾을 수 없습니다')
      }

      if (!driver.isActive) {
        throw new Error('비활성화된 기사로는 변경할 수 없습니다')
      }
    }

    // Validate loading point if changed
    if (data.loadingPointId && data.loadingPointId !== existingContract.loadingPointId) {
      const loadingPoint = await this.prisma.loadingPoint.findUnique({
        where: { id: data.loadingPointId }
      })

      if (!loadingPoint) {
        throw new Error('상차지를 찾을 수 없습니다')
      }

      if (!loadingPoint.isActive) {
        throw new Error('비활성화된 상차지로는 변경할 수 없습니다')
      }
    }

    // Check for conflicts if driver or loading point changed
    if (data.driverId || data.loadingPointId || data.routeName) {
      const checkDriverId = data.driverId || existingContract.driverId
      const checkLoadingPointId = data.loadingPointId || existingContract.loadingPointId
      const checkRouteName = data.routeName || existingContract.routeName

      const conflictingContract = await fcUpd.findFirst({
        where: {
          id: { not: id },
          driverId: checkDriverId,
          loadingPointId: checkLoadingPointId,
          routeName: checkRouteName,
          isActive: true
        }
      })

      if (conflictingContract) {
        throw new Error('동일한 기사와 상차지로 등록된 다른 활성 계약이 있습니다')
      }
    }

    // Validate date range if both dates are provided
    // endDate 제거됨

    // Prepare update data
    const updateData: Prisma.FixedContractUpdateInput = {}

    if (data.routeName !== undefined) updateData.routeName = data.routeName
    // contractType 단일 필드 제거
    if (data.operatingDays !== undefined) updateData.operatingDays = data.operatingDays
    // 기사금액 업데이트 지원
    // 업데이트: 분리된 필드 직접 업데이트
    if ((data as any).centerContractType !== undefined) updateData.centerContractType = (data as any).centerContractType
    if ((data as any).driverContractType !== undefined) updateData.driverContractType = (data as any).driverContractType
    if ((data as any).centerAmount !== undefined) updateData.centerAmount = new Prisma.Decimal((data as any).centerAmount as number)
    if ((data as any).driverAmount !== undefined) updateData.driverAmount = (data as any).driverAmount === null ? null : new Prisma.Decimal((data as any).driverAmount as number)
    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate ? new Date(data.startDate) : null
    }
    if (data.specialConditions !== undefined) updateData.specialConditions = data.specialConditions
    if (data.remarks !== undefined) updateData.remarks = data.remarks

    if (data.driverId) {
      updateData.driver = { connect: { id: data.driverId } }
    }

    if (data.loadingPointId) {
      updateData.loadingPoint = { connect: { id: data.loadingPointId } }
    }

    const contract = await fcUpd.update({
      where: { id },
      data: updateData,
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleNumber: true
          }
        },
        loadingPoint: {
          select: {
            id: true,
            centerName: true,
            loadingPointName: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return this.formatFixedContractResponse(contract)
  }

  /**
   * Delete a fixed contract (soft delete by setting isActive to false)
   */
  async deleteFixedContract(id: string): Promise<void> {
    const existingContract = await this.prisma.fixedContract.findUnique({
      where: { id }
    })

    if (!existingContract) {
      throw new Error('고정계약을 찾을 수 없습니다')
    }

    await this.prisma.fixedContract.update({
      where: { id },
      data: { isActive: false }
    })
  }

  /**
   * Permanently delete a fixed contract (hard delete)
   */
  async hardDeleteFixedContract(id: string): Promise<void> {
    const existingContract = await this.prisma.fixedContract.findUnique({
      where: { id }
    })

    if (!existingContract) {
      throw new Error('고정계약을 찾을 수 없습니다')
    }

    await this.prisma.fixedContract.delete({
      where: { id }
    })
  }

  /**
   * Activate/Deactivate a fixed contract
   */
  async toggleFixedContractStatus(id: string): Promise<FixedContractResponse> {
    const fcT = (this.prisma as any).fixedContract
    if (!fcT || typeof fcT.findUnique !== 'function') {
      throw new Error('고정계약 테이블이 아직 준비되지 않았습니다. prisma migrate를 실행해주세요.')
    }
    const existingContract = await fcT.findUnique({
      where: { id }
    })

    if (!existingContract) {
      throw new Error('고정계약을 찾을 수 없습니다')
    }

    const contract = await fcT.update({
      where: { id },
      data: { isActive: !existingContract.isActive },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleNumber: true
          }
        },
        loadingPoint: {
          select: {
            id: true,
            centerName: true,
            loadingPointName: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return this.formatFixedContractResponse(contract)
  }

  /**
   * Get fixed contracts by driver ID
   */
  async getFixedContractsByDriver(driverId: string): Promise<FixedContractResponse[]> {
    const fcG = (this.prisma as any).fixedContract
    if (!fcG || typeof fcG.findMany !== 'function') return []
    const contracts = await fcG.findMany({
      where: {
        driverId,
        isActive: true
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleNumber: true
          }
        },
        loadingPoint: {
          select: {
            id: true,
            centerName: true,
            loadingPointName: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return contracts.map((contract: any) => this.formatFixedContractResponse(contract))
  }

  /**
   * Get fixed contracts by loading point ID
   */
  async getFixedContractsByLoadingPoint(loadingPointId: string): Promise<FixedContractResponse[]> {
    const fcLP = (this.prisma as any).fixedContract
    if (!fcLP || typeof fcLP.findMany !== 'function') return []
    const contracts = await fcLP.findMany({
      where: {
        loadingPointId,
        isActive: true
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleNumber: true
          }
        },
        loadingPoint: {
          select: {
            id: true,
            centerName: true,
            loadingPointName: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return contracts.map((contract: any) => this.formatFixedContractResponse(contract))
  }

  /**
   * Get contract statistics
   */
  async getContractStats() {
    const fcS = (this.prisma as any).fixedContract
    if (!fcS || typeof fcS.count !== 'function') {
      return {
        totalContracts: 0,
        activeContracts: 0,
        inactiveContracts: 0,
        contractsByType: {},
        recentContracts: 0
      }
    }

    const [
      totalContracts,
      activeContracts,
      contractsByType,
      recentContracts
    ] = await Promise.all([
      fcS.count(),
      fcS.count({ where: { isActive: true } }),
      fcS.groupBy({
        by: ['driverContractType'],
        _count: { driverContractType: true },
        where: { isActive: true }
      }),
      fcS.count({
        where: {
          isActive: true,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      })
    ])

    return {
      totalContracts,
      activeContracts,
      inactiveContracts: totalContracts - activeContracts,
      contractsByType: (contractsByType as any).reduce((acc: any, item: any) => {
        acc[item.driverContractType ?? 'UNKNOWN'] = item._count.driverContractType
        return acc
      }, {} as Record<string, number>),
      recentContracts
    }
  }

  /**
   * Format fixed contract response
   */
  private formatFixedContractResponse(contract: any): FixedContractResponse {
    return {
      id: contract.id,
      loadingPointId: contract.loadingPointId,
      routeName: contract.routeName,
      centerContractType: contract.centerContractType,
      driverContractType: contract.driverContractType,
      operatingDays: contract.operatingDays,
      centerAmount: contract.centerAmount,
      driverAmount: contract.driverAmount,
      startDate: contract.startDate?.toISOString() || null,
      specialConditions: contract.specialConditions,
      remarks: contract.remarks,
      isActive: contract.isActive,
      createdAt: contract.createdAt.toISOString(),
      updatedAt: contract.updatedAt.toISOString(),
      driverId: contract.driverId,
      createdBy: contract.createdBy,
      driver: contract.driver,
      loadingPoint: contract.loadingPoint,
      creator: contract.creator
    }
  }
}
