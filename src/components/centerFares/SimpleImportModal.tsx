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
import { parseExcelFile, downloadExcelTemplate, type FareRow } from '@/lib/utils/center-fares'
import { toast } from 'react-hot-toast'

interface SimpleImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (rows: FareRow[]) => Promise<void>
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
  const [importResult, setImportResult] = useState<{
    imported: number
    failed: number
    errors: Array<{ row: number; error: string }>
  } | null>(null)

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

  const handleImport = async () => {
    if (previewData.length === 0) {
      toast.error('가져올 데이터가 없습니다')
      return
    }

    setIsProcessing(true)
    try {
      const result = await onImport(previewData)
      setImportResult(result as any) // 결과 저장
      toast.success(`${(result as any).imported}개 가져오기 완료!`)
    } catch (error) {
      console.error('가져오기 실패:', error)
      toast.error('가져오기 실패: ' + (error as Error).message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setPreviewData([])
    setErrors([])
    setIsProcessing(false)
    setImportResult(null) // 결과도 초기화
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[900px] max-w-[900px] h-[90vh] max-h-[90vh] rounded-2xl shadow-lg p-8 flex flex-col">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-3xl font-bold flex items-center gap-3">
            <Upload className="h-8 w-8 text-blue-600" />
            요율 데이터 가져오기
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8 overflow-y-auto flex-1 min-h-0">
          {/* 결과 화면 */}
          {importResult && (
            <Card className="rounded-2xl border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-900 text-xl mb-1">가져오기 완료!</h3>
                    <p className="text-green-700">
                      성공: {importResult.imported}개 | 실패: {importResult.failed}개
                    </p>
                  </div>
                </div>
                
                {importResult.errors.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-red-800 mb-2">실패한 항목:</h4>
                    <div className="bg-red-100 rounded-lg p-3 max-h-32 overflow-y-auto">
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-700 mb-1">
                          {error.row}행: {error.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end mt-6">
                  <Button 
                    onClick={handleClose}
                    className="bg-green-600 hover:bg-green-700 text-white h-11 px-6 rounded-xl"
                  >
                    확인
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 결과가 없을 때만 기존 화면 표시 */}
          {!importResult && (
            <>
          {/* Template Download */}
          <Card className="rounded-2xl border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <FileText className="h-7 w-7 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-blue-900 text-lg mb-1">Excel 템플릿 다운로드</h3>
                    <p className="text-blue-700">올바른 형식의 Excel 템플릿을 다운로드하세요</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleDownloadTemplate}
                  className="bg-white h-11 px-5 text-base rounded-xl"
                >
                  <Download className="h-5 w-5 mr-2" />
                  템플릿 다운로드
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card className="rounded-2xl">
            <CardContent className="p-8">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors">
                <Upload className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Excel 파일 업로드</h3>
                <p className="text-gray-600 mb-6 text-lg leading-relaxed">클릭하여 Excel 파일을 선택하거나 드래그하여 업로드하세요</p>
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="excel-upload"
                />
                <label htmlFor="excel-upload">
                  <Button asChild className="cursor-pointer h-12 px-8 text-base rounded-xl">
                    <span>파일 선택</span>
                  </Button>
                </label>
                {selectedFile && (
                  <p className="text-gray-600 mt-4 text-base">
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
                
                <div className="overflow-x-auto max-h-96 overflow-y-auto border rounded-xl">
                  <table className="w-full text-base">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold">센터명</th>
                        <th className="px-6 py-3 text-left font-semibold">차량톤수</th>
                        <th className="px-6 py-3 text-left font-semibold">지역</th>
                        <th className="px-6 py-3 text-left font-semibold">요율종류</th>
                        <th className="px-6 py-3 text-right font-semibold">기본운임</th>
                        <th className="px-6 py-3 text-right font-semibold">경유운임</th>
                        <th className="px-6 py-3 text-right font-semibold">지역운임</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.slice(0, 20).map((row, index) => (
                        <tr key={index} className="border-t hover:bg-gray-50">
                          <td className="px-6 py-3">{row.centerName}</td>
                          <td className="px-6 py-3">{row.vehicleTypeName}</td>
                          <td className="px-6 py-3">
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                              {row.region || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              row.fareType === '기본운임' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {row.fareType}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right font-mono">₩{(row.baseFare || 0).toLocaleString()}</td>
                          <td className="px-6 py-3 text-right font-mono">₩{(row.extraStopFee || 0).toLocaleString()}</td>
                          <td className="px-6 py-3 text-right font-mono">₩{(row.extraRegionFee || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewData.length > 20 && (
                    <div className="p-4 text-center text-base text-gray-600 bg-gray-50">
                      {previewData.length - 20}개 행이 더 있습니다...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
            </>
          )}
        </div>

        {/* Actions - 결과가 없을 때만 표시 */}
        {!importResult && (
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 flex-shrink-0">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            className="rounded-xl h-12 px-6 text-base font-medium"
          >
            취소
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={previewData.length === 0 || errors.length > 0}
            className="rounded-xl h-12 px-6 text-base font-semibold"
          >
            <Upload className="w-5 h-5 mr-2" />
            {previewData.length}개 행 가져오기
          </Button>
        </div>
        )}
      </DialogContent>
    </Dialog>
  )
}