import { z } from 'zod'
import { TripStatus } from '@prisma/client'

// 운임 검증 스키마
const fareSchema = z
  .number({ 
    required_error: '운임을 입력해주세요',
    invalid_type_error: '운임은 숫자여야 합니다'
  })
  .positive('운임은 양수여야 합니다')
  .max(10000000, '운임은 1천만원 이하로 입력해주세요') // 10M 한도

// 커스텀 노선 스키마
const customRouteSchema = z.object({
  loadingPoint: z
    .string()
    .min(1, '상차지를 입력해주세요')
    .max(200, '상차지는 200자 이하로 입력해주세요'),
  
  unloadingPoint: z
    .string()
    .min(1, '하차지를 입력해주세요')
    .max(200, '하차지는 200자 이하로 입력해주세요'),
  
  distance: z
    .number()
    .positive('거리는 양수여야 합니다')
    .max(2000, '거리는 2000km 이하로 입력해주세요')
    .optional()
})

// 운행 생성 스키마
export const createTripSchema = z.object({
  date: z
    .string()
    .datetime({ message: '올바른 날짜 형식이 아닙니다' })
    .transform(str => new Date(str).toISOString().split('T')[0]), // Date only
  
  driverId: z
    .string()
    .uuid('올바른 기사 ID가 아닙니다'),
  
  vehicleId: z
    .string()
    .uuid('올바른 차량 ID가 아닙니다'),
  
  routeType: z
    .enum(['fixed', 'custom'], {
      errorMap: () => ({ message: '노선 타입은 fixed 또는 custom이어야 합니다' })
    })
    .default('fixed'),
  
  routeTemplateId: z
    .string()
    .uuid('올바른 노선 ID가 아닙니다')
    .optional(),
  
  customRoute: customRouteSchema.optional(),
  
  status: z
    .nativeEnum(TripStatus, {
      errorMap: () => ({ message: '올바른 운행 상태를 선택해주세요' })
    })
    .default('SCHEDULED'),
  
  driverFare: fareSchema,
  
  billingFare: fareSchema,
  
  absenceReason: z
    .string()
    .max(500, '결행 사유는 500자 이하로 입력해주세요')
    .optional(),
  
  deductionAmount: z
    .number()
    .nonnegative('차감액은 0 이상이어야 합니다')
    .max(10000000, '차감액은 1천만원 이하로 입력해주세요')
    .optional(),
  
  substituteDriverId: z
    .string()
    .uuid('올바른 대차 기사 ID가 아닙니다')
    .optional(),
  
  substituteFare: z
    .number()
    .positive('대차 운임은 양수여야 합니다')
    .max(10000000, '대차 운임은 1천만원 이하로 입력해주세요')
    .optional(),
  
  remarks: z
    .string()
    .max(1000, '비고는 1000자 이하로 입력해주세요')
    .optional()
})
.refine(data => {
  // 고정 노선의 경우 routeTemplateId 필수
  if (data.routeType === 'fixed' && !data.routeTemplateId) {
    return false
  }
  return true
}, {
  message: '고정 노선의 경우 노선 템플릿 ID가 필요합니다',
  path: ['routeTemplateId']
})
.refine(data => {
  // 커스텀 노선의 경우 customRoute 필수
  if (data.routeType === 'custom' && !data.customRoute) {
    return false
  }
  return true
}, {
  message: '커스텀 노선의 경우 노선 정보가 필요합니다',
  path: ['customRoute']
})
.refine(data => {
  // 청구운임은 기사운임보다 크거나 같아야 함
  return data.billingFare >= data.driverFare
}, {
  message: '청구운임은 기사운임보다 크거나 같아야 합니다',
  path: ['billingFare']
})
.refine(data => {
  // 결행 상태인 경우 결행 사유 필수
  if (data.status === 'ABSENCE' && !data.absenceReason) {
    return false
  }
  return true
}, {
  message: '결행 상태인 경우 결행 사유가 필요합니다',
  path: ['absenceReason']
})
.refine(data => {
  // 대차 상태인 경우 대차 기사 ID와 대차 운임 필수
  if (data.status === 'SUBSTITUTE' && (!data.substituteDriverId || !data.substituteFare)) {
    return false
  }
  return true
}, {
  message: '대차 상태인 경우 대차 기사와 대차 운임이 필요합니다',
  path: ['substituteDriverId']
})
.refine(data => {
  // 대차 기사는 원래 기사와 달라야 함
  if (data.status === 'SUBSTITUTE' && data.substituteDriverId === data.driverId) {
    return false
  }
  return true
}, {
  message: '대차 기사는 원래 기사와 달라야 합니다',
  path: ['substituteDriverId']
})

