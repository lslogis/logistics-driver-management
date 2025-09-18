import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const CenterCreateSchema = z.object({
  name: z.string().min(1, 'Center name is required').max(100, 'Center name too long'),
  location: z.string().optional().nullable().transform(val => val || null)
})

const CenterUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  location: z.string().optional().nullable().transform(val => val || null),
  isActive: z.boolean().optional()
})

const CenterQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
  search: z.string().optional(),
  isActive: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined)
})

// GET /api/centers - List all centers with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    const validatedQuery = CenterQuerySchema.parse(query)

    const where: any = {}
    
    if (validatedQuery.search) {
      where.OR = [
        { name: { contains: validatedQuery.search, mode: 'insensitive' } },
        { location: { contains: validatedQuery.search, mode: 'insensitive' } }
      ]
    }
    
    if (validatedQuery.isActive !== undefined) {
      where.isActive = validatedQuery.isActive
    }

    const [centers, total] = await Promise.all([
      prisma.center.findMany({
        where,
        include: {
          _count: {
            select: { requests: true }
          }
        },
        orderBy: [
          { isActive: 'desc' },
          { name: 'asc' }
        ],
        skip: (validatedQuery.page - 1) * validatedQuery.limit,
        take: validatedQuery.limit
      }),
      prisma.center.count({ where })
    ])

    const centersWithRequestCount = centers.map(center => ({
      id: center.id,
      name: center.name,
      location: center.location,
      isActive: center.isActive,
      requestCount: center._count.requests,
      createdAt: center.createdAt,
      updatedAt: center.updatedAt
    }))

    return NextResponse.json({
      data: centersWithRequestCount,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total,
        totalPages: Math.ceil(total / validatedQuery.limit)
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Centers GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch centers' },
      { status: 500 }
    )
  }
}

// POST /api/centers - Create a new center
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = CenterCreateSchema.parse(body)

    // Check if center name already exists
    const existingCenter = await prisma.center.findUnique({
      where: { name: validatedData.name }
    })

    if (existingCenter) {
      return NextResponse.json(
        { error: 'Center name already exists' },
        { status: 409 }
      )
    }

    const center = await prisma.center.create({
      data: {
        name: validatedData.name,
        location: validatedData.location
      }
    })

    return NextResponse.json(center, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Centers POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create center' },
      { status: 500 }
    )
  }
}