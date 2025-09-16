import { ReactNode } from 'react'
import { Copy, MessageCircle, MessageSquare, Phone, Edit, CheckCircle, UserX } from 'lucide-react'
import { TableColumn, BaseItem } from './ManagementPageTemplate'
import { ContextMenuItem } from '@/components/ui/ContextMenu'
import { DriverResponse } from '@/lib/validations/driver'
import { formatPhoneNumber, formatBusinessNumber, formatAccountNumber } from '@/lib/utils/format'

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
  // 그룹 1: 기본 정보
  {
    key: 'name',
    header: '성함',
    render: (item) => (
      <div className="text-center">
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
      <div className="text-sm text-gray-900 text-center">
        {formatPhoneNumber(item.phone)}
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
  // 구분선 (컬럼 구분을 위한 시각적 표시는 CSS로 처리)
  // 그룹 2: 사업자 정보
  {
    key: 'businessNumber',
    header: '사업번호',
    render: (item) => (
      <div className="text-sm text-gray-900 text-center border-l-2 border-gray-200 pl-4">
        {item.businessNumber ? formatBusinessNumber(item.businessNumber) : '-'}
      </div>
    )
  },
  {
    key: 'businessName',
    header: '사업상호',
    render: (item) => (
      <div className="text-sm text-gray-900 text-center">
        {item.businessName || '-'}
      </div>
    )
  },
  {
    key: 'representative',
    header: '대표자',
    render: (item) => (
      <div className="text-sm text-gray-900 text-center">
        {item.representative || '-'}
      </div>
    )
  },
  // 그룹 3: 계좌 및 기타 정보
  {
    key: 'bankName',
    header: '계좌은행',
    render: (item) => (
      <div className="text-sm text-gray-900 text-center border-l-2 border-gray-200 pl-4">
        {item.bankName || '-'}
      </div>
    )
  },
  {
    key: 'accountNumber',
    header: '계좌번호',
    render: (item) => (
      <div className="text-sm text-gray-900 text-center">
        {item.accountNumber ? formatAccountNumber(item.accountNumber, item.bankName) : '-'}
      </div>
    )
  },
  {
    key: 'remarks',
    header: '특이사항',
    render: (item) => (
      <div className="text-sm text-gray-500 text-center" title={item.remarks || ''}>
        {item.remarks || '-'}
      </div>
    )
  }
]

// Context menu items generator for drivers
export const getDriverContextMenuItems = (
  driver: DriverItem,
  handlers: {
    onCopyBasic: (driver: DriverItem) => Promise<void>
    onCopyExtended: (driver: DriverItem) => Promise<void>
    onKakaoShareBasic: (driver: DriverItem) => Promise<void>
    onKakaoShareExtended: (driver: DriverItem) => Promise<void>
    onSendSMS: (driver: DriverItem) => void
    onPhoneCall: (driver: DriverItem) => void
    onEdit: (driver: DriverItem) => void
    onActivate: (id: string) => void
    onDeactivate: (id: string) => void
  }
): ContextMenuItem[] => [
  {
    id: 'copy-basic',
    label: '복사하기(기본)',
    icon: <Copy className="h-4 w-4" />,
    onClick: () => handlers.onCopyBasic(driver)
  },
  {
    id: 'copy-extended',
    label: '복사하기(확장)',
    icon: <Copy className="h-4 w-4" />,
    onClick: () => handlers.onCopyExtended(driver)
  },
  {
    id: 'kakao-basic',
    label: '카톡 공유(기본)',
    icon: <MessageCircle className="h-4 w-4" />,
    onClick: () => handlers.onKakaoShareBasic(driver)
  },
  {
    id: 'kakao-extended',
    label: '카톡 공유(확장)',
    icon: <MessageCircle className="h-4 w-4" />,
    onClick: () => handlers.onKakaoShareExtended(driver)
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
    label: `${driver.name}님께 전화`,
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