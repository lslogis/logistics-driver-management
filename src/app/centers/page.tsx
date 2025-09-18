'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
// Simple toast replacement
const toast = {
  success: (message: string) => alert(`✅ ${message}`),
  error: (message: string) => alert(`❌ ${message}`)
}

interface Center {
  id: number
  name: string
  location?: string | null
  isActive: boolean
  requestCount: number
  createdAt: string
  updatedAt: string
}

interface CenterFormData {
  name: string
  location: string
  isActive: boolean
}

export default function CentersPage() {
  const [centers, setCenters] = useState<Center[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingCenter, setEditingCenter] = useState<Center | null>(null)
  const [formData, setFormData] = useState<CenterFormData>({
    name: '',
    location: '',
    isActive: true
  })

  useEffect(() => {
    loadCenters()
  }, [])

  const loadCenters = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/centers?limit=100')
      if (!response.ok) throw new Error('Failed to load centers')
      
      const data = await response.json()
      setCenters(data.data || [])
    } catch (error) {
      console.error('Error loading centers:', error)
      toast.error('센터 목록을 불러오는 데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('센터명을 입력해주세요.')
      return
    }

    try {
      const url = editingCenter ? `/api/centers/${editingCenter.id}` : '/api/centers'
      const method = editingCenter ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          location: formData.location.trim() || null,
          ...(editingCenter && { isActive: formData.isActive })
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save center')
      }

      toast.success(editingCenter ? '센터가 수정되었습니다.' : '센터가 생성되었습니다.')
      setShowCreateDialog(false)
      setEditingCenter(null)
      setFormData({ name: '', location: '', isActive: true })
      loadCenters()
    } catch (error: any) {
      console.error('Error saving center:', error)
      toast.error(error.message || '센터 저장에 실패했습니다.')
    }
  }

  const handleEdit = (center: Center) => {
    setEditingCenter(center)
    setFormData({
      name: center.name,
      location: center.location || '',
      isActive: center.isActive
    })
    setShowCreateDialog(true)
  }

  const handleDelete = async (center: Center) => {
    if (center.requestCount > 0) {
      toast.error('요청이 있는 센터는 삭제할 수 없습니다.')
      return
    }

    if (!confirm(`'${center.name}' 센터를 삭제하시겠습니까?`)) {
      return
    }

    try {
      const response = await fetch(`/api/centers/${center.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete center')
      }

      toast.success('센터가 삭제되었습니다.')
      loadCenters()
    } catch (error: any) {
      console.error('Error deleting center:', error)
      toast.error(error.message || '센터 삭제에 실패했습니다.')
    }
  }

  const closeDialog = () => {
    setShowCreateDialog(false)
    setEditingCenter(null)
    setFormData({ name: '', location: '', isActive: true })
  }

  const filteredCenters = centers.filter(center =>
    center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (center.location && center.location.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">센터 관리</h1>
          <p className="text-muted-foreground">
            물류 센터를 관리하고 요청과 연결합니다.
          </p>
        </div>
        <Button onClick={() => {
          setEditingCenter(null)
          setShowCreateDialog(true)
        }}>
          <Plus className="h-4 w-4 mr-2" />
          센터 추가
        </Button>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCenter ? '센터 수정' : '새 센터 추가'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">센터명 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="센터명을 입력하세요"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="location">위치</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="위치를 입력하세요 (선택사항)"
                />
              </div>

              {editingCenter && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">활성 상태</Label>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  취소
                </Button>
                <Button type="submit">
                  {editingCenter ? '수정' : '생성'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="센터명 또는 위치로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">전체 센터</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{centers.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">활성 센터</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {centers.filter(c => c.isActive).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">총 요청 수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {centers.reduce((sum, c) => sum + c.requestCount, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Centers Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>센터명</TableHead>
                <TableHead>위치</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>요청 수</TableHead>
                <TableHead>생성일</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    로딩 중...
                  </TableCell>
                </TableRow>
              ) : filteredCenters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    {searchTerm ? '검색 결과가 없습니다.' : '센터가 없습니다.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCenters.map((center) => (
                  <TableRow key={center.id}>
                    <TableCell className="font-medium">{center.name}</TableCell>
                    <TableCell>
                      {center.location ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {center.location}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={center.isActive ? 'default' : 'secondary'}>
                        {center.isActive ? '활성' : '비활성'}
                      </Badge>
                    </TableCell>
                    <TableCell>{center.requestCount}</TableCell>
                    <TableCell>
                      {new Date(center.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(center)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(center)}
                          disabled={center.requestCount > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}