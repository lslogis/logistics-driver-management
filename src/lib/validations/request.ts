import { z } from 'zod'

// Base Request validation schema
export const CreateRequestSchema = z.object({
  requestDate: z.string().transform((str) => new Date(str)),
  centerCarNo: z.string().min(1, 'Center car number is required').max(50, 'Center car number too long'),
  vehicleTon: z.number().min(0.1, 'Vehicle tonnage must be at least 0.1').max(999.9, 'Vehicle tonnage too large'),
  regions: z.array(z.string().min(1, 'Region cannot be empty'))
    .min(1, 'At least one region is required')
    .max(10, 'Maximum 10 regions allowed'),
  stops: z.number().int().min(1, 'At least 1 stop required').max(50, 'Maximum 50 stops allowed'),
  notes: z.string().optional(),
  extraAdjustment: z.number().int().default(0),
  adjustmentReason: z.string().max(200, 'Adjustment reason too long').optional(),
}).refine(
  (data) => {
    // Business rule: adjustment reason required when extra adjustment is not zero
    if (data.extraAdjustment !== 0 && !data.adjustmentReason) {
      return false
    }
    return true
  },
  {
    message: 'Adjustment reason is required when extra adjustment is not zero',
    path: ['adjustmentReason']
  }
)

export const UpdateRequestSchema = CreateRequestSchema.partial()

// Request query parameters validation
export const RequestQuerySchema = z.object({
  page: z.string().optional().transform((val) => val ? parseInt(val) : 1),
  limit: z.string().optional().transform((val) => val ? parseInt(val) : 20),
  startDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  centerCarNo: z.string().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate && data.startDate > data.endDate) {
      return false
    }
    return true
  },
  {
    message: 'Start date must be before end date',
    path: ['endDate']
  }
)

// Type exports
export type CreateRequestInput = z.infer<typeof CreateRequestSchema>
export type UpdateRequestInput = z.infer<typeof UpdateRequestSchema>
export type RequestQueryInput = z.infer<typeof RequestQuerySchema>