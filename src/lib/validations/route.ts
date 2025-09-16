import { z } from 'zod'

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

// 노선 생성 스키마
export const createRouteSchema = z.object({
  name: z
    .string()
    .min(1, '노선명을 입력해주세요')
    .max(100, '노선명은 100자 이하로 입력해주세요'),
  
  loadingPoint: z
    .string()
    .min(1, '상차지를 입력해주세요')
    .max(200, '상차지는 200자 이하로 입력해주세요'),
  
  distance: z
    .number()
    .positive('거리는 양수여야 합니다')
    .max(2000, '거리는 2000km 이하로 입력해주세요')
    .optional(),
  
  driverFare: fareSchema,
  
  billingFare: fareSchema,
  
  weekdayPattern: weekdayPatternSchema,
  
  defaultDriverId: z.preprocess((v) => {
    if (v === undefined || v === null) return null;
    const s = String(v).trim();
    return s === '' || s.toLowerCase() === 'null' || s === '__none__' ? null : s;
  }, z.string().uuid('올바른 기사 ID가 아닙니다').nullable().optional()),
  
  isActive: z
    .boolean()
    .optional()
    .default(true)
})
.refine(data => data.billingFare >= data.driverFare, {
  message: '청구운임은 기사운임보다 크거나 같아야 합니다',
  path: ['billingFare']
})

// 노선 수정 스키마 (모든 필드가 선택적)
export const updateRouteSchema = z.object({
  name: z
    .string()
    .min(1, '노선명을 입력해주세요')
    .max(100, '노선명은 100자 이하로 입력해주세요')
    .optional(),
  
  loadingPoint: z
    .string()
    .min(1, '상차지를 입력해주세요')
    .max(200, '상차지는 200자 이하로 입력해주세요')
    .optional(),
  
  distance: z
    .number()
    .positive('거리는 양수여야 합니다')
    .max(2000, '거리는 2000km 이하로 입력해주세요')
    .optional(),
  
  driverFare: fareSchema.optional(),
  
  billingFare: fareSchema.optional(),
  
  weekdayPattern: weekdayPatternSchema.optional(),
  
  defaultDriverId: z.preprocess((v) => {
    if (v === undefined || v === null) return null;
    const s = String(v).trim();
    return s === '' || s.toLowerCase() === 'null' || s === '__none__' ? null : s;
  }, z.string().uuid('올바른 기사 ID가 아닙니다').nullable().optional()),
  
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

// 노선 조회 쿼리 스키마
export const getRoutesQuerySchema = z.object({
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
  
  defaultDriverId: z.preprocess((v) => {
    if (v === undefined || v === null) return null;
    const s = String(v).trim();
    return s === '' || s.toLowerCase() === 'null' || s === '__none__' ? null : s;
  }, z.string().uuid('올바른 기사 ID가 아닙니다').nullable().optional()),
  
  weekday: z
    .string()
    .transform(val => parseInt(val))
    .refine(val => !isNaN(val) && val >= 0 && val <= 6, '요일은 0-6 사이의 숫자여야 합니다')
    .optional(),
  
  sortBy: z
    .enum(['name', 'loadingPoint', 'driverFare', 'billingFare', 'createdAt', 'updatedAt'])
    .default('createdAt'),
  
  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc')
})

// 타입 정의
export type CreateRouteData = z.infer<typeof createRouteSchema>
export type UpdateRouteData = z.infer<typeof updateRouteSchema>
export type GetRoutesQuery = z.infer<typeof getRoutesQuerySchema>

// 응답 타입
export interface RouteResponse {
  id: string
  name: string
  loadingPoint: string
  distance?: number | null
  driverFare: string // Decimal as string
  billingFare: string // Decimal as string
  weekdayPattern: number[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  
  // 관계 데이터
  defaultDriver?: {
    id: string
    name: string
    phone: string
  } | null
  
  // 통계 데이터 - RouteTemplate에는 trips 관계가 없음
  _count?: {
    // Future relations can be added here
  }
}

export interface RoutesListResponse {
  routes: RouteResponse[]
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

export const isRouteActiveOnWeekday = (weekdayPattern: number[], targetWeekday: number): boolean => {
  return weekdayPattern.includes(targetWeekday)
}