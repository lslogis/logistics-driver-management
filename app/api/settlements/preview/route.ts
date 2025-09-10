import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

const requestSchema = z.object({
  yearMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Format: YYYY-MM'),
  driverId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const params = requestSchema.parse(body);

    const [year, month] = params.yearMonth.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const whereClause: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (params.driverId) {
      whereClause.driverId = params.driverId;
    }

    // Fetch all trips for the period
    const trips = await prisma.trip.findMany({
      where: whereClause,
      include: {
        driver: true,
        routeTemplate: true,
        vehicle: true,
        substituteDriver: true,
      },
    });

    // Group trips by driver
    const driverGroups = trips.reduce((acc, trip) => {
      const driverId = trip.driverId;
      if (!acc[driverId]) {
        acc[driverId] = {
          driver: trip.driver,
          trips: [],
          totalBaseFare: new Decimal(0),
          totalDeductions: new Decimal(0),
          totalAdditions: new Decimal(0),
          tripCount: 0,
        };
      }
      acc[driverId].trips.push(trip);
      acc[driverId].tripCount++;
      
      // Calculate based on trip status
      if (trip.status === 'COMPLETED' || trip.status === 'SCHEDULED') {
        acc[driverId].totalBaseFare = acc[driverId].totalBaseFare.plus(trip.driverFare);
      } else if (trip.status === 'ABSENCE' && trip.deductionAmount) {
        acc[driverId].totalDeductions = acc[driverId].totalDeductions.plus(trip.deductionAmount);
      } else if (trip.status === 'SUBSTITUTE' && trip.substituteFare) {
        // Original driver gets deduction for substitute fare
        acc[driverId].totalDeductions = acc[driverId].totalDeductions.plus(trip.substituteFare);
      }

      // Handle substitute driver earnings
      if (trip.status === 'SUBSTITUTE' && trip.substituteDriverId && trip.substituteFare) {
        if (!acc[trip.substituteDriverId]) {
          const substituteDriver = trip.substituteDriver!;
          acc[trip.substituteDriverId] = {
            driver: substituteDriver,
            trips: [],
            totalBaseFare: new Decimal(0),
            totalDeductions: new Decimal(0),
            totalAdditions: new Decimal(0),
            tripCount: 0,
          };
        }
        acc[trip.substituteDriverId].totalAdditions = 
          acc[trip.substituteDriverId].totalAdditions.plus(trip.substituteFare);
      }

      return acc;
    }, {} as Record<string, any>);

    // Format preview data
    const previews = Object.entries(driverGroups).map(([driverId, data]) => {
      const finalAmount = data.totalBaseFare
        .minus(data.totalDeductions)
        .plus(data.totalAdditions);

      return {
        driverId,
        driver: {
          id: data.driver.id,
          name: data.driver.name,
          phone: data.driver.phone,
          bankName: data.driver.bankName,
          accountNumber: data.driver.accountNumber,
        },
        yearMonth: params.yearMonth,
        totalTrips: data.tripCount,
        totalBaseFare: data.totalBaseFare.toNumber(),
        totalDeductions: data.totalDeductions.toNumber(),
        totalAdditions: data.totalAdditions.toNumber(),
        finalAmount: finalAmount.toNumber(),
        trips: data.trips.map((trip: any) => ({
          id: trip.id,
          date: trip.date,
          status: trip.status,
          routeName: trip.routeTemplate?.name || 'Custom Route',
          driverFare: trip.driverFare.toNumber(),
          billingFare: trip.billingFare.toNumber(),
          deductionAmount: trip.deductionAmount?.toNumber() || 0,
          substituteFare: trip.substituteFare?.toNumber() || 0,
          vehiclePlate: trip.vehicle.plateNumber,
        })),
      };
    });

    // Check existing settlements
    const existingSettlements = await prisma.settlement.findMany({
      where: {
        yearMonth: params.yearMonth,
        driverId: params.driverId || { in: Object.keys(driverGroups) },
      },
      select: {
        driverId: true,
        status: true,
      },
    });

    const existingMap = existingSettlements.reduce((acc, s) => {
      acc[s.driverId] = s.status;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({
      success: true,
      data: {
        previews,
        existingSettlements: existingMap,
        summary: {
          totalDrivers: previews.length,
          totalAmount: previews.reduce((sum, p) => sum + p.finalAmount, 0),
          hasExisting: Object.keys(existingMap).length > 0,
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
    console.error('Settlement preview error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}