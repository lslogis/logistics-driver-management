const { NextRequest, NextResponse } = require('next/server');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 직접 getFixedRoutes 함수를 시뮬레이션
async function testDirectGetFixedRoutes() {
  try {
    console.log('🔍 [Direct Test] 시작...');
    
    // URL 시뮬레이션
    const url = new URL('http://localhost:3000/api/fixed-routes?page=1&limit=5');
    const searchParams = url.searchParams;
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const loadingPointId = searchParams.get('loadingPointId');
    const assignedDriverId = searchParams.get('assignedDriverId');

    console.log('🔍 [Direct Test] 파라미터:', { page, limit, search, loadingPointId, assignedDriverId });

    const skip = (page - 1) * limit;

    // 검색 조건 구성
    const where = {
      isActive: true
    };

    if (search) {
      where.OR = [
        { routeName: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (loadingPointId) {
      where.loadingPointId = loadingPointId;
    }

    if (assignedDriverId) {
      where.assignedDriverId = assignedDriverId;
    }

    console.log('🔍 [Direct Test] Where 조건:', where);

    // 데이터 조회
    console.log('🔍 [Direct Test] Prisma 쿼리 실행...');
    const [fixedRoutes, total] = await Promise.all([
      prisma.fixedRoute.findMany({
        where,
        skip,
        take: limit,
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
        },
        orderBy: [
          { createdAt: 'desc' }
        ]
      }),
      prisma.fixedRoute.count({ where })
    ]);

    console.log('🔍 [Direct Test] 쿼리 결과:', { fixedRoutesCount: fixedRoutes.length, total });

    const totalPages = Math.ceil(total / limit);

    const result = {
      ok: true,
      data: {
        fixedRoutes: fixedRoutes.map(route => ({
          ...route,
          createdAt: route.createdAt.toISOString(),
          updatedAt: route.updatedAt.toISOString(),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    };

    console.log('✅ [Direct Test] 성공:', JSON.stringify(result, null, 2));
    return result;

  } catch (error) {
    console.error('❌ [Direct Test] 실패:', error);
    console.error('❌ [Direct Test] 에러 스택:', error?.stack);
    return { error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

testDirectGetFixedRoutes();