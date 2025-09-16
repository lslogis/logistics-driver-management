import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { RateService } from '@/lib/services/rate.service'
import { withAuth } from '@/lib/auth/rbac'
import { rateImpactSimulationQuerySchema } from '@/lib/validations/rate'
import { isFeatureEnabled } from '@/lib/feature-flags'

const rateService = new RateService(prisma)

/**
 * GET /api/rates/simulate - 요금 변화 영향 분석 (시뮬레이션)
 */
export const GET = withAuth(
  async (req: NextRequest) => {
    // Feature flag guard
    if (!isFeatureEnabled('rates')) {
      return NextResponse.json({
        ok: false,
        error: {
          code: 'FEATURE_DISABLED',
          message: '요금 분석 기능이 현재 비활성화되어 있습니다'
        }
      }, { status: 404 })
    }

    const startTime = performance.now();
    console.log('[RATES] Simulation request started', {
      url: req.url,
      timestamp: new Date().toISOString()
    });

    try {
      const { searchParams } = new URL(req.url)
      const query = rateImpactSimulationQuerySchema.parse({
        from: searchParams.get('from'),
        to: searchParams.get('to'),
        center: searchParams.get('center') || undefined,
        tonnage: searchParams.get('tonnage') || undefined
      })

      // 비즈니스 로직 검증
      const fromDate = new Date(query.from + '-01')
      const toDate = new Date(query.to + '-01')
      const now = new Date()
      
      // 미래 날짜 검증
      if (toDate > now) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'INVALID_DATE_RANGE',
            message: '미래 기간에 대한 분석은 수행할 수 없습니다'
          }
        }, { status: 400 })
      }

      // 권한별 접근 제한 (Operations/Admin만)
      const token = req.headers.get('authorization')?.replace('Bearer ', '') || ''
      // 실제 환경에서는 JWT 토큰에서 사용자 역할 확인
      // 현재는 기본 구현으로 진행

      const result = await rateService.simulateRateImpact(query)

      const responseTime = performance.now() - startTime;
      
      // 성능 및 보안 로그 (관리자/운영진 전용 분석)
      console.log(`[RATES] Simulation completed in ${responseTime.toFixed(2)}ms`, {
        from: query.from,
        to: query.to,
        center: query.center,
        tonnage: query.tonnage,
        centersAnalyzed: result.byCenter.length,
        outliersDetected: result.outliers.length,
        totalImpact: result.deltaBilling,
        responseTime: Math.round(responseTime),
        timestamp: new Date().toISOString()
      });

      // 민감한 재무 데이터 접근 로그
      if (Math.abs(result.deltaBilling) > 1000000) { // 백만원 이상 영향
        console.warn('[RATES] High-impact simulation accessed', {
          impactAmount: result.deltaBilling,
          centersAffected: result.summary.centersAffected,
          periods: result.summary.periodsCompared,
          accessTime: new Date().toISOString()
        });
      }

      return NextResponse.json({ 
        ok: true, 
        data: result
      })
    } catch (error) {
      const responseTime = performance.now() - startTime;
      
      // 상세한 오류 로깅
      console.error(`[RATES] Simulation failed in ${responseTime.toFixed(2)}ms:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        url: req.url,
        timestamp: new Date().toISOString()
      });

      if (error instanceof ZodError) {
        return NextResponse.json({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '요청 파라미터가 올바르지 않습니다',
            details: error.errors.map(e => ({
              path: e.path.join('.'),
              message: e.message
            }))
          }
        }, { status: 400 })
      }

      if (error instanceof Error) {
        // 특정 비즈니스 오류 처리
        if (error.message.includes('데이터를 찾을 수 없습니다')) {
          return NextResponse.json({
            ok: false,
            error: {
              code: 'NO_DATA_FOUND',
              message: '분석 대상 기간에 해당하는 데이터가 없습니다',
              suggestion: '다른 기간을 선택하거나 데이터 존재 여부를 확인해주세요'
            }
          }, { status: 404 })
        }

        if (error.message.includes('권한')) {
          return NextResponse.json({
            ok: false,
            error: {
              code: 'ACCESS_DENIED',
              message: '요금 분석 기능에 대한 접근 권한이 없습니다'
            }
          }, { status: 403 })
        }
      }

      // 일반적인 서버 오류
      return NextResponse.json({
        ok: false,
        error: {
          code: 'SIMULATION_ERROR',
          message: '요금 영향 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요'
        }
      }, { status: 500 })
    }
  },
  { 
    resource: 'rates', 
    action: 'read'
  }
)