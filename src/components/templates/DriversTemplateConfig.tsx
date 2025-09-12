import { ReactNode } from 'react'
import { Copy, MessageCircle, MessageSquare, Phone, Edit, CheckCircle, UserX } from 'lucide-react'
import { TableColumn, BaseItem } from './ManagementPageTemplate'
import { ContextMenuItem } from '@/components/ui/ContextMenu'
import { DriverResponse } from '@/lib/validations/driver'

// Driver extends BaseItem
export interface DriverItem extends BaseItem {
  name: string
  phone: string
  vehicleNumber?: string
  businessName?: string
  representative?: string
  businessNumber?: string
  bankName?: string
  accountNumber?: string
  remarks?: string
}

// Table columns for drivers
export const getDriverColumns = (): TableColumn<DriverItem>[] => [
  {
    key: 'name',
    header: '성함',
    render: (item) => (
      <div>
        <div className="text-sm font-medium text-gray-900">{item.name}</div>
        {!item.isActive && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
            비활성
          </span>
        )}
      </div>
    )
  },
  {
    key: 'phone',
    header: '연락처',
    render: (item) => (
      <div className="text-sm text-gray-900">
        {item.phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')}
      </div>
    )
  },
  {
    key: 'vehicleNumber',
    header: '차량번호',
    render: (item) => (
      <div className="text-sm text-gray-900">
        {item.vehicleNumber || '-'}
      </div>
    )
  },
  {
    key: 'businessName',
    header: '사업상호',
    render: (item) => (
      <div className="text-sm text-gray-900">
        {item.businessName || '-'}
      </div>
    )
  },
  {
    key: 'representative',
    header: '대표자',
    render: (item) => (
      <div className="text-sm text-gray-900">
        {item.representative || '-'}
      </div>
    )
  },
  {
    key: 'bankName',
    header: '계좌은행',
    render: (item) => (
      <div className="text-sm text-gray-900">
        {item.bankName || '-'}
      </div>
    )
  },
  {
    key: 'accountNumber',
    header: '계좌번호',
    render: (item) => (
      <div className="text-sm text-gray-900">
        {item.accountNumber || '-'}
      </div>
    )
  },
  {
    key: 'remarks',
    header: '특이사항',
    render: (item) => (
      <div className="text-sm text-gray-500" title={item.remarks || ''}>
        {item.remarks || '-'}
      </div>
    )
  }
]

// Context menu items generator for drivers
export const getDriverContextMenuItems = (
  driver: DriverItem,
  handlers: {
    onCopy: (driver: DriverItem) => Promise<void>
    onKakaoShare: (driver: DriverItem) => Promise<void>
    onSendSMS: (driver: DriverItem) => void
    onPhoneCall: (driver: DriverItem) => void
    onEdit: (driver: DriverItem) => void
    onActivate: (id: string) => void
    onDeactivate: (id: string) => void
  }
): ContextMenuItem[] => [
  {
    id: 'copy',
    label: '복사하기',
    icon: <Copy className="h-4 w-4" />,
    onClick: () => handlers.onCopy(driver)
  },
  {
    id: 'kakao',
    label: '카톡 공유',
    icon: <MessageCircle className="h-4 w-4" />,
    onClick: () => handlers.onKakaoShare(driver)
  },
  {
    id: 'sms',
    label: '문자 보내기',
    icon: <MessageSquare className="h-4 w-4" />,
    onClick: () => handlers.onSendSMS(driver),
    disabled: !driver.phone
  },
  {
    id: 'call',
    label: '전화 걸기',
    icon: <Phone className="h-4 w-4" />,
    onClick: () => handlers.onPhoneCall(driver),
    disabled: !driver.phone
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
    onClick: () => handlers.onEdit(driver)
  },
  {
    id: 'toggle',
    label: driver.isActive ? '비활성화' : '활성화',
    icon: driver.isActive ? <UserX className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />,
    onClick: () => driver.isActive ? handlers.onDeactivate(driver.id) : handlers.onActivate(driver.id),
    destructive: driver.isActive
  }
]