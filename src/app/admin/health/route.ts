import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /admin/health - 시스템 상태 확인 (단순화된 버전)
 * 
 * 요구사항에 맞는 응답 형식:
 * { ok: true, service: "app", migrated: true/false, now: ISOString }
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Prisma 연결 확인
    await prisma.$queryRaw`SELECT 1 as test`
    
    // 마이그레이션 상태 확인 (간단한 테이블 존재 확인)
    let migrated = false
    try {
      await prisma.driver.findFirst()
      migrated = true
    } catch (error) {
      migrated = false
    }
    
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      ok: true,
      service: "app",
      migrated,
      now: new Date().toISOString()
    }, { 
      status: 200,
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
      service: "app",
      migrated: false,
      now: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Database connection failed'
    }, { 
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'X-Response-Time': `${responseTime}ms`
      }
    })
  }
}