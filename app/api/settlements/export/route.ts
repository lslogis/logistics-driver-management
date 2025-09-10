import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { getServerSession } from 'next-auth';

const prisma = new PrismaClient();

const requestSchema = z.object({
  yearMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Format: YYYY-MM'),
  driverId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    const userId = session?.user?.email || 'system';
    
    const body = await request.json();
    const params = requestSchema.parse(body);

    const where: any = {
      yearMonth: params.yearMonth,
      status: { in: ['CONFIRMED', 'PAID'] },
    };

    if (params.driverId) {
      where.driverId = params.driverId;
    }

    const settlements = await prisma.settlement.findMany({
      where,
      include: {
        driver: true,
        items: {
          orderBy: { date: 'asc' },
          include: {
            trip: {
              include: {
                routeTemplate: true,
                vehicle: true,
              },
            },
          },
        },
      },
      orderBy: { driver: { name: 'asc' } },
    });

    if (settlements.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No confirmed settlements found for export' },
        { status: 404 }
      );
    }

    // Create audit log
    const user = session?.user ? await prisma.user.findUnique({
      where: { email: session.user.email! },
    }) : null;

    await prisma.auditLog.create({
      data: {
        userId: user?.id,
        userName: user?.name || userId,
        action: 'EXPORT',
        entityType: 'Settlement',
        entityId: params.yearMonth,
        metadata: {
          yearMonth: params.yearMonth,
          driverId: params.driverId,
          count: settlements.length,
        },
      },
    });

    // Format export data (Excel format stub)
    const exportData = settlements.map(s => ({
      'Settlement ID': s.id,
      'Year-Month': s.yearMonth,
      'Driver ID': s.driverId,
      'Driver Name': s.driver.name,
      'Phone': s.driver.phone,
      'Bank': s.driver.bankName || '',
      'Account': s.driver.accountNumber || '',
      'Total Trips': s.totalTrips,
      'Base Fare': s.totalBaseFare.toNumber(),
      'Deductions': s.totalDeductions.toNumber(),
      'Additions': s.totalAdditions.toNumber(),
      'Final Amount': s.finalAmount.toNumber(),
      'Status': s.status,
      'Confirmed At': s.confirmedAt?.toISOString() || '',
      'Paid At': s.paidAt?.toISOString() || '',
      'Items': s.items.map(item => ({
        date: item.date.toISOString().split('T')[0],
        type: item.type,
        description: item.description,
        amount: item.amount.toNumber(),
        trip: item.trip ? {
          route: item.trip.routeTemplate?.name || 'Custom',
          vehicle: item.trip.vehicle.plateNumber,
        } : null,
      })),
    }));

    // In production, this would generate actual Excel file
    // For now, return JSON structure that represents Excel data
    return NextResponse.json({
      success: true,
      data: {
        format: 'excel_stub',
        filename: `settlements_${params.yearMonth}.xlsx`,
        sheets: {
          'Summary': exportData.map(({ Items, ...rest }) => rest),
          'Details': exportData.flatMap(s => 
            s.Items.map(item => ({
              'Driver': s['Driver Name'],
              'Date': item.date,
              'Type': item.type,
              'Description': item.description,
              'Amount': item.amount,
              'Route': item.trip?.route || '',
              'Vehicle': item.trip?.vehicle || '',
            }))
          ),
        },
        metadata: {
          exportedAt: new Date().toISOString(),
          exportedBy: userId,
          recordCount: settlements.length,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors },
        { status: 400 }
      );
    }
    console.error('Settlement export error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}