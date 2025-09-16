'use client'

import React, { useState } from 'react'
import { 
  Route, 
  Calendar, 
  User, 
  MapPin, 
  Clock, 
  DollarSign, 
  MoreHorizontal,
  Edit2,
  Trash2,
  Play,
  Pause,
  Phone,
  MessageSquare,
  Copy,
  Share
} from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface FixedRoute {
  id: string
  routeName: string
  operatingDays: string | string[] | null
  driver: {
    id: string
    name: string
    phone: string
  } | null
  loadingPoint: {
    id: string
    name: string
  } | null
  centerContractType: string
  driverContractType: string
  centerAmount?: number
  driverAmount?: number
  monthlyOperatingCost?: number
  dailyOperatingCost?: number
  startDate: string
  endDate?: string
  isActive: boolean
  remarks?: string
  createdAt: string
  updatedAt: string
}

interface FixedRoutesTableProps {
  data: FixedRoute[]
  isLoading?: boolean
  onEdit?: (route: FixedRoute) => void
  onDelete?: (id: string) => void
  onToggleStatus?: (id: string) => void
  onCopy?: (route: FixedRoute) => void
  onShare?: (route: FixedRoute) => void
  onCall?: (phone: string) => void
  onMessage?: (route: FixedRoute) => void
}

