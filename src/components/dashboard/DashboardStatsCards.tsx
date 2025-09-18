'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Truck, Calculator, ArrowRight, TrendingUp, AlertCircle, Zap, DollarSign, Target, BarChart3, Percent, Edit3 } from 'lucide-react'
import { useFeatureFlag } from '@/lib/feature-flags'
// recharts 제거: 빌드 시 모듈 미설치 오류 발생하여
// 간단한 CSS 기반 차트로 대체합니다.

interface StatsData {
  drivers: {
    total: number
    active: number
    activePercentage: number
  }
  settlements: {
    pending: number
    total: number
    pendingPercentage: number
  }
  rates: {
    calculationsToday: number
    avgResponseTime: number
    failureRate: number
    totalRateMasters: number
    status: 'healthy' | 'degraded' | 'error'
  }
  businessMetrics?: {
    profitability: {
      totalProfitThisMonth: number
      profitChangePercent: number
      avgProfitPerTrip: number
    }
    automation: {
      automationRate: number
      totalCalculations: number
      manualOverrides: number
    }
    fareAnalysis: {
      fareChangePercent: number
      thisMonthAvgFare: number
      lastMonthAvgFare: number
    }
  }
  manualOverrides?: {
    centerName: string
    count: number
    percentage: number
  }[]
}

interface ApiResponse {
  ok: boolean
  data?: {
    pagination?: {
      total: number
    }
  }
  error?: {
    code: string
    message: string
  }
}

