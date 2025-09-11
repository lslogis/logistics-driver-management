'use client'

import React, { useState } from 'react'
import { Plus, Search, Edit, Trash2, Phone, User, Building, CreditCard, Upload } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { DriverResponse, CreateDriverData, UpdateDriverData } from '@/lib/validations/driver'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'

// 기사 목록 조회
function useDrivers(search?: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['drivers', search, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search })
      })
      
      const response = await fetch(`/api/drivers?${params}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to fetch drivers')
      }
      
      return result.data
    },
    staleTime: 30000, // 30초 동안 fresh
    retry: 2
  })
}

// 기사 생성 뮤테이션
function useCreateDriver() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateDriverData) => {
      const response = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to create driver')
      }
      
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      toast.success('기사가 등록되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 기사 수정 뮤테이션
function useUpdateDriver() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateDriverData }) => {
      const response = await fetch(`/api/drivers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to update driver')
      }
      
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      toast.success('기사 정보가 수정되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 기사 삭제 뮤테이션
function useDeleteDriver() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/drivers/${id}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to delete driver')
      }
      
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      toast.success('기사가 비활성화되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 기사 폼 컴포넌트
interface DriverFormProps {
  driver?: DriverResponse
  onSubmit: (data: any) => void
  isLoading: boolean
  onCancel: () => void
}

function DriverForm({ driver, onSubmit, isLoading, onCancel }: DriverFormProps) {
  const [formData, setFormData] = useState({
    name: driver?.name || '',
    phone: driver?.phone || '',
    email: driver?.email || '',
    businessNumber: driver?.businessNumber || '',
    companyName: driver?.companyName || '',
    representativeName: driver?.representativeName || '',
    bankName: driver?.bankName || '',
    accountNumber: driver?.accountNumber || '',
    remarks: driver?.remarks || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">이름 *</Label>
          <Input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="phone">전화번호 *</Label>
          <Input
            type="tel"
            id="phone"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="010-1234-5678"
          />
        </div>

        <div>
          <Label htmlFor="email">이메일</Label>
          <Input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="businessNumber">사업자등록번호</Label>
          <Input
            type="text"
            id="businessNumber"
            value={formData.businessNumber}
            onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
            placeholder="000-00-00000"
          />
        </div>

        <div>
          <Label htmlFor="companyName">회사명</Label>
          <Input
            type="text"
            id="companyName"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="representativeName">대표자명</Label>
          <Input
            type="text"
            id="representativeName"
            value={formData.representativeName}
            onChange={(e) => setFormData({ ...formData, representativeName: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="bankName">은행명</Label>
          <Input
            type="text"
            id="bankName"
            value={formData.bankName}
            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="accountNumber">계좌번호</Label>
          <Input
            type="text"
            id="accountNumber"
            value={formData.accountNumber}
            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="remarks">비고</Label>
        <textarea
          id="remarks"
          rows={3}
          value={formData.remarks}
          onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '처리 중...' : driver ? '수정' : '등록'}
        </Button>
      </div>
    </form>
  )
}

// 메인 DriversPage 컴포넌트
export default function DriversPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingDriver, setEditingDriver] = useState<DriverResponse | null>(null)

  const { data: driversData, isLoading, error } = useDrivers(searchTerm)
  const createMutation = useCreateDriver()
  const updateMutation = useUpdateDriver()
  const deleteMutation = useDeleteDriver()

  const handleCreateSubmit = (data: CreateDriverData) => {
    createMutation.mutate(data, {
      onSuccess: () => setIsCreateModalOpen(false)
    })
  }

  const handleUpdateSubmit = (data: UpdateDriverData) => {
    if (!editingDriver) return
    
    updateMutation.mutate(
      { id: editingDriver.id, data },
      {
        onSuccess: () => setEditingDriver(null)
      }
    )
  }

  const handleDelete = (id: string) => {
    if (window.confirm('정말로 이 기사를 비활성화하시겠습니까?')) {
      deleteMutation.mutate(id)
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">오류가 발생했습니다</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-slate-600 mb-4">
              {error instanceof Error ? error.message : '알 수 없는 오류'}
            </p>
            <Button onClick={() => window.location.reload()}>
              새로고침
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <User className="h-8 w-8 text-sky-600" />
          <div>
            <h1 className="text-3xl font-bold text-slate-900">기사 관리</h1>
            <p className="text-slate-600 mt-1">기사 정보를 등록하고 관리합니다</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" asChild>
            <Link href="/import/drivers">
              <Upload className="h-4 w-4 mr-2" />
              CSV 가져오기
            </Link>
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            기사 등록
          </Button>
        </div>
      </div>

      {/* 검색 */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="기사명, 전화번호, 회사명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* 기사 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>
            기사 목록
            {driversData?.pagination && (
              <span className="text-sm font-normal text-slate-600 ml-2">
                총 {driversData.pagination.total}명
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="text-slate-500">로딩 중...</div>
            </div>
          ) : !driversData?.drivers?.length ? (
            <div className="p-8 text-center">
              <User className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-2 text-sm font-medium text-slate-900">등록된 기사가 없습니다</h3>
              <p className="mt-1 text-sm text-slate-500">
                새로운 기사를 등록해보세요.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>기사 정보</TableHead>
                    <TableHead>연락처</TableHead>
                    <TableHead>회사 정보</TableHead>
                    <TableHead>은행 정보</TableHead>
                    <TableHead>통계</TableHead>
                    <TableHead className="w-20">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {driversData.drivers.map((driver: DriverResponse) => (
                    <TableRow key={driver.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-sky-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-sky-600" />
                          </div>
                          <div>
                            <div className="flex items-center">
                              <p className="font-medium text-slate-900">{driver.name}</p>
                              {!driver.isActive && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  비활성
                                </span>
                              )}
                            </div>
                            {driver.remarks && (
                              <p className="text-sm text-slate-500">{driver.remarks}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center text-slate-900">
                            <Phone className="h-3 w-3 mr-1" />
                            {driver.phone}
                          </div>
                          {driver.email && (
                            <div className="text-slate-500 mt-1">{driver.email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {driver.companyName && (
                            <div className="flex items-center text-slate-900">
                              <Building className="h-3 w-3 mr-1" />
                              {driver.companyName}
                            </div>
                          )}
                          {driver.representativeName && (
                            <div className="text-slate-500 mt-1">대표: {driver.representativeName}</div>
                          )}
                          {driver.businessNumber && (
                            <div className="text-slate-500 mt-1">사업자: {driver.businessNumber}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {driver.bankName && driver.accountNumber && (
                            <div className="flex items-center text-slate-900">
                              <CreditCard className="h-3 w-3 mr-1" />
                              {driver.bankName}
                            </div>
                          )}
                          {driver.accountNumber && (
                            <div className="text-slate-500 mt-1">{driver.accountNumber}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-slate-500">
                          <p>차량: {driver._count?.vehicles || 0}대</p>
                          <p>운행: {driver._count?.trips || 0}회</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingDriver(driver)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(driver.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 페이지네이션 */}
      {driversData?.pagination && driversData.pagination.totalPages > 1 && (
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-center">
              <p className="text-sm text-slate-700">
                총 <span className="font-medium">{driversData.pagination.total}</span>개 중{' '}
                <span className="font-medium">
                  {(driversData.pagination.page - 1) * driversData.pagination.limit + 1}
                </span>{' '}
                -{' '}
                <span className="font-medium">
                  {Math.min(
                    driversData.pagination.page * driversData.pagination.limit,
                    driversData.pagination.total
                  )}
                </span>{' '}
                개 표시
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 생성 모달 */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>기사 등록</DialogTitle>
            <DialogClose onClick={() => setIsCreateModalOpen(false)} />
          </DialogHeader>
          <DriverForm
            onSubmit={handleCreateSubmit}
            isLoading={createMutation.isPending}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* 수정 모달 */}
      <Dialog open={!!editingDriver} onOpenChange={(open) => !open && setEditingDriver(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>기사 정보 수정</DialogTitle>
            <DialogClose onClick={() => setEditingDriver(null)} />
          </DialogHeader>
          {editingDriver && (
            <DriverForm
              driver={editingDriver}
              onSubmit={handleUpdateSubmit}
              isLoading={updateMutation.isPending}
              onCancel={() => setEditingDriver(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}