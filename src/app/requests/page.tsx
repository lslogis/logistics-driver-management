'use client'

export const dynamic = 'force-dynamic'

import React, { useState } from 'react'
import { RequestTable } from '@/components/requests/RequestTable'
import NewRequestForm from '@/components/requests/NewRequestForm'
import { RequestDetailDrawer } from '@/components/requests/RequestDetailDrawer'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { TruckIcon, PlusIcon, Calculator, Upload, Download, Loader2, Filter } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Request } from '@/types'
import { requestsAPI } from '@/lib/api/requests'

function RequestsPageContent() {
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailDrawer, setShowDetailDrawer] = useState(false)

  const handleCreateNew = () => {
    setShowCreateDialog(true)
  }

  const handleViewRequest = (request: Request) => {
    setSelectedRequest(request)
    setShowDetailDrawer(true)
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
    } catch (error) {
      console.error('Request creation failed:', error)
      toast.error('용차 요청 생성에 실패했습니다')
    }
  }

  const handleEditSubmit = async (data: any) => {
    try {
      if (!selectedRequest) return
      await requestsAPI.update(selectedRequest.id, data)
      toast.success('용차 요청이 수정되었습니다')
      setShowEditDialog(false)
      setShowDetailDrawer(false)
      setSelectedRequest(null)
    } catch (error) {
      console.error('Request update failed:', error)
      toast.error('용차 요청 수정에 실패했습니다')
    }
  }

  const handleCloseDetailDrawer = () => {
    setShowDetailDrawer(false)
    setSelectedRequest(null)
  }

  return (
    <div className="flex-1 space-y-4 p-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <TruckIcon className="h-8 w-8 text-white" />
            </div>
            용차 관리
          </h1>
          <p className="text-lg text-emerald-700 ml-16 font-medium">
            센터별 용차 요청을 체계적으로 관리하고 배차를 진행합니다
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={() => {}} // TODO: Add fare calculator
            className="h-12 px-6 rounded-xl border-2 border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400 transition-all duration-300 font-medium shadow-sm hover:shadow-md"
          >
            <Calculator className="h-5 w-5 mr-2" />
            요금 계산기
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => {}} // TODO: Add export functionality
            className="h-12 px-6 rounded-xl border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 transition-all duration-300 font-medium shadow-sm hover:shadow-md"
          >
            <Download className="h-5 w-5 mr-2" />
            내보내기
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => {}} // TODO: Add import functionality
            className="h-12 px-6 rounded-xl border-2 border-rose-300 text-rose-700 hover:bg-rose-50 hover:border-rose-400 transition-all duration-300 font-medium shadow-sm hover:shadow-md"
          >
            <Upload className="h-5 w-5 mr-2" />
            가져오기
          </Button>
          
          <Button 
            onClick={handleCreateNew}
            className="h-12 px-6 rounded-xl font-semibold bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-700 hover:via-teal-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            새 용차 요청
          </Button>
        </div>
      </div>

      {/* Filters - Modern Purple Theme */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-white via-emerald-50/30 to-white rounded-2xl backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[300px]">
              <Input
                placeholder="🔍 노선번호, 센터명으로 검색..."
                className="h-12 border-2 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl bg-white/70 backdrop-blur-sm transition-all duration-300 text-gray-700 font-medium"
              />
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="date"
                placeholder="시작일"
                className="h-12 w-44 border-2 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl bg-white/70 backdrop-blur-sm transition-all duration-300"
              />
              <span className="text-emerald-400 font-bold text-lg">~</span>
              <Input
                type="date"
                placeholder="종료일"
                className="h-12 w-44 border-2 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl bg-white/70 backdrop-blur-sm transition-all duration-300"
              />
            </div>
            <Button variant="outline" className="h-12 px-6 border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 rounded-xl transition-all duration-300 font-medium">
              <Filter className="h-4 w-4 mr-2" />
              필터
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Request Table */}
      <RequestTable 
        onViewRequest={handleViewRequest}
        onEditRequest={handleEditRequest}
      />

      {/* Create Dialog */}
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

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>용차 요청 수정</DialogTitle>
          </DialogHeader>
          <NewRequestForm 
            initialData={selectedRequest}
            onSubmit={handleEditSubmit}
            onCancel={() => setShowEditDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Detail Drawer */}
      <RequestDetailDrawer
        request={selectedRequest}
        isOpen={showDetailDrawer}
        onClose={handleCloseDetailDrawer}
        onEdit={handleEditRequest}
        onRefresh={refreshRequest}
      />
    </div>
  )
}

export default function RequestsPage() {
  return <RequestsPageContent />
}