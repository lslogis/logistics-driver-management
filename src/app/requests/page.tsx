'use client'

export const dynamic = 'force-dynamic'

import React, { useState } from 'react'
import { RequestList } from '@/components/requests/RequestList'
import NewRequestForm from '@/components/requests/NewRequestForm'
import { RequestDetail } from '@/components/requests/RequestDetail'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { TruckIcon, PlusIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Request } from '@/types'
import { requestsAPI } from '@/lib/api/requests'

type ViewMode = 'list' | 'create' | 'detail' | 'edit'

function RequestsPageContent() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const handleCreateNew = () => {
    setShowCreateDialog(true)
  }

  const handleViewRequest = (request: Request) => {
    setSelectedRequest(request)
    setViewMode('detail')
  }

  const handleEditRequest = (request: Request) => {
    setSelectedRequest(request)
    setShowEditDialog(true)
  }

  const refreshRequest = async (requestId: string) => {
    try {
      const refreshed = await requestsAPI.get(requestId)
      setSelectedRequest(refreshed)
    } catch (error) {
      console.error('Request refresh failed:', error)
      toast.error('요청 정보를 다시 불러오지 못했습니다')
    }
  }

  const handleCreateSubmit = async (data: any) => {
    try {
      await requestsAPI.create(data)
      toast.success('용차 요청이 생성되었습니다')
      setShowCreateDialog(false)
      window.location.reload()
    } catch (error: any) {
      console.error('Create request failed:', error)
      toast.error(error?.message || '생성 중 오류가 발생했습니다')
    }
  }

  const handleEditSubmit = async (data: any) => {
    if (!selectedRequest) return

    try {
      await requestsAPI.update(selectedRequest.id, data)
      toast.success('용차 요청이 수정되었습니다')
      setShowEditDialog(false)
      setSelectedRequest(null)
      window.location.reload()
    } catch (error: any) {
      console.error('Update request failed:', error)
      toast.error(error?.message || '수정 중 오류가 발생했습니다')
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
        await refreshRequest(selectedRequest.id)
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
        if (selectedRequest) {
          await refreshRequest(selectedRequest.id)
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
        if (selectedRequest) {
          await refreshRequest(selectedRequest.id)
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
    setShowEditDialog(true)
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
        await requestsAPI.delete(selectedRequest.id)
        toast.success('요청이 삭제되었습니다')
        setViewMode('list')
        setSelectedRequest(null)
      } catch (error: any) {
        console.error('Delete request failed:', error)
        toast.error(error?.message || '삭제 중 오류가 발생했습니다')
      }
    }
  }

  if (viewMode === 'detail' && selectedRequest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
        {/* Header Section */}
        <div className="bg-white shadow-sm border-b border-emerald-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  onClick={handleBack} 
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  ← 목록으로 돌아가기
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-emerald-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-lg">
                <TruckIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">용차 관리</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                onClick={handleCreateNew}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                새 요청 생성
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RequestList
          onCreateNew={handleCreateNew}
          onViewRequest={handleViewRequest}
          onEditRequest={handleEditRequest}
          onExportSelected={handleExportSelected}
        />
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>새 용차 요청 생성</DialogTitle>
          </DialogHeader>
          <NewRequestForm
            onSubmit={handleCreateSubmit}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>용차 요청 수정</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <NewRequestForm
              onSubmit={handleEditSubmit}
              onCancel={() => {
                setShowEditDialog(false)
                setSelectedRequest(null)
              }}
              initialData={{
                loadingPointId: selectedRequest.loadingPointId,
                requestDate: selectedRequest.requestDate,
                centerCarNo: selectedRequest.centerCarNo,
                vehicleTon: selectedRequest.vehicleTon,
                regions: selectedRequest.regions.join(', '),
                stops: selectedRequest.stops,
                notes: selectedRequest.notes || '',
                baseFare: selectedRequest.baseFare || 0,
                extraStopFee: selectedRequest.extraStopFee || 0,
                extraRegionFee: selectedRequest.extraRegionFee || 0,
                extraAdjustment: selectedRequest.extraAdjustment || 0,
                adjustmentReason: selectedRequest.adjustmentReason || ''
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

const RequestsPage = () => {
  return <RequestsPageContent />
}

export default RequestsPage
