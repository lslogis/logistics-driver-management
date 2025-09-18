import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const CenterUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  location: z.string().optional().nullable().transform(val => val || null),
  isActive: z.boolean().optional()
})

// GET /api/centers/:id - Get center details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const centerId = parseInt(params.id, 10)
    
    if (isNaN(centerId)) {
      return NextResponse.json(
        { error: 'Invalid center ID' },
        { status: 400 }
      )
    }

    const center = await prisma.center.findUnique({
      where: { id: centerId },
      include: {
        _count: {
          select: { requests: true }
        }
      }
    })

    if (!center) {
      return NextResponse.json(
        { error: 'Center not found' },
        { status: 404 }
      )
    }

    const centerWithRequestCount = {
      id: center.id,
      name: center.name,
      location: center.location,
      isActive: center.isActive,
      requestCount: center._count.requests,
      createdAt: center.createdAt,
      updatedAt: center.updatedAt
    }

    return NextResponse.json(centerWithRequestCount)

  } catch (error) {
    console.error('Centers GET by ID error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch center' },
      { status: 500 }
    )
  }
}

// PUT /api/centers/:id - Update center information
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const centerId = parseInt(params.id, 10)
    
    if (isNaN(centerId)) {
      return NextResponse.json(
        { error: 'Invalid center ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = CenterUpdateSchema.parse(body)

    // Check if center exists
    const existingCenter = await prisma.center.findUnique({
      where: { id: centerId }
    })

    if (!existingCenter) {
      return NextResponse.json(
        { error: 'Center not found' },
        { status: 404 }
      )
    }

    // Check if name is being updated and already exists
    if (validatedData.name && validatedData.name !== existingCenter.name) {
      const nameExists = await prisma.center.findUnique({
        where: { name: validatedData.name }
      })

      if (nameExists) {
        return NextResponse.json(
          { error: 'Center name already exists' },
          { status: 409 }
        )
      }
    }

    const updatedCenter = await prisma.center.update({
      where: { id: centerId },
      data: validatedData,
      include: {
        _count: {
          select: { requests: true }
        }
      }
    })

    const centerWithRequestCount = {
      id: updatedCenter.id,
      name: updatedCenter.name,
      location: updatedCenter.location,
      isActive: updatedCenter.isActive,
      requestCount: updatedCenter._count.requests,
      createdAt: updatedCenter.createdAt,
      updatedAt: updatedCenter.updatedAt
    }

    return NextResponse.json(centerWithRequestCount)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Centers PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update center' },
      { status: 500 }
    )
  }
}

// DELETE /api/centers/:id - Soft delete center (set isActive = false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const centerId = parseInt(params.id, 10)
    
    if (isNaN(centerId)) {
      return NextResponse.json(
        { error: 'Invalid center ID' },
        { status: 400 }
      )
    }

    // Check if center exists
    const existingCenter = await prisma.center.findUnique({
      where: { id: centerId },
      include: {
        _count: {
          select: { requests: true }
        }
      }
    })

    if (!existingCenter) {
      return NextResponse.json(
        { error: 'Center not found' },
        { status: 404 }
      )
    }

    // Check if center has active requests
    if (existingCenter._count.requests > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete center with existing requests',
          requestCount: existingCenter._count.requests
        },
        { status: 409 }
      )
    }

    // Soft delete by setting isActive to false
    const deletedCenter = await prisma.center.update({
      where: { id: centerId },
      data: { isActive: false }
    })

    return NextResponse.json({
      message: 'Center deleted successfully',
      center: deletedCenter
    })

  } catch (error) {
    console.error('Centers DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete center' },
      { status: 500 }
    )
  }
}