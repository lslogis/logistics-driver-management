import { z } from 'zod'

// Vehicle types enum
export const VEHICLE_TYPES = [
  { value: '5TON', label: '5톤' },
  { value: '8TON', label: '8톤' },
  { value: '11TON', label: '11톤' },
  { value: '15TON', label: '15톤' },
  { value: '25TON', label: '25톤' },
  { value: 'TRAILER', label: '트레일러' },
  { value: 'CARGO', label: '카고' },
  { value: 'WING', label: '윙바디' },
  { value: 'REFRIGERATED', label: '냉동차' },
  { value: 'TANK', label: '탱크로리' },
  { value: 'OTHER', label: '기타' }
] as const

// Contract types enum
export const CONTRACT_TYPES = [
  { 
    value: 'DAILY', 
    label: '고정회별',
    description: '일일 회별 운행에 따른 운임 계산'
  },
  { 
    value: 'MONTHLY', 
    label: '고정월별',
    description: '월 단위 고정 운임 + 회별 추가 운임'
  },
  { 
    value: 'COMPLETE', 
    label: '고정지입',
    description: '월 단위 완전 지입 계약'
  }
] as const

export type VehicleType = typeof VEHICLE_TYPES[number]['value']
export type ContractType = typeof CONTRACT_TYPES[number]['value']

// 요일 패턴 (0=일요일, 1=월요일, ..., 6=토요일)
const weekdayPatternSchema = z
  .array(z.number().int().min(0).max(6), {
    errorMap: () => ({ message: '요일은 0-6 사이의 숫자여야 합니다 (0=일요일, 6=토요일)' })
  })
  .min(1, '최소 하나의 요일을 선택해야 합니다')
  .max(7, '최대 7개의 요일까지 선택 가능합니다')
  .refine(arr => new Set(arr).size === arr.length, {
    message: '중복된 요일이 있습니다'
  })

// 운임 검증 스키마
const fareSchema = z
  .number({ 
    required_error: '운임을 입력해주세요',
    invalid_type_error: '운임은 숫자여야 합니다'
  })
  .positive('운임은 양수여야 합니다')
  .max(10000000, '운임은 1천만원 이하로 입력해주세요') // 10M 한도

// Vehicle type 검증 스키마
const vehicleTypeSchema = z.enum(VEHICLE_TYPES.map(vt => vt.value) as [string, ...string[]], {
  errorMap: () => ({ message: '유효한 차종을 선택해주세요' })
})

// Contract type 검증 스키마
const contractTypeSchema = z.enum(CONTRACT_TYPES.map(ct => ct.value) as [string, ...string[]], {
  errorMap: () => ({ message: '유효한 계약형태를 선택해주세요' })
})

// FixedRoute 생성 스키마
export const createFixedRouteSchema = z.object({
  courseName: z
    .string()
    .min(1, '코스명을 입력해주세요')
    .max(100, '코스명은 100자 이하로 입력해주세요'),
  
  loadingPoint: z
    .string()
    .min(1, '상차지를 입력해주세요')
    .max(200, '상차지는 200자 이하로 입력해주세요'),
  
  vehicleType: vehicleTypeSchema,
  
  contractType: contractTypeSchema,
  
  assignedDriverId: z
    .string()
    .uuid('올바른 기사 ID가 아닙니다')
    .optional(),
  
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식이 아닙니다 (YYYY-MM-DD)')
    .refine(dateStr => {
      const date = new Date(dateStr)
      return date instanceof Date && !isNaN(date.getTime())
    }, '유효한 날짜를 입력해주세요'),
  
  weekdayPattern: weekdayPatternSchema,
  
  billingFare: fareSchema,
  
  driverFare: fareSchema,
  
  monthlyBaseFare: z
    .number()
    .min(0, '월정액은 0 이상이어야 합니다')
    .max(50000000, '월정액은 5천만원 이하로 입력해주세요')
    .optional(),
  
  distance: z
    .number()
    .positive('거리는 양수여야 합니다')
    .max(2000, '거리는 2000km 이하로 입력해주세요')
    .optional(),
    
  remarks: z
    .string()
    .max(500, '비고는 500자 이하로 입력해주세요')
    .optional(),
  
  isActive: z
    .boolean()
    .optional()
    .default(true)
})
.refine(data => data.billingFare >= data.driverFare, {
  message: '청구운임은 기사운임보다 크거나 같아야 합니다',
  path: ['billingFare']
})
.refine(data => {
  // MONTHLY 또는 COMPLETE 계약의 경우 monthlyBaseFare 필수
  if ((data.contractType === 'MONTHLY' || data.contractType === 'COMPLETE') && 
      (data.monthlyBaseFare === undefined || data.monthlyBaseFare === 0)) {
    return false
  }
  return true
}, {
  message: '월별 및 지입 계약의 경우 월정액을 입력해주세요',
  path: ['monthlyBaseFare']
})

