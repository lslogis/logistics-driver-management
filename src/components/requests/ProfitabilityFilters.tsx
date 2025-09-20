/**
 * 고급 수익성 필터링 컴포넌트
 * 다양한 필터 옵션과 실시간 미리보기 기능 제공
 */

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Filter, 
  X, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Users, 
  MapPin, 
  Truck,
  Search,
  RotateCcw,
  Save,
  Download,
  Upload,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProfitabilityFilter, SortOptions, ProfitabilityAnalytics } from '@/hooks/useProfitabilityFilters'
import { ProfitabilityStatus } from '@/lib/services/profitability.service'

interface ProfitabilityFiltersProps {
  filters: ProfitabilityFilter
  sortOptions: SortOptions
  analytics: ProfitabilityAnalytics
  onFilterChange: (key: keyof ProfitabilityFilter, value: any) => void
  onSortChange: (field: SortOptions['field'], order?: SortOptions['order']) => void
  onReset: () => void
  onExport: () => void
  hasActiveFilters: boolean
  className?: string
}

interface FilterPreset {
  name: string
  description: string
  filters: Partial<ProfitabilityFilter>
  icon: React.ReactNode
}

const FILTER_PRESETS: FilterPreset[] = [
  {
    name: '고수익 요청',
    description: '마진율 25% 이상',
    filters: { profitabilityStatus: 'excellent' },
    icon: <TrendingUp className="h-4 w-4" />
  },
  {
    name: '손실 위험',
    description: '마진율 5% 이하',
    filters: { maxMarginRate: 5 },
    icon: <TrendingUp className="h-4 w-4 text-red-500" />
  },
  {
    name: '미배정 요청',
    description: '기사 미배정 상태',
    filters: { driverAssignment: 'unassigned' },
    icon: <Users className="h-4 w-4" />
  },
  {
    name: '고액 건',
    description: '청구금액 50만원 이상',
    filters: { minCenterBilling: 500000 },
    icon: <DollarSign className="h-4 w-4" />
  }
]

const DATE_RANGE_OPTIONS = [
  { value: 'today', label: '오늘' },
  { value: 'week', label: '최근 7일' },
  { value: 'month', label: '최근 30일' },
  { value: 'quarter', label: '최근 3개월' },
  { value: 'year', label: '최근 1년' },
  { value: 'all', label: '전체' }
]

const PROFITABILITY_STATUS_OPTIONS = [
  { value: 'all', label: '모든 상태', color: 'bg-gray-100 text-gray-700' },
  { value: 'excellent', label: '우수 (30%+)', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'good', label: '양호 (20-30%)', color: 'bg-blue-100 text-blue-700' },
  { value: 'fair', label: '보통 (10-20%)', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'poor', label: '주의 (0-10%)', color: 'bg-orange-100 text-orange-700' },
  { value: 'loss', label: '손실 (0% 미만)', color: 'bg-red-100 text-red-700' }
]

const SORT_OPTIONS = [
  { value: 'marginRate', label: '마진율', icon: <TrendingUp className="h-3 w-3" /> },
  { value: 'margin', label: '마진 금액', icon: <DollarSign className="h-3 w-3" /> },
  { value: 'centerBilling', label: '청구금액', icon: <DollarSign className="h-3 w-3" /> },
  { value: 'driverFee', label: '기사운임', icon: <Users className="h-3 w-3" /> },
  { value: 'date', label: '날짜', icon: <Calendar className="h-3 w-3" /> },
  { value: 'centerName', label: '센터명', icon: <MapPin className="h-3 w-3" /> },
  { value: 'driverName', label: '기사명', icon: <Users className="h-3 w-3" /> }
]

