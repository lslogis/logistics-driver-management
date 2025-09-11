'use client'

import { TomorrowTripsSection } from '@/components/dashboard/TomorrowTripsSection'
import { DashboardStatsCards } from '@/components/dashboard/DashboardStatsCards'
import { QuickActionsSection } from '@/components/dashboard/QuickActionsSection'
import { NotificationsAndWeatherSection } from '@/components/dashboard/NotificationsAndWeatherSection'
import '@/styles/design-system.css'

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          LogiFlow 대시보드
        </h1>
        <p className="text-slate-600 mt-2">
          {new Date().toLocaleDateString('ko-KR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
          })} 운송업무 현황
        </p>
      </div>

      {/* 1. 내일 배차내역 (최우선) */}
      <TomorrowTripsSection />

      {/* 2. 핵심 통계 카드 */}
      <DashboardStatsCards />

      {/* 3. 빠른 액션 & 알림/날씨 위젯 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <QuickActionsSection />
        </div>
        <div>
          <NotificationsAndWeatherSection />
        </div>
      </div>
    </div>
  )
}