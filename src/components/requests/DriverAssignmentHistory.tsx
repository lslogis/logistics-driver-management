/**
 * 기사 배정 히스토리 컴포넌트
 * 기사 배정의 변경 이력을 시간순으로 표시
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Clock, 
  User, 
  Phone, 
  Truck, 
  DollarSign, 
  Calendar,
  History,
  AlertCircle,
  CheckCircle,
  Edit3
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Request } from '@/types'
import { useDriverAssignmentHistory } from '@/hooks/useDriverAssignment'

interface DriverAssignmentHistoryProps {
  request: Request
  className?: string
}

interface HistoryEntry {
  id: string
  timestamp: string
  action: 'assigned' | 'updated' | 'removed'
  driverName: string
  driverPhone?: string
  driverVehicle?: string
  driverFee?: number
  notes?: string
  changes?: Array<{
    field: string
    oldValue?: string | number
    newValue?: string | number
  }>
}

export function DriverAssignmentHistory({ 
  request, 
  className 
}: DriverAssignmentHistoryProps) {
  const { data: history = [], isLoading, error } = useDriverAssignmentHistory(request.id)

  // 현재 배정 정보를 히스토리 엔트리로 변환
  const getCurrentAssignmentEntry = (): HistoryEntry | null => {
    if (!request.driverName && !request.driverId) return null

    return {
      id: 'current',
      timestamp: request.dispatchedAt || request.updatedAt,
      action: 'assigned',
      driverName: request.driverName || '이름 없음',
      driverPhone: request.driverPhone,
      driverVehicle: request.driverVehicle,
      driverFee: request.driverFee,
      notes: request.driverNotes
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return '미지정'
    return amount.toLocaleString() + '원'
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'assigned':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'updated':
        return <Edit3 className="h-4 w-4 text-blue-600" />
      case 'removed':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <History className="h-4 w-4 text-gray-600" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'assigned':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'updated':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'removed':
        return 'bg-red-50 border-red-200 text-red-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'assigned':
        return '기사 배정'
      case 'updated':
        return '정보 수정'
      case 'removed':
        return '배정 해제'
      default:
        return '변경됨'
    }
  }

  // 현재 배정 정보를 포함한 전체 히스토리
  const currentEntry = getCurrentAssignmentEntry()
  const allHistory = currentEntry ? [currentEntry, ...history] : history

  if (isLoading) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-gray-600">히스토리를 불러오는 중...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn("border-red-200", className)}>
        <CardContent className="p-6">
          <div className="flex items-center text-red-600">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span className="text-sm">히스토리를 불러올 수 없습니다</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (allHistory.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5" />
            기사 배정 히스토리
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <History className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">기사 배정 이력이 없습니다</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5" />
          기사 배정 히스토리
          <Badge variant="outline" className="ml-auto">
            {allHistory.length}개
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {allHistory.map((entry, index) => (
            <div key={entry.id} className="relative">
              {/* Timeline connector */}
              {index < allHistory.length - 1 && (
                <div className="absolute left-4 top-12 w-0.5 h-full bg-gray-200 -z-10" />
              )}

              <div className="flex gap-4">
                {/* Timeline dot */}
                <div className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center",
                  index === 0 ? "bg-blue-100 border-blue-300" : "bg-gray-100 border-gray-300"
                )}>
                  {getActionIcon(entry.action)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "border rounded-lg p-4",
                    index === 0 ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-gray-50"
                  )}>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className={getActionColor(entry.action)} variant="outline">
                          {getActionLabel(entry.action)}
                        </Badge>
                        {index === 0 && (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                            현재
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {formatDateTime(entry.timestamp)}
                      </div>
                    </div>

                    {/* Driver Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-3 w-3 text-gray-500" />
                          <span className="font-medium">{entry.driverName}</span>
                        </div>
                        
                        {entry.driverPhone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="h-3 w-3 text-gray-500" />
                            {entry.driverPhone}
                          </div>
                        )}
                        
                        {entry.driverVehicle && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Truck className="h-3 w-3 text-gray-500" />
                            {entry.driverVehicle}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        {entry.driverFee && (
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="h-3 w-3 text-gray-500" />
                            <span className="font-medium">{formatCurrency(entry.driverFee)}</span>
                          </div>
                        )}
                        
                        {entry.notes && (
                          <div className="text-xs text-gray-600 bg-white/60 p-2 rounded">
                            💬 {entry.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Changes */}
                    {entry.changes && entry.changes.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs font-medium text-gray-700 mb-2">변경사항:</div>
                        <div className="space-y-1">
                          {entry.changes.map((change, changeIndex) => (
                            <div key={changeIndex} className="text-xs text-gray-600 flex items-center gap-2">
                              <span className="font-medium">{change.field}:</span>
                              <span className="text-red-600 line-through">{change.oldValue}</span>
                              <span className="text-gray-400">→</span>
                              <span className="text-green-600">{change.newValue}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <Separator className="my-4" />
        <div className="text-xs text-gray-500 text-center">
          총 {allHistory.length}개의 배정 이력 · 최근 업데이트: {formatDateTime(allHistory[0]?.timestamp)}
        </div>
      </CardContent>
    </Card>
  )
}