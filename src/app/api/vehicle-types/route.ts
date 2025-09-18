import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const rows = await prisma.centerFare.findMany({
      distinct: ['vehicleType'],
      select: { vehicleType: true },
      orderBy: { vehicleType: 'asc' }
    })

    const types = rows
      .map(row => row.vehicleType?.trim())
      .filter((type): type is string => !!type && type.length > 0)
      .filter((type, index, self) => self.indexOf(type) === index)

    return NextResponse.json({ data: types })
  } catch (error) {
    console.error('Failed to fetch vehicle types:', error)
    return NextResponse.json({ error: 'Failed to fetch vehicle types' }, { status: 500 })
  }
}
