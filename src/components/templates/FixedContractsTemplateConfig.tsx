import React from 'react'
import { Copy, MessageSquare, Phone, Edit, Play, Pause, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { TableColumn } from '@/components/templates/ManagementPageTemplate'
import { ContextMenuItem } from '@/components/ui/ContextMenu'
import { FixedContractResponse, CONTRACT_TYPE_LABELS, WEEKDAY_LABELS } from '@/lib/validations/fixedContract'
import { formatCurrency, formatPhoneNumber } from '@/lib/utils/format'

export interface FixedContractItem {
  id: string
  routeName: string
  centerContractType?: string
  driverContractType?: string
  operatingDays: number[]
  driver: {
    id: string
    name: string
    phone: string
    vehicleNumber: string
  }
  loadingPoint: {
    id: string
    centerName: string
    loadingPointName: string
  }
  centerAmount?: number
  driverAmount?: number
  monthlyOperatingCost?: number
  dailyOperatingCost?: number
  startDate?: string
  endDate?: string
  remarks?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface FixedContractContextMenuHandlers {
  onCopy: (item: FixedContractItem) => void
  onKakaoShare: (item: FixedContractItem) => void
  onSendSMS: (item: FixedContractItem) => void
  onPhoneCall: (item: FixedContractItem, phoneNumber: string) => void
  onEdit: (item: FixedContractItem) => void
  onActivate: (id: string) => void
  onDeactivate: (id: string) => void
  onDelete: (id: string) => void
}

function formatOperatingDays(days: number[]): string {
  if (!days || days.length === 0) return '-'
  
  return days
    .sort()
    .map(day => WEEKDAY_LABELS[day]?.slice(0, 1))
    .join(', ')
}

function formatDate(dateString?: string): string {
  if (!dateString) return '-'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\./g, '/').replace(/\s/g, '').replace(/\/$/, '')
  } catch {
    return '-'
  }
}

export function getFixedContractColumns(): TableColumn<FixedContractItem>[] {
  return [
    {
      key: 'centerName',
      header: '센터명',
      render: (item) => (
        <div className="font-medium text-center">{item.loadingPoint.centerName}</div>
      )
    },
    {
      key: 'routeName',
      header: '노선명',
      render: (item) => (
        <div className="font-medium text-center">{item.routeName}</div>
      )
    },
    {
      key: 'driver',
      header: '기사 정보',
      render: (item) => (
        <div className="space-y-1 text-center">
          <div className="font-medium">{item.driver.name}</div>
          <div className="text-sm text-gray-500">{formatPhoneNumber(item.driver.phone)} • {item.driver.vehicleNumber}</div>
        </div>
      )
    },
    {
      key: 'operatingDays',
      header: '운행 요일',
      render: (item) => (
        <div className="text-sm text-center">{formatOperatingDays(item.operatingDays)}</div>
      )
    },
    {
      key: 'centerContractType',
      header: '센터계약',
      render: (item) => (
        <div className="text-sm text-center">
          {item.centerContractType ? (CONTRACT_TYPE_LABELS[item.centerContractType as keyof typeof CONTRACT_TYPE_LABELS] || item.centerContractType) : '-'}
        </div>
      )
    },
    {
      key: 'centerAmount',
      header: '센터금액',
      render: (item) => (
        <div className="text-sm text-center">{item.centerAmount !== undefined ? formatCurrency(item.centerAmount) : '-'}</div>
      )
    },
    {
      key: 'driverContractType',
      header: '기사계약',
      render: (item) => (
        <div className="text-sm text-center">
          {item.driverContractType ? (CONTRACT_TYPE_LABELS[item.driverContractType as keyof typeof CONTRACT_TYPE_LABELS] || item.driverContractType) : '-'}
        </div>
      )
    },
    {
      key: 'driverAmount',
      header: '기사금액',
      render: (item) => (
        <div className="text-sm text-center">{item.driverAmount !== undefined ? formatCurrency(item.driverAmount) : '-'}</div>
      )
    },
    {
      key: 'startDate',
      header: '시작일자',
      render: (item) => (
        <div className="text-sm text-center">{formatDate(item.startDate)}</div>
      )
    },
    {
      key: 'endDate',
      header: '종료일자',
      render: (item) => (
        <div className="text-sm text-center">{formatDate(item.endDate)}</div>
      )
    },
    {
      key: 'remarks',
      header: '비고',
      render: (item) => (
        <div className="text-sm text-center max-w-32 truncate" title={item.remarks || ''}>
          {item.remarks || '-'}
        </div>
      )
    },
    {
      key: 'isActive',
      header: '상태',
      render: (item) => (
        <div className="text-center">
          <Badge variant={item.isActive ? 'default' : 'secondary'}>
            {item.isActive ? '활성' : '비활성'}
          </Badge>
        </div>
      )
    }
  ]
}

export function getFixedContractContextMenuItems(
  item: FixedContractItem,
  handlers: FixedContractContextMenuHandlers
) : ContextMenuItem[] {
  return [
    {
      id: 'copy',
      label: '복사하기',
      icon: <Copy className="h-4 w-4" />,
      onClick: () => handlers.onCopy(item)
    },
    {
      id: 'kakao',
      label: '카톡공유',
      icon: <MessageSquare className="h-4 w-4" />,
      onClick: () => handlers.onKakaoShare(item)
    },
    {
      id: 'sms',
      label: 'SMS 발송',
      icon: <MessageSquare className="h-4 w-4" />,
      onClick: () => handlers.onSendSMS(item)
    },
    {
      id: 'call',
      label: '전화걸기',
      icon: <Phone className="h-4 w-4" />,
      onClick: () => handlers.onPhoneCall(item, item.driver.phone)
    },
    { id: 'div1', label: '', onClick: () => {}, divider: true },
    {
      id: 'edit',
      label: '수정',
      icon: <Edit className="h-4 w-4" />,
      onClick: () => handlers.onEdit(item)
    },
    {
      id: 'toggle',
      label: item.isActive ? '비활성화' : '활성화',
      icon: item.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />,
      onClick: () => (item.isActive ? handlers.onDeactivate(item.id) : handlers.onActivate(item.id)),
      destructive: item.isActive
    },
    { id: 'div2', label: '', onClick: () => {}, divider: true },
    {
      id: 'delete',
      label: '삭제',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => handlers.onDelete(item.id),
      destructive: true
    }
  ]
}
