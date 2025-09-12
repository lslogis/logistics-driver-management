'use client'

import React, { useState } from 'react'
import { Calendar, Plus, Upload, CheckCircle, RefreshCw, Edit, Trash2, User, Truck } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { TripResponse, CreateTripData, UpdateTripData, getTripStatusName, getTripStatusColor, canEditTrip, canDeleteTrip } from '@/lib/validations/trip'
import { useTrips, useCreateTrip, useUpdateTrip, useDeleteTrip, useUpdateTripStatus, useCompleteTrip } from '@/hooks/useTrips'
import ManagementPageLayout from '@/components/layout/ManagementPageLayout'
import { DataTable, commonActions } from '@/components/ui/DataTable'
import { ExportButton } from '@/components/ExportButton'
import { useExportTrips } from '@/hooks/useImports'

// 상태 배지 컴포넌트
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

// 운행 등록 모달
function CreateTripModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isSubmitting 
}: { 
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateTripData) => void
  isSubmitting: boolean
}) {
  const [formData, setFormData] = useState<Partial<CreateTripData & {
    loadingPoint: string;
    unloadingPoint: string;
    driverFare: number | string;
    billingFare: number | string;
  }>>({
    date: new Date().toISOString().split('T')[0],
    status: 'SCHEDULED',
    loadingPoint: '',
    unloadingPoint: '',
    driverFare: 0,
    billingFare: 0
  })

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.date || !formData.driverId || !formData.vehicleId || !Number(formData.driverFare) || !Number(formData.billingFare)) {
      toast.error('필수 필드를 모두 입력해주세요')
      return
    }
    onSubmit({
      ...formData,
      driverFare: Number(formData.driverFare),
      billingFare: Number(formData.billingFare)
    } as CreateTripData)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">운행 등록</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">운행일</label>
                  <input
                    type="date"
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">기사 ID</label>
                  <input
                    type="text"
                    placeholder="기사 ID를 입력하세요"
                    value={formData.driverId || ''}
                    onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">차량 ID</label>
                  <input
                    type="text"
                    placeholder="차량 ID를 입력하세요"
                    value={formData.vehicleId || ''}
                    onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">기사요금</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.driverFare || ''}
                      onChange={(e) => setFormData({ ...formData, driverFare: Number(e.target.value) })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">청구요금</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.billingFare || ''}
                      onChange={(e) => setFormData({ ...formData, billingFare: Number(e.target.value) })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">노선 템플릿 ID (선택)</label>
                  <input
                    type="text"
                    placeholder="노선 템플릿 ID (선택사항)"
                    value={formData.routeTemplateId || ''}
                    onChange={(e) => setFormData({ ...formData, routeTemplateId: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">상차지 (선택)</label>
                    <input
                      type="text"
                      placeholder="상차지"
                      value={formData.loadingPoint || ''}
                      onChange={(e) => setFormData({ ...formData, loadingPoint: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">하차지 (선택)</label>
                    <input
                      type="text"
                      placeholder="하차지"
                      value={formData.unloadingPoint || ''}
                      onChange={(e) => setFormData({ ...formData, unloadingPoint: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">비고</label>
                  <textarea
                    placeholder="비고사항"
                    value={formData.remarks || ''}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '등록 중...' : '운행 등록'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// 운행 수정 모달
function EditTripModal({ 
  isOpen, 
  onClose, 
  trip, 
  onSubmit, 
  isSubmitting 
}: { 
  isOpen: boolean
  onClose: () => void
  trip: TripResponse | null
  onSubmit: (id: string, data: UpdateTripData) => void
  isSubmitting: boolean
}) {
  const [formData, setFormData] = useState<Partial<UpdateTripData & {
    date: string;
    loadingPoint: string;
    unloadingPoint: string;
    driverFare: number | string;
    billingFare: number | string;
  }>>({})

  // trip이 변경될 때 폼 데이터 초기화
  React.useEffect(() => {
    if (trip) {
      setFormData({
        date: trip.date,
        driverId: trip.driver.id,
        vehicleId: trip.vehicle.id,
        routeTemplateId: trip.routeTemplate?.id || undefined,
        loadingPoint: trip.customRoute?.loadingPoint || undefined,
        unloadingPoint: trip.customRoute?.unloadingPoint || undefined,
        driverFare: Number(trip.driverFare),
        billingFare: Number(trip.billingFare),
        remarks: trip.remarks || undefined
      })
    }
  }, [trip])

  if (!isOpen || !trip) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.date || !formData.driverId || !formData.vehicleId || !Number(formData.driverFare) || !Number(formData.billingFare)) {
      toast.error('필수 필드를 모두 입력해주세요')
      return
    }
    onSubmit(trip.id, {
      ...formData,
      driverFare: Number(formData.driverFare),
      billingFare: Number(formData.billingFare)
    } as UpdateTripData)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">운행 수정</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">운행일</label>
                  <input
                    type="date"
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">기사 ID</label>
                  <input
                    type="text"
                    value={formData.driverId || ''}
                    onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">차량 ID</label>
                  <input
                    type="text"
                    value={formData.vehicleId || ''}
                    onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">기사요금</label>
                    <input
                      type="number"
                      value={formData.driverFare || ''}
                      onChange={(e) => setFormData({ ...formData, driverFare: Number(e.target.value) })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">청구요금</label>
                    <input
                      type="number"
                      value={formData.billingFare || ''}
                      onChange={(e) => setFormData({ ...formData, billingFare: Number(e.target.value) })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">노선 템플릿 ID</label>
                  <input
                    type="text"
                    value={formData.routeTemplateId || ''}
                    onChange={(e) => setFormData({ ...formData, routeTemplateId: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">상차지</label>
                    <input
                      type="text"
                      value={formData.loadingPoint || ''}
                      onChange={(e) => setFormData({ ...formData, loadingPoint: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">하차지</label>
                    <input
                      type="text"
                      value={formData.unloadingPoint || ''}
                      onChange={(e) => setFormData({ ...formData, unloadingPoint: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">비고</label>
                  <textarea
                    value={formData.remarks || ''}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '수정 중...' : '운행 수정'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// 상태 변경 모달
function StatusChangeModal({ 
  isOpen, 
  onClose, 
  trip, 
  onSubmit, 
  isSubmitting 
}: { 
  isOpen: boolean
  onClose: () => void
  trip: TripResponse | null
  onSubmit: (id: string, data: any) => void
  isSubmitting: boolean
}) {
  const [status, setStatus] = useState<'COMPLETED' | 'ABSENCE' | 'SUBSTITUTE'>('COMPLETED')
  const [absenceReason, setAbsenceReason] = useState('')
  const [substituteDriverId, setSubstituteDriverId] = useState('')
  const [substituteFare, setSubstituteFare] = useState('')
  const [deductionAmount, setDeductionAmount] = useState('')
  const [remarks, setRemarks] = useState('')

  if (!isOpen || !trip) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const data: any = { status, remarks }
    
    if (status === 'ABSENCE' && !absenceReason) {
      toast.error('결행 사유를 입력해주세요')
      return
    }
    if (status === 'SUBSTITUTE' && (!substituteDriverId || !substituteFare)) {
      toast.error('대차 기사와 대차 요금을 입력해주세요')
      return
    }
    
    if (status === 'ABSENCE') {
      data.absenceReason = absenceReason
      if (deductionAmount) data.deductionAmount = parseInt(deductionAmount)
    }
    
    if (status === 'SUBSTITUTE') {
      data.substituteDriverId = substituteDriverId
      data.substituteFare = parseInt(substituteFare)
      if (deductionAmount) data.deductionAmount = parseInt(deductionAmount)
    }
    
    onSubmit(trip.id, data)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">운행 상태 변경</h3>
                <p className="mt-1 text-sm text-gray-600">
                  {trip.driver.name} - {new Date(trip.date).toLocaleDateString('ko-KR')}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="COMPLETED"
                        checked={status === 'COMPLETED'}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className="mr-2"
                      />
                      <span className="text-sm">완료</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="ABSENCE"
                        checked={status === 'ABSENCE'}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className="mr-2"
                      />
                      <span className="text-sm">결행</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="SUBSTITUTE"
                        checked={status === 'SUBSTITUTE'}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className="mr-2"
                      />
                      <span className="text-sm">대차</span>
                    </label>
                  </div>
                </div>

                {status === 'ABSENCE' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">결행 사유</label>
                    <input
                      type="text"
                      value={absenceReason}
                      onChange={(e) => setAbsenceReason(e.target.value)}
                      placeholder="결행 사유를 입력하세요"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                )}

                {status === 'SUBSTITUTE' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">대차 기사 ID</label>
                      <input
                        type="text"
                        value={substituteDriverId}
                        onChange={(e) => setSubstituteDriverId(e.target.value)}
                        placeholder="대차 기사 ID를 입력하세요"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">대차 요금</label>
                      <input
                        type="number"
                        value={substituteFare}
                        onChange={(e) => setSubstituteFare(e.target.value)}
                        placeholder="0"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </>
                )}

                {(status === 'ABSENCE' || status === 'SUBSTITUTE') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">공제액 (선택)</label>
                    <input
                      type="number"
                      value={deductionAmount}
                      onChange={(e) => setDeductionAmount(e.target.value)}
                      placeholder="0"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">비고</label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="추가 비고사항"
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '처리 중...' : '상태 변경'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function TripsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [status, setStatus] = useState<'SCHEDULED' | 'COMPLETED' | 'ABSENCE' | 'SUBSTITUTE' | ''>('')

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingTrip, setEditingTrip] = useState<TripResponse | null>(null)
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [statusChangingTrip, setStatusChangingTrip] = useState<TripResponse | null>(null)

  const { data, isLoading, error } = useTrips({ 
    page, 
    limit: 20, 
    search: search || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    status: status || undefined
  })

  const createMutation = useCreateTrip()
  const updateMutation = useUpdateTrip()
  const deleteMutation = useDeleteTrip()
  const statusMutation = useUpdateTripStatus()
  const completeMutation = useCompleteTrip()
  const exportMutation = useExportTrips()

  const handleEdit = (trip: TripResponse) => {
    setEditingTrip(trip)
    setEditModalOpen(true)
  }

  const handleDelete = (tripId: string, tripStatus: TripResponse['status']) => {
    if (!canDeleteTrip(tripStatus)) {
      toast.error('이 운행은 삭제할 수 없습니다')
      return
    }
    
    if (confirm('정말 이 운행을 삭제하시겠습니까?')) {
      deleteMutation.mutate(tripId)
    }
  }

  const handleStatusChange = (trip: TripResponse) => {
    setStatusChangingTrip(trip)
    setStatusModalOpen(true)
  }

  const handleComplete = (tripId: string) => {
    if (confirm('이 운행을 완료 처리하시겠습니까?')) {
      completeMutation.mutate(tripId)
    }
  }

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(parseInt(amount))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    })
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-2">오류가 발생했습니다</h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    )
  }

  // Define table columns
  const columns = [
    {
      key: 'date',
      header: '날짜',
      render: (date: string) => (
        <div className="text-sm text-gray-900">
          {formatDate(date)}
        </div>
      ),
    },
    {
      key: 'driver',
      header: '기사/차량',
      render: (value: any, trip: TripResponse) => (
        <div>
          <div className="flex items-center mb-1">
            <User className="h-3 w-3 mr-1 text-gray-400" />
            <span className="font-medium text-gray-900">{trip.driver.name}</span>
          </div>
          <div className="text-xs text-gray-500">{trip.driver.phone}</div>
          <div className="flex items-center text-xs text-gray-400 mt-1">
            <Truck className="h-3 w-3 mr-1" />
            <span>{trip.vehicle.plateNumber} ({trip.vehicle.vehicleType})</span>
          </div>
        </div>
      ),
    },
    {
      key: 'route',
      header: '노선',
      render: (value: any, trip: TripResponse) => (
        trip.routeTemplate ? (
          <div>
            <div className="font-medium text-gray-900">{trip.routeTemplate.name}</div>
            <div className="text-xs text-gray-500 mt-1">
              {trip.routeTemplate.loadingPoint} → {trip.routeTemplate.unloadingPoint}
            </div>
          </div>
        ) : trip.customRoute ? (
          <div>
            <div className="font-medium text-gray-900">커스텀</div>
            <div className="text-xs text-gray-500 mt-1">
              {trip.customRoute.loadingPoint} → {trip.customRoute.unloadingPoint}
            </div>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )
      ),
    },
    {
      key: 'fare',
      header: '운임',
      render: (value: any, trip: TripResponse) => (
        <div>
          <div className="font-medium text-gray-900">기사: {formatCurrency(trip.driverFare)}</div>
          <div className="text-gray-500 text-sm">청구: {formatCurrency(trip.billingFare)}</div>
          {trip.deductionAmount && (
            <div className="text-xs text-red-600 mt-1">
              차감: {formatCurrency(trip.deductionAmount)}
            </div>
          )}
          {trip.substituteFare && (
            <div className="text-xs text-orange-600 mt-1">
              대차: {formatCurrency(trip.substituteFare)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: '상태',
      render: (value: any, trip: TripResponse) => (
        <div>
          <StatusBadge status={trip.status} />
          {trip.absenceReason && (
            <div className="text-xs text-red-600 mt-1">
              {trip.absenceReason}
            </div>
          )}
          {trip.substituteDriver && (
            <div className="text-xs text-orange-600 mt-1">
              대차: {trip.substituteDriver.name}
            </div>
          )}
        </div>
      ),
    },
  ]

  // Define table actions
  const actions = [
    {
      icon: <CheckCircle />,
      label: '완료 처리',
      onClick: (trip: TripResponse) => handleComplete(trip.id),
      variant: 'success' as const,
      show: (trip: TripResponse) => trip.status === 'SCHEDULED',
    },
    {
      icon: <RefreshCw />,
      label: '상태 변경',
      onClick: (trip: TripResponse) => handleStatusChange(trip),
    },
    commonActions.edit(
      (trip: TripResponse) => handleEdit(trip),
      (trip: TripResponse) => canEditTrip(trip.status)
    ),
    commonActions.delete(
      (trip: TripResponse) => handleDelete(trip.id, trip.status),
      (trip: TripResponse) => canDeleteTrip(trip.status)
    ),
  ]

  return (
    <ManagementPageLayout
      title="운행 관리"
      subtitle="운행 일정을 등록하고 관리합니다"
      icon={<Calendar />}
      totalCount={data?.pagination?.total}
      countLabel="건"
      primaryAction={{
        label: '운행 등록',
        onClick: () => setCreateModalOpen(true),
        icon: <Plus className="h-4 w-4" />,
      }}
      secondaryActions={[{
        label: 'CSV 가져오기',
        href: '/import/trips',
        icon: <Upload className="h-4 w-4" />,
      }]}
      exportAction={{
        label: '목록 내보내기',
        onClick: (format) => exportMutation.mutate(format),
        loading: exportMutation.isPending,
      }}
      searchFilters={[
        {
          label: '검색',
          type: 'text',
          value: search,
          onChange: setSearch,
          placeholder: '기사명, 차량번호, 노선으로 검색...',
        },
        {
          label: '시작일',
          type: 'date',
          value: dateFrom,
          onChange: setDateFrom,
        },
        {
          label: '종료일',
          type: 'date',
          value: dateTo,
          onChange: setDateTo,
        },
        {
          label: '상태',
          type: 'select',
          value: status,
          onChange: setStatus,
          options: [
            { value: 'SCHEDULED', label: '예정' },
            { value: 'COMPLETED', label: '완료' },
            { value: 'ABSENCE', label: '결행' },
            { value: 'SUBSTITUTE', label: '대차' },
          ],
        },
      ]}
      isLoading={isLoading}
      error={error instanceof Error ? error.message : undefined}
    >
      <DataTable
        data={data?.trips || []}
        columns={columns}
        actions={actions}
        pagination={data?.pagination}
        onPageChange={setPage}
        emptyState={{
          icon: <Calendar />,
          title: '등록된 운행이 없습니다',
          description: '새로운 운행을 등록해보세요.',
          action: {
            label: '운행 등록',
            onClick: () => setCreateModalOpen(true),
          },
        }}
        isLoading={isLoading}
      />

      {/* 모달 컴포넌트들 */}
      <CreateTripModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={(data) => {
          createMutation.mutate(data)
          setCreateModalOpen(false)
        }}
        isSubmitting={createMutation.isPending}
      />

      <EditTripModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setEditingTrip(null)
        }}
        trip={editingTrip}
        onSubmit={(id, data) => {
          updateMutation.mutate({ id, data })
          setEditModalOpen(false)
          setEditingTrip(null)
        }}
        isSubmitting={updateMutation.isPending}
      />

      <StatusChangeModal
        isOpen={statusModalOpen}
        onClose={() => {
          setStatusModalOpen(false)
          setStatusChangingTrip(null)
        }}
        trip={statusChangingTrip}
        onSubmit={(id, data) => {
          statusMutation.mutate({ id, data })
          setStatusModalOpen(false)
          setStatusChangingTrip(null)
        }}
        isSubmitting={statusMutation.isPending}
      />
    </ManagementPageLayout>
  )
}