'use client'

import { useState } from 'react'
import React from 'react'
import Link from 'next/link'
import { useVehicles, useCreateVehicle, useUpdateVehicle, useDeleteVehicle, useAssignDriver } from '@/hooks/useVehicles'
import { CreateVehicleData, UpdateVehicleData, VehicleResponse } from '@/lib/validations/vehicle'
import { VehicleOwnership } from '@prisma/client'
import { toast } from 'react-hot-toast'
import '@/styles/design-system.css'

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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-slate-900 bg-opacity-50 transition-opacity" onClick={onClose} />
        
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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-slate-900 bg-opacity-50 transition-opacity" onClick={onClose} />
        
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

  return (
    <div className="page-container">
      {/* 헤더 */}
      <header className="page-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v-2a2 2 0 00-2-2H8V7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-heading-2 text-slate-900">차량 관리</h1>
                <p className="text-caption text-slate-500 mt-0.5">Vehicle Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link 
                href="/" 
                className="btn-secondary focus-ring"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                메인으로
              </Link>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="btn-primary focus-ring"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                차량 등록
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="page-content">
        {/* 검색 및 필터 - 개선된 디자인 */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-heading-3 text-slate-900">차량 검색 및 필터</h2>
            <span className="text-caption text-slate-500">총 {data?.pagination?.total || 0}대 등록</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="search" className="form-label">
                차량번호 검색
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="search"
                  className="form-input pl-10"
                  placeholder="예: 12가3456, 서울12가3456..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="ownership" className="form-label">
                소유권 유형
              </label>
              <select
                id="ownership"
                className="form-select"
                value={ownership}
                onChange={(e) => setOwnership(e.target.value as VehicleOwnership | '')}
              >
                <option value="">전체 유형</option>
                <option value="OWNED">고정 (자차)</option>
                <option value="CHARTER">용차 (임시)</option>
                <option value="CONSIGNED">지입 (계약)</option>
              </select>
            </div>

            <div>
              <label htmlFor="isActive" className="form-label">
                운행 상태
              </label>
              <select
                id="isActive"
                className="form-select"
                value={isActive === undefined ? '' : isActive.toString()}
                onChange={(e) => {
                  const value = e.target.value
                  setIsActive(value === '' ? undefined : value === 'true')
                }}
              >
                <option value="">전체 상태</option>
                <option value="true">활성 차량</option>
                <option value="false">비활성 차량</option>
              </select>
            </div>
          </div>
          
          {/* 빠른 필터 버튼들 */}
          <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-slate-200">
            <span className="text-caption text-slate-600">빠른 필터:</span>
            <button
              onClick={() => {
                setOwnership('OWNED')
                setIsActive(true)
              }}
              className="btn-ghost text-xs py-1 px-2 h-auto"
            >
              활성 자차
            </button>
            <button
              onClick={() => {
                setOwnership('')
                setIsActive(false)
              }}
              className="btn-ghost text-xs py-1 px-2 h-auto"
            >
              비활성 차량
            </button>
            <button
              onClick={() => {
                setSearch('')
                setOwnership('')
                setIsActive(undefined)
              }}
              className="btn-ghost text-xs py-1 px-2 h-auto text-red-600 hover:text-red-700"
            >
              초기화
            </button>
          </div>
        </div>

        {/* 차량 목록 - 전문적인 테이블 디자인 */}
        <div className="table-container">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center space-x-2">
                <div className="loading-spinner"></div>
                <span className="text-body-secondary">차량 데이터를 불러오는 중...</span>
              </div>
            </div>
          ) : !data?.vehicles?.length ? (
            <div className="p-12 text-center">
              <div className="max-w-sm mx-auto">
                <svg className="h-16 w-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v-2a2 2 0 00-2-2H8V7z" />
                </svg>
                <h3 className="text-heading-3 text-slate-900 mb-2">등록된 차량이 없습니다</h3>
                <p className="text-body-secondary mb-4">새 차량을 등록하여 관리를 시작하세요.</p>
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="btn-primary"
                >
                  첫 번째 차량 등록하기
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header">
                        차량번호
                      </th>
                      <th className="table-header">
                        차종/제원
                      </th>
                      <th className="table-header">
                        소유권
                      </th>
                      <th className="table-header">
                        배정 기사
                      </th>
                      <th className="table-header">
                        상태
                      </th>
                      <th className="table-header">
                        등록일
                      </th>
                      <th className="table-header">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.vehicles.map((vehicle) => (
                      <tr key={vehicle.id} className="table-row group">
                        <td className="table-cell">
                          <div className="font-mono text-sm font-medium text-slate-900">
                            {vehicle.plateNumber}
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="space-y-1">
                            <div className="font-medium text-slate-900">{vehicle.vehicleType}</div>
                            <div className="flex items-center space-x-3 text-xs text-slate-500">
                              {vehicle.year && (
                                <span className="flex items-center">
                                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-8 0h8m-8 0v8a2 2 0 002 2h4a2 2 0 002-2V7m-8 0V7" />
                                  </svg>
                                  {vehicle.year}년
                                </span>
                              )}
                              {vehicle.capacity && (
                                <span className="flex items-center">
                                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                  {vehicle.capacity}인승
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className={`${
                            vehicle.ownership === 'OWNED' ? 'badge-info' :
                            vehicle.ownership === 'CHARTER' ? 'badge-warning' :
                            'badge-success'
                          }`}>
                            {vehicle.ownership === 'OWNED' ? '고정' :
                             vehicle.ownership === 'CHARTER' ? '용차' : '지입'}
                          </span>
                        </td>
                        <td className="table-cell">
                          {vehicle.driver ? (
                            <div className="space-y-1">
                              <div className="font-medium text-slate-900">{vehicle.driver.name}</div>
                              <div className="text-caption text-slate-500 font-mono">{vehicle.driver.phone}</div>
                            </div>
                          ) : (
                            <span className="badge-neutral">미배정</span>
                          )}
                        </td>
                        <td className="table-cell">
                          <span className={`${
                            vehicle.isActive ? 'badge-success' : 'badge-danger'
                          }`}>
                            {vehicle.isActive ? '활성' : '비활성'}
                          </span>
                        </td>
                        <td className="table-cell table-cell-secondary">
                          <div className="text-caption">
                            {new Date(vehicle.createdAt).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEdit(vehicle)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors focus-ring-inset"
                              title="차량 정보 수정"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            {vehicle.isActive && (
                              <button
                                onClick={() => handleDelete(vehicle.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors focus-ring-inset"
                                title="차량 비활성화"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 개선된 페이지네이션 */}
              {data.pagination && (
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="text-body-secondary">
                        총 <span className="font-semibold text-slate-900">{data.pagination.total.toLocaleString()}</span>대 중{' '}
                        <span className="font-semibold text-slate-900">
                          {((data.pagination.page - 1) * data.pagination.limit) + 1}
                        </span>
                        -{' '}
                        <span className="font-semibold text-slate-900">
                          {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)}
                        </span>
                        대 표시
                      </div>
                      <div className="hidden sm:flex items-center space-x-2 text-caption text-slate-500">
                        <span>페이지당</span>
                        <span className="font-mono font-medium">{data.pagination.limit}개</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setPage(1)}
                        disabled={page <= 1}
                        className="p-2 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed focus-ring-inset"
                        title="첫 페이지"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={page <= 1}
                        className="btn-ghost py-1.5 px-3 text-sm disabled:opacity-30"
                      >
                        이전
                      </button>
                      <div className="flex items-center px-3 py-1.5 text-sm font-mono">
                        <span className="text-slate-900 font-semibold">{page}</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="text-slate-600">{data.pagination.totalPages}</span>
                      </div>
                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={page >= data.pagination.totalPages}
                        className="btn-ghost py-1.5 px-3 text-sm disabled:opacity-30"
                      >
                        다음
                      </button>
                      <button
                        onClick={() => setPage(data.pagination.totalPages)}
                        disabled={page >= data.pagination.totalPages}
                        className="p-2 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed focus-ring-inset"
                        title="마지막 페이지"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

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
    </div>
  )
}