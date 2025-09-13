import { z } from 'zod'

// Contract types that match Prisma schema
export const CONTRACT_TYPES = [
  {
    value: 'FIXED_DAILY',
    label: '고정(일대)',
    description: '일일 고정 운임 계산'
  },
  {
    value: 'FIXED_MONTHLY',
    label: '고정(월대)',
    description: '월 고정 운임 계산'
  },
  {
    value: 'CONSIGNED_MONTHLY',
    label: '지입(월대)',
    description: '월 지입 운임 계산'
  }
] as const

export type ContractType = typeof CONTRACT_TYPES[number]['value']

// Contract type labels for UI
export const ContractTypeLabels: Record<ContractType, string> = {
  'FIXED_DAILY': '고정(일대)',  
  'FIXED_MONTHLY': '고정(월대)',
  'CONSIGNED_MONTHLY': '지입(월대)'
}

// Weekday labels for UI
export const WeekdayLabels: Record<number, string> = {
  0: '일',
  1: '월', 
  2: '화',
  3: '수',
  4: '목',
  5: '금',
  6: '토'
}

// Vehicle types for UI (추가)
export const VEHICLE_TYPES = [
  { value: 'TRUCK_1T', label: '1톤 트럭' },
  { value: 'TRUCK_2_5T', label: '2.5톤 트럭' },
  { value: 'TRUCK_3T', label: '3톤 트럭' },
  { value: 'TRUCK_5T', label: '5톤 트럭' },
  { value: 'TRUCK_8T', label: '8톤 트럭' },
  { value: 'TRUCK_11T', label: '11톤 트럭' },
  { value: 'VAN', label: '승합차' },
  { value: 'SEDAN', label: '승용차' },
  { value: 'OTHER', label: '기타' }
] as const

export type VehicleType = typeof VEHICLE_TYPES[number]['value']

// 요일 패턴 (한글 요일을 숫자로 변환)
const weekdayPatternSchema = z
  .array(z.string())
  .min(1, '최소 하나의 요일을 선택해야 합니다')
  .max(7, '최대 7개의 요일까지 선택 가능합니다')
  .transform((weekdays) => {
    const weekdayMap: Record<string, number> = {
      '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6
    }
    return weekdays.map(day => weekdayMap[day]).filter(num => num !== undefined)
  })
  .refine(arr => arr.length > 0, {
    message: '유효한 요일을 선택해주세요'
  })
  .refine(arr => new Set(arr).size === arr.length, {
    message: '중복된 요일이 있습니다'
  })

// 운임 검증 스키마 - string 입력을 number로 변환
const fareSchema = z
  .union([z.string(), z.number()])
  .transform((val) => {
    if (typeof val === 'string') {
      const parsed = parseFloat(val)
      return isNaN(parsed) ? 0 : parsed
    }
    return val
  })
  .refine((val) => val >= 0, '운임은 0 이상이어야 합니다')
  .refine((val) => val <= 10000000, '운임은 1천만원 이하로 입력해주세요')

// Contract type 검증 스키마
const contractTypeSchema = z.enum(CONTRACT_TYPES.map(ct => ct.value) as [string, ...string[]], {
  errorMap: () => ({ message: '유효한 계약형태를 선택해주세요' })
})

// FixedRoute 생성 스키마 (Database schema와 일치)
export const CreateFixedRouteSchema = z.object({
  loadingPointId: z
    .string()
    .min(1, '상차지를 선택해주세요'),

  routeName: z
    .string()
    .min(1, '노선명을 입력해주세요')
    .max(100, '노선명은 100자 이하로 입력해주세요'),
  
  assignedDriverId: z
    .string()
    .optional(),
  
  weekdayPattern: z.array(z.number()).min(1, '최소 하나의 요일을 선택해야 합니다'),
  
  contractType: contractTypeSchema,
  
  // 실제 DB 스키마 필드들
  revenueMonthlyWithExpense: fareSchema.optional(),
  revenueDaily: fareSchema.optional(),
  revenueMonthly: fareSchema.optional(),
  costMonthlyWithExpense: fareSchema.optional(),
  costDaily: fareSchema.optional(),
  costMonthly: fareSchema.optional(),
    
  remarks: z
    .string()
    .max(500, '비고는 500자 이하로 입력해주세요')
    .optional()
})
.refine(data => {
  // 계약유형별 필수 필드 검증
  if (data.contractType === 'FIXED_DAILY') {
    return data.revenueDaily && data.costDaily &&
           data.revenueDaily >= data.costDaily
  }
  if (data.contractType === 'FIXED_MONTHLY') {
    return data.revenueMonthly && data.costMonthly &&
           data.revenueMonthly >= data.costMonthly
  }
  if (data.contractType === 'CONSIGNED_MONTHLY') {
    return data.revenueMonthly && data.costMonthly &&
           data.revenueMonthly >= data.costMonthly
  }
  return true
}, {
  message: '선택한 계약유형에 맞는 매출가와 매입가를 입력해주세요 (매출가 >= 매입가)',
  path: ['contractType']
})

