import { z } from 'zod'

// 클라이언트에서도 사용 가능한 요금 타입 스키마 (Prisma 의존 제거)
export const RateDetailTypeSchema = z.enum(['BASE', 'CALL_FEE', 'WAYPOINT_FEE', 'SPECIAL'])
export type RateDetailType = z.infer<typeof RateDetailTypeSchema>

// 요금 금액 검증 스키마
const amountSchema = z
  .number({ 
    required_error: '금액을 입력해주세요',
    invalid_type_error: '금액은 숫자여야 합니다'
  })
  .nonnegative('금액은 0 이상이어야 합니다')
  .max(10000000, '금액은 1천만원 이하로 입력해주세요')

// 요금 상세 생성 스키마
const rateDetailSchema = z.object({
  type: RateDetailTypeSchema,
  region: z
    .string()
    .max(50, '지역명은 50자 이하로 입력해주세요')
    .optional(),
  amount: amountSchema,
  conditions: z
    .string()
    .max(500, '조건은 500자 이하로 입력해주세요')
    .optional(),
  isActive: z
    .boolean()
    .default(true)
})
.refine(data => {
  // WAYPOINT_FEE 타입인 경우 region 필수
  if (data.type === 'WAYPOINT_FEE' && !data.region) {
    return false
  }
  return true
}, {
  message: '경유비 타입인 경우 지역명이 필요합니다',
  path: ['region']
})

// 요금 마스터 생성 스키마
export const createRateSchema = z.object({
  centerName: z
    .string()
    .min(1, '센터명을 입력해주세요')
    .max(100, '센터명은 100자 이하로 입력해주세요')
    .transform(str => str.trim()),
  
  tonnage: z
    .number({ 
      required_error: '톤수를 입력해주세요',
      invalid_type_error: '톤수는 숫자여야 합니다'
    })
    .positive('톤수는 양수여야 합니다')
    .max(50, '톤수는 50톤 이하로 입력해주세요'),
  
  rateDetails: z
    .array(rateDetailSchema)
    .min(1, '최소 1개의 요금 정보가 필요합니다')
    .max(20, '요금 정보는 최대 20개까지 입력 가능합니다')
})
.refine(data => {
  // BASE 타입이 최소 1개는 있어야 함
  const hasBaseRate = data.rateDetails.some(detail => detail.type === 'BASE')
  return hasBaseRate
}, {
  message: '기본요금(BASE) 타입이 최소 1개 필요합니다',
  path: ['rateDetails']
})

// 요금 마스터 수정 스키마
export const updateRateSchema = z.object({
  centerName: z
    .string()
    .min(1, '센터명을 입력해주세요')
    .max(100, '센터명은 100자 이하로 입력해주세요')
    .transform(str => str.trim())
    .optional(),
  
  tonnage: z
    .number()
    .positive('톤수는 양수여야 합니다')
    .max(50, '톤수는 50톤 이하로 입력해주세요')
    .optional(),
  
  isActive: z
    .boolean()
    .optional(),
  
  rateDetails: z
    .array(z.object({
      type: RateDetailTypeSchema,
      region: z.string().optional(),
      amount: z.number().positive('금액은 양수여야 합니다'),
      conditions: z.string().optional(),
      isActive: z.boolean().default(true),
      id: z.string().optional(), // 수정 시 기존 ID
      _action: z.enum(['create', 'update', 'delete']).optional() // 명시적 액션
    }))
    .max(20, '요금 정보는 최대 20개까지 입력 가능합니다')
    .optional()
})

// 요금 조회 쿼리 스키마
export const getRatesQuerySchema = z.object({
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
  
  tonnage: z
    .string()
    .transform(val => parseFloat(val))
    .refine(val => !isNaN(val) && val > 0, '톤수는 양수여야 합니다')
    .optional(),
  
  isActive: z
    .string()
    .transform(val => val === 'true')
    .optional(),
  
  sortBy: z
    .enum(['centerName', 'tonnage', 'createdAt', 'updatedAt'])
    .default('createdAt'),
  
  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc')
})

// 요금 계산 쿼리 스키마
export const calculateRateQuerySchema = z.object({
  center: z
    .string()
    .min(1, '센터명이 필요합니다')
    .max(100, '센터명은 100자 이하로 입력해주세요')
    .transform(str => str.trim()),
  
  tonnage: z
    .coerce.number({
      required_error: '톤수가 필요합니다',
      invalid_type_error: '톤수는 숫자여야 합니다'
    })
    .positive('톤수는 양수여야 합니다')
    .max(50, '톤수는 50톤 이하로 입력해주세요'),
  
  regions: z
    .string()
    .optional()
    .transform(str => 
      str ? str.split(',').map(s => s.trim()).filter(Boolean) : undefined
    ),

  date: z
    .string()
    .optional()
    .transform(str => str ? new Date(str) : new Date())
    .refine(date => !isNaN(date.getTime()), '유효한 날짜를 입력해주세요'),

  totalStops: z
    .string()
    .optional()
    .transform(str => str ? parseInt(str) : undefined)
    .refine(val => val === undefined || (val >= 1 && val <= 99), '총착수는 1-99 사이여야 합니다'),

  distinctRegions: z
    .string()
    .optional()
    .transform(str => str ? parseInt(str) : undefined)
    .refine(val => val === undefined || (val >= 0 && val <= 99), '고유 지역 수는 0-99 사이여야 합니다')
})

