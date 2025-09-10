import { z } from 'zod';

// Settlement query schema
export const settlementQuerySchema = z.object({
  yearMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Format must be YYYY-MM'),
  driverId: z.string().optional(),
  status: z.enum(['DRAFT', 'CONFIRMED', 'PAID']).optional(),
});

// Settlement preview request
export const settlementPreviewSchema = z.object({
  yearMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Format must be YYYY-MM'),
  driverId: z.string().optional(),
});

// Settlement finalize request
export const settlementFinalizeSchema = z.object({
  yearMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Format must be YYYY-MM'),
  driverId: z.string().optional(),
  force: z.boolean().optional(),
});

// Settlement export request
export const settlementExportSchema = z.object({
  yearMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Format must be YYYY-MM'),
  driverId: z.string().optional(),
  format: z.enum(['excel', 'csv', 'pdf']).optional().default('excel'),
});

// Settlement item schema
export const settlementItemSchema = z.object({
  type: z.enum(['TRIP', 'DEDUCTION', 'ADDITION', 'ADJUSTMENT']),
  description: z.string().min(1).max(500),
  amount: z.number(),
  date: z.string().transform((val) => new Date(val)),
  tripId: z.string().optional(),
});

// Settlement creation schema
export const settlementCreateSchema = z.object({
  yearMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Format must be YYYY-MM'),
  driverId: z.string(),
  status: z.enum(['DRAFT', 'CONFIRMED', 'PAID']).optional().default('DRAFT'),
  items: z.array(settlementItemSchema).optional(),
});

// Settlement update schema
export const settlementUpdateSchema = z.object({
  status: z.enum(['DRAFT', 'CONFIRMED', 'PAID']).optional(),
  totalTrips: z.number().int().positive().optional(),
  totalBaseFare: z.number().optional(),
  totalDeductions: z.number().optional(),
  totalAdditions: z.number().optional(),
  finalAmount: z.number().optional(),
  confirmedAt: z.string().transform((val) => new Date(val)).optional(),
  confirmedBy: z.string().optional(),
  paidAt: z.string().transform((val) => new Date(val)).optional(),
});

// Settlement bulk action schema
export const settlementBulkActionSchema = z.object({
  action: z.enum(['confirm', 'pay', 'export', 'delete']),
  settlementIds: z.array(z.string()).min(1),
  metadata: z.record(z.any()).optional(),
});

// Settlement summary schema
export const settlementSummarySchema = z.object({
  yearMonth: z.string().regex(/^\d{4}-\d{2}$/),
  totalDrivers: z.number().int(),
  totalAmount: z.number(),
  totalTrips: z.number().int(),
  averagePerDriver: z.number(),
  status: z.object({
    draft: z.number().int(),
    confirmed: z.number().int(),
    paid: z.number().int(),
  }),
});

// Validation helpers
export const validateSettlementMonth = (yearMonth: string): boolean => {
  const regex = /^\d{4}-\d{2}$/;
  if (!regex.test(yearMonth)) return false;
  
  const [year, month] = yearMonth.split('-').map(Number);
  return year >= 2020 && year <= 2100 && month >= 1 && month <= 12;
};

export const validateSettlementAmount = (amount: number): boolean => {
  return amount >= 0 && amount <= 999999999.99;
};

// Type exports
export type SettlementQuery = z.infer<typeof settlementQuerySchema>;
export type SettlementPreview = z.infer<typeof settlementPreviewSchema>;
export type SettlementFinalize = z.infer<typeof settlementFinalizeSchema>;
export type SettlementExport = z.infer<typeof settlementExportSchema>;
export type SettlementItem = z.infer<typeof settlementItemSchema>;
export type SettlementCreate = z.infer<typeof settlementCreateSchema>;
export type SettlementUpdate = z.infer<typeof settlementUpdateSchema>;
export type SettlementBulkAction = z.infer<typeof settlementBulkActionSchema>;
export type SettlementSummary = z.infer<typeof settlementSummarySchema>;