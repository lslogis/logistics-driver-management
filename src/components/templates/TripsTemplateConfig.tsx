import { ReactNode } from 'react'
import { Copy, MessageCircle, Phone, Edit, CheckCircle, UserX, Calendar, RefreshCw, User, Truck } from 'lucide-react'
import { TableColumn, BaseItem } from './ManagementPageTemplate'
import { ContextMenuItem } from '@/components/ui/ContextMenu'
import { TripResponse, getTripStatusName, getTripStatusColor } from '@/lib/validations/trip'

// Trip extends BaseItem
export interface TripItem extends BaseItem {
  date: string
  status: TripResponse['status']
  driver: {
    id: string
    name: string
    phone: string
  }
  vehicle: {
    id: string
    plateNumber: string
    vehicleType: string
  }
  routeTemplate?: {
    id: string
    name: string
    loadingPoint: string
    unloadingPoint: string
  }
  customRoute?: {
    loadingPoint: string
    unloadingPoint: string
  }
  driverFare: string
  billingFare: string
  deductionAmount?: string
  substituteFare?: string
  substituteDriver?: {
    id: string
    name: string
  }
  absenceReason?: string
  remarks?: string
}

// Status Badge Component
function StatusBadge({ status }: { status: TripResponse['status'] }) {
  const color = getTripStatusColor(status)
  const name = getTripStatusName(status)
  
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    orange: 'bg-orange-100 text-orange-800'
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[color as keyof typeof colorClasses] || 'bg-gray-100 text-gray-800'}`}>
      {name}
    </span>
  )
}

// Table columns for trips
export const getTripColumns = (): TableColumn<TripItem>[] => [
  {
    key: 'date',
    header: '날짜',
    width: '120px',
    render: (item) => {
      const date = new Date(item.date)
      return (
        <div className="text-center">
          <div className="text-sm text-gray-900">
            {date.toLocaleDateString('ko-KR', {
              month: 'short',
              day: 'numeric',
              weekday: 'short'
            })}
          </div>
        </div>
      )
    }
  },
  {
    key: 'driver',
    header: '기사/차량',
    width: '200px',
    render: (item) => (
      <div className="text-center">
        <div className="flex items-center justify-center mb-1">
          <User className="h-3 w-3 mr-1 text-gray-400" />
          <span className="font-medium text-gray-900 text-sm">{item.driver.name}</span>
        </div>
        <div className="text-xs text-gray-500">{item.driver.phone}</div>
        <div className="flex items-center justify-center text-xs text-gray-400 mt-1">
          <Truck className="h-3 w-3 mr-1" />
          <span>{item.vehicle.plateNumber} ({item.vehicle.vehicleType})</span>
        </div>
      </div>
    )
  },
  {
    key: 'route',
    header: '노선',
    width: '180px',
    render: (item) => (
      <div className="text-center">
        {item.routeTemplate ? (
          <div>
            <div className="font-medium text-gray-900 text-sm">{item.routeTemplate.name}</div>
            <div className="text-xs text-gray-500 mt-1">
              {item.routeTemplate.loadingPoint} → {item.routeTemplate.unloadingPoint}
            </div>
          </div>
        ) : item.customRoute ? (
          <div>
            <div className="font-medium text-gray-900 text-sm">커스텀</div>
            <div className="text-xs text-gray-500 mt-1">
              {item.customRoute.loadingPoint} → {item.customRoute.unloadingPoint}
            </div>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </div>
    )
  },
  {
    key: 'fare',
    header: '운임',
    width: '140px',
    render: (item) => {
      const formatCurrency = (amount: string) => {
        return new Intl.NumberFormat('ko-KR', {
          style: 'currency',
          currency: 'KRW'
        }).format(parseInt(amount))
      }

      return (
        <div className="text-center">
          <div className="font-medium text-gray-900 text-sm">기사: {formatCurrency(item.driverFare)}</div>
          <div className="text-gray-500 text-xs">청구: {formatCurrency(item.billingFare)}</div>
          {item.deductionAmount && (
            <div className="text-xs text-red-600 mt-1">
              차감: {formatCurrency(item.deductionAmount)}
            </div>
          )}
          {item.substituteFare && (
            <div className="text-xs text-orange-600 mt-1">
              대차: {formatCurrency(item.substituteFare)}
            </div>
          )}
        </div>
      )
    }
  },
  {
    key: 'status',
    header: '상태',
    width: '120px',
    render: (item) => (
      <div className="text-center">
        <StatusBadge status={item.status} />
        {item.absenceReason && (
          <div className="text-xs text-red-600 mt-1">
            {item.absenceReason}
          </div>
        )}
        {item.substituteDriver && (
          <div className="text-xs text-orange-600 mt-1">
            대차: {item.substituteDriver.name}
          </div>
        )}
      </div>
    )
  },
  {
    key: 'remarks',
    header: '비고',
    render: (item) => (
      <div className="text-sm text-gray-500 text-center" title={item.remarks || ''}>
        {item.remarks || '-'}
      </div>
    )
  }
]

// Context menu items generator for trips
export const getTripContextMenuItems = (
  trip: TripItem,
  handlers: {
    onCopy: (trip: TripItem) => Promise<void>
    onKakaoShare: (trip: TripItem) => Promise<void>
    onPhoneCall: (trip: TripItem) => void
    onEdit: (trip: TripItem) => void
    onStatusChange: (trip: TripItem) => void
    onComplete: (trip: TripItem) => void
    onActivate: (id: string) => void
    onDeactivate: (id: string) => void
  }
): ContextMenuItem[] => [
  {
    id: 'copy',
    label: '운행정보 복사',
    icon: <Copy className="h-4 w-4" />,
    onClick: () => handlers.onCopy(trip)
  },
  {
    id: 'kakao',
    label: '카톡 공유',
    icon: <MessageCircle className="h-4 w-4" />,
    onClick: () => handlers.onKakaoShare(trip)
  },
  {
    id: 'call',
    label: `${trip.driver.name}님께 전화`,
    icon: <Phone className="h-4 w-4" />,
    onClick: () => handlers.onPhoneCall(trip),
    disabled: !trip.driver.phone
  },
  {
    id: 'divider1',
    label: '',
    icon: null,
    onClick: () => {},
    divider: true
  },
  {
    id: 'complete',
    label: '완료 처리',
    icon: <CheckCircle className="h-4 w-4" />,
    onClick: () => handlers.onComplete(trip),
    disabled: trip.status !== 'SCHEDULED'
  },
  {
    id: 'status',
    label: '상태 변경',
    icon: <RefreshCw className="h-4 w-4" />,
    onClick: () => handlers.onStatusChange(trip)
  },
  {
    id: 'divider2',
    label: '',
    icon: null,
    onClick: () => {},
    divider: true
  },
  {
    id: 'edit',
    label: '수정하기',
    icon: <Edit className="h-4 w-4" />,
    onClick: () => handlers.onEdit(trip)
  }
]