import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/health - 시스템 상태 확인
 * 
 * 애플리케이션의 전반적인 건강 상태를 체크합니다.
 * - 데이터베이스 연결 상태
 * - 응답 시간 측정
 * - 시스템 기본 정보
 * - 종속성 상태 확인
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    // 기본 시스템 정보
    const systemInfo = {
      service: 'logistics-driver-management',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }

    // 데이터베이스 상태 확인
    const dbStatus = await checkDatabaseHealth()
    
    // 전체 응답 시간 계산
    const responseTime = Date.now() - startTime
    
    // 전체 상태 결정
    const isHealthy = dbStatus.status === 'healthy'
    const overallStatus = isHealthy ? 'healthy' : 'unhealthy'

    const healthCheck = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      system: systemInfo,
      services: {
        database: dbStatus
      },
      meta: {
        checks: ['database'],
        totalChecks: 1,
        healthyChecks: isHealthy ? 1 : 0
      }
    }

    // 상태에 따른 HTTP 상태 코드 반환
    const httpStatus = isHealthy ? 200 : 503

    return NextResponse.json({
      ok: isHealthy,
      data: healthCheck
    }, { 
      status: httpStatus,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${responseTime}ms`
      }
    })

  } catch (error) {
    console.error('Health check failed:', error)
    
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      ok: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: '시스템 상태 확인 중 오류가 발생했습니다'
      },
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        system: {
          service: 'logistics-driver-management',
          environment: process.env.NODE_ENV || 'development'
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 503 })
  }
}

/**
 * 데이터베이스 연결 상태 확인
 */
async function checkDatabaseHealth() {
  const dbStartTime = Date.now()
  
  try {
    // 간단한 쿼리로 데이터베이스 연결 테스트
    await prisma.$queryRaw`SELECT 1 as test`
    
    // 기본 통계 정보 수집
    const [driverCount, loadingPointCount, charterCount, settlementCount] = await Promise.all([
      prisma.driver.count({ where: { isActive: true } }),
      prisma.loadingPoint.count({ where: { isActive: true } }),
      prisma.charterRequest.count(),
      prisma.settlement.count()
    ])
    
    const dbResponseTime = Date.now() - dbStartTime
    
    return {
      status: 'healthy',
      responseTime: `${dbResponseTime}ms`,
      connection: 'active',
      statistics: {
        activeDrivers: driverCount,
        activeLoadingPoints: loadingPointCount,
        totalCharters: charterCount,
        totalSettlements: settlementCount
      },
      lastChecked: new Date().toISOString()
    }
    
  } catch (error) {
    const dbResponseTime = Date.now() - dbStartTime
    
    return {
      status: 'unhealthy',
      responseTime: `${dbResponseTime}ms`,
      connection: 'failed',
      error: error instanceof Error ? error.message : 'Unknown database error',
      lastChecked: new Date().toISOString()
    }
  }
}

/**
 * HEAD /api/admin/health - 가벼운 상태 확인
 * 
 * 헬스체크 결과의 바디 없이 상태 코드만 반환합니다.
 * 로드밸런서나 모니터링 도구에서 사용하기 적합합니다.
 */
export async function HEAD(req: NextRequest) {
  try {
    // 데이터베이스 연결만 간단히 체크
    await prisma.$queryRaw`SELECT 1 as test`
    
    return new NextResponse(null, { status: 200 })
    
  } catch (error) {
    console.error('Health check (HEAD) failed:', error)
    return new NextResponse(null, { status: 503 })
  }
}