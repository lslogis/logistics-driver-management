'use client'

import React, { useMemo } from 'react'
import { 
  Calendar, 
  Clock, 
  Route, 
  User, 
  MapPin, 
  AlertCircle,
  CheckCircle,
  Play
} from 'lucide-react'
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface RouteScheduleItem {
  routeId: string
  routeName: string
  driverName?: string
  loadingPointName?: string
  operatingDays: string // 'MON,TUE,WED,THU,FRI'
  startTime?: string
  endTime?: string
  status: 'active' | 'inactive' | 'maintenance'
  isActive: boolean
}

interface RouteScheduleWidgetProps {
  data: RouteScheduleItem[]
  isLoading?: boolean
  selectedDate?: Date
  className?: string
}

const RouteScheduleWidget: React.FC<RouteScheduleWidgetProps> = ({
  data,
  isLoading = false,
  selectedDate = new Date(),
  className
}) => {
  const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
  const weekDaysKo = ['월', '화', '수', '목', '금', '토', '일']
  
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }) // Monday
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const scheduleByDay = useMemo(() => {
    const schedule: { [key: string]: RouteScheduleItem[] } = {}
    
    weekDays.forEach(day => {
      schedule[day] = data.filter(route => 
        route.operatingDays.includes(day) && route.isActive
      )
    })
    
    return schedule
  }, [data])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'inactive':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-3 w-3" />
      case 'inactive':
        return <AlertCircle className="h-3 w-3" />
      case 'maintenance':
        return <Clock className="h-3 w-3" />
      default:
        return <Play className="h-3 w-3" />
    }
  }

  if (isLoading) {
    return (
      <Card className={cn("bg-white shadow-lg border-indigo-100", className)}>
        <CardHeader>
          <div className="h-6 bg-gray-200 animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("bg-white shadow-lg border-indigo-100", className)}>
      <CardHeader className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50">
        <CardTitle className="flex items-center gap-2 text-indigo-800">
          <Calendar className="h-5 w-5" />
          주간 운행 스케줄
          <Badge variant="secondary" className="ml-2 bg-indigo-100 text-indigo-700">
            {format(weekStart, 'M월 d일', { locale: ko })} 주
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* 주간 달력 헤더 */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {weekDates.map((date, index) => (
            <div 
              key={date.toISOString()}
              className={cn(
                "text-center p-3 rounded-lg border",
                isToday(date) 
                  ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-indigo-500" 
                  : "bg-gray-50 border-gray-200"
              )}
            >
              <div className={cn(
                "font-semibold text-sm",
                isToday(date) ? "text-white" : "text-gray-900"
              )}>
                {weekDaysKo[index]}
              </div>
              <div className={cn(
                "text-xs mt-1",
                isToday(date) ? "text-indigo-100" : "text-gray-600"
              )}>
                {format(date, 'd일')}
              </div>
            </div>
          ))}
        </div>

        {/* 운행 스케줄 그리드 */}
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, dayIndex) => (
            <div key={day} className="space-y-2">
              <div className="h-4 flex items-center justify-center">
                {scheduleByDay[day].length > 0 && (
                  <Badge variant="outline" className="text-xs px-2 py-0 bg-indigo-50 text-indigo-600 border-indigo-200">
                    {scheduleByDay[day].length}건
                  </Badge>
                )}
              </div>
              
              <div className="space-y-2 min-h-[300px]">
                {scheduleByDay[day].map((route, index) => (
                  <div
                    key={`${route.routeId}-${day}`}
                    className={cn(
                      "p-3 rounded-lg border text-xs space-y-2 hover:shadow-md transition-shadow cursor-pointer",
                      getStatusColor(route.status)
                    )}
                  >
                    {/* 노선명 */}
                    <div className="flex items-center gap-1 font-medium">
                      <Route className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate" title={route.routeName}>
                        {route.routeName}
                      </span>
                    </div>

                    {/* 시간 */}
                    {(route.startTime || route.endTime) && (
                      <div className="flex items-center gap-1 text-xs opacity-80">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        <span>
                          {route.startTime || '시작'} ~ {route.endTime || '종료'}
                        </span>
                      </div>
                    )}

                    {/* 기사 */}
                    {route.driverName && (
                      <div className="flex items-center gap-1 text-xs opacity-80">
                        <User className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate" title={route.driverName}>
                          {route.driverName}
                        </span>
                      </div>
                    )}

                    {/* 상차지 */}
                    {route.loadingPointName && (
                      <div className="flex items-center gap-1 text-xs opacity-80">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate" title={route.loadingPointName}>
                          {route.loadingPointName}
                        </span>
                      </div>
                    )}

                    {/* 상태 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(route.status)}
                        <span className="text-xs font-medium">
                          {route.status === 'active' ? '운행중' : 
                           route.status === 'maintenance' ? '정비중' : '대기중'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {scheduleByDay[day].length === 0 && (
                  <div className="flex items-center justify-center h-20 text-gray-400 text-xs">
                    운행 예정 없음
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 범례 */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-100 border border-green-200"></div>
              <span className="text-gray-600">운행중</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-200"></div>
              <span className="text-gray-600">정비중</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gray-100 border border-gray-200"></div>
              <span className="text-gray-600">대기중</span>
            </div>
          </div>
        </div>

        {/* 요약 정보 */}
        <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-indigo-600">
                {data.filter(r => r.isActive && r.status === 'active').length}
              </div>
              <div className="text-xs text-gray-600">활성 노선</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {Object.values(scheduleByDay).reduce((acc, routes) => acc + routes.length, 0)}
              </div>
              <div className="text-xs text-gray-600">주간 운행</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">
                {new Set(data.filter(r => r.driverName).map(r => r.driverName)).size}
              </div>
              <div className="text-xs text-gray-600">참여 기사</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default RouteScheduleWidget