import { z } from 'zod'
import { SettlementStatus } from '@prisma/client'

// 정산 생성 스키마
export const createSettlementSchema = z.object({
  driverId: z
    .string()
    .uuid('올바른 기사 ID가 아닙니다'),
  
  yearMonth: z
    .string()
    .regex(/^\d{4}-\d{2}$/, '월 형식은 YYYY-MM 이어야 합니다'),
  
  status: z
    .nativeEnum(SettlementStatus, {
      errorMap: () => ({ message: '올바른 정산 상태를 선택해주세요' })
    })
    .default('DRAFT'),
  
  remarks: z
    .string()
    .max(1000, '비고는 1000자 이하로 입력해주세요')
    .optional()
})

// 정산 수정 스키마
export const updateSettlementSchema = z.object({
  status: z
    .nativeEnum(SettlementStatus)
    .optional(),
  
  remarks: z
    .string()
    .max(1000, '비고는 1000자 이하로 입력해주세요')
    .optional()
})

// 정산 조회 쿼리 스키마
export const getSettlementsQuerySchema = z.object({
  page: z
    .string()
    .transform(val => parseInt(val))
    .refine(val => !isNaN(val) && val > 0, '페이지는 1 이상의 숫자여야 합니다')
    .default('1'),
  
  limit: z
    .string()
    .transform(val => parseInt(val))
    .refine(val => !isNaN(val) && val > 0 && val <= 100, '페이지 크기는 1-100 사이여야 합니다')
    .default('20'),
  
  search: z
    .string()
    .max(100, '검색어는 100자 이하로 입력해주세요')
    .optional(),
  
  status: z
    .nativeEnum(SettlementStatus)
    .optional(),
  
  driverId: z
    .string()
    .uuid('올바른 기사 ID가 아닙니다')
    .optional(),
  
  yearMonth: z
    .string()
    .regex(/^\d{4}-\d{2}$/, '월 형식은 YYYY-MM 이어야 합니다')
    .optional(),
  
  confirmedBy: z
    .string()
    .uuid('올바른 확정자 ID가 아닙니다')
    .optional(),
  
  sortBy: z
    .enum(['yearMonth', 'status', 'totalBaseFare', 'totalDeductions', 'finalAmount', 'createdAt', 'updatedAt', 'confirmedAt'])
    .default('yearMonth'),
  
  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc')
})

// 정산 확정 스키마
export const confirmSettlementSchema = z.object({
  remarks: z
    .string()
    .max(1000, '비고는 1000자 이하로 입력해주세요')
    .optional()
})

// 정산 미리보기 스키마
export const previewSettlementSchema = z.object({
  driverId: z
    .string()
    .uuid('올바른 기사 ID가 아닙니다'),
  
  yearMonth: z
    .string()
    .regex(/^\d{4}-\d{2}$/, '월 형식은 YYYY-MM 이어야 합니다')
})

// 타입 정의
export type CreateSettlementData = z.infer<typeof createSettlementSchema>
export type UpdateSettlementData = z.infer<typeof updateSettlementSchema>
export type GetSettlementsQuery = z.infer<typeof getSettlementsQuerySchema>
export type ConfirmSettlementData = z.infer<typeof confirmSettlementSchema>
export type PreviewSettlementData = z.infer<typeof previewSettlementSchema>

// 정산 세부 항목 타입
export interface SettlementItem {
  tripId: string
  date: string
  status: string
  routeName?: string
  loadingPoint?: string
  unloadingPoint?: string
  driverFare: string
  billingFare: string
  deductionAmount?: string
  isSubstitute: boolean
  substituteDriverId?: string | null
  substituteDriverName?: string
  remarks?: string | null
}

// 정산 응답 타입
export interface SettlementResponse {
  id: string
  yearMonth: string
  status: SettlementStatus
  totalTrips: number
  totalBaseFare: string // Decimal as string
  totalDeductions: string // Decimal as string
  totalAdditions: string // Decimal as string
  finalAmount: string // Decimal as string
  createdAt: string
  updatedAt: string
  confirmedAt?: string | null
  paidAt?: string | null
  
  // 관계 데이터
  driver: {
    id: string
    name: string
    phone: string
  }
  
  confirmer?: {
    id: string
    name: string
    email: string
  } | null
  
  creator?: {
    id: string
    name: string
    email: string
  } | null
  
  // 정산 세부 항목
  items: SettlementItem[]
}

export interface SettlementsListResponse {
  settlements: SettlementResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// 정산 미리보기 응답 타입
export interface SettlementPreviewResponse {
  driverId: string
  yearMonth: string
  driver: {
    id: string
    name: string
    phone: string
  }
  items: SettlementItem[]
  calculation: {
    totalTrips: number
    totalBaseFare: string
    totalDeductions: string
    totalAdditions: string
    finalAmount: string
  }
  canConfirm: boolean
  warnings: string[]
}

// 정산 상태 헬퍼 함수
export const getSettlementStatusName = (status: SettlementStatus): string => {
  const names = {
    DRAFT: '임시저장',
    CONFIRMED: '확정',
    PAID: '지급완료'
  }
  return names[status]
}

export const getSettlementStatusColor = (status: SettlementStatus): string => {
  const colors = {
    DRAFT: 'gray',
    CONFIRMED: 'blue',
    PAID: 'green'
  }
  return colors[status]
}

export const canEditSettlement = (status: SettlementStatus): boolean => {
  // 임시저장 상태만 수정 가능
  return status === 'DRAFT'
}

export const canConfirmSettlement = (status: SettlementStatus): boolean => {
  // 임시저장 상태만 확정 가능
  return status === 'DRAFT'
}

export const canDeleteSettlement = (status: SettlementStatus): boolean => {
  // 임시저장 상태만 삭제 가능
  return status === 'DRAFT'
}

// 월 헬퍼 함수
export const formatYearMonth = (yearMonth: string): string => {
  const [year, monthNum] = yearMonth.split('-')
  return `${year}년 ${parseInt(monthNum)}월`
}

export const getYearMonthRange = (yearMonth: string): { start: Date; end: Date } => {
  const [year, monthNum] = yearMonth.split('-')
  const start = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
  const end = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59, 999)
  return { start, end }
}