'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Calculator, Upload, Download } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { SimpleCenterFareCreateModal } from '@/components/centerFares/SimpleCenterFareCreateModal'
import { SimpleCenterFareEditModal } from '@/components/centerFares/SimpleCenterFareEditModal'
import { SimpleCenterFareDeleteDialog } from '@/components/centerFares/SimpleCenterFareDeleteDialog'
import { SimpleFareCalculatorDrawer } from '@/components/centerFares/SimpleFareCalculatorDrawer'
import { SimpleImportModal } from '@/components/centerFares/SimpleImportModal'
import { ExportButton } from '@/components/centerFares/ExportButton'
import { SimpleFiltersBar } from '@/components/centerFares/SimpleFiltersBar'
import { type FareRow } from '@/lib/utils/center-fares'

export default function CenterFaresPage() {
  const [rows, setRows] = useState<FareRow[]>([])
  
  const [selectedRow, setSelectedRow] = useState<FareRow | null>(null)
  const [filters, setFilters] = useState<{ center?: string; fareType?: string }>({})

  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)
  const [openCalc, setOpenCalc] = useState(false)
  const [openImport, setOpenImport] = useState(false)

  // Filter rows based on active filters
  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      if (filters.center && row.centerName !== filters.center) return false
      if (filters.fareType && row.fareType !== filters.fareType) return false
      return true
    })
  }, [rows, filters])

  const handleCreate = (row: FareRow) => {
    setRows([...rows, row])
    toast.success('요율이 등록되었습니다')
  }

  const handleUpdate = (updated: FareRow) => {
    setRows(rows.map(r => (r.id === updated.id ? updated : r)))
    toast.success('요율이 수정되었습니다')
  }

  const handleDelete = (id: string) => {
    setRows(rows.filter(r => r.id !== id))
    toast.success('요율이 삭제되었습니다')
  }

  const handleImport = (imported: FareRow[]) => {
    setRows([...rows, ...imported])
    toast.success(`${imported.length}건 가져오기 완료`)
  }

  const handleFilterChange = (newFilters: { center?: string; fareType?: string }) => {
    setFilters(newFilters)
  }

  return (
    <div className="flex-1 space-y-8 p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
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
          
          <ExportButton rows={filteredRows} />
          
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
              총 {filteredRows.length}개 항목 {filters.center || filters.fareType ? '(필터 적용됨)' : ''}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 sticky top-0 rounded-lg">
                <tr>
                  <th className="px-6 py-3 font-semibold text-gray-900">센터명</th>
                  <th className="px-6 py-3 font-semibold text-gray-900">차량톤수</th>
                  <th className="px-6 py-3 font-semibold text-gray-900">지역</th>
                  <th className="px-6 py-3 font-semibold text-gray-900">요율종류</th>
                  <th className="px-6 py-3 font-semibold text-gray-900">기본운임</th>
                  <th className="px-6 py-3 font-semibold text-gray-900">경유운임</th>
                  <th className="px-6 py-3 font-semibold text-gray-900">지역운임</th>
                  <th className="px-6 py-3 font-semibold text-gray-900">등록일</th>
                  <th className="px-6 py-3 font-semibold text-gray-900">작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-gray-500">
                      {filters.center || filters.fareType 
                        ? '필터 조건에 맞는 요율이 없습니다' 
                        : '등록된 요율이 없습니다'
                      }
                    </td>
                  </tr>
                )}
                {filteredRows.map(row => (
                  <tr key={row.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium">{row.centerName}</td>
                    <td className="px-6 py-4">{row.vehicleTypeName}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {row.region}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        row.fareType === '기본운임' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {row.fareType}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono">₩{row.baseFare?.toLocaleString() || 0}</td>
                    <td className="px-6 py-4 font-mono">₩{row.extraStopFee?.toLocaleString() || 0}</td>
                    <td className="px-6 py-4 font-mono">₩{row.extraRegionFee?.toLocaleString() || 0}</td>
                    <td className="px-6 py-4 text-gray-600">{row.createdAt}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
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
        existingRows={rows}
      />
      
      <SimpleCenterFareEditModal 
        open={openEdit} 
        onOpenChange={setOpenEdit} 
        row={selectedRow} 
        onSubmit={handleUpdate} 
        existingRows={rows}
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
        rows={rows} 
      />
      
      <SimpleImportModal 
        open={openImport} 
        onOpenChange={setOpenImport} 
        onImport={handleImport} 
      />
    </div>
  )
}