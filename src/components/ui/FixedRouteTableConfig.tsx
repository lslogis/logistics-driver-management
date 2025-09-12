'use client'

import React from 'react'
import { User, Truck, Calendar, MapPin } from 'lucide-react'
import {
  FixedRouteResponse,
  getWeekdayNames,
  getContractTypeLabel,
  getContractTypeColor
} from '@/lib/validations/fixedRoute'

// Enhanced table columns for FixedRoute display
export const getFixedRouteTableColumns = () => [
  {
    key: 'centerName',
    header: '센터명',
    render: (centerName: string, route: FixedRouteResponse) => (
      <div>
        <div className="font-medium text-gray-900">{centerName}</div>
        <div className="text-xs text-gray-500 flex items-center mt-1">
          <MapPin className="h-3 w-3 mr-1" />
          {route.courseName}
        </div>
      </div>
    ),
  },
  {
    key: 'contractType',
    header: '계약형태',
    render: (contractType: string) => (
      <span className={`
        inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border
        ${getContractTypeColor(contractType as any)}
      `}>
        {getContractTypeLabel(contractType as any)}
      </span>
    ),
  },
  {
    key: 'courseName',
    header: '노선명',
    render: (courseName: string) => (
      <div className="text-sm font-medium text-gray-900">{courseName}</div>
    ),
  },
  {
    key: 'assignedDriver',
    header: '배정 기사',
    render: (driver: any, route: FixedRouteResponse) => (
      route.assignedDriver ? (
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{route.assignedDriver.name}</div>
            <div className="text-xs text-gray-500">
              {route.assignedDriver.phone} • {route.assignedDriver.vehicleNumber}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center space-x-2 text-gray-400">
          <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
            <User className="h-4 w-4" />
          </div>
          <span className="text-sm">미배정</span>
        </div>
      )
    ),
  },
  {
    key: 'weekdayPattern',
    header: '요일패턴',
    render: (pattern: number[]) => (
      <div className="flex items-center space-x-1">
        <Calendar className="h-4 w-4 text-gray-400" />
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800">
          {getWeekdayNames(pattern)}
        </span>
      </div>
    ),
  },
  {
    key: 'fare',
    header: '운임 정보',
    render: (value: any, route: FixedRouteResponse) => {
      const contractType = route.contractType
      
      // 계약유형별 운임 표시
      if (contractType === 'CONSIGNED_MONTHLY') {
        const revenue = route.revenueMonthlyWithExpense ? parseInt(route.revenueMonthlyWithExpense) : 0
        const cost = route.costMonthlyWithExpense ? parseInt(route.costMonthlyWithExpense) : 0
        return (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">매출:</span>
              <span className="font-medium">{revenue.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">매입:</span>
              <span className="font-medium">{cost.toLocaleString()}원</span>
            </div>
          </div>
        )
      } else if (contractType === 'FIXED_DAILY') {
        const revenue = route.revenueDaily ? parseInt(route.revenueDaily) : 0
        const cost = route.costDaily ? parseInt(route.costDaily) : 0
        return (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">매출:</span>
              <span className="font-medium">{revenue.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">매입:</span>
              <span className="font-medium">{cost.toLocaleString()}원</span>
            </div>
          </div>
        )
      } else if (contractType === 'FIXED_MONTHLY') {
        const revenue = route.revenueMonthly ? parseInt(route.revenueMonthly) : 0
        const cost = route.costMonthly ? parseInt(route.costMonthly) : 0
        return (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">매출:</span>
              <span className="font-medium">{revenue.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">매입:</span>
              <span className="font-medium">{cost.toLocaleString()}원</span>
            </div>
          </div>
        )
      }
      
      return <span className="text-xs text-gray-400">-</span>
    },
  },
  {
    key: 'status',
    header: '상태',
    render: (value: any, route: FixedRouteResponse) => (
      <div className="space-y-1">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          route.isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {route.isActive ? '활성' : '비활성'}
        </span>
        <div className="text-xs text-gray-500">
          운행 {route._count.trips}회
        </div>
      </div>
    ),
  },
  {
    key: 'createdAt',
    header: '등록일',
    render: (createdAt: string) => (
      <div className="text-xs text-gray-500">
        {new Date(createdAt).toLocaleDateString('ko-KR')}
      </div>
    ),
  },
]

// Enhanced mobile view for FixedRoute
export const FixedRouteMobileCard = ({ route, actions }: {
  route: FixedRouteResponse
  actions: Array<{
    label: string
    onClick: (item: any) => void
    variant?: 'primary' | 'secondary' | 'danger'
    icon?: React.ReactNode
    show?: (item: any) => boolean
  }>
}) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
    {/* Header */}
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">{route.centerName}</h3>
        <div className="flex items-center space-x-2 mt-1">
          <MapPin className="h-3 w-3 text-gray-400" />
          <span className="text-sm text-gray-500 truncate">{route.courseName}</span>
        </div>
      </div>
      <div className="flex items-center space-x-2 ml-2">
        <span className={`
          inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border
          ${getContractTypeColor(route.contractType)}
        `}>
          {getContractTypeLabel(route.contractType)}
        </span>
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          route.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {route.isActive ? '활성' : '비활성'}
        </span>
      </div>
    </div>

    {/* Driver Info */}
    <div className="pt-2 border-t border-gray-100">
      <div>
        <div className="flex items-center space-x-1 text-xs text-gray-500 mb-1">
          <User className="h-3 w-3" />
          <span>배정 기사</span>
        </div>
        <div className="text-sm font-medium">
          {route.assignedDriver ? route.assignedDriver.name : '미배정'}
        </div>
        {route.assignedDriver && (
          <div className="text-xs text-gray-500">{route.assignedDriver.phone}</div>
        )}
      </div>
    </div>

    {/* Schedule and Fare Info */}
    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
      <div>
        <div className="flex items-center space-x-1 text-xs text-gray-500 mb-1">
          <Calendar className="h-3 w-3" />
          <span>운행 패턴</span>
        </div>
        <div className="text-sm font-medium">{getWeekdayNames(route.weekdayPattern)}</div>
      </div>
      <div>
        <div className="text-xs text-gray-500 mb-1">운임 정보</div>
        <div className="space-y-1">
          {route.contractType === 'CONSIGNED_MONTHLY' && (
            <>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">매출:</span>
                <span className="font-medium">{route.revenueMonthlyWithExpense ? parseInt(route.revenueMonthlyWithExpense).toLocaleString() : '0'}원</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">매입:</span>
                <span className="font-medium">{route.costMonthlyWithExpense ? parseInt(route.costMonthlyWithExpense).toLocaleString() : '0'}원</span>
              </div>
            </>
          )}
          {route.contractType === 'FIXED_DAILY' && (
            <>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">매출:</span>
                <span className="font-medium">{route.revenueDaily ? parseInt(route.revenueDaily).toLocaleString() : '0'}원</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">매입:</span>
                <span className="font-medium">{route.costDaily ? parseInt(route.costDaily).toLocaleString() : '0'}원</span>
              </div>
            </>
          )}
          {route.contractType === 'FIXED_MONTHLY' && (
            <>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">매출:</span>
                <span className="font-medium">{route.revenueMonthly ? parseInt(route.revenueMonthly).toLocaleString() : '0'}원</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">매입:</span>
                <span className="font-medium">{route.costMonthly ? parseInt(route.costMonthly).toLocaleString() : '0'}원</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>

    {/* Additional Info */}
    <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
      <span>운행 {route._count.trips}회</span>
      <span>{new Date(route.createdAt).toLocaleDateString('ko-KR')}</span>
    </div>

    {/* Remarks */}
    {route.remarks && (
      <div className="pt-2 border-t border-gray-100">
        <div className="text-xs text-gray-500 mb-1">비고</div>
        <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded text-xs">
          {route.remarks}
        </div>
      </div>
    )}

    {/* Actions */}
    {actions.length > 0 && (
      <div className="flex space-x-2 pt-3 border-t border-gray-100">
        {actions
          .filter(action => !action.show || action.show(route))
          .map((action, index) => (
            <button
              key={index}
              onClick={() => action.onClick(route)}
              className={`
                flex items-center space-x-1 px-3 py-1 text-xs font-medium rounded-md
                ${action.variant === 'danger' 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : action.variant === 'primary'
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          ))}
      </div>
    )}
  </div>
)