import { PrismaClient, SettlementStatus } from '@prisma/client'
import { CreateSettlementData, UpdateSettlementData, GetSettlementsQuery, SettlementResponse, SettlementsListResponse, ConfirmSettlementData, PreviewSettlementData, SettlementPreviewResponse, SettlementItem, getYearMonthRange } from '@/lib/validations/settlement'
import { CharterSettlementService } from './settlement-charter.service'

export class SettlementApiService {
  private settlementService: CharterSettlementService

  constructor(private prisma: PrismaClient) {
    this.settlementService = new CharterSettlementService(prisma)
  }

  /**
   * 정산 목록 조회 (검색, 필터링, 페이지네이션)
   */
  async getSettlements(query: GetSettlementsQuery): Promise<SettlementsListResponse> {
    const { page, limit, search, status, driverId, yearMonth, confirmedBy, sortBy, sortOrder } = query

    // 검색 조건 구성
    const where: any = {}
    
    if (search) {
      where.OR = [
        { driver: { name: { contains: search, mode: 'insensitive' } } },
        { driver: { phone: { contains: search } } }
      ]
    }

    if (status) {
      where.status = status
    }

    if (driverId) {
      where.driverId = driverId
    }

    if (yearMonth) {
      where.yearMonth = yearMonth
    }

    if (confirmedBy) {
      where.confirmedBy = confirmedBy
    }

    // 정렬 조건
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    // 총 개수 조회
    const total = await this.prisma.settlement.count({ where })

    // 정산 목록 조회
    const settlements = await this.prisma.settlement.findMany({
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
        confirmer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        items: {
          orderBy: { date: 'asc' }
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
      settlements: settlements.map(this.formatSettlementResponse),
      pagination
    }
  }

  /**
   * 정산 상세 조회
   */
  async getSettlementById(id: string): Promise<SettlementResponse | null> {
    const settlement = await this.prisma.settlement.findUnique({
      where: { id },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        confirmer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        items: {
          orderBy: { date: 'asc' }
        }
      }
    })

    if (!settlement) {
      return null
    }

    return this.formatSettlementResponse(settlement)
  }

  /**
   * 정산 미리보기
   */
  async previewSettlement(data: PreviewSettlementData): Promise<SettlementPreviewResponse> {
    const { driverId, yearMonth } = data

    // 미래 월 차단
    const [year, month] = yearMonth.split('-').map(Number)
    const targetMonth = new Date(year, month - 1)
    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)
    
    if (targetMonth > currentMonth) {
      throw new Error('미래 월의 정산은 미리보기할 수 없습니다')
    }

    // 기사 존재 확인
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      select: {
        id: true,
        name: true,
        phone: true,
        isActive: true
      }
    })

    if (!driver) {
      throw new Error('존재하지 않는 기사입니다')
    }

    // 이미 확정된 정산이 있는지 확인
    const existingSettlement = await this.prisma.settlement.findFirst({
      where: {
        driverId,
        yearMonth,
        status: { in: ['CONFIRMED', 'PAID'] }
      }
    })

    const warnings: string[] = []
    
    if (existingSettlement) {
      warnings.push('이미 확정된 정산이 존재합니다')
    }

    if (!driver.isActive) {
      warnings.push('비활성화된 기사입니다')
    }

    // 정산 항목 조회
    const items = await this.getSettlementItems(driverId, yearMonth)

    // 정산 계산
    const calculation = await this.settlementService.calculateMonthlySettlement(driverId, yearMonth)

    return {
      driverId,
      yearMonth,
      driver,
      items,
      calculation: {
        totalTrips: calculation.totalTrips,
        totalBaseFare: calculation.totalBaseFare.toString(),
        totalDeductions: calculation.totalDeductions.toString(),
        totalAdditions: calculation.totalAdditions.toString(),
        finalAmount: calculation.finalAmount.toString()
      },
      canConfirm: warnings.length === 0 && items.length > 0,
      warnings
    }
  }

  /**
   * 정산 생성
   */
  async createSettlement(data: CreateSettlementData): Promise<SettlementResponse> {
    const { driverId, yearMonth, status = 'DRAFT' } = data

    // 기사 존재 확인
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId }
    })

    if (!driver) {
      throw new Error('존재하지 않는 기사입니다')
    }

    // 동일 월 정산 중복 확인
    const existingSettlement = await this.prisma.settlement.findFirst({
      where: { driverId, yearMonth }
    })

    if (existingSettlement) {
      throw new Error('해당 월의 정산이 이미 존재합니다')
    }

    // 정산 계산
    const calculation = await this.settlementService.calculateMonthlySettlement(driverId, yearMonth)

    // 정산 생성
    const settlement = await this.prisma.settlement.create({
      data: {
        driverId,
        yearMonth,
        status,
        totalTrips: calculation.totalTrips,
        totalBaseFare: calculation.totalBaseFare,
        totalDeductions: calculation.totalDeductions,
        totalAdditions: calculation.totalAdditions,
        finalAmount: calculation.finalAmount
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        confirmer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // 정산 아이템 생성
    if (calculation.items.length > 0) {
      await this.prisma.settlementItem.createMany({
        data: calculation.items.map(item => ({
          settlementId: settlement.id,
          tripId: item.tripId,
          type: item.type,
          description: item.description,
          amount: item.amount,
          date: item.date
        }))
      })
    }

    // 아이템을 포함한 정산 재조회
    const settlementWithItems = await this.getSettlementById(settlement.id)
    return settlementWithItems!
  }

  /**
   * 정산 수정
   */
  async updateSettlement(id: string, data: UpdateSettlementData): Promise<SettlementResponse> {
    // 정산 존재 확인
    const existingSettlement = await this.prisma.settlement.findUnique({
      where: { id }
    })

    if (!existingSettlement) {
      throw new Error('정산을 찾을 수 없습니다')
    }

    // 확정된 정산은 수정 불가
    if (existingSettlement.status === 'CONFIRMED' || existingSettlement.status === 'PAID') {
      throw new Error('확정된 정산은 수정할 수 없습니다')
    }

    const settlement = await this.prisma.settlement.update({
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
        confirmer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        items: {
          orderBy: { date: 'asc' }
        }
      }
    })

    return this.formatSettlementResponse(settlement)
  }

  /**
   * 정산 확정
   */
  async confirmSettlement(id: string, confirmedBy: string, data: ConfirmSettlementData): Promise<SettlementResponse> {
    const existingSettlement = await this.prisma.settlement.findUnique({
      where: { id }
    })

    if (!existingSettlement) {
      throw new Error('정산을 찾을 수 없습니다')
    }

    if (existingSettlement.status !== 'DRAFT') {
      throw new Error('임시저장 상태의 정산만 확정할 수 있습니다')
    }

    // 정산 금액 재계산 (최신 데이터 반영)
    const calculation = await this.settlementService.calculateMonthlySettlement(
      existingSettlement.driverId, 
      existingSettlement.yearMonth
    )

    const settlement = await this.prisma.settlement.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
        confirmedBy,
        confirmedAt: new Date(),
        totalTrips: calculation.totalTrips,
        totalBaseFare: calculation.totalBaseFare,
        totalDeductions: calculation.totalDeductions,
        totalAdditions: calculation.totalAdditions,
        finalAmount: calculation.finalAmount
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        confirmer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        items: {
          orderBy: { date: 'asc' }
        }
      }
    })

    return this.formatSettlementResponse(settlement)
  }

  /**
   * 정산 확정 (finalizeSettlement 별칭)
   */
  async finalizeSettlement(id: string, confirmedBy: string, remarks?: string): Promise<SettlementResponse> {
    return this.confirmSettlement(id, confirmedBy, { remarks })
  }

  /**
   * 정산 엑셀 내보내기
   */
  async exportSettlementsToExcel(yearMonth: string, driverIds?: string[]): Promise<Buffer> {
    // 정산 데이터 조회
    const where: any = { yearMonth }
    if (driverIds && driverIds.length > 0) {
      where.driverId = { in: driverIds }
    }

    const settlements = await this.prisma.settlement.findMany({
      where,
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            businessName: true,
            businessNumber: true
          }
        },
        items: {
          orderBy: { date: 'asc' }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    // Excel 생성 (stub - 실제 구현은 xlsx 라이브러리 필요)
    const excelData = settlements.map((settlement: any) => ({
      기사명: settlement.driver?.name || '',
      전화번호: settlement.driver?.phone || '',
      사업상호: settlement.driver?.businessName || '',
      사업자번호: settlement.driver?.businessNumber || '',
      정산월: settlement.yearMonth,
      총운행수: settlement.totalTrips,
      기본요금: Number(settlement.totalBaseFare),
      공제액: Number(settlement.totalDeductions),
      추가액: Number(settlement.totalAdditions),
      최종정산액: Number(settlement.finalAmount),
      상태: settlement.status === 'DRAFT' ? '임시저장' : settlement.status === 'CONFIRMED' ? '확정' : '지급완료',
      생성일: settlement.createdAt.toISOString().split('T')[0],
      확정일: settlement.confirmedAt?.toISOString().split('T')[0] || '',
      지급일: settlement.paidAt?.toISOString().split('T')[0] || ''
    }))

    // CSV 형태로 생성 (Excel 라이브러리 대신 임시)
    const headers = Object.keys(excelData[0] || {}).join(',')
    const rows = excelData.map(row => Object.values(row).join(','))
    const csvContent = [headers, ...rows].join('\n')
    
    return Buffer.from(csvContent, 'utf8')
  }

  /**
   * 정산 지급 완료 처리
   */
  async markSettlementAsPaid(id: string): Promise<SettlementResponse> {
    const existingSettlement = await this.prisma.settlement.findUnique({
      where: { id }
    })

    if (!existingSettlement) {
      throw new Error('정산을 찾을 수 없습니다')
    }

    if (existingSettlement.status !== 'CONFIRMED') {
      throw new Error('확정된 정산만 지급 처리할 수 있습니다')
    }

    const settlement = await this.prisma.settlement.update({
      where: { id },
      data: { 
        status: 'PAID',
        paidAt: new Date()
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        confirmer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        items: {
          orderBy: { date: 'asc' }
        }
      }
    })

    return this.formatSettlementResponse(settlement)
  }

  /**
   * 정산 삭제 (임시저장만 가능)
   */
  async deleteSettlement(id: string): Promise<void> {
    const existingSettlement = await this.prisma.settlement.findUnique({
      where: { id }
    })

    if (!existingSettlement) {
      throw new Error('정산을 찾을 수 없습니다')
    }

    if (existingSettlement.status !== 'DRAFT') {
      throw new Error('임시저장 상태의 정산만 삭제할 수 있습니다')
    }

    await this.prisma.settlement.delete({
      where: { id }
    })
  }

  /**
   * 정산 항목 조회 (미리보기용)
   */
  private async getSettlementItems(driverId: string, yearMonth: string): Promise<SettlementItem[]> {
    const { start, end } = getYearMonthRange(yearMonth)

    // TODO: Update to use CharterRequest data instead of non-existent Trip model
    const charters = await this.prisma.charterRequest.findMany({
      where: {
        driverId,
        date: {
          gte: start,
          lte: end
        }
      },
      include: {
        center: {
          select: {
            centerName: true
          }
        },
        driver: {
          select: {
            id: true,
            name: true
          }
        },
        destinations: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { date: 'asc' }
    })

    return charters.map(charter => ({
      tripId: charter.id, // Using charter request ID
      date: charter.date.toISOString().split('T')[0],
      status: 'COMPLETED', // Charter requests are considered completed
      routeName: `${charter.center?.centerName} - ${charter.destinations.map(d => d.region).join(', ')}`,
      loadingPoint: charter.center?.centerName,
      unloadingPoint: charter.destinations.map(d => d.region).join(', '),
      driverFare: charter.driverFare.toString(),
      billingFare: charter.totalFare.toString(),
      deductionAmount: undefined,
      isSubstitute: false,
      substituteDriverId: undefined,
      substituteDriverName: undefined,
      remarks: charter.notes
    }))
  }

  /**
   * 정산 응답 포맷팅
   */
  private formatSettlementResponse(settlement: any): SettlementResponse {
    // 정산 아이템을 SettlementItem 형태로 변환
    const items: SettlementItem[] = settlement.items?.map((item: any) => ({
      tripId: item.tripId || undefined,
      date: item.date.toISOString().split('T')[0],
      status: item.type,
      routeName: undefined, // SettlementItem에는 노선 정보가 없으므로
      loadingPoint: undefined,
      unloadingPoint: undefined,
      driverFare: item.type === 'TRIP' ? item.amount.toString() : '0',
      billingFare: '0',
      deductionAmount: item.type === 'DEDUCTION' ? item.amount.toString() : undefined,
      isSubstitute: false,
      substituteDriverId: undefined,
      substituteDriverName: undefined,
      remarks: item.description
    })) || []

    return {
      id: settlement.id,
      yearMonth: settlement.yearMonth,
      status: settlement.status,
      totalTrips: settlement.totalTrips,
      totalBaseFare: settlement.totalBaseFare.toString(),
      totalDeductions: settlement.totalDeductions.toString(),
      totalAdditions: settlement.totalAdditions.toString(),
      finalAmount: settlement.finalAmount.toString(),
      createdAt: settlement.createdAt.toISOString(),
      updatedAt: settlement.updatedAt.toISOString(),
      confirmedAt: settlement.confirmedAt?.toISOString() || null,
      paidAt: settlement.paidAt?.toISOString() || null,
      driver: settlement.driver,
      confirmer: settlement.confirmer,
      creator: settlement.creator,
      items
    }
  }
}