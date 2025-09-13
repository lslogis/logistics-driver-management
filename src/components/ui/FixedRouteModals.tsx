'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, User, MapPin, CreditCard } from 'lucide-react'
import { toast } from 'react-hot-toast'
import {
  CreateFixedRouteData,
  UpdateFixedRouteData,
  FixedRouteResponse,
  ContractType,
  ContractTypeLabels,
  WeekdayLabels
} from '@/lib/validations/fixedRoute'

// Import actual hooks
import { useLoadingPoints } from '@/hooks/useLoadingPoints'
import { useDrivers } from '@/hooks/useDrivers'

// Create Modal
interface CreateFixedRouteModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateFixedRouteData) => void
  isSubmitting: boolean
}

export function CreateFixedRouteModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting
}: CreateFixedRouteModalProps) {
  const [formData, setFormData] = useState<Partial<CreateFixedRouteData>>({
    weekdayPattern: [],
    contractType: 'FIXED_DAILY',
  })

  const { data: loadingPointsData, isLoading: isLoadingPointsLoading } = useLoadingPoints()
  const { data: driversData, isLoading: isDriversLoading } = useDrivers('', 'active')
  
  // Extract all loading points and drivers from infinite query pages
  const loadingPoints = loadingPointsData?.pages?.flatMap(page => page.data || []) || []
  const drivers = driversData?.pages?.flatMap(page => page.data || []) || []

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.loadingPointId || !formData.routeName || !formData.contractType || !formData.weekdayPattern?.length) {
      toast.error('필수 필드를 모두 입력해주세요')
      return
    }

    // Check contract type specific fields
    const hasRequiredAmount = 
      (formData.contractType === 'CONSIGNED_MONTHLY' && formData.revenueMonthlyWithExpense && formData.costMonthlyWithExpense) ||
      (formData.contractType === 'FIXED_DAILY' && formData.revenueDaily && formData.costDaily) ||
      (formData.contractType === 'FIXED_MONTHLY' && formData.revenueMonthly && formData.costMonthly)

    if (!hasRequiredAmount) {
      toast.error('계약유형에 맞는 금액을 입력해주세요')
      return
    }
    
    onSubmit(formData as CreateFixedRouteData)
  }

  const handleWeekdayToggle = (weekday: number) => {
    const current = formData.weekdayPattern || []
    const isSelected = current.includes(weekday)
    
    if (isSelected) {
      setFormData({
        ...formData,
        weekdayPattern: current.filter(d => d !== weekday)
      })
    } else {
      setFormData({
        ...formData,
        weekdayPattern: [...current, weekday].sort()
      })
    }
  }

  return (
    <div className="fixed inset-0 md:left-64 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="fixed inset-0 md:left-64 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all max-w-4xl w-full max-h-[85vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">고정노선 등록</h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md bg-white text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Center Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      <MapPin className="inline h-4 w-4 mr-1" />
                      센터명 (정산 담당) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.loadingPointId || ''}
                      onChange={(e) => setFormData({ ...formData, loadingPointId: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">센터를 선택하세요</option>
                      {loadingPoints?.map((lp) => (
                        <option key={lp.id} value={lp.id}>
                          {lp.centerName} - {lp.loadingPointName}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-sm text-gray-500">
                      선택한 센터에서 이 고정노선의 정산을 담당합니다
                    </p>
                  </div>

                  {/* Route Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      노선명 (도착지) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.routeName || ''}
                      onChange={(e) => setFormData({ ...formData, routeName: e.target.value })}
                      placeholder="예: 서울-부산 정기노선"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* Assigned Driver */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      <User className="inline h-4 w-4 mr-1" />
                      배정기사
                    </label>
                    <select
                      value={formData.assignedDriverId || ''}
                      onChange={(e) => setFormData({ ...formData, assignedDriverId: e.target.value || undefined })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">기사를 선택하세요 (선택사항)</option>
                      {drivers?.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name} - {driver.vehicleNumber}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Contract Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <CreditCard className="inline h-4 w-4 mr-1" />
                      계약유형 <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {Object.entries(ContractTypeLabels).map(([value, label]) => (
                        <div key={value} className="flex items-center">
                          <input
                            id={`contract-${value}`}
                            type="radio"
                            name="contractType"
                            value={value}
                            checked={formData.contractType === value}
                            onChange={(e) => setFormData({ ...formData, contractType: e.target.value as ContractType })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <label htmlFor={`contract-${value}`} className="ml-2 text-sm text-gray-700">
                            {label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Weekdays */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      운행요일 <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-7 gap-2">
                      {Object.entries(WeekdayLabels).map(([weekdayIndex, day]) => (
                        <button
                          key={weekdayIndex}
                          type="button"
                          onClick={() => handleWeekdayToggle(Number(weekdayIndex))}
                          className={`p-2 text-sm rounded-md border ${
                            formData.weekdayPattern?.includes(Number(weekdayIndex))
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amount Fields - Conditional based on contract type */}
                  {formData.contractType === 'CONSIGNED_MONTHLY' && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">지입(월대+경비) 금액</h4>
                      <div>
                        <label className="block text-sm text-gray-600">매출가 (받는금액) *</label>
                        <input
                          type="number"
                          value={formData.revenueMonthlyWithExpense || ''}
                          onChange={(e) => setFormData({ ...formData, revenueMonthlyWithExpense: Number(e.target.value) || 0 })}
                          placeholder="원"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600">매입가 (주는금액) *</label>
                        <input
                          type="number"
                          value={formData.costMonthlyWithExpense || ''}
                          onChange={(e) => setFormData({ ...formData, costMonthlyWithExpense: Number(e.target.value) || 0 })}
                          placeholder="원"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                    </div>
                  )}

                  {formData.contractType === 'FIXED_DAILY' && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">고정(일대) 금액</h4>
                      <div>
                        <label className="block text-sm text-gray-600">매출가 (받는금액) *</label>
                        <input
                          type="number"
                          value={formData.revenueDaily || ''}
                          onChange={(e) => setFormData({ ...formData, revenueDaily: Number(e.target.value) || 0 })}
                          placeholder="원"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600">매입가 (주는금액) *</label>
                        <input
                          type="number"
                          value={formData.costDaily || ''}
                          onChange={(e) => setFormData({ ...formData, costDaily: Number(e.target.value) || 0 })}
                          placeholder="원"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                    </div>
                  )}

                  {formData.contractType === 'FIXED_MONTHLY' && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">고정(월대) 금액</h4>
                      <div>
                        <label className="block text-sm text-gray-600">매출가 (받는금액) *</label>
                        <input
                          type="number"
                          value={formData.revenueMonthly || ''}
                          onChange={(e) => setFormData({ ...formData, revenueMonthly: Number(e.target.value) || 0 })}
                          placeholder="원"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600">매입가 (주는금액) *</label>
                        <input
                          type="number"
                          value={formData.costMonthly || ''}
                          onChange={(e) => setFormData({ ...formData, costMonthly: Number(e.target.value) || 0 })}
                          placeholder="원"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                    </div>
                  )}

                  {/* Remarks */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      비고
                    </label>
                    <textarea
                      value={formData.remarks || ''}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="추가 정보나 특이사항을 입력하세요"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isSubmitting ? '등록 중...' : '등록'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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

// Edit Modal
interface EditFixedRouteModalProps {
  isOpen: boolean
  onClose: () => void
  fixedRoute: FixedRouteResponse | null
  onSubmit: (data: UpdateFixedRouteData) => void
  isSubmitting: boolean
}

export function EditFixedRouteModal({
  isOpen,
  onClose,
  fixedRoute,
  onSubmit,
  isSubmitting
}: EditFixedRouteModalProps) {
  const [formData, setFormData] = useState<Partial<UpdateFixedRouteData>>({})

  const { data: loadingPointsData, isLoading: isLoadingPointsLoading } = useLoadingPoints()
  const { data: driversData, isLoading: isDriversLoading } = useDrivers('', 'active')
  
  // Extract all loading points and drivers from infinite query pages
  const loadingPoints = loadingPointsData?.pages?.flatMap(page => page.data || []) || []
  const drivers = driversData?.pages?.flatMap(page => page.data || []) || []

  // Initialize form data when fixedRoute changes
  useEffect(() => {
    if (fixedRoute) {
      setFormData({
        loadingPointId: fixedRoute.loadingPointId,
        routeName: fixedRoute.routeName,
        assignedDriverId: fixedRoute.assignedDriverId || undefined,
        weekdayPattern: fixedRoute.weekdayPattern,
        contractType: fixedRoute.contractType,
        revenueMonthlyWithExpense: fixedRoute.revenueMonthlyWithExpense || 0,
        revenueDaily: fixedRoute.revenueDaily || 0,
        revenueMonthly: fixedRoute.revenueMonthly || 0,
        costMonthlyWithExpense: fixedRoute.costMonthlyWithExpense || 0,
        costDaily: fixedRoute.costDaily || 0,
        costMonthly: fixedRoute.costMonthly || 0,
        remarks: fixedRoute.remarks || undefined,
      })
    }
  }, [fixedRoute])

  if (!isOpen || !fixedRoute) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.loadingPointId || !formData.routeName || !formData.contractType || !formData.weekdayPattern?.length) {
      toast.error('필수 필드를 모두 입력해주세요')
      return
    }

    // Check contract type specific fields
    const hasRequiredAmount = 
      (formData.contractType === 'CONSIGNED_MONTHLY' && formData.revenueMonthlyWithExpense && formData.costMonthlyWithExpense) ||
      (formData.contractType === 'FIXED_DAILY' && formData.revenueDaily && formData.costDaily) ||
      (formData.contractType === 'FIXED_MONTHLY' && formData.revenueMonthly && formData.costMonthly)

    if (!hasRequiredAmount) {
      toast.error('계약유형에 맞는 금액을 입력해주세요')
      return
    }
    
    onSubmit(formData as UpdateFixedRouteData)
  }

  const handleWeekdayToggle = (weekday: number) => {
    const current = formData.weekdayPattern || []
    const isSelected = current.includes(weekday)
    
    if (isSelected) {
      setFormData({
        ...formData,
        weekdayPattern: current.filter(d => d !== weekday)
      })
    } else {
      setFormData({
        ...formData,
        weekdayPattern: [...current, weekday].sort()
      })
    }
  }

  return (
    <div className="fixed inset-0 md:left-64 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="fixed inset-0 md:left-64 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all max-w-4xl w-full max-h-[85vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">고정노선 수정</h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md bg-white text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Center Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      <MapPin className="inline h-4 w-4 mr-1" />
                      센터명 (정산 담당) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.loadingPointId || ''}
                      onChange={(e) => setFormData({ ...formData, loadingPointId: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">센터를 선택하세요</option>
                      {loadingPoints?.map((lp) => (
                        <option key={lp.id} value={lp.id}>
                          {lp.centerName} - {lp.loadingPointName}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-sm text-gray-500">
                      선택한 센터에서 이 고정노선의 정산을 담당합니다
                    </p>
                  </div>

                  {/* Route Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      노선명 (도착지) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.routeName || ''}
                      onChange={(e) => setFormData({ ...formData, routeName: e.target.value })}
                      placeholder="예: 서울-부산 정기노선"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* Assigned Driver */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      <User className="inline h-4 w-4 mr-1" />
                      배정기사
                    </label>
                    <select
                      value={formData.assignedDriverId || ''}
                      onChange={(e) => setFormData({ ...formData, assignedDriverId: e.target.value || undefined })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">기사를 선택하세요 (선택사항)</option>
                      {drivers?.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name} - {driver.vehicleNumber}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Contract Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <CreditCard className="inline h-4 w-4 mr-1" />
                      계약유형 <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {Object.entries(ContractTypeLabels).map(([value, label]) => (
                        <div key={value} className="flex items-center">
                          <input
                            id={`edit-contract-${value}`}
                            type="radio"
                            name="contractType"
                            value={value}
                            checked={formData.contractType === value}
                            onChange={(e) => setFormData({ ...formData, contractType: e.target.value as ContractType })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <label htmlFor={`edit-contract-${value}`} className="ml-2 text-sm text-gray-700">
                            {label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Weekdays */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      운행요일 <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-7 gap-2">
                      {Object.entries(WeekdayLabels).map(([weekdayIndex, day]) => (
                        <button
                          key={weekdayIndex}
                          type="button"
                          onClick={() => handleWeekdayToggle(Number(weekdayIndex))}
                          className={`p-2 text-sm rounded-md border ${
                            formData.weekdayPattern?.includes(Number(weekdayIndex))
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amount Fields - Conditional based on contract type */}
                  {formData.contractType === 'CONSIGNED_MONTHLY' && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">지입(월대+경비) 금액</h4>
                      <div>
                        <label className="block text-sm text-gray-600">매출가 (받는금액) *</label>
                        <input
                          type="number"
                          value={formData.revenueMonthlyWithExpense || ''}
                          onChange={(e) => setFormData({ ...formData, revenueMonthlyWithExpense: Number(e.target.value) || 0 })}
                          placeholder="원"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600">매입가 (주는금액) *</label>
                        <input
                          type="number"
                          value={formData.costMonthlyWithExpense || ''}
                          onChange={(e) => setFormData({ ...formData, costMonthlyWithExpense: Number(e.target.value) || 0 })}
                          placeholder="원"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                    </div>
                  )}

                  {formData.contractType === 'FIXED_DAILY' && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">고정(일대) 금액</h4>
                      <div>
                        <label className="block text-sm text-gray-600">매출가 (받는금액) *</label>
                        <input
                          type="number"
                          value={formData.revenueDaily || ''}
                          onChange={(e) => setFormData({ ...formData, revenueDaily: Number(e.target.value) || 0 })}
                          placeholder="원"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600">매입가 (주는금액) *</label>
                        <input
                          type="number"
                          value={formData.costDaily || ''}
                          onChange={(e) => setFormData({ ...formData, costDaily: Number(e.target.value) || 0 })}
                          placeholder="원"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                    </div>
                  )}

                  {formData.contractType === 'FIXED_MONTHLY' && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">고정(월대) 금액</h4>
                      <div>
                        <label className="block text-sm text-gray-600">매출가 (받는금액) *</label>
                        <input
                          type="number"
                          value={formData.revenueMonthly || ''}
                          onChange={(e) => setFormData({ ...formData, revenueMonthly: Number(e.target.value) || 0 })}
                          placeholder="원"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600">매입가 (주는금액) *</label>
                        <input
                          type="number"
                          value={formData.costMonthly || ''}
                          onChange={(e) => setFormData({ ...formData, costMonthly: Number(e.target.value) || 0 })}
                          placeholder="원"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                    </div>
                  )}

                  {/* Remarks */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      비고
                    </label>
                    <textarea
                      value={formData.remarks || ''}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="추가 정보나 특이사항을 입력하세요"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isSubmitting ? '수정 중...' : '수정'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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