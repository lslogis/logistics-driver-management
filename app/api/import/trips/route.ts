import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// Expected CSV headers  
const EXPECTED_HEADERS = [
  'date',
  'driverPhone',
  'vehiclePlateNumber',
  'routeTemplateName',
  'status',
  'driverFare',
  'billingFare',
  'absenceReason',
  'deductionAmount',
  'substituteDriverPhone',
  'substituteFare',
  'remarks',
];

const tripSchema = z.object({
  date: z.string().refine(val => !isNaN(Date.parse(val)), 'Invalid date'),
  driverPhone: z.string().min(10),
  vehiclePlateNumber: z.string().min(1),
  routeTemplateName: z.string().optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'ABSENCE', 'SUBSTITUTE']),
  driverFare: z.string().transform(val => new Decimal(val || '0')),
  billingFare: z.string().transform(val => new Decimal(val || '0')),
  absenceReason: z.string().optional().nullable(),
  deductionAmount: z.string().optional().transform(val => val ? new Decimal(val) : null),
  substituteDriverPhone: z.string().optional().nullable(),
  substituteFare: z.string().optional().transform(val => val ? new Decimal(val) : null),
  remarks: z.string().optional().nullable(),
});

function parseCSV(content: string): { headers: string[]; rows: any[] } {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) {
    throw new Error('Empty CSV file');
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    const userId = session?.user?.email || 'system';
    
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { success: false, error: 'File must be CSV format' },
        { status: 400 }
      );
    }

    const content = await file.text();
    const { headers, rows } = parseCSV(content);

    // Validate headers
    const missingHeaders = EXPECTED_HEADERS.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0 && headers[0] !== 'date') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid CSV headers',
          expected: EXPECTED_HEADERS,
          received: headers,
          missing: missingHeaders,
        },
        { status: 400 }
      );
    }

    // Validate and simulate import
    const validationResults = [];
    const validTrips = [];
    const errors = [];
    const duplicates = [];

    for (let i = 0; i < rows.length; i++) {
      try {
        const validated = tripSchema.parse(rows[i]);
        
        // Resolve driver by phone
        const driver = await prisma.driver.findUnique({
          where: { phone: validated.driverPhone },
        });

        if (!driver) {
          errors.push({
            row: i + 2,
            data: rows[i],
            error: `Driver not found with phone: ${validated.driverPhone}`,
          });
          continue;
        }

        // Resolve vehicle by plate number
        const vehicle = await prisma.vehicle.findUnique({
          where: { plateNumber: validated.vehiclePlateNumber },
        });

        if (!vehicle) {
          errors.push({
            row: i + 2,
            data: rows[i],
            error: `Vehicle not found with plate: ${validated.vehiclePlateNumber}`,
          });
          continue;
        }

        // Resolve route template if provided
        let routeTemplateId = null;
        if (validated.routeTemplateName) {
          const routeTemplate = await prisma.routeTemplate.findUnique({
            where: { name: validated.routeTemplateName },
          });
          
          if (!routeTemplate) {
            errors.push({
              row: i + 2,
              data: rows[i],
              error: `Route template not found: ${validated.routeTemplateName}`,
            });
            continue;
          }
          routeTemplateId = routeTemplate.id;
        }

        // Resolve substitute driver if provided
        let substituteDriverId = null;
        if (validated.substituteDriverPhone) {
          const substituteDriver = await prisma.driver.findUnique({
            where: { phone: validated.substituteDriverPhone },
          });
          
          if (!substituteDriver) {
            errors.push({
              row: i + 2,
              data: rows[i],
              error: `Substitute driver not found with phone: ${validated.substituteDriverPhone}`,
            });
            continue;
          }
          substituteDriverId = substituteDriver.id;
        }

        // Check for duplicate (unique constraint)
        const tripDate = new Date(validated.date);
        const existing = await prisma.trip.findUnique({
          where: {
            unique_vehicle_date_driver: {
              vehicleId: vehicle.id,
              date: tripDate,
              driverId: driver.id,
            },
          },
        });

        if (existing) {
          duplicates.push({
            row: i + 2,
            data: rows[i],
            error: `Trip already exists for vehicle ${validated.vehiclePlateNumber} on ${validated.date} with driver ${driver.name}`,
            existingId: existing.id,
          });
          continue;
        }

        validTrips.push({
          date: tripDate,
          driverId: driver.id,
          vehicleId: vehicle.id,
          routeType: routeTemplateId ? 'fixed' : 'custom',
          routeTemplateId,
          status: validated.status,
          driverFare: validated.driverFare,
          billingFare: validated.billingFare,
          absenceReason: validated.absenceReason,
          deductionAmount: validated.deductionAmount,
          substituteDriverId,
          substituteFare: validated.substituteFare,
          remarks: validated.remarks,
          createdBy: userId,
        });

        validationResults.push({
          row: i + 2,
          status: 'valid',
          data: {
            date: validated.date,
            driver: driver.name,
            vehicle: vehicle.plateNumber,
            route: validated.routeTemplateName || 'Custom',
          },
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push({
            row: i + 2,
            data: rows[i],
            error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          });
        }
      }
    }

    // If validation errors or duplicates, return report
    if (errors.length > 0 || duplicates.length > 0) {
      return NextResponse.json({
        success: false,
        simulation: true,
        data: {
          totalRows: rows.length,
          validRows: validTrips.length,
          errorRows: errors.length,
          duplicateRows: duplicates.length,
          errors,
          duplicates,
          summary: {
            canImport: validTrips.length,
            blocked: errors.length + duplicates.length,
          },
        },
      });
    }

    // Perform actual import in transaction
    const user = session?.user ? await prisma.user.findUnique({
      where: { email: session.user.email! },
    }) : null;

    const importResult = await prisma.$transaction(async (tx) => {
      const created = [];

      for (const trip of validTrips) {
        const newTrip = await tx.trip.create({
          data: trip,
          include: {
            driver: true,
            vehicle: true,
            routeTemplate: true,
          },
        });
        created.push(newTrip);
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: user?.id,
          userName: user?.name || userId,
          action: 'IMPORT',
          entityType: 'Trip',
          entityId: 'bulk',
          metadata: {
            filename: file.name,
            totalRows: rows.length,
            imported: created.length,
            timestamp: new Date().toISOString(),
          },
          changes: {
            imported: created.map(t => ({
              id: t.id,
              date: t.date,
              driver: t.driver.name,
              vehicle: t.vehicle.plateNumber,
            })),
          },
        },
      });

      return created;
    });

    return NextResponse.json({
      success: true,
      data: {
        imported: importResult.length,
        trips: importResult.map(t => ({
          id: t.id,
          date: t.date,
          driver: t.driver.name,
          vehicle: t.vehicle.plateNumber,
          route: t.routeTemplate?.name || 'Custom',
          status: t.status,
        })),
        audit: {
          timestamp: new Date().toISOString(),
          filename: file.name,
          importedBy: userId,
        },
      },
    });
  } catch (error) {
    console.error('Trip import error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Import failed',
      },
      { status: 500 }
    );
  }
}