const FixedRoutesTable: React.FC<FixedRoutesTableProps> = ({
  data,
  isLoading = false,
  onEdit,
  onDelete,
  onToggleStatus,
  onCopy,
  onShare,
  onCall,
  onMessage
}) => {
  const [selectedRows, setSelectedRows] = useState<string[]>([])

  const formatOperatingDays = (days: string | string[] | null | undefined) => {
    if (!days || (Array.isArray(days) && days.length === 0)) return '-'
    const dayMap: { [key: string]: string } = {
      'MON': '월',
      'TUE': '화', 
      'WED': '수',
      'THU': '목',
      'FRI': '금',
      'SAT': '토',
      'SUN': '일'
    }
    const dayList = Array.isArray(days)
      ? days
      : typeof days === 'string'
        ? days.split(',')
        : []

    if (dayList.length === 0) return '-'

    return dayList
      .map(day => {
        const normalized = typeof day === 'string' ? day : String(day ?? '')
        const trimmed = normalized.trim()
        return dayMap[trimmed] || trimmed
      })
      .filter(Boolean)
      .join(', ')
  }

  const formatContractType = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'MONTHLY': '월급',
      'DAILY': '일당',
      'PER_TRIP': '건당',
      'PERCENTAGE': '수수료'
    }
    return typeMap[type] || type
  }

  const formatAmount = (amount: number | undefined) => {
    if (!amount) return '-'
    return `${amount.toLocaleString()}원`
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="flex flex-col items-center space-y-4">
          <div className="p-6 bg-gradient-to-r from-indigo-100 to-violet-100 rounded-full">
            <Route className="h-16 w-16 text-indigo-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-900">등록된 고정노선이 없습니다</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              새로운 고정노선을 등록하여 정기 운송을 체계적으로 관리해보세요.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-indigo-50 to-violet-50 hover:from-indigo-100 hover:to-violet-100 border-b border-indigo-200">
            <TableHead className="font-semibold text-indigo-800">노선 정보</TableHead>
            <TableHead className="font-semibold text-indigo-800">운행 일정</TableHead>
            <TableHead className="font-semibold text-indigo-800">담당 기사</TableHead>
            <TableHead className="font-semibold text-indigo-800">상차지</TableHead>
            <TableHead className="font-semibold text-indigo-800">계약 정보</TableHead>
            <TableHead className="font-semibold text-indigo-800">수익 정보</TableHead>
            <TableHead className="font-semibold text-indigo-800">상태</TableHead>
            <TableHead className="w-16"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((route) => (
            <TableRow 
              key={route.id} 
              className={cn(
                "hover:bg-indigo-50/50 transition-colors border-b border-indigo-100",
                !route.isActive && "opacity-60"
              )}
            >
              {/* 노선 정보 */}
              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Route className="h-4 w-4 text-indigo-500" />
                    <span className="font-medium text-gray-900">{route.routeName}</span>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(route.startDate), 'yyyy.MM.dd', { locale: ko })} ~
                    {route.endDate ? format(new Date(route.endDate), 'yyyy.MM.dd', { locale: ko }) : '지속'}
                  </div>
                </div>
              </TableCell>

              {/* 운행 일정 */}
              <TableCell>
                <div className="space-y-1">
                  <Badge variant="outline" className="text-indigo-600 border-indigo-200">
                    {formatOperatingDays(route.operatingDays)}
                  </Badge>
                  {route.remarks && (
                    <div className="text-xs text-gray-500 truncate max-w-32">
                      {route.remarks}
                    </div>
                  )}
                </div>
              </TableCell>

              {/* 담당 기사 */}
              <TableCell>
                {route.driver ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-900">{route.driver.name}</span>
                    </div>
                    <div className="text-xs text-gray-500">{route.driver.phone}</div>
                  </div>
                ) : (
                  <span className="text-gray-400 text-sm">미배정</span>
                )}
              </TableCell>

              {/* 상차지 */}
              <TableCell>
                {route.loadingPoint ? (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-orange-500" />
                    <span className="text-gray-900">{route.loadingPoint.name}</span>
                  </div>
                ) : (
                  <span className="text-gray-400 text-sm">미설정</span>
                )}
              </TableCell>

              {/* 계약 정보 */}
              <TableCell>
                <div className="space-y-1">
                  <div className="text-sm">
                    <span className="text-gray-600">센터: </span>
                    <span className="font-medium">{formatContractType(route.centerContractType)}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">기사: </span>
                    <span className="font-medium">{formatContractType(route.driverContractType)}</span>
                  </div>
                </div>
              </TableCell>

              {/* 수익 정보 */}
              <TableCell>
                <div className="space-y-1">
                  {route.centerAmount && (
                    <div className="text-sm flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-green-500" />
                      <span className="text-gray-600">센터: </span>
                      <span className="font-medium text-green-600">{formatAmount(route.centerAmount)}</span>
                    </div>
                  )}
                  {route.driverAmount && (
                    <div className="text-sm flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-blue-500" />
                      <span className="text-gray-600">기사: </span>
                      <span className="font-medium text-blue-600">{formatAmount(route.driverAmount)}</span>
                    </div>
                  )}
                  {route.monthlyOperatingCost && (
                    <div className="text-xs text-gray-500">
                      월 운영비: {formatAmount(route.monthlyOperatingCost)}
                    </div>
                  )}
                </div>
              </TableCell>

              {/* 상태 */}
              <TableCell>
                <Badge 
                  variant={route.isActive ? "default" : "secondary"}
                  className={cn(
                    route.isActive 
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white" 
                      : "bg-gray-200 text-gray-600"
                  )}
                >
                  {route.isActive ? '활성' : '비활성'}
                </Badge>
              </TableCell>

              {/* 액션 메뉴 */}
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-indigo-100"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {onEdit && (
                      <DropdownMenuItem 
                        onClick={() => onEdit(route)}
                        className="cursor-pointer"
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        노선 수정
                      </DropdownMenuItem>
                    )}
                    
                    {onToggleStatus && (
                      <DropdownMenuItem 
                        onClick={() => onToggleStatus(route.id)}
                        className="cursor-pointer"
                      >
                        {route.isActive ? (
                          <>
                            <Pause className="h-4 w-4 mr-2" />
                            비활성화
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            활성화
                          </>
                        )}
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    {route.driver?.phone && onCall && (
                      <DropdownMenuItem 
                        onClick={() => onCall(route.driver!.phone)}
                        className="cursor-pointer"
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        기사 전화
                      </DropdownMenuItem>
                    )}

                    {onMessage && (
                      <DropdownMenuItem 
                        onClick={() => onMessage(route)}
                        className="cursor-pointer"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        메시지 발송
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    {onCopy && (
                      <DropdownMenuItem 
                        onClick={() => onCopy(route)}
                        className="cursor-pointer"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        정보 복사
                      </DropdownMenuItem>
                    )}

                    {onShare && (
                      <DropdownMenuItem 
                        onClick={() => onShare(route)}
                        className="cursor-pointer"
                      >
                        <Share className="h-4 w-4 mr-2" />
                        카카오 공유
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    {onDelete && (
                      <DropdownMenuItem 
                        onClick={() => onDelete(route.id)}
                        className="cursor-pointer text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        노선 삭제
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default FixedRoutesTable
