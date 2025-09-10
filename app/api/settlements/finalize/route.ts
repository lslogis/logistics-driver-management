import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';
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

    const [year, month] = params.yearMonth.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Check for existing confirmed settlements
    const existingConfirmed = await prisma.settlement.findMany({
      where: {
        yearMonth: params.yearMonth,
        driverId: params.driverId,
        status: { in: ['CONFIRMED', 'PAID'] },
      },
    });

    if (existingConfirmed.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Settlement already confirmed for this period',
          existing: existingConfirmed.map(s => ({
            driverId: s.driverId,
            status: s.status,
            confirmedAt: s.confirmedAt,
          })),
        },
        { status: 409 }
      );
    }

    const whereClause: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (params.driverId) {
      whereClause.driverId = params.driverId;
    }

    // Fetch trips
    const trips = await prisma.trip.findMany({
      where: whereClause,
      include: {
        driver: true,
        routeTemplate: true,
        substituteDriver: true,
      },
    });

    // Group by driver and calculate
    const driverGroups = trips.reduce((acc, trip) => {
      const driverId = trip.driverId;
      if (!acc[driverId]) {
        acc[driverId] = {
          trips: [],
          totalBaseFare: new Decimal(0),
          totalDeductions: new Decimal(0),
          totalAdditions: new Decimal(0),
        };
      }
      acc[driverId].trips.push(trip);
      
      if (trip.status === 'COMPLETED' || trip.status === 'SCHEDULED') {
        acc[driverId].totalBaseFare = acc[driverId].totalBaseFare.plus(trip.driverFare);
      } else if (trip.status === 'ABSENCE' && trip.deductionAmount) {
        acc[driverId].totalDeductions = acc[driverId].totalDeductions.plus(trip.deductionAmount);
      } else if (trip.status === 'SUBSTITUTE' && trip.substituteFare) {
        acc[driverId].totalDeductions = acc[driverId].totalDeductions.plus(trip.substituteFare);
      }

      // Handle substitute driver
      if (trip.status === 'SUBSTITUTE' && trip.substituteDriverId && trip.substituteFare) {
        if (!acc[trip.substituteDriverId]) {
          acc[trip.substituteDriverId] = {
            trips: [],
            totalBaseFare: new Decimal(0),
            totalDeductions: new Decimal(0),
            totalAdditions: new Decimal(0),
          };
        }
        acc[trip.substituteDriverId].totalAdditions = 
          acc[trip.substituteDriverId].totalAdditions.plus(trip.substituteFare);
      }

      return acc;
    }, {} as Record<string, any>);

    // Get user for audit
    const user = session?.user ? await prisma.user.findUnique({
      where: { email: session.user.email! },
    }) : null;

    // Create settlements in transaction
    const settlements = await prisma.$transaction(async (tx) => {
      const created = [];

      for (const [driverId, data] of Object.entries(driverGroups)) {
        const finalAmount = data.totalBaseFare
          .minus(data.totalDeductions)
          .plus(data.totalAdditions);

        // Create or update settlement
        const settlement = await tx.settlement.upsert({
          where: {
            unique_driver_yearmonth: {
              driverId,
              yearMonth: params.yearMonth,
            },
          },
          update: {
            status: 'CONFIRMED',
            totalTrips: data.trips.length,
            totalBaseFare: data.totalBaseFare,
            totalDeductions: data.totalDeductions,
            totalAdditions: data.totalAdditions,
            finalAmount,
            confirmedAt: new Date(),
            confirmedBy: user?.id,
            updatedAt: new Date(),
          },
          create: {
            driverId,
            yearMonth: params.yearMonth,
            status: 'CONFIRMED',
            totalTrips: data.trips.length,
            totalBaseFare: data.totalBaseFare,
            totalDeductions: data.totalDeductions,
            totalAdditions: data.totalAdditions,
            finalAmount,
            confirmedAt: new Date(),
            confirmedBy: user?.id,
            createdBy: user?.id,
          },
        });

        // Delete existing items
        await tx.settlementItem.deleteMany({
          where: { settlementId: settlement.id },
        });

        // Create settlement items
        const items = [];
        for (const trip of data.trips) {
          if (trip.status === 'COMPLETED' || trip.status === 'SCHEDULED') {
            items.push({
              settlementId: settlement.id,
              tripId: trip.id,
              type: 'TRIP' as const,
              description: `Trip: ${trip.routeTemplate?.name || 'Custom'} - ${trip.date.toISOString().split('T')[0]}`,
              amount: trip.driverFare,
              date: trip.date,
            });
          }
          
          if (trip.status === 'ABSENCE' && trip.deductionAmount) {
            items.push({
              settlementId: settlement.id,
              tripId: trip.id,
              type: 'DEDUCTION' as const,
              description: `Absence deduction: ${trip.absenceReason || 'No reason'}`,
              amount: trip.deductionAmount.negated(),
              date: trip.date,
            });
          }
          
          if (trip.status === 'SUBSTITUTE' && trip.substituteFare) {
            items.push({
              settlementId: settlement.id,
              tripId: trip.id,
              type: 'DEDUCTION' as const,
              description: `Substitute driver payment`,
              amount: trip.substituteFare.negated(),
              date: trip.date,
            });
          }
        }

        if (items.length > 0) {
          await tx.settlementItem.createMany({ data: items });
        }

        // Create audit log
        await tx.auditLog.create({
          data: {
            userId: user?.id,
            userName: user?.name || userId,
            action: 'CONFIRM',
            entityType: 'Settlement',
            entityId: settlement.id,
            metadata: {
              yearMonth: params.yearMonth,
              driverId,
              finalAmount: finalAmount.toNumber(),
            },
          },
        });

        created.push(settlement);
      }

      return created;
    });

    return NextResponse.json({
      success: true,
      data: {
        settlements: settlements.map(s => ({
          id: s.id,
          driverId: s.driverId,
          yearMonth: s.yearMonth,
          status: s.status,
          totalTrips: s.totalTrips,
          finalAmount: s.finalAmount.toNumber(),
          confirmedAt: s.confirmedAt,
        })),
        summary: {
          totalSettlements: settlements.length,
          totalAmount: settlements.reduce((sum, s) => sum + s.finalAmount.toNumber(), 0),
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
    console.error('Settlement finalize error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}