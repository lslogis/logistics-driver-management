'use client'

import React from 'react'
import { BarChart3, PieChart, TrendingUp } from 'lucide-react'

interface ChartData {
  marginTrend?: Array<{ month: string; margin: number }>
  driverPayoutRatio?: Array<{ name: string; value: number; percentage: number }>
  centerMargin?: Array<{ center: string; margin: number }>
}

interface SettlementChartsProps {
  data: ChartData
}

export default function SettlementCharts({ data }: SettlementChartsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // 간단한 차트 구현 (recharts 없이)
  const maxMargin = Math.max(...(data.marginTrend?.map(d => Math.abs(d.margin)) || [0]))
  const maxCenterMargin = Math.max(...(data.centerMargin?.map(d => Math.abs(d.margin)) || [0]))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 마진 트렌드 차트 */}
      <div className="bg-white border rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">월별 마진 추이</h3>
          <TrendingUp className="h-4 w-4 text-gray-400" />
        </div>
        <div className="space-y-2">
          {data.marginTrend?.slice(-6).map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-xs text-gray-600 w-12">{item.month}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-6 relative">
                <div
                  className={`h-full rounded-full ${
                    item.margin >= 0 ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{
                    width: `${Math.abs(item.margin) / maxMargin * 100}%`
                  }}
                />
                <span className="absolute right-2 top-0.5 text-xs font-medium">
                  {formatCurrency(item.margin)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 기사별 지급 비율 차트 */}
      <div className="bg-white border rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">기사별 지급 비율</h3>
          <PieChart className="h-4 w-4 text-gray-400" />
        </div>
        <div className="space-y-2">
          {data.driverPayoutRatio?.slice(0, 5).map((item, index) => {
            const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500']
            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                  <span className="text-xs text-gray-700">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{item.percentage.toFixed(1)}%</span>
                  <span className="text-xs text-gray-500">
                    {formatCurrency(item.value)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 센터별 마진 차트 */}
      <div className="bg-white border rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">센터별 마진</h3>
          <BarChart3 className="h-4 w-4 text-gray-400" />
        </div>
        <div className="space-y-2">
          {data.centerMargin?.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-xs text-gray-600 w-20 truncate">{item.center}</span>
              <div className="flex-1 bg-gray-100 rounded h-5 relative">
                <div
                  className={`h-full rounded ${
                    item.margin >= 0 ? 'bg-blue-500' : 'bg-red-500'
                  }`}
                  style={{
                    width: `${Math.abs(item.margin) / maxCenterMargin * 100}%`
                  }}
                />
                <span className="absolute right-1 top-0 text-xs font-medium">
                  {formatCurrency(item.margin)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}