import { ReactNode } from 'react'
import { Copy, MessageCircle, MessageSquare, Phone, Edit, CheckCircle, UserX } from 'lucide-react'
import { TableColumn, BaseItem } from './ManagementPageTemplate'
import { ContextMenuItem } from '@/components/ui/ContextMenu'
import { FixedRouteResponse, ContractTypeLabels, WeekdayLabels } from '@/lib/validations/fixedRoute'

// FixedRoute extends BaseItem
export interface FixedRouteItem extends BaseItem {
  routeName: string
  centerName: string
  loadingPointName: string
  assignedDriverName?: string | null
  assignedDriverId?: string
  weekdayPattern?: number[]
  contractType: string
  revenueDaily?: number
  costDaily?: number
  revenueMonthly?: number
  costMonthly?: number
  driverPhone?: string | null
  vehicleNumber?: string | null
  remarks?: string | null
  loadingPoint?: {
    centerName: string
    loadingPointName: string
  } | null
  assignedDriver?: {
    name: string
    phone: string
  } | null
}

// Table columns for fixed routes
export const getFixedRouteColumns = (): TableColumn<FixedRouteItem>[] => [
  {
    key: 'centerName',
    header: '센터명',
    render: (item) => (
      <div className="text-sm text-gray-900 text-center">
        {item.centerName}
      </div>
    )
  },
  {
    key: 'routeName',
    header: '노선명',
    render: (item) => (
      <div className="text-center">
        <div className="text-sm font-medium text-gray-900">{item.routeName}</div>
        {!item.isActive && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
            비활성
          </span>
        )}
      </div>
    )
  },
  {
    key: 'assignedDriverName',
    header: '배정기사',
    render: (item) => (
      <div className="text-sm text-gray-900 text-center">
        {item.assignedDriverName || '-'}
      </div>
    )
  },
  {
    key: 'vehicleNumber',
    header: '차량번호',
    render: (item) => (
      <div className="text-sm text-gray-900 text-center">
        {item.vehicleNumber || '-'}
      </div>
    )
  },
  {
    key: 'driverPhone',
    header: '전화번호',
    render: (item) => (
      <div className="text-sm text-gray-900 text-center">
        {item.driverPhone || '-'}
      </div>
    )
  },
  {
    key: 'contractType',
    header: '계약형태',
    render: (item) => (
      <div className="text-sm text-gray-900 text-center">
        {ContractTypeLabels[item.contractType as keyof typeof ContractTypeLabels] || item.contractType}
      </div>
    )
  },
  {
    key: 'weekdayPattern',
    header: '운행요일',
    render: (item) => (
      <div className="text-sm text-gray-900 text-center">
        {item.weekdayPattern?.map(day => WeekdayLabels[day]).join(', ') || '-'}
      </div>
    )
  },
  {
    key: 'revenue',
    header: '매출',
    render: (item) => (
      <div className="text-sm text-gray-900 text-center">
        {item.contractType === 'FIXED_DAILY' && item.revenueDaily ? 
          `일 ${item.revenueDaily.toLocaleString()}원` : 
          item.contractType === 'FIXED_MONTHLY' && item.revenueMonthly ? 
          `월 ${item.revenueMonthly.toLocaleString()}원` : '-'}
      </div>
    )
  },
  {
    key: 'cost',
    header: '매입',
    render: (item) => (
      <div className="text-sm text-gray-900 text-center">
        {item.contractType === 'FIXED_DAILY' && item.costDaily ? 
          `일 ${item.costDaily.toLocaleString()}원` : 
          item.contractType === 'FIXED_MONTHLY' && item.costMonthly ? 
          `월 ${item.costMonthly.toLocaleString()}원` : '-'}
      </div>
    )
  },
  {
    key: 'remarks',
    header: '비고',
    render: (item) => (
      <div className="text-sm text-gray-900 text-center max-w-32 truncate" title={item.remarks || ''}>
        {item.remarks || '-'}
      </div>
    )
  }
]

// Context menu items generator for fixed routes
export const getFixedRouteContextMenuItems = (
  fixedRoute: FixedRouteItem,
  handlers: {
    onCopy: (fixedRoute: FixedRouteItem) => Promise<void>
    onKakaoShare: (fixedRoute: FixedRouteItem) => Promise<void>
    onSendSMS: (fixedRoute: FixedRouteItem) => void
    onPhoneCall: (fixedRoute: FixedRouteItem, phoneNumber: string) => void
    onEdit: (fixedRoute: FixedRouteItem) => void
    onActivate: (id: string) => void
    onDeactivate: (id: string) => void
  }
): ContextMenuItem[] => [
  {
    id: 'copy',
    label: '복사하기',
    icon: <Copy className="h-4 w-4" />,
    onClick: () => handlers.onCopy(fixedRoute)
  },
  {
    id: 'kakao',
    label: '카톡 공유',
    icon: <MessageCircle className="h-4 w-4" />,
    onClick: () => handlers.onKakaoShare(fixedRoute)
  },
  {
    id: 'sms',
    label: '문자 보내기',
    icon: <MessageSquare className="h-4 w-4" />,
    onClick: () => handlers.onSendSMS(fixedRoute),
    disabled: !fixedRoute.assignedDriver?.phone
  },
  {
    id: 'call',
    label: fixedRoute.assignedDriver?.name ? `${fixedRoute.assignedDriver.name}님께 전화` : '전화 걸기',
    icon: <Phone className="h-4 w-4" />,
    onClick: () => fixedRoute.assignedDriver?.phone && handlers.onPhoneCall(fixedRoute, fixedRoute.assignedDriver.phone),
    disabled: !fixedRoute.assignedDriver?.phone
  },
  {
    id: 'divider1',
    label: '',
    icon: null,
    onClick: () => {},
    divider: true
  },
  {
    id: 'edit',
    label: '수정하기',
    icon: <Edit className="h-4 w-4" />,
    onClick: () => handlers.onEdit(fixedRoute)
  },
  {
    id: 'toggle',
    label: fixedRoute.isActive ? '비활성화' : '활성화',
    icon: fixedRoute.isActive ? <UserX className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />,
    onClick: () => fixedRoute.isActive ? handlers.onDeactivate(fixedRoute.id) : handlers.onActivate(fixedRoute.id),
    destructive: fixedRoute.isActive
  }
]