// 운행 수정 스키마
export const updateTripSchema = z.object({
  driverId: z
    .string()
    .uuid('올바른 기사 ID가 아닙니다')
    .optional(),
  
  vehicleId: z
    .string()
    .uuid('올바른 차량 ID가 아닙니다')
    .optional(),
  
  routeType: z
    .enum(['fixed', 'custom'])
    .optional(),
  
  routeTemplateId: z
    .string()
    .uuid('올바른 노선 ID가 아닙니다')
    .optional(),
  
  customRoute: customRouteSchema.optional(),
  
  status: z
    .nativeEnum(TripStatus)
    .optional(),
  
  driverFare: fareSchema.optional(),
  
  billingFare: fareSchema.optional(),
  
  absenceReason: z
    .string()
    .max(500, '결행 사유는 500자 이하로 입력해주세요')
    .optional(),
  
  deductionAmount: z
    .number()
    .nonnegative('차감액은 0 이상이어야 합니다')
    .max(10000000, '차감액은 1천만원 이하로 입력해주세요')
    .optional(),
  
  substituteDriverId: z
    .string()
    .uuid('올바른 대차 기사 ID가 아닙니다')
    .optional(),
  
  substituteFare: z
    .number()
    .positive('대차 운임은 양수여야 합니다')
    .max(10000000, '대차 운임은 1천만원 이하로 입력해주세요')
    .optional(),
  
  remarks: z
    .string()
    .max(1000, '비고는 1000자 이하로 입력해주세요')
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

// 운행 조회 쿼리 스키마
export const getTripsQuerySchema = z.object({
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
    .nativeEnum(TripStatus)
    .optional(),
  
  driverId: z
    .string()
    .uuid('올바른 기사 ID가 아닙니다')
    .optional(),
  
  vehicleId: z
    .string()
    .uuid('올바른 차량 ID가 아닙니다')
    .optional(),
  
  routeTemplateId: z
    .string()
    .uuid('올바른 노선 ID가 아닙니다')
    .optional(),
  
  dateFrom: z
    .string()
    .datetime({ message: '올바른 시작 날짜 형식이 아닙니다' })
    .optional(),
  
  dateTo: z
    .string()
    .datetime({ message: '올바른 종료 날짜 형식이 아닙니다' })
    .optional(),
  
  sortBy: z
    .enum(['date', 'status', 'driverFare', 'billingFare', 'createdAt', 'updatedAt'])
    .default('date'),
  
  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc')
})

// 운행 상태 변경 스키마
export const updateTripStatusSchema = z.object({
  status: z.nativeEnum(TripStatus, {
    errorMap: () => ({ message: '올바른 운행 상태를 선택해주세요' })
  }),
  
  absenceReason: z
    .string()
    .max(500, '결행 사유는 500자 이하로 입력해주세요')
    .optional(),
  
  deductionAmount: z
    .number()
    .nonnegative('차감액은 0 이상이어야 합니다')
    .max(10000000, '차감액은 1천만원 이하로 입력해주세요')
    .optional(),
  
  substituteDriverId: z
    .string()
    .uuid('올바른 대차 기사 ID가 아닙니다')
    .optional(),
  
  substituteFare: z
    .number()
    .positive('대차 운임은 양수여야 합니다')
    .max(10000000, '대차 운임은 1천만원 이하로 입력해주세요')
    .optional(),
  
  remarks: z
    .string()
    .max(1000, '비고는 1000자 이하로 입력해주세요')
    .optional()
})
.refine(data => {
  // 결행 상태인 경우 결행 사유 필수
  if (data.status === 'ABSENCE' && !data.absenceReason) {
    return false
  }
  return true
}, {
  message: '결행 상태인 경우 결행 사유가 필요합니다',
  path: ['absenceReason']
})
.refine(data => {
  // 대차 상태인 경우 대차 기사 ID와 대차 운임 필수
  if (data.status === 'SUBSTITUTE' && (!data.substituteDriverId || !data.substituteFare)) {
    return false
  }
  return true
}, {
  message: '대차 상태인 경우 대차 기사와 대차 운임이 필요합니다',
  path: ['substituteDriverId']
})

// 타입 정의
export type CreateTripData = z.infer<typeof createTripSchema>
export type UpdateTripData = z.infer<typeof updateTripSchema>
export type GetTripsQuery = z.infer<typeof getTripsQuerySchema>
export type UpdateTripStatusData = z.infer<typeof updateTripStatusSchema>

// 응답 타입
export interface TripResponse {
  id: string
  date: string
  routeType: string
  status: TripStatus
  driverFare: string // Decimal as string
  billingFare: string // Decimal as string
  absenceReason?: string | null
  deductionAmount?: string | null // Decimal as string
  substituteFare?: string | null // Decimal as string
  remarks?: string | null
  createdAt: string
  updatedAt: string
  
  // 관계 데이터
  driver: {
    id: string
    name: string
    phone: string
  }
  
  vehicle: {
    id: string
    plateNumber: string
    vehicleType: string
  }
  
  routeTemplate?: {
    id: string
    name: string
    loadingPoint: string
    unloadingPoint: string
  } | null
  
  customRoute?: {
    loadingPoint: string
    unloadingPoint: string
    distance?: number
  } | null
  
  substituteDriver?: {
    id: string
    name: string
    phone: string
  } | null
}

export interface TripsListResponse {
  trips: TripResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// 운행 상태 헬퍼 함수
export const getTripStatusName = (status: TripStatus): string => {
  const names = {
    SCHEDULED: '예정',
    COMPLETED: '완료',
    ABSENCE: '결행',
    SUBSTITUTE: '대차'
  }
  return names[status]
}

export const getTripStatusColor = (status: TripStatus): string => {
  const colors = {
    SCHEDULED: 'blue',
    COMPLETED: 'green',
    ABSENCE: 'red',
    SUBSTITUTE: 'orange'
  }
  return colors[status]
}

export const canEditTrip = (status: TripStatus): boolean => {
  // 완료된 운행은 수정 불가
  return status !== 'COMPLETED'
}

export const canDeleteTrip = (status: TripStatus): boolean => {
  // 예정 상태의 운행만 삭제 가능
  return status === 'SCHEDULED'
}