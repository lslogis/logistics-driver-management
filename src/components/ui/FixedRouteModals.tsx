'use client'

import { useState, useEffect } from 'react'
import React from 'react'
import { X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import {
  CreateFixedRouteData,
  UpdateFixedRouteData,
  FixedRouteResponse,
  getWeekdayName,
  ContractType
} from '@/lib/validations/fixedRoute'
import DriverSelector from './DriverSelector'
import ContractTypeSelector from './ContractTypeSelector'
import VehicleTypeSelector from './VehicleTypeSelector'

// Create Modal Component
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
    isActive: true,
    contractType: 'DAILY'
  })

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.courseName || !formData.loadingPoint || !formData.vehicleType || 
        !formData.contractType || !formData.startDate || !formData.driverFare || 
        !formData.billingFare || !formData.weekdayPattern?.length) {
      toast.error('필수 필드를 모두 입력해주세요')
      return
    }
    
    if (formData.billingFare < formData.driverFare) {
      toast.error('청구운임은 기사운임보다 크거나 같아야 합니다')
      return
    }
    
    // Monthly/Complete contract validation
    if ((formData.contractType === 'MONTHLY' || formData.contractType === 'COMPLETE') && 
        (!formData.monthlyBaseFare || formData.monthlyBaseFare <= 0)) {
      toast.error('월별 및 지입 계약의 경우 월정액을 입력해주세요')
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

  const handleReset = () => {
    setFormData({
      weekdayPattern: [],
      isActive: true,
      contractType: 'DAILY'
    })
  }

  const isMonthlyOrComplete = formData.contractType === 'MONTHLY' || formData.contractType === 'COMPLETE'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
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
                  {/* Course Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      코스명 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="코스명을 입력하세요"
                      value={formData.courseName || ''}
                      onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* Loading Point */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      상차지 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="상차지를 입력하세요"
                      value={formData.loadingPoint || ''}
                      onChange={(e) => setFormData({ ...formData, loadingPoint: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* Vehicle Type */}
                  <VehicleTypeSelector
                    label="차종"
                    required
                    value={formData.vehicleType}
                    onChange={(vehicleType) => setFormData({ ...formData, vehicleType })}
                    placeholder="차종을 선택하세요"
                  />

                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      시작일 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.startDate || ''}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* Distance */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">거리 (선택)</label>
                    <input
                      type="number"
                      placeholder="km"
                      min="0"
                      max="2000"
                      step="0.1"
                      value={formData.distance || ''}
                      onChange={(e) => setFormData({ ...formData, distance: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Contract Type */}
                  <ContractTypeSelector
                    label="계약형태"
                    required
                    value={formData.contractType}
                    onChange={(contractType) => setFormData({ ...formData, contractType })}
                  />

                  {/* Driver Assignment */}
                  <DriverSelector
                    label="배정 기사 (선택)"
                    value={formData.assignedDriverId}
                    onChange={(driverId) => setFormData({ ...formData, assignedDriverId: driverId })}
                    placeholder="기사를 선택하세요"
                  />

                  {/* Weekday Pattern */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      운행요일 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[0, 1, 2, 3, 4, 5, 6].map((weekday) => (
                        <button
                          key={weekday}
                          type="button"
                          onClick={() => handleWeekdayToggle(weekday)}
                          className={`px-3 py-1 text-sm rounded ${
                            formData.weekdayPattern?.includes(weekday)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {getWeekdayName(weekday)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Fare Section - Full Width */}
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-4">운임 정보</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      기사운임 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      min="0"
                      max="10000000"
                      value={formData.driverFare || ''}
                      onChange={(e) => setFormData({ ...formData, driverFare: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      청구운임 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      min="0"
                      max="10000000"
                      value={formData.billingFare || ''}
                      onChange={(e) => setFormData({ ...formData, billingFare: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  {/* Monthly Base Fare - Conditional */}
                  <div className={isMonthlyOrComplete ? '' : 'opacity-50'}>
                    <label className="block text-sm font-medium text-gray-700">
                      월정액 {isMonthlyOrComplete && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      min="0"
                      max="50000000"
                      disabled={!isMonthlyOrComplete}
                      value={formData.monthlyBaseFare || ''}
                      onChange={(e) => setFormData({ ...formData, monthlyBaseFare: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                      required={isMonthlyOrComplete}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {isMonthlyOrComplete ? '월별/지입 계약 필수' : '회별 계약에서는 사용되지 않음'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">비고 (선택)</label>
                <textarea
                  placeholder="비고사항을 입력하세요"
                  rows={3}
                  value={formData.remarks || ''}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {(formData.remarks || '').length}/500자
                </p>
              </div>

              {/* Active Status */}
              <div className="mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive !== false}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">활성 상태</span>
                </label>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '등록 중...' : '고정노선 등록'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                초기화
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

// Edit Modal Component
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

  // Initialize form data when fixedRoute changes
  useEffect(() => {
    if (fixedRoute) {
      setFormData({
        courseName: fixedRoute.courseName,
        loadingPoint: fixedRoute.loadingPoint,
        vehicleType: fixedRoute.vehicleType,
        contractType: fixedRoute.contractType,
        assignedDriverId: fixedRoute.assignedDriverId || undefined,
        startDate: fixedRoute.startDate,
        weekdayPattern: fixedRoute.weekdayPattern,
        billingFare: parseInt(fixedRoute.billingFare),
        driverFare: parseInt(fixedRoute.driverFare),
        monthlyBaseFare: fixedRoute.monthlyBaseFare ? parseInt(fixedRoute.monthlyBaseFare) : undefined,
        distance: fixedRoute.distance || undefined,
        remarks: fixedRoute.remarks || undefined,
        isActive: fixedRoute.isActive
      })
    }
  }, [fixedRoute])

  if (!isOpen || !fixedRoute) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.courseName || !formData.loadingPoint || !formData.vehicleType || 
        !formData.contractType || !formData.startDate || !formData.driverFare || 
        !formData.billingFare || !formData.weekdayPattern?.length) {
      toast.error('필수 필드를 모두 입력해주세요')
      return
    }
    
    if (formData.billingFare && formData.driverFare && formData.billingFare < formData.driverFare) {
      toast.error('청구운임은 기사운임보다 크거나 같아야 합니다')
      return
    }
    
    // Monthly/Complete contract validation
    if ((formData.contractType === 'MONTHLY' || formData.contractType === 'COMPLETE') && 
        (!formData.monthlyBaseFare || formData.monthlyBaseFare <= 0)) {
      toast.error('월별 및 지입 계약의 경우 월정액을 입력해주세요')
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

  const isMonthlyOrComplete = formData.contractType === 'MONTHLY' || formData.contractType === 'COMPLETE'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
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
                  {/* Course Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      코스명 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.courseName || ''}
                      onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* Loading Point */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      상차지 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.loadingPoint || ''}
                      onChange={(e) => setFormData({ ...formData, loadingPoint: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* Vehicle Type */}
                  <VehicleTypeSelector
                    label="차종"
                    required
                    value={formData.vehicleType}
                    onChange={(vehicleType) => setFormData({ ...formData, vehicleType })}
                  />

                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      시작일 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.startDate || ''}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* Distance */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">거리</label>
                    <input
                      type="number"
                      min="0"
                      max="2000"
                      step="0.1"
                      value={formData.distance || ''}
                      onChange={(e) => setFormData({ ...formData, distance: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Contract Type */}
                  <ContractTypeSelector
                    label="계약형태"
                    required
                    value={formData.contractType}
                    onChange={(contractType) => setFormData({ ...formData, contractType })}
                  />

                  {/* Driver Assignment */}
                  <DriverSelector
                    label="배정 기사"
                    value={formData.assignedDriverId}
                    onChange={(driverId) => setFormData({ ...formData, assignedDriverId: driverId })}
                  />

                  {/* Weekday Pattern */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      운행요일 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[0, 1, 2, 3, 4, 5, 6].map((weekday) => (
                        <button
                          key={weekday}
                          type="button"
                          onClick={() => handleWeekdayToggle(weekday)}
                          className={`px-3 py-1 text-sm rounded ${
                            formData.weekdayPattern?.includes(weekday)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {getWeekdayName(weekday)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Fare Section - Full Width */}
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-4">운임 정보</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      기사운임 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10000000"
                      value={formData.driverFare || ''}
                      onChange={(e) => setFormData({ ...formData, driverFare: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      청구운임 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10000000"
                      value={formData.billingFare || ''}
                      onChange={(e) => setFormData({ ...formData, billingFare: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  {/* Monthly Base Fare - Conditional */}
                  <div className={isMonthlyOrComplete ? '' : 'opacity-50'}>
                    <label className="block text-sm font-medium text-gray-700">
                      월정액 {isMonthlyOrComplete && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50000000"
                      disabled={!isMonthlyOrComplete}
                      value={formData.monthlyBaseFare || ''}
                      onChange={(e) => setFormData({ ...formData, monthlyBaseFare: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                      required={isMonthlyOrComplete}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {isMonthlyOrComplete ? '월별/지입 계약 필수' : '회별 계약에서는 사용되지 않음'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">비고</label>
                <textarea
                  rows={3}
                  value={formData.remarks || ''}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {(formData.remarks || '').length}/500자
                </p>
              </div>

              {/* Active Status */}
              <div className="mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive !== false}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">활성 상태</span>
                </label>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '수정 중...' : '고정노선 수정'}
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