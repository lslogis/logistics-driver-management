import { PrismaClient, SettlementStatus, SettlementItemType } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { getYearMonthRange } from '../validations/settlement'

export interface CharterSettlementCalculationResult {
  totalCharters: number
  totalBaseFare: Decimal
  totalDeductions: Decimal
  totalAdditions: Decimal
  finalAmount: Decimal
  items: CharterSettlementItemDetail[]
}

export interface CharterSettlementItemDetail {
  charterId?: string
  type: SettlementItemType
  description: string
  amount: Decimal
  date: Date
}

export class CharterSettlementService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 월별 정산 계산 - Charter 시스템용
   * Trip 대신 CharterRequest 데이터를 사용
   */
  async calculateMonthlySettlement(
    driverId: string,
    yearMonth: string
  ): Promise<CharterSettlementCalculationResult> {
    // 1. 입력 검증
    if (!driverId || !yearMonth) {
      throw new Error('driverId and yearMonth are required')
    }

    const yearMonthRegex = /^\d{4}-\d{2}$/
    if (!yearMonthRegex.test(yearMonth)) {
      throw new Error('yearMonth must be in YYYY-MM format')
    }

    // 2. 기사 존재 확인
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId }
    })
    if (!driver) {
      throw new Error(`Driver not found: ${driverId}`)
    }

    // 3. 해당 월의 용차 요청 조회
    const { start: startDate, end: endDate } = getYearMonthRange(yearMonth)

    const charters = await this.prisma.charterRequest.findMany({
      where: {
        driverId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        center: true,
        destinations: {
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    // 4. 정산 계산 수행
    return this.performCalculation(charters, yearMonth)
  }

  /**
   * 정산 계산 핵심 로직 - Charter 버전
   */
  private performCalculation(charters: any[], yearMonth: string): CharterSettlementCalculationResult {
    const items: CharterSettlementItemDetail[] = []
    let totalBaseFare = new Decimal(0)
    let totalDeductions = new Decimal(0)
    let totalAdditions = new Decimal(0)

    for (const charter of charters) {
      const charterDate = new Date(charter.date)
      const driverFare = new Decimal(charter.driverFare)
      
      // 목적지 정보 포함한 설명 생성
      const destinations = charter.destinations
        .sort((a: any, b: any) => a.order - b.order)
        .map((d: any) => d.region)
        .join(' → ')
      
      const description = `용차: ${charter.center?.centerName || '센터'} / ${charter.vehicleType} / ${destinations}`

      // 기본 용차 요금 항목 추가
      items.push({
        charterId: charter.id,
        type: SettlementItemType.TRIP,
        description: description,
        amount: driverFare,
        date: charterDate
      })
      totalBaseFare = totalBaseFare.add(driverFare)

      // 협의금액인 경우 별도 표시
      if (charter.isNegotiated) {
        items.push({
          charterId: charter.id,
          type: SettlementItemType.ADDITION,
          description: `협의금액 적용: ${charter.notes || '사유 미기재'}`,
          amount: new Decimal(0), // 이미 driverFare에 반영됨
          date: charterDate
        })
      }

      // 추가 요금이 있는 경우
      if (charter.extraFare && charter.extraFare > 0) {
        const extraAmount = new Decimal(charter.extraFare)
        items.push({
          charterId: charter.id,
          type: SettlementItemType.ADDITION,
          description: `추가요금: ${charter.notes || '대기/회송/수작업 등'}`,
          amount: extraAmount,
          date: charterDate
        })
        totalAdditions = totalAdditions.add(extraAmount)
      }
    }

    // 최종 금액 계산
    const finalAmount = totalBaseFare.add(totalAdditions).sub(totalDeductions)

    return {
      totalCharters: charters.length,
      totalBaseFare,
      totalDeductions,
      totalAdditions,
      finalAmount,
      items
    }
  }

  /**
   * 정산 생성 또는 업데이트 - Charter 버전
   */
  async createOrUpdateSettlement(
    driverId: string,
    yearMonth: string,
    createdBy: string
  ) {
    // 기존 정산 확인
    const existingSettlement = await this.prisma.settlement.findUnique({
      where: {
        unique_driver_yearmonth: {
          driverId,
          yearMonth
        }
      }
    })

    if (existingSettlement && existingSettlement.status === SettlementStatus.CONFIRMED) {
      throw new Error('확정된 정산은 수정할 수 없습니다')
    }

    // 정산 계산
    const calculation = await this.calculateMonthlySettlement(driverId, yearMonth)

    // 정산 데이터 준비
    const settlementData = {
      driverId,
      yearMonth,
      totalAmount: calculation.finalAmount,
      baseFare: calculation.totalBaseFare,
      deductions: calculation.totalDeductions,
      additions: calculation.totalAdditions,
      status: SettlementStatus.DRAFT,
      notes: `Charter 시스템 기반 정산 - 총 ${calculation.totalCharters}건`,
      createdBy,
      updatedBy: createdBy
    }

    // 정산 항목 데이터 준비
    const itemsData = calculation.items.map(item => ({
      charterId: item.charterId,
      type: item.type,
      description: item.description,
      amount: item.amount,
      date: item.date
    }))

    // 트랜잭션으로 처리
    const result = await this.prisma.$transaction(async (tx) => {
      // 기존 정산이 있으면 삭제
      if (existingSettlement) {
        await tx.settlementItem.deleteMany({
          where: { settlementId: existingSettlement.id }
        })
        await tx.settlement.delete({
          where: { id: existingSettlement.id }
        })
      }

      // 새 정산 생성
      const settlement = await tx.settlement.create({
        data: {
          ...settlementData,
          items: {
            createMany: {
              data: itemsData
            }
          }
        },
        include: {
          driver: true,
          items: true
        }
      })

      return settlement
    })

    return result
  }

  /**
   * 여러 기사의 정산 일괄 처리
   */
  async createBulkSettlements(
    driverIds: string[],
    yearMonth: string,
    createdBy: string
  ) {
    const results = []
    const errors = []

    for (const driverId of driverIds) {
      try {
        const settlement = await this.createOrUpdateSettlement(
          driverId,
          yearMonth,
          createdBy
        )
        results.push({
          driverId,
          success: true,
          settlement
        })
      } catch (error: any) {
        errors.push({
          driverId,
          success: false,
          error: error.message
        })
      }
    }

    return {
      successful: results,
      failed: errors,
      summary: {
        total: driverIds.length,
        succeeded: results.length,
        failed: errors.length
      }
    }
  }

  /**
   * 정산 상태 업데이트
   */
  async updateSettlementStatus(
    settlementId: string,
    status: SettlementStatus,
    confirmedBy?: string
  ) {
    const settlement = await this.prisma.settlement.findUnique({
      where: { id: settlementId }
    })

    if (!settlement) {
      throw new Error('Settlement not found')
    }

    if (settlement.status === SettlementStatus.CONFIRMED && status !== SettlementStatus.CONFIRMED) {
      throw new Error('확정된 정산은 상태를 변경할 수 없습니다')
    }

    const updateData: any = {
      status,
      updatedBy: confirmedBy
    }

    if (status === SettlementStatus.CONFIRMED) {
      updateData.confirmedAt = new Date()
      updateData.confirmedBy = confirmedBy
    }

    return await this.prisma.settlement.update({
      where: { id: settlementId },
      data: updateData,
      include: {
        driver: true,
        items: true
      }
    })
  }
}

// Trip 시스템과의 호환성을 위한 별칭
export { CharterSettlementService as SettlementService }