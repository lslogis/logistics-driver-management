import { z } from 'zod'

// 상차지 생성 스키마
export const createLoadingPointSchema = z.object({
  // Required fields
  centerName: z.string()
    .min(1, '센터명을 입력해주세요')
    .max(100, '센터명은 100자 이내로 입력해주세요')
    .transform((value) => value.trim()),
  
  loadingPointName: z.string()
    .min(1, '상차지명을 입력해주세요')
    .max(100, '상차지명은 100자 이내로 입력해주세요')
    .transform((value) => value.trim()),
  
  // Optional fields  
  lotAddress: z.string()
    .max(200, '지번주소는 200자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
    
  roadAddress: z.string()
    .max(200, '도로명주소는 200자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
    
  manager1: z.string()
    .max(50, '담당자1은 50자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
    
  manager2: z.string()
    .max(50, '담당자2는 50자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
    
  phone1: z.string()
    .max(20, '연락처1은 20자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
    
  phone2: z.string()
    .max(20, '연락처2는 20자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
    
  remarks: z.string()
    .max(500, '비고는 500자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
  
  isActive: z.boolean().default(true)
}).transform((data) => {
  // 빈 문자열을 null로 변환
  return {
    ...data,
    lotAddress: data.lotAddress === '' ? null : data.lotAddress,
    roadAddress: data.roadAddress === '' ? null : data.roadAddress,
    manager1: data.manager1 === '' ? null : data.manager1,
    manager2: data.manager2 === '' ? null : data.manager2,
    phone1: data.phone1 === '' ? null : data.phone1,
    phone2: data.phone2 === '' ? null : data.phone2,
    remarks: data.remarks === '' ? null : data.remarks
  }
})

// 상차지 수정 스키마 (모든 필드 선택적)
export const updateLoadingPointSchema = z.object({
  centerName: z.string()
    .min(1, '센터명을 입력해주세요')
    .max(100, '센터명은 100자 이내로 입력해주세요')
    .transform((value) => value.trim())
    .optional(),
  
  loadingPointName: z.string()
    .min(1, '상차지명을 입력해주세요')
    .max(100, '상차지명은 100자 이내로 입력해주세요')
    .transform((value) => value.trim())
    .optional(),
    
  lotAddress: z.string()
    .max(200, '지번주소는 200자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
    
  roadAddress: z.string()
    .max(200, '도로명주소는 200자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
    
  manager1: z.string()
    .max(50, '담당자1은 50자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
    
  manager2: z.string()
    .max(50, '담당자2는 50자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
    
  phone1: z.string()
    .max(20, '연락처1은 20자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
    
  phone2: z.string()
    .max(20, '연락처2는 20자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
    
  remarks: z.string()
    .max(500, '비고는 500자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
  
  isActive: z.boolean().optional()
}).transform((data) => {
  // 빈 문자열을 null로 변환
  return {
    ...data,
    lotAddress: data.lotAddress === '' ? null : data.lotAddress,
    roadAddress: data.roadAddress === '' ? null : data.roadAddress,
    manager1: data.manager1 === '' ? null : data.manager1,
    manager2: data.manager2 === '' ? null : data.manager2,
    phone1: data.phone1 === '' ? null : data.phone1,
    phone2: data.phone2 === '' ? null : data.phone2,
    remarks: data.remarks === '' ? null : data.remarks
  }
})

// 상차지 목록 조회 쿼리 스키마
export const getLoadingPointsQuerySchema = z.object({
  page: z.string().default('1').transform(val => parseInt(val) || 1),
  limit: z.string().default('10').transform(val => Math.min(parseInt(val) || 10, 100)),
  search: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  isActive: z.string()
    .transform(val => val === 'true' ? true : val === 'false' ? false : undefined)
    .optional(),
  sortBy: z.enum(['centerName', 'loadingPointName', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

// 상차지 자동완성 쿼리 스키마
export const loadingPointSuggestionsQuerySchema = z.object({
  query: z.string().optional().default(''),
  limit: z.string().transform(val => Math.min(parseInt(val) || 10, 50)).default('10')
})

// 타입 추출
export type CreateLoadingPointData = z.infer<typeof createLoadingPointSchema>
export type UpdateLoadingPointData = z.infer<typeof updateLoadingPointSchema>
export type GetLoadingPointsQuery = z.infer<typeof getLoadingPointsQuerySchema>
export type LoadingPointSuggestionsQuery = z.infer<typeof loadingPointSuggestionsQuerySchema>

// 응답 타입
export interface LoadingPointResponse {
  id: string
  centerName: string
  loadingPointName: string
  lotAddress: string | null
  roadAddress: string | null
  manager1: string | null
  manager2: string | null
  phone1: string | null
  phone2: string | null
  remarks: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface LoadingPointsListResponse {
  loadingPoints: LoadingPointResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface LoadingPointSuggestionResponse {
  id: string
  centerName: string
  loadingPointName: string
}

