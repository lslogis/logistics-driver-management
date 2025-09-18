'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { Calculator, Plus, AlertCircle, Info, RefreshCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingPointSelector } from '@/components/ui/LoadingPointSelector'

// 타입 정의
export type CharterFormData = {
  loadingPointId: string
  /** @deprecated centerId는 loadingPointId로 대체되었습니다. 호환을 위해 유지됩니다. */
  centerId?: string
  vehicleType: string
  date: string
  destinations: Array<{
    region: string
    order: number
  }>
  isNegotiated: boolean
  negotiatedFare?: number
  baseFare?: number
  regionFare?: number
  stopFare?: number
  extraFare?: number
  totalFare: number
  driverId: string
  driverFare: number
  notes?: string
}

export type CharterFormProps = {
  onSubmit: (data: CharterFormData) => void
  isLoading: boolean
  onCancel: () => void
  initialData?: Partial<CharterFormData>
}

// 차량 타입 옵션
const VEHICLE_TYPES = [
  '1.0톤', '1.4톤', '2.5톤', '3.5톤', '3.5광',
  '5.0톤', '5축', '8.0톤', '11톤', '11.0톤', '14톤', '상온'
]

export default function CharterForm({ onSubmit, isLoading, onCancel, initialData }: CharterFormProps) {
  // 폼 상태
  const [formData, setFormData] = useState<Partial<CharterFormData>>(() => {
    const baseState: Partial<CharterFormData> = {
      date: new Date().toISOString().split('T')[0], // 오늘 날짜 기본값
      destinations: [],
      isNegotiated: false,
      totalFare: 0,
      driverFare: 0,
      ...initialData
    }

    if (!baseState.loadingPointId) {
      const legacyCenterId = (initialData as any)?.centerId
      if (legacyCenterId) {
        baseState.loadingPointId = legacyCenterId
      }
    }

    if (baseState.loadingPointId && !baseState.centerId) {
      baseState.centerId = baseState.loadingPointId
    }

    return baseState
  })

  // UI 상태
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showErrorSummary, setShowErrorSummary] = useState(false)
  
  // 데이터 로딩 상태
  const [drivers, setDrivers] = useState<Array<{id: string, name: string, phone: string, vehicleNumber: string}>>([])
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false)

  // 요금 계산 상태
  const [isCalculating, setIsCalculating] = useState(false)
  const [calculationResult, setCalculationResult] = useState<any>(null)
  const [calculationError, setCalculationError] = useState<string>('')
  const [showRateModal, setShowRateModal] = useState(false)
  const [missingRates, setMissingRates] = useState<string[]>([])

  // 지역 입력 상태
  const [regionInput, setRegionInput] = useState('')
  const [driverSearch, setDriverSearch] = useState('')
  const [showDriverDropdown, setShowDriverDropdown] = useState(false)

  // refs
  const driverDropdownRef = useRef<HTMLDivElement>(null)

  // 기사 검색
  const searchDrivers = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      setDrivers([])
      return
    }

    setIsLoadingDrivers(true)
    try {
      const response = await fetch(`/api/drivers?search=${encodeURIComponent(searchTerm)}&limit=10&isActive=true`)
      if (response.ok) {
        const data = await response.json()
        setDrivers(data.data?.drivers || [])
      }
    } catch (error) {
      console.error('Failed to search drivers:', error)
    } finally {
      setIsLoadingDrivers(false)
    }
  }, [])

  // 기사 검색 디바운스
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (driverSearch.length >= 2) {
        searchDrivers(driverSearch)
      } else {
        setDrivers([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [driverSearch, searchDrivers])

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (driverDropdownRef.current && !driverDropdownRef.current.contains(event.target as Node)) {
        setShowDriverDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 필드 변경 핸들러
  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => {
      const next = { ...prev, [name]: value }

      if (name === 'loadingPointId') {
        next.loadingPointId = value
        next.centerId = value
      }

      return next
    })
    
    // 에러 클리어
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // 지역 추가
  const addRegion = (region: string) => {
    if (!region.trim()) return
    
    const currentDestinations = formData.destinations || []
    const newOrder = currentDestinations.length + 1
    const newDestination = { region: region.trim(), order: newOrder }
    
    handleFieldChange('destinations', [...currentDestinations, newDestination])
    setRegionInput('')
  }

  // 지역 제거
  const removeRegion = (index: number) => {
    const currentDestinations = formData.destinations || []
    const newDestinations = currentDestinations
      .filter((_, i) => i !== index)
      .map((dest, i) => ({ ...dest, order: i + 1 })) // 순서 재정렬
    
    handleFieldChange('destinations', newDestinations)
  }

  // 지역 입력 핸들러
  const handleRegionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addRegion(regionInput)
    }
  }

  // 기사 선택
  const handleDriverSelect = (driver: {id: string, name: string, phone: string, vehicleNumber: string}) => {
    handleFieldChange('driverId', driver.id)
    setDriverSearch(driver.name)
    setShowDriverDropdown(false)
  }

  // 요금 계산
  const calculateFare = async () => {
    if (!formData.loadingPointId || !formData.vehicleType || !formData.destinations?.length) {
      toast.error('상차지, 차량타입, 목적지를 입력해주세요')
      return
    }

    setIsCalculating(true)
    setCalculationError('')

    try {
      const response = await fetch('/api/charters/requests/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loadingPointId: formData.loadingPointId,
          centerId: formData.loadingPointId, // backwards compatibility with center-based APIs
          vehicleType: formData.vehicleType,
          regions: formData.destinations.map(d => d.region),
          stopCount: formData.destinations.length,
          extras: {
            regionMove: 0, // 기본값, 추후 설정 가능
            stopExtra: 0,
            misc: 0
          },
          isNegotiated: formData.isNegotiated,
          negotiatedFare: formData.negotiatedFare
        })
      })

      const data = await response.json()

      if (response.ok) {
        setCalculationResult(data.data)
        
        // 계산된 값으로 폼 업데이트
        setFormData(prev => ({
          ...prev,
          baseFare: data.data.baseFare,
          regionFare: data.data.regionFare,
          stopFare: data.data.stopFare,
          extraFare: data.data.extraFare,
          totalFare: data.data.totalFare
        }))

        toast.success('요금이 계산되었습니다')
      } else if (response.status === 422) {
        // 요율 누락
        setCalculationError(data.error.message)
        setMissingRates(data.error.details?.missingRegions || [])
        setShowRateModal(true)
        
        // 부분 계산 결과 적용
        if (data.data) {
          setCalculationResult(data.data)
          setFormData(prev => ({
            ...prev,
            baseFare: data.data.baseFare,
            regionFare: data.data.regionFare,
            stopFare: data.data.stopFare,
            extraFare: data.data.extraFare,
            totalFare: data.data.totalFare
          }))
        }
      } else {
        setCalculationError(data.error?.message || '요금 계산 실패')
        toast.error(data.error?.message || '요금 계산에 실패했습니다')
      }
    } catch (error) {
      console.error('Calculate fare error:', error)
      setCalculationError('요금 계산 중 오류가 발생했습니다')
      toast.error('요금 계산 중 오류가 발생했습니다')
    } finally {
      setIsCalculating(false)
    }
  }

  // 협의금액 토글
  const handleNegotiatedToggle = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      isNegotiated: checked,
      negotiatedFare: checked ? prev.totalFare : undefined
    }))
  }

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 필수 필드 검증
    const newErrors: Record<string, string> = {}
    
    if (!formData.loadingPointId) newErrors.loadingPointId = '상차지는 필수입니다'
    if (!formData.vehicleType) newErrors.vehicleType = '차량타입은 필수입니다'
    if (!formData.date) newErrors.date = '운행일은 필수입니다'
    if (!formData.destinations?.length) newErrors.destinations = '목적지는 필수입니다'
    if (!formData.driverId) newErrors.driverId = '기사는 필수입니다'
    if (formData.totalFare === undefined || formData.totalFare < 0) newErrors.totalFare = '총 금액은 필수입니다'
    if (formData.driverFare === undefined || formData.driverFare < 0) newErrors.driverFare = '기사 금액은 필수입니다'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setShowErrorSummary(true)
      toast.error('필수 항목을 확인해주세요')
      return
    }

    try {
      await onSubmit(formData as CharterFormData)
    } catch (error) {
      // 에러는 부모 컴포넌트에서 처리
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 에러 요약 */}
        {showErrorSummary && Object.keys(errors).length > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-destructive mb-2">입력 오류</h4>
                <ul className="space-y-1 text-sm text-destructive">
                  {Object.entries(errors).map(([field, error]) => (
                    <li key={field}>• {error}</li>
                  ))}
                </ul>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowErrorSummary(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="date">운행일 *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date || ''}
                  onChange={(e) => handleFieldChange('date', e.target.value)}
                  className={errors.date ? 'border-destructive' : ''}
                />
                {errors.date && <p className="text-sm text-destructive mt-1">{errors.date}</p>}
              </div>

              <div>
                <Label htmlFor="loadingPointId">상차지 *</Label>
                <LoadingPointSelector
                  value={formData.loadingPointId || ''}
                  onValueChange={(value) => handleFieldChange('loadingPointId', value)}
                  className={errors.loadingPointId ? 'border-destructive' : ''}
                />
                {errors.loadingPointId && <p className="text-sm text-destructive mt-1">{errors.loadingPointId}</p>}
              </div>

              <div>
                <Label htmlFor="vehicleType">차량타입 *</Label>
                <Select
                  value={formData.vehicleType || ''}
                  onValueChange={(value) => handleFieldChange('vehicleType', value)}
                >
                  <SelectTrigger className={errors.vehicleType ? 'border-destructive' : ''}>
                    <SelectValue placeholder="차량타입 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.vehicleType && <p className="text-sm text-destructive mt-1">{errors.vehicleType}</p>}
              </div>
            </div>

            {/* 목적지 */}
            <div>
              <Label htmlFor="regionInput">목적지 *</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    id="regionInput"
                    value={regionInput}
                    onChange={(e) => setRegionInput(e.target.value)}
                    onKeyDown={handleRegionKeyDown}
                    placeholder="지역명 입력 후 Enter"
                    className={errors.destinations ? 'border-destructive' : ''}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addRegion(regionInput)}
                    disabled={!regionInput.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* 목적지 리스트 */}
                {formData.destinations && formData.destinations.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/50">
                    {formData.destinations.map((dest, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {dest.order}. {dest.region}
                        <button
                          type="button"
                          onClick={() => removeRegion(index)}
                          className="ml-1 hover:bg-secondary/80 rounded"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                {errors.destinations && <p className="text-sm text-destructive mt-1">{errors.destinations}</p>}
              </div>
            </div>

            {/* 기사 선택 */}
            <div className="relative" ref={driverDropdownRef}>
              <Label htmlFor="driverSearch">기사 *</Label>
              <Input
                id="driverSearch"
                value={driverSearch}
                onChange={(e) => {
                  setDriverSearch(e.target.value)
                  setShowDriverDropdown(true)
                }}
                onFocus={() => setShowDriverDropdown(true)}
                placeholder="기사명 검색"
                className={errors.driverId ? 'border-destructive' : ''}
              />
              
              {/* 기사 드롭다운 */}
              {showDriverDropdown && (driverSearch.length >= 2 || drivers.length > 0) && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {isLoadingDrivers ? (
                    <div className="p-3 text-center text-sm text-muted-foreground">검색 중...</div>
                  ) : drivers.length > 0 ? (
                    drivers.map((driver) => (
                      <button
                        key={driver.id}
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted focus:bg-muted focus:outline-none border-b last:border-b-0"
                        onClick={() => handleDriverSelect(driver)}
                      >
                        <div className="font-medium">{driver.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {driver.phone} • {driver.vehicleNumber}
                        </div>
                      </button>
                    ))
                  ) : driverSearch.length >= 2 ? (
                    <div className="p-3 text-center text-sm text-muted-foreground">검색 결과가 없습니다</div>
                  ) : null}
                </div>
              )}
              {errors.driverId && <p className="text-sm text-destructive mt-1">{errors.driverId}</p>}
            </div>
          </CardContent>
        </Card>

        {/* 요금 계산 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>요금 계산</CardTitle>
              <div className="flex items-center gap-2">
                {isCalculating && (
                  <Badge variant="secondary">계산중...</Badge>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={calculateFare}
                  disabled={isCalculating || !formData.loadingPointId || !formData.vehicleType || !formData.destinations?.length}
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  요금 계산
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 협의금액 토글 */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isNegotiated"
                checked={formData.isNegotiated || false}
                onCheckedChange={handleNegotiatedToggle}
              />
              <Label htmlFor="isNegotiated">협의금액 사용</Label>
            </div>

            {/* 협의금액 입력 */}
            {formData.isNegotiated && (
              <div>
                <Label htmlFor="negotiatedFare">협의금액</Label>
                <Input
                  id="negotiatedFare"
                  type="number"
                  value={formData.negotiatedFare || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0
                    setFormData(prev => ({
                      ...prev,
                      negotiatedFare: value,
                      totalFare: value
                    }))
                  }}
                  placeholder="협의금액 입력"
                />
              </div>
            )}

            {/* 계산 결과 */}
            {!formData.isNegotiated && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="baseFare">기본운임</Label>
                  <Input
                    id="baseFare"
                    type="number"
                    value={formData.baseFare || ''}
                    onChange={(e) => handleFieldChange('baseFare', parseInt(e.target.value) || 0)}
                    className={calculationResult ? 'bg-success/10' : ''}
                  />
                </div>

                <div>
                  <Label htmlFor="regionFare">지역이동비</Label>
                  <Input
                    id="regionFare"
                    type="number"
                    value={formData.regionFare || ''}
                    onChange={(e) => handleFieldChange('regionFare', parseInt(e.target.value) || 0)}
                    className={calculationResult ? 'bg-success/10' : ''}
                  />
                </div>

                <div>
                  <Label htmlFor="stopFare">콜비</Label>
                  <Input
                    id="stopFare"
                    type="number"
                    value={formData.stopFare || ''}
                    onChange={(e) => handleFieldChange('stopFare', parseInt(e.target.value) || 0)}
                    className={calculationResult ? 'bg-success/10' : ''}
                  />
                </div>

                <div>
                  <Label htmlFor="extraFare">기타비</Label>
                  <Input
                    id="extraFare"
                    type="number"
                    value={formData.extraFare || ''}
                    onChange={(e) => handleFieldChange('extraFare', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            )}

            {/* 총 금액 */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label htmlFor="totalFare" className="text-lg font-semibold">총 금액 *</Label>
                <Input
                  id="totalFare"
                  type="number"
                  value={formData.totalFare || ''}
                  onChange={(e) => handleFieldChange('totalFare', parseInt(e.target.value) || 0)}
                  className={`w-40 text-right font-bold ${errors.totalFare ? 'border-destructive' : calculationResult ? 'bg-success/10' : ''}`}
                  readOnly={formData.isNegotiated}
                />
              </div>
              {errors.totalFare && <p className="text-sm text-destructive mt-1">{errors.totalFare}</p>}
            </div>

            {/* 기사 금액 */}
            <div>
              <Label htmlFor="driverFare">기사 금액 *</Label>
              <Input
                id="driverFare"
                type="number"
                value={formData.driverFare || ''}
                onChange={(e) => handleFieldChange('driverFare', parseInt(e.target.value) || 0)}
                className={errors.driverFare ? 'border-destructive' : ''}
                placeholder="기사에게 지급할 금액"
              />
              {errors.driverFare && <p className="text-sm text-destructive mt-1">{errors.driverFare}</p>}
              
              {/* 마진 표시 */}
              {formData.totalFare && formData.driverFare && (
                <div className="mt-2 p-2 bg-muted rounded text-sm">
                  <span className="text-muted-foreground">마진: </span>
                  <span className={`font-medium ${(formData.totalFare - formData.driverFare) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(formData.totalFare - formData.driverFare).toLocaleString()}원
                  </span>
                </div>
              )}
            </div>

            {/* 비고 */}
            <div>
              <Label htmlFor="notes">비고</Label>
              <Input
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                placeholder="특이사항 입력"
              />
            </div>

            {/* 계산 오류 */}
            {calculationError && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm text-destructive">{calculationError}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 제출 버튼 */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            취소
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? '저장중...' : '용차 등록'}
          </Button>
        </div>
      </form>

      {/* 요율 등록 모달 placeholder */}
      {showRateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">요율 등록 필요</h3>
            <p className="text-sm text-muted-foreground mb-4">
              다음 지역의 요율이 등록되지 않았습니다:
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {missingRates.map((region) => (
                <Badge key={region} variant="destructive">{region}</Badge>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRateModal(false)}>
                닫기
              </Button>
              <Button onClick={() => {
                setShowRateModal(false)
                // 요율 등록 페이지로 이동하거나 모달 열기
              }}>
                요율 등록
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
