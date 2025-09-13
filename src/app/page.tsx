'use client'

import { TomorrowTripsSection } from '@/components/dashboard/TomorrowTripsSection'
import { DashboardStatsCards } from '@/components/dashboard/DashboardStatsCards'
import { QuickActionsSection } from '@/components/dashboard/QuickActionsSection'
import { NotificationsAndWeatherSection } from '@/components/dashboard/NotificationsAndWeatherSection'
import '@/styles/design-system.css'

export default function HomePage() {
  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Main Container with proper padding */}
      <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-12 py-6 space-y-8">
        {/* 페이지 헤더 */}
        <div className="text-center lg:text-left">
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-slate-900 bg-clip-text text-transparent">
            LogiFlow 대시보드
          </h1>
          <p className="text-slate-600 mt-2 text-sm">
            {new Date().toLocaleDateString('ko-KR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            })} 운송업무 현황
          </p>
        </div>

        {/* 1. 내일 배차내역 (최우선) */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/50 p-6">
          <TomorrowTripsSection />
        </div>

        {/* 2. 핵심 통계 카드 */}
        <div className="bg-white/50 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/50 p-6">
          <DashboardStatsCards />
        </div>

        {/* 3. 빠른 액션 & 알림/날씨 위젯 */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/50 p-6">
              <QuickActionsSection />
            </div>
          </div>
          <div className="xl:col-span-1">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/50 p-6 h-fit">
              <NotificationsAndWeatherSection />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}