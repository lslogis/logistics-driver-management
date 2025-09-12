'use client'

import React from 'react'
import { User, Truck, Calendar, MapPin } from 'lucide-react'
import {
  FixedRouteResponse,
  getWeekdayNames,
  getContractTypeLabel,
  getContractTypeColor,
  getVehicleTypeLabel
} from '@/lib/validations/fixedRoute'

// Enhanced table columns for FixedRoute display
export const getFixedRouteTableColumns = () => [
  {
    key: 'courseName',
    header: '코스명',
    render: (courseName: string, route: FixedRouteResponse) => (
      <div>
        <div className="font-medium text-gray-900">{courseName}</div>
        <div className="text-xs text-gray-500 flex items-center mt-1">
          <MapPin className="h-3 w-3 mr-1" />
          {route.loadingPoint}
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
    key: 'vehicleType',
    header: '차종',
    render: (vehicleType: string) => (
      <div className="flex items-center space-x-2">
        <Truck className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium">{getVehicleTypeLabel(vehicleType as any)}</span>
      </div>
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
      const driverFare = parseInt(route.driverFare)
      const billingFare = parseInt(route.billingFare)
      const monthlyBaseFare = route.monthlyBaseFare ? parseInt(route.monthlyBaseFare) : null
      
      return (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">기사:</span>
            <span className="font-medium">{driverFare.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">청구:</span>
            <span className="font-medium">{billingFare.toLocaleString()}원</span>
          </div>
          {monthlyBaseFare && (contractType === 'MONTHLY' || contractType === 'COMPLETE') && (
            <div className="flex justify-between text-xs border-t border-gray-200 pt-1">
              <span className="text-gray-500">월정:</span>
              <span className="font-medium text-blue-600">{monthlyBaseFare.toLocaleString()}원</span>
            </div>
          )}
        </div>
      )
    },
  },
  {
    key: 'period',
    header: '운행 기간',
    render: (value: any, route: FixedRouteResponse) => (
      <div className="text-xs">
        <div className="font-medium text-gray-900">
          {new Date(route.startDate).toLocaleDateString('ko-KR')}
        </div>
        <div className="text-gray-500 mt-1">시작일</div>
        {route.distance && (
          <div className="text-gray-500 mt-1">{route.distance}km</div>
        )}
      </div>
    ),
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
        <h3 className="font-medium text-gray-900 truncate">{route.courseName}</h3>
        <div className="flex items-center space-x-2 mt-1">
          <MapPin className="h-3 w-3 text-gray-400" />
          <span className="text-sm text-gray-500 truncate">{route.loadingPoint}</span>
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

    {/* Vehicle and Driver Info */}
    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
      <div>
        <div className="flex items-center space-x-1 text-xs text-gray-500 mb-1">
          <Truck className="h-3 w-3" />
          <span>차종</span>
        </div>
        <div className="text-sm font-medium">{getVehicleTypeLabel(route.vehicleType)}</div>
      </div>
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
        <div className="text-xs text-gray-500 mt-1">
          {new Date(route.startDate).toLocaleDateString('ko-KR')} 시작
        </div>
      </div>
      <div>
        <div className="text-xs text-gray-500 mb-1">운임 정보</div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">기사:</span>
            <span className="font-medium">{parseInt(route.driverFare).toLocaleString()}원</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">청구:</span>
            <span className="font-medium">{parseInt(route.billingFare).toLocaleString()}원</span>
          </div>
          {route.monthlyBaseFare && (route.contractType === 'MONTHLY' || route.contractType === 'COMPLETE') && (
            <div className="flex justify-between text-xs border-t border-gray-200 pt-1">
              <span className="text-gray-500">월정:</span>
              <span className="font-medium text-blue-600">{parseInt(route.monthlyBaseFare).toLocaleString()}원</span>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Additional Info */}
    <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
      <span>운행 {route._count.trips}회</span>
      {route.distance && <span>{route.distance}km</span>}
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