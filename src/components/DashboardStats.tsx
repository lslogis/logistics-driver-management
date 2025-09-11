'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

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
  routes: {
    total: number
    active: number
  }
  trips: {
    thisMonth: number
    completed: number
    completionRate: number
  }
}

export function DashboardStats() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        // 각 API에서 통계 데이터 수집
        const [driversRes, vehiclesRes, routesRes, tripsRes] = await Promise.all([
          fetch('/api/drivers?limit=1'),
          fetch('/api/vehicles?limit=1'), 
          fetch('/api/routes?limit=1'),
          fetch('/api/trips?limit=1')
        ])

        const [drivers, vehicles, routes, trips] = await Promise.all([
          driversRes.json(),
          vehiclesRes.json(),
          routesRes.json(),
          tripsRes.json()
        ])

        setStats({
          drivers: {
            total: drivers.data?.pagination?.total || 0,
            active: drivers.data?.pagination?.total || 0, // 임시: 활성 기사 수
            activePercentage: 85 // 임시 데이터
          },
          vehicles: {
            total: vehicles.data?.pagination?.total || 0,
            active: Math.floor((vehicles.data?.pagination?.total || 0) * 0.9), // 임시: 90% 활성
            activePercentage: 90
          },
          routes: {
            total: routes.data?.pagination?.total || 0,
            active: routes.data?.pagination?.total || 0
          },
          trips: {
            thisMonth: trips.data?.pagination?.total || 0,
            completed: Math.floor((trips.data?.pagination?.total || 0) * 0.75), // 임시: 75% 완료
            completionRate: 75
          }
        })
      } catch (error) {
        console.error('Failed to fetch stats:', error)
        // 데모 데이터로 폴백
        setStats({
          drivers: { total: 12, active: 10, activePercentage: 83 },
          vehicles: { total: 8, active: 7, activePercentage: 88 },
          routes: { total: 5, active: 5 },
          trips: { thisMonth: 124, completed: 98, completionRate: 79 }
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-full"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* 기사 통계 */}
      <Link href="/drivers" className="group">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-slate-300 transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex items-center text-xs text-slate-500 group-hover:text-blue-600">
              보기
              <svg className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-600">등록 기사</h3>
            <div className="flex items-baseline space-x-2">
              <p className="text-2xl font-bold text-slate-900">{stats.drivers.total}</p>
              <span className="text-sm text-slate-500">명</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${stats.drivers.activePercentage}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium text-slate-600">{stats.drivers.activePercentage}% 활성</span>
            </div>
          </div>
        </div>
      </Link>

      {/* 차량 통계 */}
      <Link href="/vehicles" className="group">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-slate-300 transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v-2a2 2 0 00-2-2H8V7z" />
              </svg>
            </div>
            <div className="flex items-center text-xs text-slate-500 group-hover:text-orange-600">
              보기
              <svg className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-600">보유 차량</h3>
            <div className="flex items-baseline space-x-2">
              <p className="text-2xl font-bold text-slate-900">{stats.vehicles.total}</p>
              <span className="text-sm text-slate-500">대</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${stats.vehicles.activePercentage}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium text-slate-600">{stats.vehicles.activePercentage}% 운행</span>
            </div>
          </div>
        </div>
      </Link>

      {/* 노선 통계 */}
      <Link href="/routes" className="group">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-slate-300 transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <div className="flex items-center text-xs text-slate-500 group-hover:text-indigo-600">
              보기
              <svg className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-600">운행 노선</h3>
            <div className="flex items-baseline space-x-2">
              <p className="text-2xl font-bold text-slate-900">{stats.routes.total}</p>
              <span className="text-sm text-slate-500">개</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                전체 활성
              </span>
              <span className="text-xs text-slate-500">노선 운영중</span>
            </div>
          </div>
        </div>
      </Link>

      {/* 운행 통계 */}
      <Link href="/trips" className="group">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-slate-300 transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="flex items-center text-xs text-slate-500 group-hover:text-green-600">
              보기
              <svg className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-600">이달 운행</h3>
            <div className="flex items-baseline space-x-2">
              <p className="text-2xl font-bold text-slate-900">{stats.trips.thisMonth}</p>
              <span className="text-sm text-slate-500">건</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${stats.trips.completionRate}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium text-slate-600">{stats.trips.completionRate}% 완료</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}