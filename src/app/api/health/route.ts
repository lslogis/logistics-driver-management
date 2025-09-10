import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    // 데이터베이스 연결 확인
    const dbCheck = await prisma.$queryRaw`SELECT 1 as health_check`
    
    // 기본 시스템 정보
    const systemInfo = {
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      database: dbCheck ? 'connected' : 'disconnected'
    }

    // 간단한 통계 (선택적)
    let stats = {}
    try {
      const [driversCount, vehiclesCount, tripsCount] = await Promise.all([
        prisma.driver.count({ where: { isActive: true } }),
        prisma.vehicle.count({ where: { isActive: true } }),
        prisma.trip.count({
          where: {
            date: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        })
      ])
      
      stats = {
        activeDrivers: driversCount,
        activeVehicles: vehiclesCount,
        monthlyTrips: tripsCount
      }
    } catch (statsError) {
      // 통계 조회 실패해도 헬스체크는 성공
      stats = { error: 'Stats unavailable' }
    }

    return new Response(
      JSON.stringify({
        status: 'healthy',
        system: systemInfo,
        stats
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Health check failed:', error)
    
    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}