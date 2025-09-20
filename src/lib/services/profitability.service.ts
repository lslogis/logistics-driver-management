/**
 * 수익성 계산 서비스 - 단일 소스 오브 트루스
 * 모든 컴포넌트에서 일관된 마진 계산을 위한 중앙화된 서비스
 */

import { Request } from '@/types'

export interface ProfitabilityResult {
  centerBilling: number
  driverFee: number
  margin: number
  marginRate: number
  status: 'profit' | 'break-even' | 'loss'
  statusLabel: string
  statusColor: string
  recommendation?: string
}

export interface ProfitabilityThresholds {
  profitThreshold: number    // 수익 기준 (기본: 20%)
  breakEvenThreshold: number // 손익분기점 (기본: 0%)
}

const DEFAULT_THRESHOLDS: ProfitabilityThresholds = {
  profitThreshold: 20,
  breakEvenThreshold: 0
}

/**
 * 요청의 수익성을 계산하는 핵심 함수
 */
export function calculateProfitability(
  request: Request, 
  thresholds: ProfitabilityThresholds = DEFAULT_THRESHOLDS
): ProfitabilityResult {
  // 센터 청구 금액 계산 (우선순위: centerBillingTotal > 개별 요금 합계)
  const centerBilling = request.centerBillingTotal || 
    ((request.baseFare || 0) + 
     (request.extraStopFee || 0) + 
     (request.extraRegionFee || 0) + 
     (request.extraAdjustment || 0))
  
  // 기사 운임
  const driverFee = request.driverFee || 0
  
  // 마진 계산
  const margin = centerBilling - driverFee
  const marginRate = centerBilling > 0 ? (margin / centerBilling) * 100 : 0
  
  // 수익성 상태 결정
  let status: 'profit' | 'break-even' | 'loss'
  let statusLabel: string
  let statusColor: string
  let recommendation: string | undefined
  
  if (marginRate >= thresholds.profitThreshold) {
    status = 'profit'
    statusLabel = '✅ 수익'
    statusColor = 'text-green-600 bg-green-50 border-green-200'
  } else if (marginRate >= thresholds.breakEvenThreshold) {
    status = 'break-even'
    statusLabel = '⚠️ 보통'
    statusColor = 'text-yellow-600 bg-yellow-50 border-yellow-200'
    recommendation = `마진율이 ${marginRate.toFixed(1)}%로 낮습니다. 기사 운임 조정을 고려해보세요.`
  } else {
    status = 'loss'
    statusLabel = '❌ 손실'
    statusColor = 'text-red-600 bg-red-50 border-red-200'
    recommendation = `손실 발생! 현재 마진율 ${marginRate.toFixed(1)}%. 즉시 운임 조정이 필요합니다.`
  }
  
  return {
    centerBilling,
    driverFee,
    margin,
    marginRate,
    status,
    statusLabel,
    statusColor,
    recommendation
  }
}

/**
 * 권장 기사 운임 계산
 */
export function calculateRecommendedDriverFee(
  request: Request,
  targetMarginRate: number = 25 // 목표 마진율 기본값 25%
): number {
  const centerBilling = request.centerBillingTotal || 
    ((request.baseFare || 0) + 
     (request.extraStopFee || 0) + 
     (request.extraRegionFee || 0) + 
     (request.extraAdjustment || 0))
  
  if (centerBilling <= 0) return 0
  
  // 목표 마진율을 위한 권장 기사 운임 계산
  const recommendedDriverFee = centerBilling * (1 - targetMarginRate / 100)
  
  return Math.round(recommendedDriverFee / 1000) * 1000 // 1000원 단위로 반올림
}

/**
 * 수익성 상태에 따른 스타일 클래스 반환
 */
export function getProfitabilityStyles(marginRate: number): {
  badgeClass: string
  textClass: string
  bgClass: string
} {
  if (marginRate >= 20) {
    return {
      badgeClass: 'bg-green-100 text-green-800 border-green-200',
      textClass: 'text-green-600',
      bgClass: 'bg-green-50'
    }
  } else if (marginRate >= 0) {
    return {
      badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      textClass: 'text-yellow-600',
      bgClass: 'bg-yellow-50'
    }
  } else {
    return {
      badgeClass: 'bg-red-100 text-red-800 border-red-200',
      textClass: 'text-red-600',
      bgClass: 'bg-red-50'
    }
  }
}

/**
 * 마진율에 따른 아이콘 반환
 */
export function getProfitabilityIcon(marginRate: number): string {
  if (marginRate >= 20) return '🟢'
  if (marginRate >= 0) return '🟡'
  return '🔴'
}

/**
 * 수익성 요약 텍스트 생성
 */
export function generateProfitabilitySummary(result: ProfitabilityResult): string {
  const { centerBilling, driverFee, margin, marginRate, status } = result
  
  const billingText = centerBilling.toLocaleString()
  const feeText = driverFee.toLocaleString()
  const marginText = margin.toLocaleString()
  const rateText = marginRate.toFixed(1)
  
  switch (status) {
    case 'profit':
      return `청구 ${billingText}원 - 기사비 ${feeText}원 = 수익 ${marginText}원 (${rateText}%) 👍`
    case 'break-even':
      return `청구 ${billingText}원 - 기사비 ${feeText}원 = 마진 ${marginText}원 (${rateText}%) ⚠️`
    case 'loss':
      return `청구 ${billingText}원 - 기사비 ${feeText}원 = 손실 ${marginText}원 (${rateText}%) ❌`
    default:
      return `수익성 계산 불가`
  }
}