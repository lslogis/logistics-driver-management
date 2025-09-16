'use client'

import React from 'react'
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Wallet } from 'lucide-react'

interface OverviewCardsProps {
  totalRevenue: number
  totalPayout: number
  margin: number
  lastMonthMargin?: number
}

export default function SettlementOverviewCards({ 
  totalRevenue, 
  totalPayout, 
  margin,
  lastMonthMargin = 0
}: OverviewCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const marginPercent = totalRevenue > 0 ? (margin / totalRevenue) * 100 : 0
  const marginChange = lastMonthMargin !== 0 ? ((margin - lastMonthMargin) / Math.abs(lastMonthMargin)) * 100 : 0
  const isPositiveMargin = margin >= 0
  const isMarginGrowth = marginChange >= 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 총 매출액 카드 */}
      <div className="bg-white border rounded-lg p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-medium text-gray-600">총 매출액</div>
            <div className="mt-2 text-2xl font-bold text-blue-600">
              {formatCurrency(totalRevenue)}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              이번 달 총 수익
            </div>
          </div>
          <div className="p-2 bg-blue-50 rounded-lg">
            <DollarSign className="h-5 w-5 text-blue-600" />
          </div>
        </div>
      </div>

      {/* 총 기사 지급액 카드 */}
      <div className="bg-white border rounded-lg p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-medium text-gray-600">총 기사 지급액</div>
            <div className="mt-2 text-2xl font-bold text-orange-500">
              {formatCurrency(totalPayout)}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              이번 달 지급 총액
            </div>
          </div>
          <div className="p-2 bg-orange-50 rounded-lg">
            <CreditCard className="h-5 w-5 text-orange-500" />
          </div>
        </div>
      </div>

      {/* 마진 카드 */}
      <div className="bg-white border rounded-lg p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-medium text-gray-600">마진 (매출 - 지급)</div>
            <div className={`mt-2 text-2xl font-bold ${isPositiveMargin ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(margin)}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className={`text-xs font-medium ${isPositiveMargin ? 'text-green-600' : 'text-red-600'}`}>
                {marginPercent.toFixed(1)}%
              </span>
              {marginChange !== 0 && (
                <div className={`flex items-center text-xs ${isMarginGrowth ? 'text-green-600' : 'text-red-600'}`}>
                  {isMarginGrowth ? (
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-0.5" />
                  )}
                  <span>{Math.abs(marginChange).toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>
          <div className={`p-2 rounded-lg ${isPositiveMargin ? 'bg-green-50' : 'bg-red-50'}`}>
            <Wallet className={`h-5 w-5 ${isPositiveMargin ? 'text-green-600' : 'text-red-600'}`} />
          </div>
        </div>
      </div>
    </div>
  )
}