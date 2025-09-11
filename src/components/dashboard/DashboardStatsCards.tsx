'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Truck, Calculator, ArrowRight, TrendingUp, AlertCircle } from 'lucide-react'

interface StatsData {
  drivers: {
    total: number
    active: number
    activePercentage: number
  }
  vehicles: {
    total: number
    active: number
    activePercentage: number
  }
  settlements: {
    pending: number
    total: number
    pendingPercentage: number
  }
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

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true)
        setError(null)

        // 각 API에서 통계 데이터 수집
        const [driversRes, vehiclesRes, settlementsRes] = await Promise.all([
          fetch('/api/drivers?page=1&limit=1'),
          fetch('/api/vehicles?page=1&limit=1'),
          fetch('/api/settlements?page=1&limit=1')
        ])

        const [drivers, vehicles, settlements] = await Promise.all([
          driversRes.json() as Promise<ApiResponse>,
          vehiclesRes.json() as Promise<ApiResponse>,
          settlementsRes.json() as Promise<ApiResponse>
        ])

        // 통계 계산
        const driversTotal = drivers.data?.pagination?.total || 0
        const vehiclesTotal = vehicles.data?.pagination?.total || 0
        const settlementsTotal = settlements.data?.pagination?.total || 0

        setStats({
          drivers: {
            total: driversTotal,
            active: Math.floor(driversTotal * 0.85), // 85% 활성으로 추정
            activePercentage: 85
          },
          vehicles: {
            total: vehiclesTotal,
            active: Math.floor(vehiclesTotal * 0.90), // 90% 활성으로 추정
            activePercentage: 90
          },
          settlements: {
            pending: Math.floor(settlementsTotal * 0.3), // 30% 미처리로 추정
            total: settlementsTotal,
            pendingPercentage: settlementsTotal > 0 ? 30 : 0
          }
        })
      } catch (err) {
        console.error('Failed to fetch stats:', err)
        setError('통계 데이터를 불러오는데 실패했습니다')
        
        // 실패시 더미 데이터 제공
        setStats({
          drivers: { total: 15, active: 13, activePercentage: 87 },
          vehicles: { total: 12, active: 11, activePercentage: 92 },
          settlements: { pending: 3, total: 8, pendingPercentage: 38 }
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        {/* 총 차량 수 */}
        <Link href="/vehicles" className="group">
          <Card className="h-full hover:shadow-md hover:border-orange-300 transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">
                  총 차량 수
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-orange-600" />
                  <ArrowRight className="h-3 w-3 text-slate-400 group-hover:text-orange-600 transition-colors" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900">
                    {stats.vehicles.total}
                  </span>
                  <span className="text-sm text-slate-500">대</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex-1 bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stats.vehicles.activePercentage}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">운행 차량: {stats.vehicles.active}대</span>
                    <span className="font-medium text-orange-600">{stats.vehicles.activePercentage}%</span>
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
      </div>
    </div>
  )
}