'use client'

import React from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Users, 
  Clock,
  Target,
  BarChart3
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface RoutePerformanceData {
  routeId: string
  routeName: string
  monthlyRevenue: number
  operationsCount: number
  efficiency: number
  profitMargin: number
  driverSatisfaction: number
  onTimeRate: number
  costPerOperation: number
  trend: 'up' | 'down' | 'stable'
  trendPercentage: number
}

interface RoutePerformanceWidgetProps {
  data: RoutePerformanceData[]
  isLoading?: boolean
  className?: string
}

const RoutePerformanceWidget: React.FC<RoutePerformanceWidgetProps> = ({
  data,
  isLoading = false,
  className
}) => {
  if (isLoading) {
    return (
      <Card className={cn("bg-white shadow-lg border-indigo-100", className)}>
        <CardHeader>
          <div className="h-6 bg-gray-200 animate-pulse rounded" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 animate-pulse rounded" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card className={cn("bg-white shadow-lg border-indigo-100", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-800">
            <BarChart3 className="h-5 w-5" />
            노선별 성과 분석
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-gray-500">성과 데이터가 없습니다</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatCurrency = (amount: number) => {
    return `${(amount / 10000).toLocaleString()}만원`
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Target className="h-4 w-4 text-gray-500" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-green-600'
    if (efficiency >= 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getEfficiencyBgColor = (efficiency: number) => {
    if (efficiency >= 90) return 'bg-green-100 border-green-200'
    if (efficiency >= 80) return 'bg-yellow-100 border-yellow-200'
    return 'bg-red-100 border-red-200'
  }

  return (
    <Card className={cn("bg-white shadow-lg border-indigo-100", className)}>
      <CardHeader className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50">
        <CardTitle className="flex items-center gap-2 text-indigo-800">
          <BarChart3 className="h-5 w-5" />
          노선별 성과 분석
          <Badge variant="secondary" className="ml-2 bg-indigo-100 text-indigo-700">
            상위 {Math.min(data.length, 5)}개
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {data.slice(0, 5).map((route, index) => (
            <div 
              key={route.routeId}
              className="p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
            >
              {/* 노선 헤더 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-bold rounded-full">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{route.routeName}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      {getTrendIcon(route.trend)}
                      <span className={getTrendColor(route.trend)}>
                        {route.trend === 'stable' ? '안정' : `${route.trendPercentage}%`}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge 
                  className={cn(
                    "font-medium",
                    getEfficiencyBgColor(route.efficiency),
                    getEfficiencyColor(route.efficiency)
                  )}
                >
                  효율성 {route.efficiency}%
                </Badge>
              </div>

              {/* 성과 지표 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-xs text-gray-600">월 매출</span>
                  </div>
                  <div className="font-bold text-green-600">
                    {formatCurrency(route.monthlyRevenue)}
                  </div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Calendar className="h-4 w-4 text-blue-500 mr-1" />
                    <span className="text-xs text-gray-600">운행 횟수</span>
                  </div>
                  <div className="font-bold text-blue-600">
                    {route.operationsCount}회
                  </div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Clock className="h-4 w-4 text-purple-500 mr-1" />
                    <span className="text-xs text-gray-600">정시율</span>
                  </div>
                  <div className="font-bold text-purple-600">
                    {route.onTimeRate}%
                  </div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Users className="h-4 w-4 text-indigo-500 mr-1" />
                    <span className="text-xs text-gray-600">만족도</span>
                  </div>
                  <div className="font-bold text-indigo-600">
                    {route.driverSatisfaction}/5
                  </div>
                </div>
              </div>

              {/* 수익성 및 효율성 바 */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">수익률</span>
                    <span className="text-sm font-medium text-gray-900">
                      {route.profitMargin}%
                    </span>
                  </div>
                  <Progress 
                    value={route.profitMargin} 
                    className="h-2"
                    // className={`h-2 ${route.profitMargin > 20 ? '[&>div]:bg-green-500' : route.profitMargin > 10 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-red-500'}`}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">운영 효율성</span>
                    <span className="text-sm font-medium text-gray-900">
                      {route.efficiency}%
                    </span>
                  </div>
                  <Progress 
                    value={route.efficiency} 
                    className="h-2"
                  />
                </div>
              </div>

              {/* 운영 비용 정보 */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  운행당 비용: <span className="font-medium text-gray-700">
                    {formatCurrency(route.costPerOperation)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {data.length > 5 && (
          <div className="mt-4 text-center">
            <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              더 많은 노선 보기 ({data.length - 5}개 더)
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default RoutePerformanceWidget