import { ReactNode } from 'react'
import { Copy, MessageCircle, MessageSquare, Phone, Edit, CheckCircle, UserX } from 'lucide-react'
import { TableColumn, BaseItem } from './ManagementPageTemplate'
import { ContextMenuItem } from '@/components/ui/ContextMenu'
import { LoadingPointResponse } from '@/hooks/useLoadingPoints'

// LoadingPoint extends BaseItem
export interface LoadingPointItem extends BaseItem {
  centerName: string
  loadingPointName: string
  lotAddress?: string
  roadAddress?: string
  manager1?: string
  manager2?: string
  phone1?: string
  phone2?: string
  remarks?: string
}

// Table columns for loading points
export const getLoadingPointColumns = (): TableColumn<LoadingPointItem>[] => [
  {
    key: 'centerName',
    header: '센터명',
    render: (item) => (
      <div className="text-center">
        <div className="text-sm font-medium text-gray-900">{item.centerName}</div>
        {!item.isActive && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
            비활성
          </span>
        )}
      </div>
    )
  },
  {
    key: 'loadingPointName',
    header: '상차지명',
    render: (item) => (
      <div className="text-sm text-gray-900 text-center">
        {item.loadingPointName || '-'}
      </div>
    )
  },
  {
    key: 'address',
    header: '주소',
    render: (item) => (
      <div className="text-sm text-gray-900 text-center">
        {item.roadAddress && <div className="mb-1">{item.roadAddress}</div>}
        {item.lotAddress && <div className="text-gray-600 text-xs">{item.lotAddress}</div>}
        {!item.roadAddress && !item.lotAddress && '-'}
      </div>
    )
  },
  {
    key: 'managers',
    header: '담당자',
    render: (item) => (
      <div className="text-sm text-gray-900 text-center">
        {item.manager1 && <div>{item.manager1}</div>}
        {item.manager2 && <div className="text-gray-600">{item.manager2}</div>}
        {!item.manager1 && !item.manager2 && '-'}
      </div>
    )
  },
  {
    key: 'phones',
    header: '연락처',
    render: (item) => (
      <div className="text-sm text-gray-900 text-center">
        {item.phone1 && <div>{item.phone1}</div>}
        {item.phone2 && <div className="text-gray-600">{item.phone2}</div>}
        {!item.phone1 && !item.phone2 && '-'}
      </div>
    )
  },
  {
    key: 'remarks',
    header: '비고',
    render: (item) => (
      <div className="text-sm text-gray-500 text-center" title={item.remarks || ''}>
        <div className="max-w-32 truncate mx-auto">
          {item.remarks || '-'}
        </div>
      </div>
    )
  }
]

// Context menu items generator for loading points
export const getLoadingPointContextMenuItems = (
  loadingPoint: LoadingPointItem,
  handlers: {
    onCopy: (loadingPoint: LoadingPointItem) => Promise<void>
    onKakaoShare: (loadingPoint: LoadingPointItem) => Promise<void>
    onSendSMS: (loadingPoint: LoadingPointItem) => void
    onPhoneCall: (loadingPoint: LoadingPointItem, phoneNumber: string) => void
    onEdit: (loadingPoint: LoadingPointItem) => void
    onActivate: (id: string) => void
    onDeactivate: (id: string) => void
  }
): ContextMenuItem[] => {
  const hasPhone = !!(loadingPoint.phone1 || loadingPoint.phone2)
  const phoneItems = []
  
  if (loadingPoint.phone1) {
    phoneItems.push({
      id: 'call1',
      label: loadingPoint.contactName ? `${loadingPoint.contactName}님께 전화1` : '전화1',
      icon: <Phone className="h-4 w-4" />,
      onClick: () => handlers.onPhoneCall(loadingPoint, loadingPoint.phone1!)
    })
  }
  
  if (loadingPoint.phone2) {
    phoneItems.push({
      id: 'call2',
      label: loadingPoint.contactName ? `${loadingPoint.contactName}님께 전화2` : '전화2',
      icon: <Phone className="h-4 w-4" />,
      onClick: () => handlers.onPhoneCall(loadingPoint, loadingPoint.phone2!)
    })
  }

  return [
    {
      id: 'copy',
      label: '복사하기',
      icon: <Copy className="h-4 w-4" />,
      onClick: () => handlers.onCopy(loadingPoint)
    },
    {
      id: 'kakao',
      label: '카톡 공유',
      icon: <MessageCircle className="h-4 w-4" />,
      onClick: () => handlers.onKakaoShare(loadingPoint)
    },
    {
      id: 'sms',
      label: '문자 보내기',
      icon: <MessageSquare className="h-4 w-4" />,
      onClick: () => handlers.onSendSMS(loadingPoint),
      disabled: !hasPhone
    },
    ...phoneItems,
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
      onClick: () => handlers.onEdit(loadingPoint)
    },
    {
      id: 'toggle',
      label: loadingPoint.isActive ? '비활성화' : '활성화',
      icon: loadingPoint.isActive ? <UserX className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />,
      onClick: () => loadingPoint.isActive ? handlers.onDeactivate(loadingPoint.id) : handlers.onActivate(loadingPoint.id),
      destructive: loadingPoint.isActive
    }
  ]
}