export function DashboardStatsCards() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isRatesEnabled = useFeatureFlag('rates')

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true)
        setError(null)

        // 각 API에서 통계 데이터 수집
        const promises = [
          fetch('/api/drivers?page=1&limit=1'),
          fetch('/api/settlements?page=1&limit=1')
        ];

        // Only fetch rates data if feature is enabled
        if (isRatesEnabled) {
          promises.push(fetch('/api/rates?page=1&limit=1'));
          promises.push(fetch('/api/admin/metrics?includeRates=true'));
        }
        
        // Fetch manual override statistics (mock data for now)
        const mockManualOverrides = [
          { centerName: '쿠팡 김포DC', count: 23, percentage: 18.5 },
          { centerName: '네이버 용인FC', count: 19, percentage: 15.3 },
          { centerName: '이마트 천안DC', count: 17, percentage: 13.7 },
          { centerName: 'SSG 여주센터', count: 14, percentage: 11.3 },
          { centerName: '마켓컬리 송파', count: 12, percentage: 9.7 }
        ]

        const responses = await Promise.all(promises);
        const jsonPromises = responses.map(res => res.json() as Promise<ApiResponse>);
        const data = await Promise.all(jsonPromises);

        const [drivers, settlements, rates, businessMetricsRes] = data;

        // 통계 계산
        const driversTotal = drivers.data?.pagination?.total || 0
        const settlementsTotal = settlements.data?.pagination?.total || 0
        const ratesTotal = isRatesEnabled ? (rates?.data?.pagination?.total || 0) : 0
        const businessMetrics = isRatesEnabled && businessMetricsRes?.ok ? businessMetricsRes.data : null

        // Build stats object conditionally
        const baseStats = {
          drivers: {
            total: driversTotal,
            active: Math.floor(driversTotal * 0.85), // 85% 활성으로 추정
            activePercentage: 85
          },
          settlements: {
            pending: Math.floor(settlementsTotal * 0.3), // 30% 미처리로 추정
            total: settlementsTotal,
            pendingPercentage: settlementsTotal > 0 ? 30 : 0
          }
        };

        // Only add rates stats if feature is enabled
        if (isRatesEnabled) {
          // 요금 계산 시스템 상태 모니터링 (실제 API에서 가져올 예정)
          const mockRatesStats = {
            calculationsToday: Math.floor(Math.random() * 50) + 10, // 10-60 calculations
            avgResponseTime: Math.floor(Math.random() * 100) + 50, // 50-150ms
            failureRate: Math.random() * 5, // 0-5% failure rate
            status: 'healthy' as const
          };

          (baseStats as any).rates = {
            calculationsToday: mockRatesStats.calculationsToday,
            avgResponseTime: mockRatesStats.avgResponseTime,
            failureRate: mockRatesStats.failureRate,
            totalRateMasters: ratesTotal,
            status: mockRatesStats.failureRate > 10 ? 'error' : 
                    mockRatesStats.failureRate > 3 ? 'degraded' : 'healthy'
          };
        }

        // Add business metrics if available
        if (businessMetrics) {
          (baseStats as any).businessMetrics = businessMetrics;
        }

        setStats(baseStats as StatsData)
      } catch (err) {
        console.error('Failed to fetch stats:', err)
        setError('통계 데이터를 불러오는데 실패했습니다')
        
        // 실패시 더미 데이터 제공
        setStats({
          drivers: { total: 15, active: 13, activePercentage: 87 },
          settlements: { pending: 3, total: 8, pendingPercentage: 38 },
          rates: { 
            calculationsToday: 25, 
            avgResponseTime: 85, 
            failureRate: 1.2, 
            totalRateMasters: 6, 
            status: 'healthy' 
          }
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [isRatesEnabled])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-slate-200 rounded w-20"></div>
                <div className="h-4 w-4 bg-slate-200 rounded"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-8 bg-slate-200 rounded w-16"></div>
                <div className="h-2 bg-slate-200 rounded w-full"></div>
                <div className="h-3 bg-slate-200 rounded w-24"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) return null

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 mb-4">핵심 통계</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-700">{error}</span>
          </div>
        </div>
      )}

      <div className={`grid grid-cols-1 gap-6 ${
        isRatesEnabled && stats.businessMetrics ? 
        'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6' :
        isRatesEnabled ? 'md:grid-cols-2 lg:grid-cols-3' : 
        'md:grid-cols-2'
      }`}>
        {/* 총 기사 수 */}
        <Link href="/drivers" className="group">
          <Card className="h-full hover:shadow-md hover:border-blue-300 transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">
                  총 기사 수
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <ArrowRight className="h-3 w-3 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900">
                    {stats.drivers.total}
                  </span>
                  <span className="text-sm text-slate-500">명</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex-1 bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stats.drivers.activePercentage}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">활성 기사: {stats.drivers.active}명</span>
                    <span className="font-medium text-blue-600">{stats.drivers.activePercentage}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>


        {/* 미처리 정산 */}
        <Link href="/settlements" className="group">
          <Card className="h-full hover:shadow-md hover:border-emerald-300 transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">
                  미처리 정산
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-emerald-600" />
                  <ArrowRight className="h-3 w-3 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900">
                    {stats.settlements.pending}
                  </span>
                  <span className="text-sm text-slate-500">건</span>
                </div>
                
                <div className="space-y-2">
                  {stats.settlements.pending > 0 ? (
                    <>
                      <div className="flex-1 bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${stats.settlements.pendingPercentage}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">전체 정산: {stats.settlements.total}건</span>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-amber-500" />
                          <span className="font-medium text-amber-600">{stats.settlements.pendingPercentage}%</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 bg-slate-200 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full w-full transition-all duration-300"></div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">모든 정산 완료</span>
                        <span className="font-medium text-emerald-600">100%</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* 요금 계산 시스템 */}
        {isRatesEnabled && stats.rates && (
          <div className="group">
            <Card className="h-full hover:shadow-md hover:border-purple-300 transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">
                  요금 계산 시스템
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {stats.rates.status === 'healthy' && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
                    {stats.rates.status === 'degraded' && <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>}
                    {stats.rates.status === 'error' && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>}
                    <span className="text-xs text-slate-500 capitalize">{stats.rates.status}</span>
                  </div>
                  <DollarSign className="h-4 w-4 text-purple-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900">
                    {stats.rates.calculationsToday}
                  </span>
                  <span className="text-sm text-slate-500">오늘 계산</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      평균 응답시간
                    </span>
                    <span className={`font-medium ${
                      stats.rates.avgResponseTime > 200 ? 'text-red-600' :
                      stats.rates.avgResponseTime > 100 ? 'text-yellow-600' : 
                      'text-green-600'
                    }`}>
                      {stats.rates.avgResponseTime}ms
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">실패율</span>
                    <span className={`font-medium ${
                      stats.rates.failureRate > 5 ? 'text-red-600' :
                      stats.rates.failureRate > 2 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {stats.rates.failureRate.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">활성 요금표</span>
                    <span className="font-medium text-purple-600">{stats.rates.totalRateMasters}개</span>
                  </div>
                </div>
              </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Business Metrics Cards */}
        {isRatesEnabled && stats.businessMetrics && (
          <>
            {/* 센터별 수익률 */}
            <div className="group">
              <Card className="h-full hover:shadow-md hover:border-green-300 transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-slate-600">
                      월간 수익률
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-slate-900">
                        ₩{(stats.businessMetrics.profitability.totalProfitThisMonth / 1000000).toFixed(1)}M
                      </span>
                      <span className="text-sm text-slate-500">총 수익</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">전월 대비</span>
                        <div className="flex items-center gap-1">
                          {stats.businessMetrics.profitability.profitChangePercent >= 0 ? (
                            <TrendingUp className="h-3 w-3 text-green-600" />
                          ) : (
                            <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />
                          )}
                          <span className={`font-medium ${
                            stats.businessMetrics.profitability.profitChangePercent >= 0 ? 
                            'text-green-600' : 'text-red-600'
                          }`}>
                            {stats.businessMetrics.profitability.profitChangePercent >= 0 ? '+' : ''}
                            {stats.businessMetrics.profitability.profitChangePercent.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">건당 평균</span>
                        <span className="font-medium text-green-600">
                          ₩{stats.businessMetrics.profitability.avgProfitPerTrip.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 자동 계산 vs 수기 오버라이드 */}
            <div className="group">
              <Card className="h-full hover:shadow-md hover:border-indigo-300 transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-slate-600">
                      자동화 비율
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-indigo-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-slate-900">
                        {stats.businessMetrics.automation.automationRate.toFixed(1)}%
                      </span>
                      <span className="text-sm text-slate-500">자동 계산</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${stats.businessMetrics.automation.automationRate}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">
                          자동: {stats.businessMetrics.automation.totalCalculations - stats.businessMetrics.automation.manualOverrides}건
                        </span>
                        <span className="text-slate-600">
                          수기: {stats.businessMetrics.automation.manualOverrides}건
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 평균 운임 변화 */}
            <div className="group">
              <Card className="h-full hover:shadow-md hover:border-amber-300 transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-slate-600">
                      평균 운임
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-amber-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-slate-900">
                        ₩{(stats.businessMetrics.fareAnalysis.thisMonthAvgFare / 1000).toFixed(0)}K
                      </span>
                      <span className="text-sm text-slate-500">이번 달</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">지난 달</span>
                        <span className="font-medium text-slate-500">
                          ₩{(stats.businessMetrics.fareAnalysis.lastMonthAvgFare / 1000).toFixed(0)}K
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">변화율</span>
                        <div className="flex items-center gap-1">
                          {stats.businessMetrics.fareAnalysis.fareChangePercent >= 0 ? (
                            <TrendingUp className="h-3 w-3 text-amber-600" />
                          ) : (
                            <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />
                          )}
                          <span className={`font-medium ${
                            stats.businessMetrics.fareAnalysis.fareChangePercent >= 0 ? 
                            'text-amber-600' : 'text-red-600'
                          }`}>
                            {stats.businessMetrics.fareAnalysis.fareChangePercent >= 0 ? '+' : ''}
                            {stats.businessMetrics.fareAnalysis.fareChangePercent.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
        
        {/* 수기 오버라이드 Top 5 센터 */}
        {isRatesEnabled && stats.manualOverrides && (
          <div className="md:col-span-2 lg:col-span-2">
            <Card className="h-full hover:shadow-md hover:border-orange-300 transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    수기 오버라이드 Top 5 센터
                  </CardTitle>
                  <Edit3 className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-xs text-slate-500 mb-2">
                    자동 계산 후 수동 수정이 많은 센터
                  </div>
                  {stats.manualOverrides.slice(0, 5).map((center, index) => (
                    <div key={center.centerName} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-700 font-medium">
                          {index + 1}. {center.centerName}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-orange-600 font-semibold">
                            {center.count}건
                          </span>
                          <span className="text-slate-500">
                            ({center.percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="absolute left-0 top-0 h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-300"
                          style={{ width: `${center.percentage * 2}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 mt-2 border-t border-slate-100">
                    <Link href="/rates" className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1">
                      요금 관리 페이지로 이동
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Enhanced Business Analytics Charts */}
      {isRatesEnabled && stats.businessMetrics && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">비즈니스 분석</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ProfitabilityChart data={stats.businessMetrics.profitability} />
            <AutomationChart data={stats.businessMetrics.automation} />
            <FareTrendChart data={stats.businessMetrics.fareAnalysis} />
          </div>
        </div>
      )}
    </div>
  )
}

// Chart Components using recharts

interface ProfitabilityChartProps {
  data: {
    totalProfitThisMonth: number
    profitChangePercent: number
    avgProfitPerTrip: number
  }
}

function ProfitabilityChart({ data }: ProfitabilityChartProps) {
  // 간단 막대 차트 데이터 (최근 3개월)
  const monthlyData = [
    { month: '7월', profit: data.totalProfitThisMonth * 0.8 },
    { month: '8월', profit: data.totalProfitThisMonth * 0.9 },
    { month: '9월', profit: data.totalProfitThisMonth },
  ]

  const max = Math.max(...monthlyData.map(d => d.profit)) || 1

  return (
    <Card className="p-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          월간 수익 추이
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              ₩{(data.totalProfitThisMonth / 1000000).toFixed(1)}M
            </span>
            <span className={`text-sm font-medium flex items-center gap-1 ${
              data.profitChangePercent >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {data.profitChangePercent >= 0 ? '↗' : '↘'}
              {Math.abs(data.profitChangePercent).toFixed(1)}%
            </span>
          </div>
        </div>
        {/* CSS 기반 막대 차트 */}
        <div className="h-32 flex items-end gap-4 px-2">
          {monthlyData.map((d) => (
            <div key={d.month} className="flex flex-col items-center gap-2">
              <div 
                className="w-8 bg-emerald-500 rounded-t"
                style={{ height: `${Math.max(8, (d.profit / max) * 100)}%` }}
                title={`₩${(d.profit / 1000000).toFixed(1)}M`}
              />
              <span className="text-[11px] text-slate-500">{d.month}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface AutomationChartProps {
  data: {
    automationRate: number
    totalCalculations: number
    manualOverrides: number
  }
}

function AutomationChart({ data }: AutomationChartProps) {
  const auto = Math.max(0, data.totalCalculations - data.manualOverrides)
  const manual = Math.max(0, data.manualOverrides)
  const total = Math.max(1, auto + manual)
  const autoPct = (auto / total) * 100
  const manualPct = 100 - autoPct

  return (
    <Card className="p-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          자동화 vs 수기 입력
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {data.automationRate.toFixed(1)}%
            </span>
            <span className="text-sm text-slate-500">자동화율</span>
          </div>
        </div>
        {/* CSS 기반 분할 바 차트 */}
        <div className="h-6 w-full bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500" style={{ width: `${autoPct}%` }} title={`자동 ${auto}건`} />
          <div className="h-full bg-amber-500" style={{ width: `${manualPct}%` }} title={`수기 ${manual}건`} />
        </div>
        <div className="flex justify-center gap-4 mt-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 bg-blue-500 rounded-full" />
            <span className="text-slate-600">자동 계산 ({Math.round(autoPct)}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 bg-amber-500 rounded-full" />
            <span className="text-slate-600">수기 입력 ({Math.round(manualPct)}%)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface FareTrendChartProps {
  data: {
    fareChangePercent: number
    thisMonthAvgFare: number
    lastMonthAvgFare: number
  }
}

function FareTrendChart({ data }: FareTrendChartProps) {
  // 간단 추세 막대 차트 데이터
  const trendData = [
    { period: '6월', avgFare: data.lastMonthAvgFare * 0.95 },
    { period: '7월', avgFare: data.lastMonthAvgFare * 0.98 },
    { period: '8월', avgFare: data.lastMonthAvgFare },
    { period: '9월', avgFare: data.thisMonthAvgFare },
  ]

  const max = Math.max(...trendData.map(d => d.avgFare)) || 1

  return (
    <Card className="p-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-amber-600" />
          평균 운임 변화
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              ₩{(data.thisMonthAvgFare / 1000).toFixed(0)}K
            </span>
            <span className={`text-sm font-medium flex items-center gap-1 ${
              data.fareChangePercent >= 0 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {data.fareChangePercent >= 0 ? '↗' : '↘'}
              {Math.abs(data.fareChangePercent).toFixed(1)}%
            </span>
          </div>
        </div>
        {/* CSS 기반 막대 추세 */}
        <div className="h-32 flex items-end gap-4 px-2">
          {trendData.map((d) => (
            <div key={d.period} className="flex flex-col items-center gap-2">
              <div 
                className="w-6 bg-amber-500 rounded-t"
                style={{ height: `${Math.max(8, (d.avgFare / max) * 100)}%` }}
                title={`₩${(d.avgFare / 1000).toFixed(0)}K`}
              />
              <span className="text-[11px] text-slate-500">{d.period}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
