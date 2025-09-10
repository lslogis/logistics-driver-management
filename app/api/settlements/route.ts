import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const querySchema = z.object({
  yearMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Format: YYYY-MM'),
  driverId: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const params = querySchema.parse({
      yearMonth: url.searchParams.get('yearMonth') || undefined,
      driverId: url.searchParams.get('driverId') || undefined,
    });

    const where: any = {
      yearMonth: params.yearMonth,
    };

    if (params.driverId) {
      where.driverId = params.driverId;
    }

    const settlements = await prisma.settlement.findMany({
      where,
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            bankName: true,
            accountNumber: true,
          },
        },
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
        confirmer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { driver: { name: 'asc' } },
      ],
    });

    return NextResponse.json({
      success: true,
      data: settlements,
      summary: {
        total: settlements.length,
        draft: settlements.filter(s => s.status === 'DRAFT').length,
        confirmed: settlements.filter(s => s.status === 'CONFIRMED').length,
        paid: settlements.filter(s => s.status === 'PAID').length,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors },
        { status: 400 }
      );
    }
    console.error('Settlement fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}