import { z } from 'zod'

// Phone number validation for Korean mobile numbers
const phoneRegex = /^010-\d{4}-\d{4}$/

// Base Dispatch validation schema
export const CreateDispatchSchema = z.object({
  driverId: z.string().optional(),
  driverName: z.string().min(1, 'Driver name is required').max(100, 'Driver name too long'),
  driverPhone: z.string().regex(phoneRegex, 'Invalid phone format. Use 010-XXXX-XXXX'),
  driverVehicle: z.string().min(1, 'Driver vehicle is required').max(50, 'Vehicle info too long'),
  deliveryTime: z.string().max(50, 'Delivery time too long').optional(),
  driverFee: z.number().int().min(0, 'Driver fee cannot be negative'),
  driverNotes: z.string().optional(),
})

export const UpdateDispatchSchema = CreateDispatchSchema.partial()

// Dispatch query parameters validation
export const DispatchQuerySchema = z.object({
  page: z.string().optional().transform((val) => val ? parseInt(val) : 1),
  limit: z.string().optional().transform((val) => val ? parseInt(val) : 20),
  startDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  driverId: z.string().optional(),
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

// Driver search validation
export const DriverSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  limit: z.string().optional().transform((val) => val ? parseInt(val) : 10),
  includeInactive: z.string().optional().transform((val) => val === 'true')
})

// Business rule validation helper
export const validateDriverConsistency = async (
  driverId: string | undefined,
  driverName: string,
  prisma: any
) => {
  if (!driverId) return true
  
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    select: { name: true, phone: true, vehicleNumber: true }
  })
  
  if (!driver) {
    throw new Error('Driver not found')
  }
  
  // Warn if name doesn't match but don't fail
  if (driver.name !== driverName) {
    console.warn(`Driver name mismatch: DB="${driver.name}", Input="${driverName}"`)
  }
  
  return true
}

// Type exports
export type CreateDispatchInput = z.infer<typeof CreateDispatchSchema>
export type UpdateDispatchInput = z.infer<typeof UpdateDispatchSchema>
export type DispatchQueryInput = z.infer<typeof DispatchQuerySchema>
export type DriverSearchInput = z.infer<typeof DriverSearchSchema>