// FixedRoute 수정 스키마 (모든 필드가 선택적)
export const updateFixedRouteSchema = z.object({
  courseName: z
    .string()
    .min(1, '코스명을 입력해주세요')
    .max(100, '코스명은 100자 이하로 입력해주세요')
    .optional(),
  
  loadingPoint: z
    .string()
    .min(1, '상차지를 입력해주세요')
    .max(200, '상차지는 200자 이하로 입력해주세요')
    .optional(),
  
  vehicleType: vehicleTypeSchema.optional(),
  
  contractType: contractTypeSchema.optional(),
  
  assignedDriverId: z
    .string()
    .uuid('올바른 기사 ID가 아닙니다')
    .optional(),
  
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식이 아닙니다 (YYYY-MM-DD)')
    .refine(dateStr => {
      const date = new Date(dateStr)
      return date instanceof Date && !isNaN(date.getTime())
    }, '유효한 날짜를 입력해주세요')
    .optional(),
  
  weekdayPattern: weekdayPatternSchema.optional(),
  
  billingFare: fareSchema.optional(),
  
  driverFare: fareSchema.optional(),
  
  monthlyBaseFare: z
    .number()
    .min(0, '월정액은 0 이상이어야 합니다')
    .max(50000000, '월정액은 5천만원 이하로 입력해주세요')
    .optional(),
  
  distance: z
    .number()
    .positive('거리는 양수여야 합니다')
    .max(2000, '거리는 2000km 이하로 입력해주세요')
    .optional(),
    
  remarks: z
    .string()
    .max(500, '비고는 500자 이하로 입력해주세요')
    .optional(),
  
  isActive: z
    .boolean()
    .optional()
})
.refine((data: any) => {
  // 청구운임과 기사운임이 모두 제공된 경우에만 검증
  if (data.billingFare !== undefined && data.driverFare !== undefined) {
    return data.billingFare >= data.driverFare
  }
  return true
}, {
  message: '청구운임은 기사운임보다 크거나 같아야 합니다',
  path: ['billingFare']
})

// FixedRoute 조회 쿼리 스키마
export const getFixedRoutesQuerySchema = z.object({
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
  
  isActive: z
    .string()
    .transform(val => val === 'true')
    .optional(),
  
  contractType: contractTypeSchema.optional(),
  
  vehicleType: vehicleTypeSchema.optional(),
  
  assignedDriverId: z
    .string()
    .uuid('올바른 기사 ID가 아닙니다')
    .optional(),
  
  weekday: z
    .string()
    .transform(val => parseInt(val))
    .refine(val => !isNaN(val) && val >= 0 && val <= 6, '요일은 0-6 사이의 숫자여야 합니다')
    .optional(),
  
  sortBy: z
    .enum(['courseName', 'loadingPoint', 'contractType', 'vehicleType', 'startDate', 'createdAt', 'updatedAt'])
    .default('createdAt'),
  
  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc')
})

// 타입 정의
export type CreateFixedRouteData = z.infer<typeof createFixedRouteSchema>
export type UpdateFixedRouteData = z.infer<typeof updateFixedRouteSchema>
export type GetFixedRoutesQuery = z.infer<typeof getFixedRoutesQuerySchema>

// 응답 타입
export interface FixedRouteResponse {
  id: string
  courseName: string
  loadingPoint: string
  vehicleType: VehicleType
  contractType: ContractType
  assignedDriverId?: string | null
  startDate: string
  weekdayPattern: number[]
  billingFare: string // Decimal as string
  driverFare: string // Decimal as string
  monthlyBaseFare?: string | null // Decimal as string
  distance?: number | null
  remarks?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  
  // 관계 데이터
  assignedDriver?: {
    id: string
    name: string
    phone: string
    vehicleNumber: string
  } | null
  
  // 통계 데이터
  _count: {
    trips: number
  }
}

export interface FixedRoutesListResponse {
  fixedRoutes: FixedRouteResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// 요일 헬퍼 함수
export const getWeekdayName = (weekday: number): string => {
  const names = ['일', '월', '화', '수', '목', '금', '토']
  return names[weekday] || '알수없음'
}

export const getWeekdayNames = (weekdays: number[]): string => {
  return weekdays
    .sort()
    .map(getWeekdayName)
    .join(', ')
}

export const isFixedRouteActiveOnWeekday = (weekdayPattern: number[], targetWeekday: number): boolean => {
  return weekdayPattern.includes(targetWeekday)
}

// Contract type helpers
export const getContractTypeLabel = (contractType: ContractType): string => {
  return CONTRACT_TYPES.find(ct => ct.value === contractType)?.label || '알수없음'
}

export const getContractTypeDescription = (contractType: ContractType): string => {
  return CONTRACT_TYPES.find(ct => ct.value === contractType)?.description || ''
}

export const getContractTypeColor = (contractType: ContractType): string => {
  switch (contractType) {
    case 'DAILY':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'MONTHLY':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'COMPLETE':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

// Vehicle type helpers
export const getVehicleTypeLabel = (vehicleType: VehicleType): string => {
  return VEHICLE_TYPES.find(vt => vt.value === vehicleType)?.label || '알수없음'
}