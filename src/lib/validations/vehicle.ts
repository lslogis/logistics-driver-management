import { z } from 'zod'

// Local enum since VehicleOwnership doesn't exist in the current schema
enum VehicleOwnership {
  OWNED = 'OWNED',
  LEASED = 'LEASED',
  CONTRACTED = 'CONTRACTED'
}

// 차량 생성 스키마
export const createVehicleSchema = z.object({
  plateNumber: z
    .string()
    .min(1, '차량번호를 입력해주세요')
    .max(20, '차량번호는 20자 이하로 입력해주세요')
    .regex(/^[가-힣0-9]+$/, '올바른 차량번호 형식이 아닙니다'),
  
  vehicleType: z
    .string()
    .min(1, '차량 유형을 입력해주세요')
    .max(50, '차량 유형은 50자 이하로 입력해주세요'),
  
  ownership: z.nativeEnum(VehicleOwnership, {
    errorMap: () => ({ message: '올바른 소유 유형을 선택해주세요' })
  }),
  
  driverId: z
    .string()
    .uuid('올바른 기사 ID가 아닙니다')
    .optional(),
  
  year: z
    .number()
    .int('연식은 정수여야 합니다')
    .min(1980, '연식은 1980년 이후여야 합니다')
    .max(new Date().getFullYear() + 1, '올바른 연식을 입력해주세요')
    .optional(),
  
  capacity: z
    .number()
    .positive('승차 정원은 양수여야 합니다')
    .max(100, '승차 정원은 100명 이하여야 합니다')
    .optional(),
  
  isActive: z
    .boolean()
    .optional()
    .default(true)
})

// 차량 수정 스키마 (모든 필드가 선택적)
export const updateVehicleSchema = createVehicleSchema.partial()

// 차량 조회 쿼리 스키마
export const getVehiclesQuerySchema = z.object({
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
  
  vehicleType: z
    .string()
    .max(50, '차량 유형은 50자 이하로 입력해주세요')
    .optional(),
  
  ownership: z
    .nativeEnum(VehicleOwnership)
    .optional(),
  
  isActive: z
    .string()
    .transform(val => val === 'true')
    .optional(),
  
  driverId: z
    .string()
    .uuid('올바른 기사 ID가 아닙니다')
    .optional(),
  
  sortBy: z
    .enum(['plateNumber', 'vehicleType', 'ownership', 'createdAt', 'updatedAt'])
    .default('createdAt'),
  
  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc')
})

// 타입 정의
export type CreateVehicleData = z.infer<typeof createVehicleSchema>
export type UpdateVehicleData = z.infer<typeof updateVehicleSchema>
export type GetVehiclesQuery = z.infer<typeof getVehiclesQuerySchema>

// 응답 타입
export interface VehicleResponse {
  id: string
  plateNumber: string
  vehicleType: string
  ownership: VehicleOwnership
  year?: number | null
  capacity?: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  
  // 관계 데이터
  driver?: {
    id: string
    name: string
    phone: string
  } | null
  
  // 통계 데이터
  _count: {
    trips: number
  }
}

export interface VehiclesListResponse {
  vehicles: VehicleResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}