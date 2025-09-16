/**
 * @deprecated 정산 서비스가 Charter 시스템으로 이전되었습니다.
 * 
 * Trip 기반 정산은 Charter 기반 정산으로 대체되었습니다.
 * 기존 코드의 호환성을 위해 임시로 재라우팅을 제공하지만,
 * 가능한 빨리 새로운 CharterSettlementService로 업데이트하세요.
 * 
 * 마이그레이션 가이드:
 * - import { SettlementService } from '@/lib/services/settlement.service'
 *   → import { CharterSettlementService } from '@/lib/services/settlement-charter.service'
 * - totalTrips → totalCharters
 * - tripId → charterId
 */

import { PrismaClient, SettlementStatus, SettlementItemType } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { getYearMonthRange } from '../validations/settlement'
import { CharterSettlementService, CharterSettlementCalculationResult } from './settlement-charter.service'

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
  private charterService: CharterSettlementService

  constructor(private prisma: PrismaClient) {
    this.charterService = new CharterSettlementService(prisma)
    console.warn('⚠️ DEPRECATED: SettlementService is deprecated. Use CharterSettlementService instead.')
  }

  /**
   * 월별 정산 계산 - Charter 시스템으로 리다이렉트
   * @deprecated Use CharterSettlementService.calculateMonthlySettlement instead
   */
  async calculateMonthlySettlement(
    driverId: string,
    yearMonth: string
  ): Promise<SettlementCalculationResult> {
    console.warn('⚠️ DEPRECATED: Trip-based settlement calculation is deprecated. Redirecting to Charter-based calculation.')
    
    // Charter 정산 서비스 호출
    const charterResult = await this.charterService.calculateMonthlySettlement(driverId, yearMonth)
    
    // 결과를 Trip 포맷으로 변환 (backward compatibility)
    return {
      totalTrips: charterResult.totalCharters,
      totalBaseFare: charterResult.totalBaseFare,
      totalDeductions: charterResult.totalDeductions,
      totalAdditions: charterResult.totalAdditions,
      finalAmount: charterResult.finalAmount,
      items: charterResult.items.map(item => ({
        tripId: item.charterId, // charterId를 tripId로 매핑
        type: item.type,
        description: item.description,
        amount: item.amount,
        date: item.date
      }))
    }
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
        case 'COMPLETED':
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

        case 'ABSENCE':
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

        case 'SUBSTITUTE':
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

        case 'SCHEDULED':
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
      totalTrips: trips.filter(t => t.status !== 'SCHEDULED').length,
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