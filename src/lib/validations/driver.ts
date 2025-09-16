import { z } from 'zod'
import { sanitizePhone, sanitizeAccountNumber, validatePhone } from '@/lib/utils/data-processing'

// 기사 생성 스키마 (9-column Excel structure)
export const createDriverSchema = z.object({
  // Required fields (성함, 연락처, 차량번호)
  name: z.string()
    .min(1, '성함을 입력해주세요')
    .max(50, '성함은 50자 이내로 입력해주세요'),
  
  phone: z.string()
    .min(1, '연락처를 입력해주세요')
    .transform((phone) => sanitizePhone(phone))
    .refine((phone) => validatePhone(phone).isValid, {
      message: '유효하지 않은 연락처 형식입니다 (010-0000-0000 형식으로 입력해주세요)'
    }),
  
  vehicleNumber: z.string()
    .min(1, '차량번호를 입력해주세요')
    .max(20, '차량번호는 20자 이내로 입력해주세요')
    .transform((value) => value.trim()),
  
  // Optional fields
  businessName: z.string()
    .max(100, '사업상호는 100자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
  
  representative: z.string()
    .max(50, '대표자명은 50자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
  
  businessNumber: z.string()
    .max(50, '사업번호는 50자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
  
  bankName: z.string()
    .max(50, '계좌은행명은 50자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
  
  accountNumber: z.string()
    .max(50, '계좌번호는 50자 이내로 입력해주세요')
    .transform((account) => account ? sanitizeAccountNumber(account) : account)
    .optional()
    .or(z.literal('')),
  
  remarks: z.string()
    .max(500, '특이사항은 500자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
  
  isActive: z.boolean().default(true)
}).transform((data) => {
  // 빈 문자열을 null로 변환
  return {
    ...data,
    businessName: data.businessName === '' ? null : data.businessName,
    representative: data.representative === '' ? null : data.representative,
    businessNumber: data.businessNumber === '' ? null : data.businessNumber,
    bankName: data.bankName === '' ? null : data.bankName,
    accountNumber: data.accountNumber === '' ? null : data.accountNumber,
    remarks: data.remarks === '' ? null : data.remarks
  }
})

// 기사 수정 스키마 (모든 필드 선택적)
export const updateDriverSchema = z.object({
  name: z.string()
    .min(1, '성함을 입력해주세요')
    .max(50, '성함은 50자 이내로 입력해주세요')
    .optional(),
    
  phone: z.string()
    .min(1, '연락처를 입력해주세요')
    .transform((phone) => sanitizePhone(phone))
    .refine((phone) => validatePhone(phone).isValid, {
      message: '유효하지 않은 연락처 형식입니다 (010-0000-0000 형식으로 입력해주세요)'
    })
    .optional(),
  
  vehicleNumber: z.string()
    .min(1, '차량번호를 입력해주세요')
    .max(20, '차량번호는 20자 이내로 입력해주세요')
    .transform((value) => value.trim())
    .optional(),
  
  businessName: z.string()
    .max(100, '사업상호는 100자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
  
  representative: z.string()
    .max(50, '대표자명은 50자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
  
  businessNumber: z.string()
    .max(50, '사업번호는 50자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
  
  bankName: z.string()
    .max(50, '계좌은행명은 50자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
  
  accountNumber: z.string()
    .max(50, '계좌번호는 50자 이내로 입력해주세요')
    .transform((account) => account ? sanitizeAccountNumber(account) : account)
    .optional()
    .or(z.literal('')),
  
  remarks: z.string()
    .max(500, '특이사항은 500자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
  
  isActive: z.boolean().optional()
}).transform((data) => {
  // 빈 문자열을 null로 변환
  return {
    ...data,
    businessName: data.businessName === '' ? null : data.businessName,
    representative: data.representative === '' ? null : data.representative,
    businessNumber: data.businessNumber === '' ? null : data.businessNumber,
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
  status: z.enum(['active', 'inactive']).optional(),
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
  vehicleNumber: string
  businessName: string | null
  representative: string | null
  businessNumber: string | null
  bankName: string | null
  accountNumber: string | null
  remarks: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    charterRequests: number
    settlements: number
    fixedContracts: number
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
