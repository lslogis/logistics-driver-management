import { PrismaClient, TripStatus, SettlementStatus, SettlementItemType } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { getYearMonthRange } from '../validations/settlement'

export interface SettlementCalculationResult {
  totalTrips: number
  totalBaseFare: Decimal
  totalDeductions: Decimal
  totalAdditions: Decimal
  finalAmount: Decimal
  items: SettlementItemDetail[]
}

export interface SettlementItemDetail {
  tripId?: string
  type: SettlementItemType
  description: string
  amount: Decimal
  date: Date
}

export class SettlementService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 월별 정산 계산 - 핵심 비즈니스 로직
   * 정확성이 최우선이므로 모든 경계 케이스를 고려
   */
  async calculateMonthlySettlement(
    driverId: string,
    yearMonth: string
  ): Promise<SettlementCalculationResult> {
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

    // 3. 해당 월의 운행 기록 조회
    const { start: startDate, end: endDate } = getYearMonthRange(yearMonth)

    const trips = await this.prisma.trip.findMany({
      where: {
        driverId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        routeTemplate: true,
        substituteDriver: true
      },
      orderBy: {
        date: 'asc'
      }
    })

    // 4. 정산 계산 수행
    return this.performCalculation(trips, yearMonth)
  }

  /**
   * 정산 계산 핵심 로직
   */
  private performCalculation(trips: any[], yearMonth: string): SettlementCalculationResult {
    const items: SettlementItemDetail[] = []
    let totalBaseFare = new Decimal(0)
    let totalDeductions = new Decimal(0)
    let totalAdditions = new Decimal(0)

    for (const trip of trips) {
      const tripDate = new Date(trip.date)
      const driverFare = new Decimal(trip.driverFare)

      switch (trip.status) {
        case TripStatus.COMPLETED:
          // 정상 운행 - 전액 지급
          items.push({
            tripId: trip.id,
            type: SettlementItemType.TRIP,
            description: `정상운행: ${trip.routeTemplate?.name || '커스텀노선'}`,
            amount: driverFare,
            date: tripDate
          })
          totalBaseFare = totalBaseFare.add(driverFare)
          break

        case TripStatus.ABSENCE:
          // 결행 - 10% 공제
          const absenceDeduction = trip.deductionAmount 
            ? new Decimal(trip.deductionAmount)
            : driverFare.mul(0.1)

          items.push({
            tripId: trip.id,
            type: SettlementItemType.TRIP,
            description: `결행운행: ${trip.routeTemplate?.name || '커스텀노선'}`,
            amount: driverFare,
            date: tripDate
          })

          items.push({
            tripId: trip.id,
            type: SettlementItemType.DEDUCTION,
            description: `결행공제: ${trip.absenceReason || '사유미기재'}`,
            amount: absenceDeduction.neg(), // 음수로 저장
            date: tripDate
          })

          totalBaseFare = totalBaseFare.add(driverFare)
          totalDeductions = totalDeductions.add(absenceDeduction)
          break

        case TripStatus.SUBSTITUTE:
          // 대차 - 원 기사 5% 공제, 대차 기사에게 80% 지급
          const substituteDeduction = trip.deductionAmount 
            ? new Decimal(trip.deductionAmount)
            : driverFare.mul(0.05)

          items.push({
            tripId: trip.id,
            type: SettlementItemType.TRIP,
            description: `대차운행: ${trip.routeTemplate?.name || '커스텀노선'}`,
            amount: driverFare,
            date: tripDate
          })

          items.push({
            tripId: trip.id,
            type: SettlementItemType.DEDUCTION,
            description: `대차공제: ${trip.substituteDriver?.name || '대차기사'}`,
            amount: substituteDeduction.neg(), // 음수로 저장
            date: tripDate
          })

          totalBaseFare = totalBaseFare.add(driverFare)
          totalDeductions = totalDeductions.add(substituteDeduction)
          break

        case TripStatus.SCHEDULED:
          // 예정 상태 - 아직 처리되지 않은 운행
          // 정산에 포함하지 않음
          break

        default:
          console.warn(`Unknown trip status: ${trip.status} for trip ${trip.id}`)
          break
      }
    }

    // 5. 최종 금액 계산
    const finalAmount = totalBaseFare.sub(totalDeductions).add(totalAdditions)

    return {
      totalTrips: trips.filter(t => t.status !== TripStatus.SCHEDULED).length,
      totalBaseFare,
      totalDeductions,
      totalAdditions,
      finalAmount,
      items
    }
  }

  /**
   * 정산 미리보기 생성
   */
  async createSettlementPreview(
    driverId: string,
    yearMonth: string
  ): Promise<SettlementCalculationResult> {
    return this.calculateMonthlySettlement(driverId, yearMonth)
  }

  /**
   * 정산 확정 처리
   */
  async confirmSettlement(
    settlementId: string,
    confirmedBy: string
  ): Promise<void> {
    const settlement = await this.prisma.settlement.findUnique({
      where: { id: settlementId }
    })

    if (!settlement) {
      throw new Error(`Settlement not found: ${settlementId}`)
    }

    if (settlement.status !== SettlementStatus.DRAFT) {
      throw new Error(`Settlement is already ${settlement.status}`)
    }

    await this.prisma.settlement.update({
      where: { id: settlementId },
      data: {
        status: SettlementStatus.CONFIRMED,
        confirmedAt: new Date(),
        confirmedBy
      }
    })
  }

  /**
   * 비상 잠금 해제 (관리자 전용)
   */
  async emergencyUnlock(
    settlementId: string,
    adminUserId: string,
    reason: string
  ): Promise<void> {
    // 관리자 권한 확인
    const admin = await this.prisma.user.findUnique({
      where: { id: adminUserId }
    })

    if (!admin || admin.role !== 'ADMIN') {
      throw new Error('Only administrators can perform emergency unlock')
    }

    const settlement = await this.prisma.settlement.findUnique({
      where: { id: settlementId }
    })

    if (!settlement) {
      throw new Error(`Settlement not found: ${settlementId}`)
    }

    // 감사 로그 기록
    await this.prisma.auditLog.create({
      data: {
        userId: adminUserId,
        userName: admin.name,
        action: 'UPDATE',
        entityType: 'Settlement',
        entityId: settlementId,
        changes: {
          status: { from: settlement.status, to: 'DRAFT' },
          reason: 'Emergency unlock by admin'
        },
        metadata: {
          emergency: true,
          reason,
          originalStatus: settlement.status,
          originalConfirmedAt: settlement.confirmedAt,
          originalConfirmedBy: settlement.confirmedBy
        }
      }
    })

    // 잠금 해제 실행
    await this.prisma.settlement.update({
      where: { id: settlementId },
      data: {
        status: SettlementStatus.DRAFT,
        confirmedAt: null,
        confirmedBy: null
      }
    })
  }
}