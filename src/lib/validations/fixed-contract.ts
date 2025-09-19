import { z } from 'zod'

// 계약 타입 enum
export const ContractTypeEnum = z.enum([
  'FIXED_DAILY',
  'FIXED_MONTHLY',
  'CONSIGNED_MONTHLY',
  'CHARTER_PER_RIDE'
])

// 계약 타입 라벨
export const CONTRACT_TYPE_LABELS = {
  FIXED_DAILY: '고정일당',
  FIXED_MONTHLY: '고정월급',
  CONSIGNED_MONTHLY: '위탁월급',
  CHARTER_PER_RIDE: '용차운임'
} as const

// 운행일 (0: 일요일, 1: 월요일, ..., 6: 토요일)
export const OPERATING_DAYS_LABELS = {
  0: '일',
  1: '월',
  2: '화',
  3: '수',
  4: '목',
  5: '금',
  6: '토'
} as const

// 고정계약 생성 스키마
export const createFixedContractSchema = z.object({
  driverId: z.string().optional().nullable(),
  loadingPointId: z.string().min(1, '센터를 선택해주세요'),
  routeName: z.string().min(1, '노선명을 입력해주세요').max(100, '노선명은 100자 이내로 입력해주세요'),
  centerContractType: ContractTypeEnum,
  driverContractType: ContractTypeEnum.optional().nullable(),
  centerAmount: z.number().min(0, '센터계약금액은 0원 이상이어야 합니다'),
  driverAmount: z.number().min(0, '기사계약금액은 0원 이상이어야 합니다').optional().nullable(),
  operatingDays: z.array(z.number().min(0).max(6)).default([]),
  startDate: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
  endDate: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
  specialConditions: z.string().max(500, '특약조건은 500자 이내로 입력해주세요').optional().nullable(),
  remarks: z.string().max(500, '비고는 500자 이내로 입력해주세요').optional().nullable(),
  isActive: z.boolean().default(true)
})

// 고정계약 수정 스키마
export const updateFixedContractSchema = createFixedContractSchema.partial()

// 고정계약 목록 조회 쿼리 스키마
export const getFixedContractsQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1),
  limit: z.string().transform(val => Math.min(parseInt(val) || 10, 100)),
  search: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  contractType: ContractTypeEnum.optional(),
  loadingPointId: z.string().optional(),
  driverId: z.string().optional(),
  sortBy: z.enum(['routeName', 'centerAmount', 'startDate', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

// 타입 추출
export type CreateFixedContractData = z.infer<typeof createFixedContractSchema>
export type UpdateFixedContractData = z.infer<typeof updateFixedContractSchema>
export type GetFixedContractsQuery = z.infer<typeof getFixedContractsQuerySchema>
export type ContractType = z.infer<typeof ContractTypeEnum>

// 응답 타입
export interface FixedContractResponse {
  id: string
  driverId: string | null
  loadingPointId: string
  routeName: string
  centerContractType: ContractType
  driverContractType: ContractType | null
  centerAmount: number
  driverAmount: number | null
  operatingDays: number[]
  startDate: string | null
  endDate: string | null
  specialConditions: string | null
  remarks: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: string | null
  // Relations
  driver?: {
    id: string
    name: string
    phone: string
    vehicleNumber: string
  }
  loadingPoint?: {
    id: string
    centerName: string
    loadingPointName: string
  }
}

export interface FixedContractsListResponse {
  contracts: FixedContractResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}