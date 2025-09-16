import { z } from 'zod'

// Common tonnage validation - standardized values
const tonnageSchema = z
  .string()
  .min(1, '톤수를 선택해주세요')
  .refine(val => {
    // Allow flexible tonnage input including special notations
    // Examples: 1t, 2.5톤, 3.5광, 5축, 11톤 등
    return /^(\d+(?:\.\d+)?)(?:t|톤|광|축)?$/i.test(val)
  }, {
    message: '톤수는 숫자 형태로 입력해주세요 (예: 1t, 2.5t, 3.5광, 5축 등)'
  })

// Positive integer amount validation
const amountSchema = z
  .number({ 
    required_error: '금액을 입력해주세요',
    invalid_type_error: '금액은 숫자여야 합니다'
  })
  .int('금액은 정수여야 합니다')
  .nonnegative('금액은 0 이상이어야 합니다')
  .max(99999999, '금액은 1억원 미만이어야 합니다')

// RateBase schemas
export const createRateBaseSchema = z.object({
  centerName: z
    .string()
    .min(1, '센터명을 입력해주세요')
    .max(100, '센터명은 100자 이하로 입력해주세요'),
  
  tonnage: tonnageSchema,
  
  region: z
    .string()
    .min(1, '지역을 입력해주세요')
    .max(50, '지역은 50자 이하로 입력해주세요'),
  
  baseFare: amountSchema
})

export const updateRateBaseSchema = createRateBaseSchema.partial()

// RateAddons schemas  
export const createRateAddonsSchema = z.object({
  centerName: z
    .string()
    .min(1, '센터명을 입력해주세요')
    .max(100, '센터명은 100자 이하로 입력해주세요'),
  
  tonnage: tonnageSchema,
  
  perStop: amountSchema,
  
  perWaypoint: amountSchema
})

export const updateRateAddonsSchema = createRateAddonsSchema.partial()

// Rate calculation query schema
export const rateCalculationQuerySchema = z.object({
  centerName: z
    .string()
    .min(1, '센터명이 필요합니다'),
  
  tonnage: z
    .string()
    .min(1, '톤수가 필요합니다'),
  
  regions: z
    .string()
    .optional()
    .transform(str => str ? str.split(',').map(r => r.trim()).filter(Boolean) : []),
  
  stopsTotal: z
    .string()
    .optional()
    .transform(str => str ? parseInt(str) : 0)
    .refine(val => !isNaN(val) && val >= 0, '총착수는 0 이상의 숫자여야 합니다')
})

// Type definitions
export type CreateRateBaseData = z.infer<typeof createRateBaseSchema>
export type UpdateRateBaseData = z.infer<typeof updateRateBaseSchema>
export type CreateRateAddonsData = z.infer<typeof createRateAddonsSchema>
export type UpdateRateAddonsData = z.infer<typeof updateRateAddonsSchema>
export type RateCalculationQuery = z.infer<typeof rateCalculationQuerySchema>

// Response types
export interface RateBaseResponse {
  id: string
  centerName: string
  tonnage: string
  region: string
  baseFare: number
  createdAt: string
  updatedAt: string
}

export interface RateAddonsResponse {
  id: string
  centerName: string
  tonnage: string
  perStop: number
  perWaypoint: number
  createdAt: string
  updatedAt: string
}

export interface RateCalculationResponse {
  baseFare: number
  callFee: number
  waypointFee: number
  total: number
  meta: {
    baseRegion: string | null
    X: number // stops calculation factor
    Y: number // waypoints calculation factor  
    perStop: number
    perWaypoint: number
    distinctRegions: number
    missing: string[] // ['BASE', 'CALL', 'WAYPOINT']
  }
}

// Utility functions
export function normalizeRegions(regions: string[]): string[] {
  return [...new Set(regions.map(r => r.trim()).filter(Boolean))]
}

export function calculateRateFactors(stopsTotal: number, regions: string[]) {
  const distinctRegions = normalizeRegions(regions).length
  const X = Math.max((stopsTotal || 0) - 1, 0) // 착지-1
  const Y = Math.max(distinctRegions - 1, 0)    // 지역-1
  
  return { X, Y, distinctRegions }
}