export function ProfitabilityFilters({
  filters,
  sortOptions,
  analytics,
  onFilterChange,
  onSortChange,
  onReset,
  onExport,
  hasActiveFilters,
  className
}: ProfitabilityFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString() + '원'
  }

  const applyPreset = (preset: FilterPreset) => {
    Object.entries(preset.filters).forEach(([key, value]) => {
      onFilterChange(key as keyof ProfitabilityFilter, value)
    })
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.dateRange !== 'month') count++
    if (filters.profitabilityStatus !== 'all') count++
    if (filters.driverAssignment !== 'all') count++
    if (filters.centerName) count++
    if (filters.searchQuery) count++
    if (filters.minMarginRate !== undefined) count++
    if (filters.maxMarginRate !== undefined) count++
    if (filters.minCenterBilling !== undefined) count++
    if (filters.maxCenterBilling !== undefined) count++
    if (filters.regions.length > 0) count++
    return count
  }

  return (
    <Card className={cn("border-emerald-100 shadow-sm", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5 text-emerald-600" />
            필터 및 정렬
            {hasActiveFilters && (
              <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                {getActiveFilterCount()}개 적용
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
            >
              {isExpanded ? (
                <>
                  <EyeOff className="h-4 w-4 mr-1" />
                  간단히
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-1" />
                  상세히
                </>
              )}
            </Button>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                className="text-gray-600 border-gray-200 hover:bg-gray-50"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                초기화
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {!isExpanded ? (
          // 간단한 필터 (기본 보기)
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Select
              value={filters.dateRange}
              onValueChange={(value: ProfitabilityFilter['dateRange']) => 
                onFilterChange('dateRange', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.profitabilityStatus}
              onValueChange={(value: ProfitabilityFilter['profitabilityStatus']) => 
                onFilterChange('profitabilityStatus', value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="수익성 상태" />
              </SelectTrigger>
              <SelectContent>
                {PROFITABILITY_STATUS_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", option.color)} />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.driverAssignment}
              onValueChange={(value: ProfitabilityFilter['driverAssignment']) => 
                onFilterChange('driverAssignment', value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="배정 상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="assigned">배정 완료</SelectItem>
                <SelectItem value="unassigned">미배정</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="센터명 검색"
              value={filters.centerName}
              onChange={(e) => onFilterChange('centerName', e.target.value)}
              className="border-emerald-200 focus:border-emerald-400"
            />

            <Input
              placeholder="통합 검색"
              value={filters.searchQuery}
              onChange={(e) => onFilterChange('searchQuery', e.target.value)}
              className="border-emerald-200 focus:border-emerald-400"
            />

            <Select
              value={`${sortOptions.field}-${sortOptions.order}`}
              onValueChange={(value) => {
                const [field, order] = value.split('-')
                onSortChange(field as SortOptions['field'], order as SortOptions['order'])
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="정렬" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(option => (
                  <React.Fragment key={option.value}>
                    <SelectItem value={`${option.value}-desc`}>
                      <div className="flex items-center gap-2">
                        {option.icon}
                        {option.label} 높은순
                      </div>
                    </SelectItem>
                    <SelectItem value={`${option.value}-asc`}>
                      <div className="flex items-center gap-2">
                        {option.icon}
                        {option.label} 낮은순
                      </div>
                    </SelectItem>
                  </React.Fragment>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          // 상세 필터 (확장 보기)
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">기본</TabsTrigger>
              <TabsTrigger value="financial">금액</TabsTrigger>
              <TabsTrigger value="geography">지역</TabsTrigger>
              <TabsTrigger value="presets">프리셋</TabsTrigger>
              <TabsTrigger value="analytics">통계</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>날짜 범위</Label>
                  <Select
                    value={filters.dateRange}
                    onValueChange={(value: ProfitabilityFilter['dateRange']) => 
                      onFilterChange('dateRange', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DATE_RANGE_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>수익성 상태</Label>
                  <Select
                    value={filters.profitabilityStatus}
                    onValueChange={(value: ProfitabilityFilter['profitabilityStatus']) => 
                      onFilterChange('profitabilityStatus', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROFITABILITY_STATUS_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full", option.color)} />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>기사 배정 상태</Label>
                  <Select
                    value={filters.driverAssignment}
                    onValueChange={(value: ProfitabilityFilter['driverAssignment']) => 
                      onFilterChange('driverAssignment', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="assigned">배정 완료</SelectItem>
                      <SelectItem value="unassigned">미배정</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>센터명</Label>
                  <Input
                    placeholder="센터명 검색"
                    value={filters.centerName}
                    onChange={(e) => onFilterChange('centerName', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>통합 검색</Label>
                  <Input
                    placeholder="ID, 기사명, 지역 등"
                    value={filters.searchQuery}
                    onChange={(e) => onFilterChange('searchQuery', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>차량 톤수</Label>
                  <Select
                    value={filters.vehicleTon?.toString() || ''}
                    onValueChange={(value) => 
                      onFilterChange('vehicleTon', value ? parseInt(value) : undefined)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="모든 톤수" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">모든 톤수</SelectItem>
                      <SelectItem value="1">1톤</SelectItem>
                      <SelectItem value="2">2.5톤</SelectItem>
                      <SelectItem value="3">3.5톤</SelectItem>
                      <SelectItem value="5">5톤</SelectItem>
                      <SelectItem value="8">8톤</SelectItem>
                      <SelectItem value="11">11톤</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="financial" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    마진율 범위 (%)
                  </h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>최소</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={filters.minMarginRate || ''}
                          onChange={(e) => onFilterChange('minMarginRate', 
                            e.target.value ? parseFloat(e.target.value) : undefined
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>최대</Label>
                        <Input
                          type="number"
                          placeholder="100"
                          value={filters.maxMarginRate || ''}
                          onChange={(e) => onFilterChange('maxMarginRate', 
                            e.target.value ? parseFloat(e.target.value) : undefined
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    센터 청구금액 범위
                  </h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>최소 (원)</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={filters.minCenterBilling || ''}
                          onChange={(e) => onFilterChange('minCenterBilling', 
                            e.target.value ? parseInt(e.target.value) : undefined
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>최대 (원)</Label>
                        <Input
                          type="number"
                          placeholder="1000000"
                          value={filters.maxCenterBilling || ''}
                          onChange={(e) => onFilterChange('maxCenterBilling', 
                            e.target.value ? parseInt(e.target.value) : undefined
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    기사 운임 범위
                  </h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>최소 (원)</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={filters.minDriverFee || ''}
                          onChange={(e) => onFilterChange('minDriverFee', 
                            e.target.value ? parseInt(e.target.value) : undefined
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>최대 (원)</Label>
                        <Input
                          type="number"
                          placeholder="800000"
                          value={filters.maxDriverFee || ''}
                          onChange={(e) => onFilterChange('maxDriverFee', 
                            e.target.value ? parseInt(e.target.value) : undefined
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    마진 금액 범위
                  </h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>최소 (원)</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={filters.minMarginAmount || ''}
                          onChange={(e) => onFilterChange('minMarginAmount', 
                            e.target.value ? parseInt(e.target.value) : undefined
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>최대 (원)</Label>
                        <Input
                          type="number"
                          placeholder="500000"
                          value={filters.maxMarginAmount || ''}
                          onChange={(e) => onFilterChange('maxMarginAmount', 
                            e.target.value ? parseInt(e.target.value) : undefined
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="geography" className="space-y-4">
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  지역 및 위치 필터
                </h4>
                <div className="text-sm text-gray-600">
                  지역별 필터링 기능은 향후 업데이트 예정입니다.
                </div>
              </div>
            </TabsContent>

            <TabsContent value="presets" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {FILTER_PRESETS.map((preset, index) => (
                  <Card 
                    key={index} 
                    className="cursor-pointer hover:bg-emerald-50 border-emerald-200 transition-colors"
                    onClick={() => applyPreset(preset)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          {preset.icon}
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">{preset.name}</h5>
                          <p className="text-sm text-gray-600">{preset.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                  <div className="text-sm text-emerald-600 mb-1">총 요청</div>
                  <div className="text-2xl font-bold text-emerald-900">{analytics.totalRequests}</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-sm text-blue-600 mb-1">총 매출</div>
                  <div className="text-lg font-bold text-blue-900">{formatCurrency(analytics.totalRevenue)}</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                  <div className="text-sm text-purple-600 mb-1">총 마진</div>
                  <div className="text-lg font-bold text-purple-900">{formatCurrency(analytics.totalMargin)}</div>
                </div>
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 text-center">
                  <div className="text-sm text-teal-600 mb-1">평균 마진율</div>
                  <div className="text-xl font-bold text-teal-900">{analytics.averageMarginRate.toFixed(1)}%</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* 액션 버튼들 */}
        <div className="flex items-center justify-between pt-4 border-t border-emerald-100">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {analytics.totalRequests}개 요청 중 표시
            </span>
            {hasActiveFilters && (
              <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                필터 적용됨
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
            >
              <Download className="h-4 w-4 mr-1" />
              내보내기
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}