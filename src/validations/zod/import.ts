import { z } from 'zod';

// Driver import schema (9-column structure)
export const driverImportSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string()
    .min(10)
    .max(20)
    .regex(/^[0-9\-\+\(\)\s]+$/, 'Invalid phone format'),
  vehicleNumber: z.string().min(1).max(20),
  businessName: z.string().max(100).optional().nullable(),
  representative: z.string().max(100).optional().nullable(),
  businessNumber: z.string().max(50).optional().nullable(),
  bankName: z.string().max(50).optional().nullable(),
  accountNumber: z.string().max(50).optional().nullable(),
  remarks: z.string().max(500).optional().nullable(),
  isActive: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true' || val === '1' || val === ''),
  ]).optional().default(true),
});

// Trip import schema
export const tripImportSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
  driverPhone: z.string().min(10).max(20),
  vehiclePlateNumber: z.string().min(1).max(20),
  routeTemplateName: z.string().max(100).optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'ABSENCE', 'SUBSTITUTE']),
  driverFare: z.union([
    z.number(),
    z.string().transform((val) => parseFloat(val)),
  ]),
  billingFare: z.union([
    z.number(),
    z.string().transform((val) => parseFloat(val)),
  ]),
  absenceReason: z.string().max(200).optional().nullable(),
  deductionAmount: z.union([
    z.number(),
    z.string().transform((val) => val ? parseFloat(val) : null),
  ]).optional().nullable(),
  substituteDriverPhone: z.string().max(20).optional().nullable(),
  substituteFare: z.union([
    z.number(),
    z.string().transform((val) => val ? parseFloat(val) : null),
  ]).optional().nullable(),
  remarks: z.string().max(500).optional().nullable(),
});

// Vehicle import schema
export const vehicleImportSchema = z.object({
  plateNumber: z.string().min(1).max(20),
  vehicleType: z.string().max(50),
  ownership: z.enum(['OWNED', 'CHARTER', 'CONSIGNED']),
  driverPhone: z.string().max(20).optional().nullable(),
  isActive: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true' || val === '1' || val === ''),
  ]).optional().default(true),
  capacity: z.union([
    z.number(),
    z.string().transform((val) => val ? parseFloat(val) : null),
  ]).optional().nullable(),
  year: z.union([
    z.number(),
    z.string().transform((val) => val ? parseInt(val) : null),
  ]).optional().nullable(),
});

// Route template import schema
export const routeTemplateImportSchema = z.object({
  name: z.string().min(1).max(100),
  loadingPoint: z.string().min(1).max(200),
  unloadingPoint: z.string().min(1).max(200),
  distance: z.union([
    z.number(),
    z.string().transform((val) => val ? parseFloat(val) : null),
  ]).optional().nullable(),
  driverFare: z.union([
    z.number(),
    z.string().transform((val) => parseFloat(val)),
  ]),
  billingFare: z.union([
    z.number(),
    z.string().transform((val) => parseFloat(val)),
  ]),
  weekdayPattern: z.union([
    z.array(z.number()),
    z.string().transform((val) => val.split(',').map(Number)),
  ]).optional().default([]),
  defaultDriverPhone: z.string().max(20).optional().nullable(),
  isActive: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true' || val === '1' || val === ''),
  ]).optional().default(true),
});

// Import result schema
export const importResultSchema = z.object({
  success: z.boolean(),
  imported: z.number().int(),
  failed: z.number().int(),
  errors: z.array(z.object({
    row: z.number(),
    field: z.string().optional(),
    message: z.string(),
    data: z.record(z.any()).optional(),
  })).optional(),
  duplicates: z.array(z.object({
    row: z.number(),
    existingId: z.string(),
    message: z.string(),
  })).optional(),
  warnings: z.array(z.object({
    row: z.number(),
    message: z.string(),
  })).optional(),
});

// CSV validation schema
export const csvFileSchema = z.object({
  filename: z.string().endsWith('.csv'),
  size: z.number().max(10 * 1024 * 1024), // 10MB max
  mimetype: z.string().refine(
    (val) => val === 'text/csv' || val === 'application/vnd.ms-excel',
    'File must be CSV format'
  ),
});

// Import options schema
export const importOptionsSchema = z.object({
  skipDuplicates: z.boolean().optional().default(false),
  updateExisting: z.boolean().optional().default(false),
  validateOnly: z.boolean().optional().default(false),
  batchSize: z.number().int().min(1).max(1000).optional().default(100),
});

// Import mapping schema
export const importMappingSchema = z.object({
  sourceColumn: z.string(),
  targetField: z.string(),
  transform: z.enum(['none', 'uppercase', 'lowercase', 'trim', 'date', 'number']).optional(),
  defaultValue: z.any().optional(),
  required: z.boolean().optional().default(false),
});

// Batch import schema
export const batchImportSchema = z.object({
  entityType: z.enum(['driver', 'vehicle', 'trip', 'routeTemplate']),
  data: z.array(z.record(z.any())),
  options: importOptionsSchema.optional(),
  mappings: z.array(importMappingSchema).optional(),
});

// Import validation helpers
export const validatePhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return /^[0-9+]{10,20}$/.test(cleaned);
};

export const validatePlateNumber = (plate: string): boolean => {
  const cleaned = plate.replace(/[\s\-]/g, '').toUpperCase();
  return /^[A-Z0-9]{2,20}$/.test(cleaned);
};

export const validateDate = (dateStr: string): Date | null => {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};

// Type exports
export type DriverImport = z.infer<typeof driverImportSchema>;
export type TripImport = z.infer<typeof tripImportSchema>;
export type VehicleImport = z.infer<typeof vehicleImportSchema>;
export type RouteTemplateImport = z.infer<typeof routeTemplateImportSchema>;
export type ImportResult = z.infer<typeof importResultSchema>;
export type CsvFile = z.infer<typeof csvFileSchema>;
export type ImportOptions = z.infer<typeof importOptionsSchema>;
export type ImportMapping = z.infer<typeof importMappingSchema>;
export type BatchImport = z.infer<typeof batchImportSchema>;