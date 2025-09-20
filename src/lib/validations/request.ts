
import { z } from 'zod'

// Shared request schema without refinement so it can be reused for create/update variants
export const baseRequestSchema = z.object({
  loadingPointId: z.string().min(1, 'Loading point is required'),
  requestDate: z.string().transform(str => new Date(str)),
  centerCarNo: z.preprocess(
    val => {
      if (typeof val !== 'string') {
        return undefined
      }

      const trimmed = val.trim()
      return trimmed.length > 0 ? trimmed : undefined
    },
    z.string().max(50, 'Center car number too long').optional()
  ),
  vehicleTon: z.number().min(0.1, 'Vehicle tonnage must be at least 0.1').max(999.9, 'Vehicle tonnage too large'),
  regions: z.array(z.string().min(1, 'Region cannot be empty'))
    .min(1, 'At least one region is required')
    .max(10, 'Maximum 10 regions allowed'),
  stops: z.number().int().min(1, 'At least 1 stop required').max(50, 'Maximum 50 stops allowed'),
  notes: z.string().optional(),
  baseFare: z.number().int().nullable().optional(),
  extraStopFee: z.number().int().nullable().optional(),
  extraRegionFee: z.number().int().nullable().optional(),
  extraAdjustment: z.number().int().default(0),
  adjustmentReason: z.string().max(200, 'Adjustment reason too long').optional(),
  centerBillingTotal: z.number().int().min(0, 'Center billing total must be non-negative').default(0)
})

type BaseRequest = z.infer<typeof baseRequestSchema>

const ensureAdjustmentReason = (data: Partial<BaseRequest>, ctx: z.RefinementCtx, skipWhenUndefined = false) => {
  const adjustmentValue = data.extraAdjustment

  if (skipWhenUndefined && adjustmentValue === undefined) {
    return
  }

  if ((adjustmentValue ?? 0) !== 0) {
    const hasReason = typeof data.adjustmentReason === 'string' && data.adjustmentReason.trim().length > 0
    if (!hasReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Adjustment reason is required when extra adjustment is not zero',
        path: ['adjustmentReason']
      })
    }
  }
}

// Base Request validation schema with refinement applied
export const CreateRequestSchema = baseRequestSchema.superRefine((data, ctx) => {
  ensureAdjustmentReason(data, ctx)
})

export const UpdateRequestSchema = baseRequestSchema.partial().superRefine((data, ctx) => {
  ensureAdjustmentReason(data, ctx, true)
})

// Request query parameters validation
export const RequestQuerySchema = z.object({
  page: z.string().optional().transform(val => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform(val => (val ? parseInt(val) : 20)),
  startDate: z.string().optional().transform(val => (val ? new Date(val) : undefined)),
  endDate: z.string().optional().transform(val => (val ? new Date(val) : undefined)),
  centerCarNo: z.string().optional(),
  loadingPointId: z.string().optional()
}).refine(
  data => {
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
