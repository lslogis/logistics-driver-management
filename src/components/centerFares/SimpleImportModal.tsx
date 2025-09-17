'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, Download, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'
import { parseExcelFile, downloadExcelTemplate, type FareRow } from '@/lib/utils/excel'
import { toast } from 'react-hot-toast'

interface SimpleImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (rows: FareRow[]) => void
}

export function SimpleImportModal({ 
  open, 
  onOpenChange, 
  onImport 
}: SimpleImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<FareRow[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      toast.error('Excel 파일(.xlsx)만 업로드 가능합니다')
      return
    }

    setSelectedFile(file)
    setIsProcessing(true)
    setErrors([])
    setPreviewData([])

    try {
      const result = await parseExcelFile(file)
      
      if (result.errors.length > 0) {
        setErrors(result.errors)
      }
      
      if (result.data.length > 0) {
        setPreviewData(result.data)
        toast.success(`${result.data.length}개 행이 파싱되었습니다`)
      } else {
        toast.error('파싱된 데이터가 없습니다')
      }
    } catch (error) {
      console.error('File parsing error:', error)
      toast.error('파일 처리 중 오류가 발생했습니다')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownloadTemplate = () => {
    downloadExcelTemplate()
    toast.success('Excel 템플릿이 다운로드되었습니다')
  }

  const handleImport = () => {
    if (previewData.length === 0) {
      toast.error('가져올 데이터가 없습니다')
      return
    }

    onImport(previewData)
    handleClose()
  }

  const handleClose = () => {
    setSelectedFile(null)
    setPreviewData([])
    setErrors([])
    setIsProcessing(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] rounded-2xl shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Upload className="h-6 w-6 text-blue-600" />
            요율 데이터 가져오기
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Template Download */}
          <Card className="rounded-2xl border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="font-medium text-blue-900">Excel 템플릿 다운로드</h3>
                    <p className="text-sm text-blue-700">올바른 형식의 Excel 템플릿을 다운로드하세요</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDownloadTemplate}
                  className="bg-white"
                >
                  <Download className="h-4 w-4 mr-1" />
                  템플릿 다운로드
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Excel 파일 업로드</h3>
                <p className="text-gray-600 mb-4">클릭하여 Excel 파일을 선택하거나 드래그하여 업로드하세요</p>
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="excel-upload"
                />
                <label htmlFor="excel-upload">
                  <Button asChild className="cursor-pointer">
                    <span>파일 선택</span>
                  </Button>
                </label>
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-2">
                    선택된 파일: {selectedFile.name}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Processing Indicator */}
          {isProcessing && (
            <Card className="rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="text-gray-700">파일을 처리하는 중...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium text-red-800">다음 오류가 발생했습니다:</p>
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview Table */}
          {previewData.length > 0 && (
            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-bold text-green-900">
                    미리보기 ({previewData.length}개 행)
                  </h3>
                </div>
                
                <div className="overflow-x-auto max-h-64 overflow-y-auto border rounded-xl">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left">센터명</th>
                        <th className="px-4 py-2 text-left">차량톤수</th>
                        <th className="px-4 py-2 text-left">요율종류</th>
                        <th className="px-4 py-2 text-right">기본운임</th>
                        <th className="px-4 py-2 text-right">경유운임</th>
                        <th className="px-4 py-2 text-right">지역운임</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.slice(0, 10).map((row, index) => (
                        <tr key={index} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-2">{row.center}</td>
                          <td className="px-4 py-2">{row.vehicleType}</td>
                          <td className="px-4 py-2">{row.fareType}</td>
                          <td className="px-4 py-2 text-right">₩{row.baseFare.toLocaleString()}</td>
                          <td className="px-4 py-2 text-right">₩{row.extraStopFee.toLocaleString()}</td>
                          <td className="px-4 py-2 text-right">₩{row.extraRegionFee.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewData.length > 10 && (
                    <div className="p-3 text-center text-sm text-gray-600 bg-gray-50">
                      {previewData.length - 10}개 행이 더 있습니다...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} className="rounded-xl">
            취소
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={previewData.length === 0 || errors.length > 0}
            className="rounded-xl"
          >
            <Upload className="w-4 h-4 mr-2" />
            {previewData.length}개 행 가져오기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}