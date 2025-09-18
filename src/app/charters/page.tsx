'use client'

import React, { useState } from 'react'
import { RequestList } from '@/components/requests/RequestList'
import { RequestForm } from '@/components/requests/RequestForm'
import { RequestDetail } from '@/components/requests/RequestDetail'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, TruckIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Request {
  id: string
  requestDate: string
  centerCarNo: string
  vehicleTon: number
  regions: string[]
  stops: number
  extraAdjustment: number
  dispatches: Array<{
    id: string
    driverName: string
    driverFee: number
  }>
  financialSummary: {
    centerBilling: number
    totalDriverFees: number
    totalMargin: number
    marginPercentage: number
    dispatchCount: number
  }
}

type ViewMode = 'list' | 'create' | 'detail' | 'edit'

function ChartersPageContent() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const handleCreateNew = () => {
    setShowCreateDialog(true)
  }

  const handleViewRequest = (request: Request) => {
    setSelectedRequest(request)
    setViewMode('detail')
  }

  const handleEditRequest = (request: Request) => {
    setSelectedRequest(request)
    setViewMode('edit')
  }

  const handleCreateSubmit = async (data: any) => {
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast.success('용차 요청이 생성되었습니다')
        setShowCreateDialog(false)
        // Refresh list
        window.location.reload()
      } else {
        const error = await response.json()
        toast.error(error.error || '생성에 실패했습니다')
      }
    } catch (error) {
      console.error('Create request failed:', error)
      toast.error('생성 중 오류가 발생했습니다')
    }
  }

  const handleAddDispatch = async (data: any) => {
    if (!selectedRequest) return

    try {
      const response = await fetch(`/api/requests/${selectedRequest.id}/dispatches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast.success('배차가 추가되었습니다')
        // Refresh current request
        const updatedResponse = await fetch(`/api/requests/${selectedRequest.id}`)
        const updatedRequest = await updatedResponse.json()
        setSelectedRequest(updatedRequest)
      } else {
        const error = await response.json()
        toast.error(error.error || '배차 추가에 실패했습니다')
      }
    } catch (error) {
      console.error('Add dispatch failed:', error)
      toast.error('배차 추가 중 오류가 발생했습니다')
    }
  }

  const handleEditDispatch = async (dispatchId: string, data: any) => {
    try {
      const response = await fetch(`/api/dispatches/${dispatchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast.success('배차가 수정되었습니다')
        // Refresh current request
        if (selectedRequest) {
          const updatedResponse = await fetch(`/api/requests/${selectedRequest.id}`)
          const updatedRequest = await updatedResponse.json()
          setSelectedRequest(updatedRequest)
        }
      } else {
        const error = await response.json()
        toast.error(error.error || '배차 수정에 실패했습니다')
      }
    } catch (error) {
      console.error('Edit dispatch failed:', error)
      toast.error('배차 수정 중 오류가 발생했습니다')
    }
  }

  const handleDeleteDispatch = async (dispatchId: string) => {
    try {
      const response = await fetch(`/api/dispatches/${dispatchId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('배차가 삭제되었습니다')
        // Refresh current request
        if (selectedRequest) {
          const updatedResponse = await fetch(`/api/requests/${selectedRequest.id}`)
          const updatedRequest = await updatedResponse.json()
          setSelectedRequest(updatedRequest)
        }
      } else {
        const error = await response.json()
        toast.error(error.error || '배차 삭제에 실패했습니다')
      }
    } catch (error) {
      console.error('Delete dispatch failed:', error)
      toast.error('배차 삭제 중 오류가 발생했습니다')
    }
  }

  const handleExportSelected = async (requestIds: string[]) => {
    try {
      const response = await fetch('/api/requests/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestIds }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `charter_requests_${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        toast.success('내보내기가 완료되었습니다')
      } else {
        toast.error('내보내기에 실패했습니다')
      }
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('내보내기 중 오류가 발생했습니다')
    }
  }

  const handleBack = () => {
    setViewMode('list')
    setSelectedRequest(null)
  }

  const handleEdit = () => {
    setViewMode('edit')
  }

  const handleCopy = () => {
    if (selectedRequest) {
      setShowCreateDialog(true)
      // TODO: Pre-fill form with selected request data
    }
  }

  const handleDelete = async () => {
    if (!selectedRequest) return

    if (confirm('정말로 이 요청을 삭제하시겠습니까?')) {
      try {
        const response = await fetch(`/api/requests/${selectedRequest.id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          toast.success('요청이 삭제되었습니다')
          setViewMode('list')
          setSelectedRequest(null)
        } else {
          const error = await response.json()
          toast.error(error.error || '삭제에 실패했습니다')
        }
      } catch (error) {
        console.error('Delete request failed:', error)
        toast.error('삭제 중 오류가 발생했습니다')
      }
    }
  }

  if (viewMode === 'detail' && selectedRequest) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button variant="outline" onClick={handleBack} className="mb-4">
            ← 목록으로 돌아가기
          </Button>
        </div>
        <RequestDetail
          request={selectedRequest}
          onEdit={handleEdit}
          onCopy={handleCopy}
          onDelete={handleDelete}
          onAddDispatch={handleAddDispatch}
          onEditDispatch={handleEditDispatch}
          onDeleteDispatch={handleDeleteDispatch}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <TruckIcon className="h-8 w-8 text-blue-600" />
              용차 관리
            </h1>
            <p className="text-gray-600 mt-2">
              요청/배차 기반의 새로운 용차 관리 시스템
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <RequestList
        onCreateNew={handleCreateNew}
        onViewRequest={handleViewRequest}
        onEditRequest={handleEditRequest}
        onExportSelected={handleExportSelected}
      />

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>새 용차 요청 생성</DialogTitle>
          </DialogHeader>
          <RequestForm
            onSubmit={handleCreateSubmit}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ChartersPage() {
  return <ChartersPageContent />
}
