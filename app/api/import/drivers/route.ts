import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

const prisma = new PrismaClient();

// Expected CSV headers
const EXPECTED_HEADERS = [
  'name',
  'phone',
  'email',
  'businessNumber',
  'companyName',
  'representativeName',
  'bankName',
  'accountNumber',
  'remarks',
  'isActive',
];

const driverSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(10),
  email: z.string().email().optional().nullable(),
  businessNumber: z.string().optional().nullable(),
  companyName: z.string().optional().nullable(),
  representativeName: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  isActive: z.enum(['true', 'false', '1', '0', '']).transform(val => 
    val === 'true' || val === '1' || val === ''
  ),
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
    if (missingHeaders.length > 0 && headers[0] !== 'name') {
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
    const validDrivers = [];
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      try {
        const validated = driverSchema.parse(rows[i]);
        
        // Check for duplicates
        const existing = await prisma.driver.findUnique({
          where: { phone: validated.phone },
        });

        if (existing) {
          errors.push({
            row: i + 2,
            data: rows[i],
            error: `Phone number ${validated.phone} already exists (Driver: ${existing.name})`,
          });
        } else {
          validDrivers.push(validated);
          validationResults.push({
            row: i + 2,
            status: 'valid',
            data: validated,
          });
        }
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

    // If validation errors, return without importing
    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        simulation: true,
        data: {
          totalRows: rows.length,
          validRows: validDrivers.length,
          errorRows: errors.length,
          errors,
        },
      });
    }

    // Perform actual import in transaction
    const user = session?.user ? await prisma.user.findUnique({
      where: { email: session.user.email! },
    }) : null;

    const importResult = await prisma.$transaction(async (tx) => {
      const created = [];

      for (const driver of validDrivers) {
        const newDriver = await tx.driver.create({
          data: {
            name: driver.name,
            phone: driver.phone,
            email: driver.email || null,
            businessNumber: driver.businessNumber || null,
            companyName: driver.companyName || null,
            representativeName: driver.representativeName || null,
            bankName: driver.bankName || null,
            accountNumber: driver.accountNumber || null,
            remarks: driver.remarks || null,
            isActive: driver.isActive,
          },
        });
        created.push(newDriver);
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: user?.id,
          userName: user?.name || userId,
          action: 'IMPORT',
          entityType: 'Driver',
          entityId: 'bulk',
          metadata: {
            filename: file.name,
            totalRows: rows.length,
            imported: created.length,
            timestamp: new Date().toISOString(),
          },
          changes: {
            imported: created.map(d => ({ id: d.id, name: d.name, phone: d.phone })),
          },
        },
      });

      return created;
    });

    return NextResponse.json({
      success: true,
      data: {
        imported: importResult.length,
        drivers: importResult.map(d => ({
          id: d.id,
          name: d.name,
          phone: d.phone,
          email: d.email,
        })),
        audit: {
          timestamp: new Date().toISOString(),
          filename: file.name,
          importedBy: userId,
        },
      },
    });
  } catch (error) {
    console.error('Driver import error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Import failed',
      },
      { status: 500 }
    );
  }
}