// 단순한 테스트용 스키마
export const SimpleCreateFixedRouteSchema = z.object({
  loadingPointId: z.string().min(1, '상차지를 선택해주세요'),
  routeName: z.string().min(1, '노선명을 입력해주세요'),
  assignedDriverId: z.string().optional(),
  weekdayPattern: z.array(z.number()).min(1, '최소 하나의 요일을 선택해야 합니다'),
  contractType: contractTypeSchema,
  unitPrice: z.number().positive().optional(), // 간단한 단가 (테스트용)
  remarks: z.string().optional()
})

// FixedRoute 수정 스키마
export const UpdateFixedRouteSchema = z.object({
  loadingPointId: z
    .string()
    .min(1, '상차지를 선택해주세요')
    .optional(),

  routeName: z
    .string()
    .min(1, '노선명을 입력해주세요')
    .max(100, '노선명은 100자 이하로 입력해주세요')
    .optional(),
  
  assignedDriverId: z
    .string()
    .optional(),
  
  weekdayPattern: z.array(z.number()).min(1, '최소 하나의 요일을 선택해야 합니다').optional(),
  
  contractType: contractTypeSchema.optional(),
  
  // 실제 DB 스키마 필드들
  revenueMonthlyWithExpense: fareSchema.optional(),
  revenueDaily: fareSchema.optional(),
  revenueMonthly: fareSchema.optional(),
  costMonthlyWithExpense: fareSchema.optional(),
  costDaily: fareSchema.optional(),
  costMonthly: fareSchema.optional(),
    
  remarks: z
    .string()
    .max(500, '비고는 500자 이하로 입력해주세요')
    .optional()
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
  
  assignedDriverId: z
    .string()
    .optional(),
  
  weekday: z
    .string()
    .transform(val => parseInt(val))
    .refine(val => !isNaN(val) && val >= 0 && val <= 6, '요일은 0-6 사이의 숫자여야 합니다')
    .optional(),
  
  sortBy: z
    .enum(['routeName', 'centerName', 'contractType', 'createdAt', 'updatedAt'])
    .default('createdAt'),
  
  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc')
})

// 타입 정의
export type CreateFixedRouteData = z.infer<typeof CreateFixedRouteSchema>
export type SimpleCreateFixedRouteData = z.infer<typeof SimpleCreateFixedRouteSchema>
export type UpdateFixedRouteData = z.infer<typeof UpdateFixedRouteSchema>
export type GetFixedRoutesQuery = z.infer<typeof getFixedRoutesQuerySchema>

// 응답 타입 (실제 DB 스키마 기반)
export interface FixedRouteResponse {
  id: string
  routeName: string
  loadingPointId: string
  assignedDriverId?: string | null
  weekdayPattern: number[]
  contractType: ContractType
  
  // 실제 DB 스키마 필드들
  revenueMonthlyWithExpense?: number | null
  revenueDaily?: number | null
  revenueMonthly?: number | null
  costMonthlyWithExpense?: number | null
  costDaily?: number | null
  costMonthly?: number | null
  
  remarks?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy?: string | null
  
  // 관계 데이터 (실제 관계명 사용)
  loading_points?: {
    id: string
    centerName: string
    loadingPointName: string
  } | null
  
  drivers?: {
    id: string
    name: string
    phone: string
    vehicleNumber?: string | null
  } | null
  
  users?: {
    id: string
    name: string
  } | null
  
  // 계산된 필드들 (UI용)
  centerName?: string
  loadingPointName?: string
  assignedDriverName?: string | null
  driverPhone?: string | null
  vehicleNumber?: string | null
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
    .join('')
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
    case 'FIXED_DAILY':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'FIXED_MONTHLY':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'CONSIGNED_MONTHLY':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

