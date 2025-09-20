'use client'

import React, { useState, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Calculator, Upload, Download, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { SimpleCenterFareCreateModal } from '@/components/centerFares/SimpleCenterFareCreateModal'
import { SimpleCenterFareEditModal } from '@/components/centerFares/SimpleCenterFareEditModal'
import { SimpleCenterFareDeleteDialog } from '@/components/centerFares/SimpleCenterFareDeleteDialog'
import { SimpleFareCalculatorDrawer } from '@/components/centerFares/SimpleFareCalculatorDrawer'
const ImportModal = dynamic(() => import('@/components/import/ImportModal').then(mod => ({ default: mod.ImportModal })), {
  ssr: false,
  loading: () => <div>Loading...</div>
})
import { ExportButton } from '@/components/centerFares/ExportButton'
import { SimpleFiltersBar } from '@/components/centerFares/SimpleFiltersBar'
import { type FareRow } from '@/lib/utils/center-fares'
import { normalizeVehicleTypeName } from '@/lib/utils/vehicle-types'
import { useCenterFares, useCreateCenterFare, useUpdateCenterFare, useDeleteCenterFare } from '@/hooks/useCenterFares'
import { type CenterFareDto, type CreateCenterFareDto } from '@/lib/api/center-fares-api'

// DB 타입을 FareRow로 변환하는 어댑터 함수
const convertDbToFareRow = (dbRow: CenterFareDto): FareRow => {
  const centerName = dbRow.loadingPoint?.centerName ?? dbRow.centerName ?? ''

  const canonicalVehicleType = normalizeVehicleTypeName(dbRow.vehicleType) ?? dbRow.vehicleType

  return {
    id: dbRow.id,
    centerId: dbRow.loadingPointId,
    centerName,
    vehicleTypeId: canonicalVehicleType,
    vehicleTypeName: canonicalVehicleType,
    region: dbRow.region,
    fareType: dbRow.fareType === 'BASIC' ? '기본운임' : '경유운임',
    baseFare: dbRow.baseFare,
    extraStopFee: dbRow.extraStopFee,
    extraRegionFee: dbRow.extraRegionFee,
    createdAt: new Date(dbRow.createdAt).toISOString().slice(0, 10)
  }
}


// FareRow를 DB 생성 DTO로 변환하는 어댑터 함수
const convertFareRowToCreateDto = (fareRow: Omit<FareRow, 'id' | 'createdAt'>): CreateCenterFareDto => ({
  loadingPointId: fareRow.centerId,
  vehicleType: fareRow.vehicleTypeId,
  region: fareRow.fareType === '기본운임' ? (fareRow.region || '') : null,
  fareType: fareRow.fareType === '기본운임' ? 'BASIC' : 'STOP_FEE',
  baseFare: fareRow.baseFare,
  extraStopFee: fareRow.extraStopFee,
  extraRegionFee: fareRow.extraRegionFee
})

export default function CenterFaresPage() {
  // API 호출
  const queryClient = useQueryClient()
  const { data: centerFaresData, isLoading, error } = useCenterFares()
  const createMutation = useCreateCenterFare()
  const updateMutation = useUpdateCenterFare()
  const deleteMutation = useDeleteCenterFare()

  // DB 데이터를 FareRow로 변환
  const rows = useMemo(() => {
    if (!centerFaresData?.fares) return []
    return centerFaresData.fares.map(convertDbToFareRow)
  }, [centerFaresData])
  
  const [selectedRow, setSelectedRow] = useState<FareRow | null>(null)
  const [filters, setFilters] = useState<{ center?: string; fareType?: string; searchText?: string }>({})
  const [prefilledData, setPrefilledData] = useState<{
    centerId: string
    centerName: string
    vehicleTypeId: string
    vehicleTypeName: string
    region?: string
    fareType: '기본운임' | '경유운임'
  } | null>(null)

  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)
  const [openCalc, setOpenCalc] = useState(false)
  const [openImport, setOpenImport] = useState(false)

  // Filter and sort rows based on active filters
  const filteredRows = useMemo(() => {
    const filtered = rows.filter(row => {
      if (filters.center && row.centerName !== filters.center) return false
      if (filters.fareType && row.fareType !== filters.fareType) return false
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase()
        const matchesVehicleType = row.vehicleTypeName.toLowerCase().includes(searchLower)
        const matchesRegion = row.region ? row.region.toLowerCase().includes(searchLower) : false
        if (!matchesVehicleType && !matchesRegion) return false
      }
      return true
    })

    // 요율종류 → 센터명 → 차량톤수 → 지역 순서로 오름차순 정렬
    return filtered.sort((a, b) => {
      // 1. 요율종류 비교 (기본운임 < 경유운임)
      if (a.fareType !== b.fareType) {
        return a.fareType.localeCompare(b.fareType, 'ko')
      }

      // 2. 센터명 비교
      if (a.centerName !== b.centerName) {
        return a.centerName.localeCompare(b.centerName, 'ko')
      }

      // 3. 차량톤수 비교 (숫자 기준 정렬)
      if (a.vehicleTypeName !== b.vehicleTypeName) {
        // 차량톤수에서 숫자 부분만 추출하여 비교
        const getVehicleWeight = (vehicleType: string) => {
          const match = vehicleType.match(/(\d+(?:\.\d+)?)/)
          return match ? parseFloat(match[1]) : 0
        }
        const aWeight = getVehicleWeight(a.vehicleTypeName)
        const bWeight = getVehicleWeight(b.vehicleTypeName)
        if (aWeight !== bWeight) {
          return aWeight - bWeight
        }
        // 같은 톤수면 문자열로 비교 (예: 3.5톤 vs 3.5톤광폭)
        return a.vehicleTypeName.localeCompare(b.vehicleTypeName, 'ko')
      }

      // 4. 지역 비교 (null은 맨 앞으로)
      const aRegion = a.region || ''
      const bRegion = b.region || ''
      return aRegion.localeCompare(bRegion, 'ko')
    })
  }, [rows, filters])

  const handleCreate = async (row: FareRow) => {
    try {
      const createDto = convertFareRowToCreateDto(row)
      await createMutation.mutateAsync(createDto)
      toast.success('요율이 등록되었습니다')
      setPrefilledData(null)
    } catch (error) {
      console.error('요율 등록 실패:', error)
      toast.error('요율 등록에 실패했습니다')
    }
  }

  const handleOpenCreateWithData = (data: {
    centerId: string
    centerName: string
    vehicleTypeId: string
    vehicleTypeName: string
    region?: string
    fareType: '기본운임' | '경유운임'
  }) => {
    setPrefilledData(data)
    setOpenCreate(true)
  }

  const handleUpdate = async (updated: FareRow) => {
    try {
      const updateDto = convertFareRowToCreateDto(updated)
      await updateMutation.mutateAsync({ 
        id: updated.id, 
        data: updateDto 
      })
      toast.success('요율이 수정되었습니다')
    } catch (error) {
      console.error('요율 수정 실패:', error)
      toast.error('요율 수정에 실패했습니다')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('요율이 삭제되었습니다')
    } catch (error) {
      console.error('요율 삭제 실패:', error)
      toast.error('요율 삭제에 실패했습니다')
    }
  }

  const handleImportSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['centerFares'] })
    queryClient.invalidateQueries({ queryKey: ['centerBaseFares'] })
  }

  const handleFilterChange = (newFilters: { center?: string; fareType?: string; searchText?: string }) => {
    setFilters(newFilters)
  }

  // 로딩 상태 표시
  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="text-lg text-gray-600">요율 데이터를 불러오는 중...</span>
          </div>
        </div>
      </div>
    )
  }

  // 에러 상태 표시
  if (error) {
    return (
      <div className="flex-1 space-y-4 p-4 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="text-red-600 text-lg font-medium">
              데이터를 불러오는 중 오류가 발생했습니다
            </div>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="text-blue-600 hover:text-blue-700"
            >
              다시 시도
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
              <span className="text-2xl text-white">₩</span>
            </div>
            요율 관리
          </h1>
          <p className="text-lg text-gray-600 ml-16">
            센터별 차량 타입과 지역별 요율을 체계적으로 관리하고 계산합니다
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={() => setOpenCalc(true)}
            className="h-12 px-6 rounded-xl border-2 border-teal-200 text-teal-700 hover:bg-teal-50 hover:border-teal-300 transition-colors font-medium"
          >
            <Calculator className="h-5 w-5 mr-2" />
            요율 계산기
          </Button>
          
          <ExportButton />
          
          <Button 
            variant="outline"
            onClick={() => setOpenImport(true)}
            className="h-12 px-6 rounded-xl border-2 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-colors font-medium"
          >
            <Upload className="h-5 w-5 mr-2" />
            가져오기
          </Button>
          
          <Button 
            onClick={() => setOpenCreate(true)}
            className="h-12 px-6 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            새 요율 등록
          </Button>
        </div>
      </div>

      {/* Filters */}
      <SimpleFiltersBar onFilterChange={handleFilterChange} />

      {/* Table */}
      <Card className="border-0 shadow-xl bg-white rounded-2xl">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50 rounded-t-2xl p-6">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <span className="text-lg text-blue-600">📋</span>
              </div>
              요율 목록
            </div>
            <div className="text-sm font-normal text-gray-600">
              총 {filteredRows.length}개 항목 {filters.center || filters.fareType || filters.searchText ? '(필터 적용됨)' : ''}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0 rounded-lg">
                <tr>
                  <th className="px-6 py-3 font-semibold text-gray-900 text-center">센터명</th>
                  <th className="px-6 py-3 font-semibold text-gray-900 text-center">차량톤수</th>
                  <th className="px-6 py-3 font-semibold text-gray-900 text-center">지역</th>
                  <th className="px-6 py-3 font-semibold text-gray-900 text-center">요율종류</th>
                  <th className="px-6 py-3 font-semibold text-gray-900 text-right">기본운임</th>
                  <th className="px-6 py-3 font-semibold text-gray-900 text-right">경유운임</th>
                  <th className="px-6 py-3 font-semibold text-gray-900 text-right">지역운임</th>
                  <th className="px-6 py-3 font-semibold text-gray-900 text-center">작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500">
                      {filters.center || filters.fareType || filters.searchText
                        ? '필터 조건에 맞는 요율이 없습니다' 
                        : '등록된 요율이 없습니다'
                      }
                    </td>
                  </tr>
                )}
                {filteredRows.map(row => (
                  <tr key={row.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-center">{row.centerName}</td>
                    <td className="px-6 py-4 text-center">{row.vehicleTypeName}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {row.region || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        row.fareType === '기본운임' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {row.fareType}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-right">₩{row.baseFare?.toLocaleString() || 0}</td>
                    <td className="px-6 py-4 font-mono font-bold text-right">₩{row.extraStopFee?.toLocaleString() || 0}</td>
                    <td className="px-6 py-4 font-mono font-bold text-right">₩{row.extraRegionFee?.toLocaleString() || 0}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRow(row)
                            setOpenEdit(true)
                          }}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          수정
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRow(row)
                            setOpenDelete(true)
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          삭제
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modals & Drawers */}
      <SimpleCenterFareCreateModal 
        open={openCreate} 
        onOpenChange={setOpenCreate} 
        onSubmit={handleCreate} 
        prefilledData={prefilledData}
      />
      
      <SimpleCenterFareEditModal 
        open={openEdit} 
        onOpenChange={setOpenEdit} 
        row={selectedRow} 
        onSubmit={handleUpdate} 
      />
      
      <SimpleCenterFareDeleteDialog 
        open={openDelete} 
        onOpenChange={setOpenDelete} 
        row={selectedRow} 
        onDelete={handleDelete} 
      />
      
      <SimpleFareCalculatorDrawer 
        open={openCalc} 
        onOpenChange={setOpenCalc} 
        onOpenCreate={handleOpenCreateWithData}
      />
      
      <ImportModal 
        isOpen={openImport} 
        onClose={() => setOpenImport(false)} 
        type="center-fares"
        onSuccess={handleImportSuccess}
      />
    </div>
  )
}