// 요금 변화 영향 분석 쿼리 스키마
export const rateImpactSimulationQuerySchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'from 형식은 YYYY-MM 이어야 합니다 (예: 2024-08)')
    .transform(str => str.trim()),
  
  to: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'to 형식은 YYYY-MM 이어야 합니다 (예: 2024-09)')
    .transform(str => str.trim()),
  
  center: z
    .string()
    .max(100, '센터명은 100자 이하로 입력해주세요')
    .optional()
    .transform(str => str?.trim()),
  
  tonnage: z
    .string()
    .transform(val => val ? parseFloat(val) : undefined)
    .refine(val => val === undefined || (!isNaN(val) && val > 0), '톤수는 양수여야 합니다')
    .optional()
})
.refine(data => {
  const fromDate = new Date(data.from + '-01')
  const toDate = new Date(data.to + '-01')
  return fromDate <= toDate
}, {
  message: 'from 기간은 to 기간보다 이전이어야 합니다',
  path: ['from']
})
.refine(data => {
  const fromDate = new Date(data.from + '-01')
  const toDate = new Date(data.to + '-01')
  const diffMonths = (toDate.getFullYear() - fromDate.getFullYear()) * 12 + (toDate.getMonth() - fromDate.getMonth())
  return diffMonths <= 12
}, {
  message: '비교 기간은 최대 12개월까지 가능합니다',
  path: ['to']
})

// 타입 정의
export type CreateRateData = z.infer<typeof createRateSchema>
export type UpdateRateData = z.infer<typeof updateRateSchema>
export type GetRatesQuery = z.infer<typeof getRatesQuerySchema>
export type CalculateRateQuery = z.infer<typeof calculateRateQuerySchema>
export type RateImpactSimulationQuery = z.infer<typeof rateImpactSimulationQuerySchema>

// 응답 타입
export interface RateDetailResponse {
  id: string
  type: RateDetailType
  region?: string | null
  amount: string // Decimal as string
  conditions?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface RateMasterResponse {
  id: string
  centerName: string
  tonnage: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  rateDetails: RateDetailResponse[]
  creator?: {
    id: string
    name: string
  } | null
}

export interface RatesListResponse {
  rateMasters: RateMasterResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface CalculateRateResponse {
  rateMaster: {
    id: string
    centerName: string
    tonnage: number
  }
  breakdown: {
    baseFare: number
    callFee: number
    waypointFee: number
    specialFees: Array<{
      type: string
      amount: number
      description: string
    }>
    total: number
  }
  calculation: {
    baseRate: RateDetailResponse
    callRate?: RateDetailResponse
    waypointRates: Array<{
      region: string
      rate: RateDetailResponse
    }>
    specialRates: RateDetailResponse[]
  }
}

export interface RateSuggestions {
  availableCenters: string[]
  availableTonnages: number[]
}

// 요금 변화 영향 분석 응답 타입
export interface RateImpactCenterAnalysis {
  centerName: string
  tonnage: number
  oldRate: number
  newRate: number
  tripCount: number
  impactBilling: number
  impactDriver: number
  impactPercent: number
}

export interface RateImpactOutlier {
  centerName: string
  tonnage: number
  reason: 'RATE_INCREASE_50PCT' | 'RATE_DECREASE_50PCT' | 'NEW_CENTER' | 'REMOVED_CENTER' | 'VOLUME_SPIKE'
  oldRate: number | null
  newRate: number | null
  impactAmount: number
  additionalInfo?: string
}

export interface RateImpactSummary {
  periodsCompared: string
  totalTrips: number
  centersAffected: number
  netImpactPercent: number
  avgRateChangePercent: number
  totalVolumeChange: number
}

export interface RateImpactSimulationResponse {
  deltaBilling: number
  deltaDriver: number
  byCenter: RateImpactCenterAnalysis[]
  outliers: RateImpactOutlier[]
  summary: RateImpactSummary
}

// 요금 타입 헬퍼 함수
export const getRateTypeDisplayName = (type: RateDetailType): string => {
  const names = {
    BASE: '기본요금',
    CALL_FEE: '콜비',
    WAYPOINT_FEE: '경유비',
    SPECIAL: '특수요금'
  }
  return names[type]
}

export const getRateTypeColor = (type: RateDetailType): string => {
  const colors = {
    BASE: 'blue',
    CALL_FEE: 'green',
    WAYPOINT_FEE: 'orange',
    SPECIAL: 'purple'
  }
  return colors[type]
}
