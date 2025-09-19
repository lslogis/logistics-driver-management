import { z } from 'zod'
import { ContractType } from '@prisma/client'

// Base FixedContract schema
export const FixedContractSchema = z.object({
  id: z.string(),
  driverId: z.string().optional(),
  loadingPointId: z.string(),
  routeName: z.string(),
  // 계약유형 분리
  centerContractType: z.nativeEnum(ContractType),
  driverContractType: z.nativeEnum(ContractType).optional(),
  operatingDays: z.array(z.number().min(0).max(6)),
  centerAmount: z.number().optional(),
  driverAmount: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  specialConditions: z.string().optional(),
  remarks: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string().optional(),
})

// Base shape for create/update (so we can reuse for partial updates)
const CreateFixedContractBase = z.object({
  driverId: z.string().optional(),
  loadingPointId: z.string({
    required_error: '상차지를 선택해주세요'
  }),
  routeName: z.string({
    required_error: '노선명을 입력해주세요'
  }).min(1, '노선명을 입력해주세요').max(100, '노선명은 100자 이내로 입력해주세요'),
  // 계약유형 분리
  centerContractType: z.nativeEnum(ContractType, { required_error: '센터계약 유형을 선택해주세요' }),
  driverContractType: z.nativeEnum(ContractType).optional(),
  operatingDays: z.array(z.number().min(0).max(6))
    .min(1, '최소 1개 이상의 운행 요일을 선택해주세요')
    .max(7, '운행 요일은 최대 7개까지 선택 가능합니다'),
  // 금액 (필수)
  centerAmount: z.number({ required_error: '센터금액을 입력해주세요' })
    .nonnegative('센터금액은 0 이상이어야 합니다')
    .max(999999999, '센터금액은 10억 미만으로 입력해주세요'),
  driverAmount: z.number()
    .nonnegative('기사금액은 0 이상이어야 합니다')
    .max(999999999, '기사금액은 10억 미만으로 입력해주세요')
    .optional(),
  
  // Contract dates
  startDate: z.string()
    .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), '시작일은 YYYY-MM-DD 형식이어야 합니다')
    .optional(),
  endDate: z.string()
    .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), '종료일은 YYYY-MM-DD 형식이어야 합니다')
    .optional(),
  
  // Additional information
  specialConditions: z.string()
    .max(500, '특이사항은 500자 이내로 입력해주세요')
    .optional(),
  remarks: z.string()
    .max(500, '비고는 500자 이내로 입력해주세요')
    .optional(),
})

// Schema for creating a new fixed contract
export const CreateFixedContractSchema = CreateFixedContractBase

// Schema for updating a fixed contract
export const UpdateFixedContractSchema = CreateFixedContractBase.partial()

// Schema for querying fixed contracts
export const GetFixedContractsQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().optional(),
  driverId: z.string().optional(),
  loadingPointId: z.string().optional(),
  contractType: z.nativeEnum(ContractType).optional(),
  isActive: z.string().transform(val => val === 'true').optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'routeName', 'startDate']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

// Response types
export type FixedContractResponse = z.infer<typeof FixedContractSchema> & {
  driver: {
    id: string
    name: string
    phone: string
    vehicleNumber: string
  }
  loadingPoint: {
    id: string
    centerName: string
    loadingPointName: string
  }
  creator?: {
    id: string
    name: string
  }
}

export type CreateFixedContractRequest = z.infer<typeof CreateFixedContractSchema>
export type UpdateFixedContractRequest = z.infer<typeof UpdateFixedContractSchema>
export type GetFixedContractsQuery = z.infer<typeof GetFixedContractsQuerySchema>

// Form schema for the UI (with string values for form handling)
export const FixedContractFormSchema = z.object({
  driverId: z.string().optional(),
  loadingPointId: z.string().min(1, '상차지를 선택해주세요'),
  routeName: z.string().min(1, '노선명을 입력해주세요').max(100),
  centerContractType: z.nativeEnum(ContractType),
  driverContractType: z.nativeEnum(ContractType).optional(),
  operatingDays: z.array(z.number()),
  
  // 금액 (문자열 입력)
  centerAmount: z.string().min(1, '센터금액을 입력해주세요'),
  driverAmount: z.string().optional(),
  
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  specialConditions: z.string().optional(),
  remarks: z.string().optional(),
})

export type FixedContractFormData = z.infer<typeof FixedContractFormSchema>

// Utility function to convert form data to API request
export function formDataToRequest(formData: FixedContractFormData): CreateFixedContractRequest {
  return {
    ...formData,
    centerAmount: parseFloat(formData.centerAmount || '0'),
    driverAmount: formData.driverAmount ? parseFloat(formData.driverAmount) : undefined,
    startDate: formData.startDate || undefined,
    endDate: formData.endDate || undefined,
  }
}

// Contract type labels for UI
export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  FIXED_DAILY: '고정일대',
  FIXED_MONTHLY: '고정월대',
  CONSIGNED_MONTHLY: '고정지입',
  CHARTER_PER_RIDE: '건별용차'
}

// Weekday labels for UI
export const WEEKDAY_LABELS = [
  '일요일',
  '월요일',
  '화요일',
  '수요일',
  '목요일',
  '금요일',
  '토요일'
]
