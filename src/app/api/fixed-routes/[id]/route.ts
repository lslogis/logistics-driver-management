import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UpdateFixedRouteSchema } from '@/lib/validations/fixedRoute'
import { getCurrentUser } from '@/lib/auth/server'

// GET /api/fixed-routes/[id] - 고정노선 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    
    if (!user) {
      return NextResponse.json({ ok: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } }, { status: 401 })
    }

    const { id } = params

    const routeTemplate = await prisma.routeTemplate.findUnique({
      where: { id },
      include: {
        loadingPointRef: {
          select: {
            id: true,
            centerName: true,
            loadingPointName: true,
          }
        },
        defaultDriver: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleNumber: true,
          }
        }
      }
    })

    if (!routeTemplate) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: '고정노선을 찾을 수 없습니다' } },
        { status: 404 }
      )
    }

    // RouteTemplate을 FixedRoute 형식으로 변환
    const fixedRoute = {
      id: routeTemplate.id,
      loadingPointId: routeTemplate.loadingPointId || '',
      routeName: routeTemplate.name,
      assignedDriverId: routeTemplate.defaultDriverId,
      weekdayPattern: routeTemplate.weekdayPattern,
      contractType: 'FIXED_DAILY',
      revenueDaily: routeTemplate.billingFare,
      costDaily: routeTemplate.driverFare,
      isActive: routeTemplate.isActive,
      createdAt: routeTemplate.createdAt.toISOString(),
      updatedAt: routeTemplate.updatedAt.toISOString(),
      loadingPoint: routeTemplate.loadingPointRef,
      assignedDriver: routeTemplate.defaultDriver
    }

    return NextResponse.json({
      ok: true,
      data: {
        ...fixedRoute,
        createdAt: fixedRoute.createdAt.toISOString(),
        updatedAt: fixedRoute.updatedAt.toISOString(),
      }
    })

  } catch (error) {
    console.error('고정노선 조회 실패:', error)
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    )
  }
}

// PUT /api/fixed-routes/[id] - 고정노선 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    
    if (!user) {
      return NextResponse.json({ ok: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const validatedData = UpdateFixedRouteSchema.parse(body)

    // 기존 데이터 확인
    const existingRoute = await prisma.routeTemplate.findUnique({
      where: { id }
    })

    if (!existingRoute) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: '고정노선을 찾을 수 없습니다' } },
        { status: 404 }
      )
    }

    // 중복 체크 (다른 고정노선과 같은 상차지 + 노선명)
    if (validatedData.loadingPointId && validatedData.routeName) {
      const duplicateRoute = await prisma.fixedRoute.findFirst({
        where: {
          id: { not: id },
          loadingPointId: validatedData.loadingPointId,
          routeName: validatedData.routeName,
          isActive: true
        }
      })

      if (duplicateRoute) {
        return NextResponse.json(
          { ok: false, error: { code: 'DUPLICATE_ROUTE', message: '이미 등록된 노선입니다' } },
          { status: 400 }
        )
      }
    }

    // 배정기사 중복 체크
    if (validatedData.assignedDriverId && validatedData.weekdayPattern) {
      const conflictRoute = await prisma.fixedRoute.findFirst({
        where: {
          id: { not: id },
          assignedDriverId: validatedData.assignedDriverId,
          isActive: true,
          weekdayPattern: {
            hasSome: validatedData.weekdayPattern
          }
        }
      })

      if (conflictRoute) {
        return NextResponse.json(
          { ok: false, error: { code: 'DRIVER_CONFLICT', message: '해당 기사는 같은 요일에 이미 배정되어 있습니다' } },
          { status: 400 }
        )
      }
    }

    const updatedRoute = await prisma.fixedRoute.update({
      where: { id },
      data: validatedData,
      include: {
        loadingPoint: {
          select: {
            id: true,
            centerName: true,
            loadingPointName: true,
          }
        },
        assignedDriver: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleNumber: true,
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    return NextResponse.json({
      ok: true,
      data: {
        ...updatedRoute,
        createdAt: updatedRoute.createdAt.toISOString(),
        updatedAt: updatedRoute.updatedAt.toISOString(),
      }
    })

  } catch (error) {
    console.error('고정노선 수정 실패:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { ok: false, error: { code: 'VALIDATION_ERROR', message: '입력 데이터가 올바르지 않습니다', details: error } },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    )
  }
}

// DELETE /api/fixed-routes/[id] - 고정노선 삭제 (비활성화)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    
    if (!user) {
      return NextResponse.json({ ok: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } }, { status: 401 })
    }

    const { id } = params

    const existingRoute = await prisma.routeTemplate.findUnique({
      where: { id }
    })

    if (!existingRoute) {
      return NextResponse.json(
        { ok: false, error: { code: 'NOT_FOUND', message: '고정노선을 찾을 수 없습니다' } },
        { status: 404 }
      )
    }

    // Soft delete - isActive를 false로 설정
    await prisma.routeTemplate.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ ok: true, message: '고정노선이 비활성화되었습니다' })

  } catch (error) {
    console.error('고정노선 삭제 실패:', error)
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    )
  }
}