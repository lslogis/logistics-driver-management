'use client'

import React, { useState, useEffect } from 'react'
import { Calculator, Plus, Upload, Download, BarChart3, Clock, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { RateMasterResponse, RateDetailResponse, CreateRateData, UpdateRateData } from '@/lib/validations/rate'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface RatesPageState {
  masters: RateMasterResponse[]
  selectedMaster: RateMasterResponse | null
  searchTerm: string
  tonnageFilter: string
  activeFilter: 'all' | 'active' | 'inactive'
  sortBy: 'centerName' | 'tonnage' | 'createdAt' | 'updatedAt'
  sortOrder: 'asc' | 'desc'
  isLoading: boolean
  error: string | null
}

export default function RatesPage() {
  const [state, setState] = useState<RatesPageState>({
    masters: [],
    selectedMaster: null,
    searchTerm: '',
    tonnageFilter: '',
    activeFilter: 'all',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    isLoading: true,
    error: null
  })

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)

  // Fetch rate masters
  useEffect(() => {
    fetchRateMasters()
  }, [state.searchTerm, state.tonnageFilter, state.activeFilter, state.sortBy, state.sortOrder])

  const fetchRateMasters = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const params = new URLSearchParams({
        page: '1',
        limit: '100',
        sortBy: state.sortBy,
        sortOrder: state.sortOrder
      })
      
      if (state.searchTerm) params.set('search', state.searchTerm)
      if (state.tonnageFilter) params.set('tonnage', state.tonnageFilter)
      if (state.activeFilter !== 'all') params.set('isActive', state.activeFilter === 'active' ? 'true' : 'false')

      const response = await fetch(`/api/rates?${params}`)
      const result = await response.json()

      if (result.ok) {
        setState(prev => ({
          ...prev,
          masters: result.data.rateMasters,
          isLoading: false
        }))
      } else {
        throw new Error(result.error.message)
      }
    } catch (error) {
      console.error('Failed to fetch rate masters:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '데이터를 불러오는데 실패했습니다',
        isLoading: false
      }))
    }
  }

  const handleMasterSelect = (master: RateMasterResponse) => {
    setState(prev => ({ ...prev, selectedMaster: master }))
  }

  const handleCreateRate = async (data: CreateRateData) => {
    try {
      const response = await fetch('/api/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      
      if (result.ok) {
        toast.success('요금표가 생성되었습니다')
        setCreateModalOpen(false)
        fetchRateMasters()
      } else {
        throw new Error(result.error.message)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '요금표 생성에 실패했습니다')
    }
  }

  const filteredAndSortedMasters = state.masters

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-12 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-slate-900 bg-clip-text text-transparent">
                요금 관리
              </h1>
              <p className="text-slate-600 mt-2 text-sm">
                센터별 운송요금 및 요금 계산 시스템 관리
              </p>
            </div>
            
            {/* Fixed Action Bar */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => {/* Import logic */}}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                가져오기
              </Button>
              <Button
                variant="outline"
                onClick={() => {/* Export logic */}}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                내보내기
              </Button>
              <Button
                onClick={() => setCreateModalOpen(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                요금표 생성
              </Button>
            </div>
          </div>
        </div>

        {/* Master/Detail Split Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Left Panel: Masters List */}
          <div className="xl:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">요금표 목록</h2>
              
              {/* Search and Filters */}
              <div className="space-y-4">
                <Input
                  placeholder="센터명으로 검색..."
                  value={state.searchTerm}
                  onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="h-10"
                />
                
                <div className="flex gap-3">
                  <Select value={state.tonnageFilter || ''} onValueChange={(value) => setState(prev => ({ ...prev, tonnageFilter: value === '__all__' ? '' : value }))}>
                    <SelectTrigger className="flex-1 h-10">
                      <SelectValue placeholder="톤수 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">전체</SelectItem>
                      <SelectItem value="1">1톤</SelectItem>
                      <SelectItem value="2.5">2.5톤</SelectItem>
                      <SelectItem value="5">5톤</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={state.activeFilter} onValueChange={(value: any) => setState(prev => ({ ...prev, activeFilter: value }))}>
                    <SelectTrigger className="flex-1 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="active">활성화</SelectItem>
                      <SelectItem value="inactive">비활성화</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {/* Masters List */}
            <div className="overflow-y-auto flex-1">
              {state.isLoading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-slate-500 mt-2">로딩 중...</p>
                </div>
              ) : filteredAndSortedMasters.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>등록된 요금표가 없습니다</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredAndSortedMasters.map((master) => (
                    <div
                      key={master.id}
                      onClick={() => handleMasterSelect(master)}
                      className={`p-4 cursor-pointer transition-colors hover:bg-slate-50 ${
                        state.selectedMaster?.id === master.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-slate-900">{master.centerName}</h3>
                            <Badge variant={master.isActive ? 'default' : 'secondary'}>
                              {master.isActive ? '활성' : '비활성'}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-1">{master.tonnage}톤</p>
                          <p className="text-xs text-slate-500">
                            요금 항목: {master.rateDetails.length}개
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Date(master.updatedAt).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm font-medium text-slate-900">
                            {master.rateDetails
                              .filter(detail => detail.type === 'BASE')
                              .reduce((sum, detail) => sum + Number(detail.amount), 0)
                              .toLocaleString()}원
                          </div>
                          <div className="text-xs text-slate-500">기본요금</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Right Panel: Details */}
          <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {state.selectedMaster ? (
              <Tabs defaultValue="details" className="h-full flex flex-col">
                <div className="px-6 py-4 border-b border-slate-200">
                  <TabsList>
                    <TabsTrigger value="details">요금 상세</TabsTrigger>
                    <TabsTrigger value="candidate">후보 대기열</TabsTrigger>
                  </TabsList>
                </div>
                
                <div className="flex-1 overflow-hidden">
                  <TabsContent value="details" className="h-full overflow-y-auto p-6">
                    <RateDetailView master={state.selectedMaster} onUpdate={fetchRateMasters} />
                  </TabsContent>
                  
                  <TabsContent value="candidate" className="h-full overflow-y-auto p-6">
                    <CandidateQueueView master={state.selectedMaster} />
                  </TabsContent>
                </div>
              </Tabs>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <Calculator className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-medium mb-2">요금표를 선택해주세요</p>
                  <p className="text-sm">좌측에서 요금표를 선택하면 상세 정보가 표시됩니다</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Create Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>새 요금표 생성</DialogTitle>
          </DialogHeader>
          <CreateRateForm onSubmit={handleCreateRate} onCancel={() => setCreateModalOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Rate Detail View Component
function RateDetailView({ master, onUpdate }: { master: RateMasterResponse; onUpdate: () => void }) {
  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-blue-900">{master.centerName}</h3>
          <div className="flex items-center gap-2">
            <Badge variant={master.isActive ? 'default' : 'secondary'}>
              {master.isActive ? '활성' : '비활성'}
            </Badge>
            <Button variant="outline" size="sm" className="text-blue-700 border-blue-300">
              편집
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-blue-600 font-medium">톤수</div>
            <div className="text-blue-900 font-bold text-lg">{master.tonnage}톤</div>
          </div>
          <div>
            <div className="text-blue-600 font-medium">요금 항목</div>
            <div className="text-blue-900 font-bold text-lg">{master.rateDetails.length}개</div>
          </div>
          <div>
            <div className="text-blue-600 font-medium">최근 수정</div>
            <div className="text-blue-900 font-bold text-lg">
              {new Date(master.updatedAt).toLocaleDateString('ko-KR')}
            </div>
          </div>
        </div>
      </div>
      
      {/* Rate Details */}
      <div className="space-y-4">
        <h4 className="font-semibold text-slate-900 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          요금 상세 내역
        </h4>
        
        <div className="space-y-3">
          {master.rateDetails.map((detail) => (
            <Card key={detail.id} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-medium text-slate-900">{getRateTypeDisplayName(detail.type)}</h5>
                      {detail.region && (
                        <Badge variant="outline" className="text-xs">{detail.region}</Badge>
                      )}
                      <Badge variant={detail.isActive ? 'default' : 'secondary'} className="text-xs">
                        {detail.isActive ? '활성' : '비활성'}
                      </Badge>
                    </div>
                    {detail.conditions && (
                      <p className="text-sm text-slate-600">{detail.conditions}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-slate-900">
                      {Number(detail.amount).toLocaleString()}원
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

// Candidate Queue View Component  
function CandidateQueueView({ master }: { master: RateMasterResponse }) {
  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <Clock className="h-16 w-16 mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">후보 대기열</h3>
        <p className="text-slate-600">아직 대기 중인 요금 변경 후보가 없습니다</p>
      </div>
    </div>
  )
}

// Create Rate Form Component
function CreateRateForm({ onSubmit, onCancel }: { onSubmit: (data: CreateRateData) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState<CreateRateData>({
    centerName: '',
    tonnage: 0,
    rateDetails: [
      {
        type: 'BASE' as const,
        amount: 0,
        isActive: true
      }
    ]
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="centerName">센터명 *</Label>
          <Input
            id="centerName"
            required
            value={formData.centerName}
            onChange={(e) => setFormData({ ...formData, centerName: e.target.value })}
            placeholder="쿠팡, 네이버, 이마트 등"
          />
        </div>
        <div>
          <Label htmlFor="tonnage">톤수 *</Label>
          <Input
            id="tonnage"
            type="number"
            step="0.5"
            required
            value={formData.tonnage || ''}
            onChange={(e) => setFormData({ ...formData, tonnage: Number(e.target.value) })}
            placeholder="1, 2.5, 5 등"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="baseAmount">기본요금 *</Label>
        <Input
          id="baseAmount"
          type="number"
          required
          value={formData.rateDetails[0]?.amount || ''}
          onChange={(e) => {
            const newRateDetails = [...formData.rateDetails]
            newRateDetails[0] = { ...newRateDetails[0], amount: Number(e.target.value) }
            setFormData({ ...formData, rateDetails: newRateDetails })
          }}
          placeholder="기본요금을 입력하세요"
        />
      </div>
      
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          생성하기
        </Button>
      </div>
    </form>
  )
}

// Helper function
function getRateTypeDisplayName(type: string): string {
  const names: Record<string, string> = {
    BASE: '기본요금',
    CALL_FEE: '콜비',
    WAYPOINT_FEE: '경유비', 
    SPECIAL: '특수요금'
  }
  return names[type] || type
}
