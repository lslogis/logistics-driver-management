import { z } from 'zod'

// 기사 생성 스키마
export const createDriverSchema = z.object({
  name: z.string()
    .min(1, '이름을 입력해주세요')
    .max(50, '이름은 50자 이내로 입력해주세요'),
  
  phone: z.string()
    .regex(/^010-\d{4}-\d{4}$/, '휴대폰 번호는 010-0000-0000 형식으로 입력해주세요'),
  
  email: z.string()
    .email('올바른 이메일 주소를 입력해주세요')
    .optional()
    .or(z.literal('')),
  
  businessNumber: z.string()
    .regex(/^\d{3}-\d{2}-\d{5}$/, '사업자등록번호는 000-00-00000 형식으로 입력해주세요')
    .optional()
    .or(z.literal('')),
  
  companyName: z.string()
    .max(100, '상호명은 100자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
  
  representativeName: z.string()
    .max(50, '대표자명은 50자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
  
  bankName: z.string()
    .max(50, '은행명은 50자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
  
  accountNumber: z.string()
    .max(50, '계좌번호는 50자 이내로 입력해주세요')
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
    email: data.email === '' ? null : data.email,
    businessNumber: data.businessNumber === '' ? null : data.businessNumber,
    companyName: data.companyName === '' ? null : data.companyName,
    representativeName: data.representativeName === '' ? null : data.representativeName,
    bankName: data.bankName === '' ? null : data.bankName,
    accountNumber: data.accountNumber === '' ? null : data.accountNumber,
    remarks: data.remarks === '' ? null : data.remarks
  }
})

// 기사 수정 스키마 (모든 필드 선택적)
export const updateDriverSchema = z.object({
  name: z.string()
    .min(1, '이름을 입력해주세요')
    .max(50, '이름은 50자 이내로 입력해주세요')
    .optional(),
    
  phone: z.string()
    .regex(/^010-\d{4}-\d{4}$/, '휴대폰 번호는 010-0000-0000 형식으로 입력해주세요')
    .optional(),
  
  email: z.string()
    .email('올바른 이메일 주소를 입력해주세요')
    .optional()
    .or(z.literal('')),
  
  businessNumber: z.string()
    .regex(/^\d{3}-\d{2}-\d{5}$/, '사업자등록번호는 000-00-00000 형식으로 입력해주세요')
    .optional()
    .or(z.literal('')),
  
  companyName: z.string()
    .max(100, '상호명은 100자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
  
  representativeName: z.string()
    .max(50, '대표자명은 50자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
  
  bankName: z.string()
    .max(50, '은행명은 50자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
  
  accountNumber: z.string()
    .max(50, '계좌번호는 50자 이내로 입력해주세요')
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
    email: data.email === '' ? null : data.email,
    businessNumber: data.businessNumber === '' ? null : data.businessNumber,
    companyName: data.companyName === '' ? null : data.companyName,
    representativeName: data.representativeName === '' ? null : data.representativeName,
    bankName: data.bankName === '' ? null : data.bankName,
    accountNumber: data.accountNumber === '' ? null : data.accountNumber,
    remarks: data.remarks === '' ? null : data.remarks
  }
})

// 기사 목록 조회 쿼리 스키마
export const getDriversQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1),
  limit: z.string().transform(val => Math.min(parseInt(val) || 10, 100)),
  search: z.string().optional(),
  isActive: z.string()
    .transform(val => val === 'true' ? true : val === 'false' ? false : undefined)
    .optional(),
  sortBy: z.enum(['name', 'phone', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

// 타입 추출
export type CreateDriverData = z.infer<typeof createDriverSchema>
export type UpdateDriverData = z.infer<typeof updateDriverSchema>
export type GetDriversQuery = z.infer<typeof getDriversQuerySchema>

// 응답 타입
export interface DriverResponse {
  id: string
  name: string
  phone: string
  email: string | null
  businessNumber: string | null
  companyName: string | null
  representativeName: string | null
  bankName: string | null
  accountNumber: string | null
  remarks: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    vehicles: number
    trips: number
    settlements: number
  }
}

export interface DriversListResponse {
  drivers: DriverResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}