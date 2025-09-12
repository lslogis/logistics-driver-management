'use client'

import { useState } from 'react'
import React from 'react'
import Link from 'next/link'
import { Truck, Plus, Upload, Calendar, User as UserIcon } from 'lucide-react'
import { useVehicles, useCreateVehicle, useUpdateVehicle, useDeleteVehicle } from '@/hooks/useVehicles'
import { CreateVehicleData, UpdateVehicleData, VehicleResponse } from '@/lib/validations/vehicle'
import { VehicleOwnership } from '@prisma/client'
import { toast } from 'react-hot-toast'
import ManagementPageLayout from '@/components/layout/ManagementPageLayout'
import { DataTable, commonActions } from '@/components/ui/DataTable'
import { ExportButton } from '@/components/ExportButton'
import { useExportVehicles } from '@/hooks/useImports'

// 차량 등록 모달
function CreateVehicleModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isSubmitting 
}: { 
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateVehicleData) => void
  isSubmitting: boolean
}) {
  const [formData, setFormData] = useState<Partial<CreateVehicleData>>({
    ownership: 'OWNED',
    isActive: true
  })

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.plateNumber || !formData.vehicleType || !formData.ownership) {
      toast.error('필수 필드를 모두 입력해주세요')
      return
    }
    onSubmit(formData as CreateVehicleData)
  }

  return (
    <div className="fixed inset-0 md:left-64 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 md:left-64 bg-slate-900 bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-6 pt-6 pb-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h3 className="text-heading-2 text-slate-900">새 차량 등록</h3>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 focus-ring-inset"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">차량번호 *</label>
                    <input
                      type="text"
                      placeholder="예: 12가3456, 서울12가3456"
                      value={formData.plateNumber || ''}
                      onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                      className="form-input"
                      required
                    />
                    <p className="form-helper">번호판 형식에 따라 입력해주세요</p>
                  </div>

                  <div>
                    <label className="form-label">소유 유형 *</label>
                    <select
                      value={formData.ownership || 'OWNED'}
                      onChange={(e) => setFormData({ ...formData, ownership: e.target.value as VehicleOwnership })}
                      className="form-select"
                      required
                    >
                      <option value="OWNED">고정 (자차)</option>
                      <option value="CHARTER">용차 (임시)</option>
                      <option value="CONSIGNED">지입 (계약)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">차량 유형 *</label>
                  <input
                    type="text"
                    placeholder="예: 1톤 트럭, 25인승 버스, 대형버스"
                    value={formData.vehicleType || ''}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    className="form-input"
                    required
                  />
                  <p className="form-helper">차량의 종류와 크기를 구체적으로 입력해주세요</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">연식</label>
                    <input
                      type="number"
                      placeholder={new Date().getFullYear().toString()}
                      min="1980"
                      max={new Date().getFullYear() + 1}
                      value={formData.year || ''}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="form-input"
                    />
                    <p className="form-helper">선택 사항</p>
                  </div>
                  <div>
                    <label className="form-label">정원 (명)</label>
                    <input
                      type="number"
                      placeholder="5"
                      min="1"
                      max="100"
                      value={formData.capacity || ''}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="form-input"
                    />
                    <p className="form-helper">선택 사항</p>
                  </div>
                </div>

                <div>
                  <label className="form-label">배정 기사 ID</label>
                  <input
                    type="text"
                    placeholder="예: DRIVER_001 (선택사항)"
                    value={formData.driverId || ''}
                    onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                    className="form-input"
                  />
                  <p className="form-helper">나중에 배정 할 수 있습니다</p>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.isActive !== false}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="mt-1 h-4 w-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                    />
                    <div>
                      <span className="form-label mb-0">활성 상태로 등록</span>
                      <p className="form-helper mt-1">체크 해제 시 비활성 상태로 등록됩니다</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-200">
              <div className="text-caption text-slate-500">
                * 표시된 필드는 필수 입력 사항입니다
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary"
                  disabled={isSubmitting}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="loading-spinner mr-2"></div>
                      등록 중...
                    </div>
                  ) : (
                    '차량 등록'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// 차량 수정 모달 - 전문적인 디자인
function EditVehicleModal({ 
  isOpen, 
  onClose, 
  vehicle, 
  onSubmit, 
  isSubmitting 
}: { 
  isOpen: boolean
  onClose: () => void
  vehicle: VehicleResponse | null
  onSubmit: (data: UpdateVehicleData) => void
  isSubmitting: boolean
}) {
  const [formData, setFormData] = useState<Partial<UpdateVehicleData>>({})

  // vehicle이 변경될 때 폼 데이터 초기화
  React.useEffect(() => {
    if (vehicle) {
      setFormData({
        plateNumber: vehicle.plateNumber,
        vehicleType: vehicle.vehicleType,
        ownership: vehicle.ownership,
        year: vehicle.year || undefined,
        capacity: vehicle.capacity || undefined,
        driverId: vehicle.driver?.id || undefined,
        isActive: vehicle.isActive
      })
    }
  }, [vehicle])

  if (!isOpen || !vehicle) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.plateNumber || !formData.vehicleType || !formData.ownership) {
      toast.error('필수 필드를 모두 입력해주세요')
      return
    }
    onSubmit(formData as UpdateVehicleData)
  }

  return (
    <div className="fixed inset-0 md:left-64 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 md:left-64 bg-slate-900 bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-6 pt-6 pb-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-heading-2 text-slate-900">차량 정보 수정</h3>
                    <p className="text-caption text-slate-500 mt-0.5">{vehicle?.plateNumber}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 focus-ring-inset"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">차량번호 *</label>
                  <input
                    type="text"
                    value={formData.plateNumber || ''}
                    onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">차량 유형 *</label>
                  <input
                    type="text"
                    value={formData.vehicleType || ''}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">소유 유형 *</label>
                  <select
                    value={formData.ownership || 'OWNED'}
                    onChange={(e) => setFormData({ ...formData, ownership: e.target.value as VehicleOwnership })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="OWNED">고정 (자차)</option>
                    <option value="CHARTER">용차 (임시)</option>
                    <option value="CONSIGNED">지입 (계약)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">연식</label>
                    <input
                      type="number"
                      min="1980"
                      max={new Date().getFullYear() + 1}
                      value={formData.year || ''}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">정원</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.capacity || ''}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">배정 기사 ID</label>
                  <input
                    type="text"
                    value={formData.driverId || ''}
                    onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive !== false}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">활성 상태</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-200">
              <div className="text-caption text-slate-500">
                마지막 수정: {vehicle?.updatedAt ? new Date(vehicle.updatedAt).toLocaleDateString('ko-KR') : '-'}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary"
                  disabled={isSubmitting}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="loading-spinner mr-2"></div>
                      수정 중...
                    </div>
                  ) : (
                    '수정 완료'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function VehiclesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [ownership, setOwnership] = useState<VehicleOwnership | ''>('')
  const [isActive, setIsActive] = useState<boolean | undefined>()

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<VehicleResponse | null>(null)

  const { data, isLoading, error } = useVehicles({ 
    page, 
    limit: 20, 
    search: search || undefined,
    ownership: ownership || undefined,
    isActive 
  })

  const createMutation = useCreateVehicle()
  const updateMutation = useUpdateVehicle()
  const deleteMutation = useDeleteVehicle()
  const exportMutation = useExportVehicles()

  const handleCreate = (data: CreateVehicleData) => {
    createMutation.mutate(data, {
      onSuccess: () => setCreateModalOpen(false)
    })
  }

  const handleEdit = (vehicle: VehicleResponse) => {
    setEditingVehicle(vehicle)
    setEditModalOpen(true)
  }

  const handleUpdate = (data: UpdateVehicleData) => {
    if (!editingVehicle) return
    updateMutation.mutate({ id: editingVehicle.id, data }, {
      onSuccess: () => {
        setEditModalOpen(false)
        setEditingVehicle(null)
      }
    })
  }

  const handleDelete = (vehicleId: string) => {
    if (confirm('정말 이 차량을 비활성화하시겠습니까?')) {
      deleteMutation.mutate(vehicleId)
    }
  }

  if (error) {
    return (
      <div className="page-container">
        <header className="page-header">
          <div className="w-full px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-heading-2 text-slate-900">차량 관리</h1>
                  <p className="text-caption text-red-600 mt-0.5">데이터 로드 오류</p>
                </div>
              </div>
              <Link href="/" className="btn-secondary">
                메인으로
              </Link>
            </div>
          </div>
        </header>
        <main className="page-content">
          <div className="max-w-lg mx-auto">
            <div className="card p-8 text-center">
              <div className="p-3 bg-red-100 rounded-full w-fit mx-auto mb-4">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-heading-2 text-slate-900 mb-3">데이터를 불러올 수 없습니다</h2>
              <p className="text-body-secondary mb-6">
                차량 데이터를 가져오는 중 문제가 발생했습니다.<br/>
                잘시 후 다시 시도해주세요.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-caption text-red-800 font-mono">{error.message}</p>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={() => window.location.reload()}
                  className="btn-primary"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  새로고침
                </button>
                <Link href="/" className="btn-secondary">
                  메인 화면으로
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Define table columns
  const columns = [
    {
      key: 'plateNumber',
      header: '차량번호',
      render: (value: string) => (
        <div className="font-mono text-sm font-medium text-gray-900">
          {value}
        </div>
      ),
    },
    {
      key: 'vehicle',
      header: '차종/제원',
      render: (value: any, vehicle: VehicleResponse) => (
        <div className="space-y-1">
          <div className="font-medium text-gray-900">{vehicle.vehicleType}</div>
          <div className="flex items-center space-x-3 text-xs text-gray-500">
            {vehicle.year && (
              <span className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {vehicle.year}년
              </span>
            )}
            {vehicle.capacity && (
              <span className="flex items-center">
                <UserIcon className="h-3 w-3 mr-1" />
                {vehicle.capacity}인승
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'ownership',
      header: '소유권',
      render: (value: VehicleOwnership) => {
        const variants = {
          OWNED: 'bg-blue-100 text-blue-800',
          CHARTER: 'bg-yellow-100 text-yellow-800',
          CONSIGNED: 'bg-green-100 text-green-800',
        }
        const labels = {
          OWNED: '고정',
          CHARTER: '용차',
          CONSIGNED: '지입',
        }
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[value]}`}>
            {labels[value]}
          </span>
        )
      },
    },
    {
      key: 'driver',
      header: '배정 기사',
      render: (driver: any) => (
        driver ? (
          <div className="space-y-1">
            <div className="font-medium text-gray-900">{driver.name}</div>
            <div className="text-xs text-gray-500 font-mono">{driver.phone}</div>
          </div>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            미배정
          </span>
        )
      ),
    },
    {
      key: 'isActive',
      header: '상태',
      render: (isActive: boolean) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isActive ? '활성' : '비활성'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: '등록일',
      render: (createdAt: string) => (
        <div className="text-xs text-gray-500">
          {new Date(createdAt).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </div>
      ),
    },
  ]

  // Define table actions
  const actions = [
    commonActions.edit(
      (vehicle: VehicleResponse) => handleEdit(vehicle),
      () => true
    ),
    commonActions.delete(
      (vehicle: VehicleResponse) => handleDelete(vehicle.id),
      (vehicle: VehicleResponse) => vehicle.isActive
    ),
  ]

  // Define search filters
  const searchFilters = [
    {
      label: '차량번호 검색',
      type: 'text' as const,
      value: search,
      onChange: setSearch,
      placeholder: '예: 12가3456, 서울12가3456...',
    },
    {
      label: '소유권 유형',
      type: 'select' as const,
      value: ownership,
      onChange: setOwnership,
      options: [
        { value: 'OWNED', label: '고정 (자차)' },
        { value: 'CHARTER', label: '용차 (임시)' },
        { value: 'CONSIGNED', label: '지입 (계약)' },
      ],
    },
    {
      label: '운행 상태',
      type: 'select' as const,
      value: isActive === undefined ? '' : isActive.toString(),
      onChange: (value: string) => {
        setIsActive(value === '' ? undefined : value === 'true')
      },
      options: [
        { value: 'true', label: '활성 차량' },
        { value: 'false', label: '비활성 차량' },
      ],
    },
  ]

  // Define quick actions
  const quickActions = [
    {
      label: '활성 자차',
      onClick: () => {
        setOwnership('OWNED')
        setIsActive(true)
      },
    },
    {
      label: '비활성 차량',
      onClick: () => {
        setOwnership('')
        setIsActive(false)
      },
    },
    {
      label: '초기화',
      onClick: () => {
        setSearch('')
        setOwnership('')
        setIsActive(undefined)
      },
      variant: 'outline' as const,
    },
  ]

  return (
    <ManagementPageLayout
      title="차량 관리"
      subtitle="차량 정보를 등록하하고 관리합니다"
      icon={<Truck />}
      totalCount={data?.pagination?.total}
      countLabel="대"
      primaryAction={{
        label: '차량 등록',
        onClick: () => setCreateModalOpen(true),
        icon: <Plus className="h-4 w-4" />,
      }}
      secondaryActions={[{
        label: 'CSV 가져오기',
        href: '/import/vehicles',
        icon: <Upload className="h-4 w-4" />,
      }]}
      exportAction={{
        label: '목록 내보내기',
        onClick: (format) => exportMutation.mutate(format),
        loading: exportMutation.isPending,
      }}
      searchFilters={searchFilters}
      quickActions={quickActions}
      isLoading={isLoading}
      error={error instanceof Error ? error.message : undefined}
    >
      <DataTable
        data={data?.vehicles || []}
        columns={columns}
        actions={actions}
        pagination={data?.pagination}
        onPageChange={setPage}
        emptyState={{
          icon: <Truck />,
          title: '등록된 차량이 없습니다',
          description: '새 차량을 등록하여 관리를 시작하세요.',
          action: {
            label: '첫 번째 차량 등록하기',
            onClick: () => setCreateModalOpen(true),
          },
        }}
        isLoading={isLoading}
      />

      {/* 모달 컴포넌트들 */}
      <CreateVehicleModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
      />

      <EditVehicleModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setEditingVehicle(null)
        }}
        vehicle={editingVehicle}
        onSubmit={handleUpdate}
        isSubmitting={updateMutation.isPending}
      />
    </ManagementPageLayout>
  )
}