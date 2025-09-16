import React from 'react'
import { CheckCircle, XCircle, AlertCircle, TrendingUp, Users, Calendar, MapPin, Truck, Navigation, Route, Eye } from 'lucide-react'
import { ImportResult } from '@/lib/api/imports'
import { ImportType } from './types'

interface ImportResultsDisplayProps {
  results: ImportResult
  type: ImportType
  onViewDetails?: () => void
}

export function ImportResultsDisplay({ results, type, onViewDetails }: ImportResultsDisplayProps) {
  const successRate = results.total > 0 ? Math.round((results.valid / results.total) * 100) : 0
  const isSuccess = results.imported > 0
  const hasErrors = results.invalid > 0

  const getStatusColor = () => {
    if (successRate >= 90) return 'green'
    if (successRate >= 70) return 'yellow'
    return 'red'
  }

  const statusColor = getStatusColor()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }

  const getTypeIcon = () => {
    switch (type) {
      case 'drivers':
        return <Users className="h-4 w-4 text-blue-600" />
      case 'loading-points':
        return <MapPin className="h-4 w-4 text-green-600" />
      case 'fixed-contracts':
        return <Route className="h-4 w-4 text-purple-600" />
      case 'vehicles':
        return <Truck className="h-4 w-4 text-orange-600" />
      case 'routes':
        return <Navigation className="h-4 w-4 text-indigo-600" />
      case 'trips':
        return <Calendar className="h-4 w-4 text-pink-600" />
      default:
        return <Users className="h-4 w-4 text-blue-600" />
    }
  }

  const getTypeName = () => {
    switch (type) {
      case 'drivers':
        return '기사'
      case 'loading-points':
        return '상차지'
      case 'fixed-contracts':
        return '고정노선'
      case 'vehicles':
        return '차량'
      case 'routes':
        return '노선템플릿'
      case 'trips':
        return '운행'
      default:
        return '항목'
    }
  }

  const renderDriverPreview = (driver: any, index: number) => (
    <tr key={index} className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
        {driver.name}
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
        {driver.phone}
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
        {driver.vehicleNumber || '-'}
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
        {driver.businessName || '-'}
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
        {driver.bankName || '-'}
      </td>
    </tr>
  )

  const renderLoadingPointPreview = (loadingPoint: any, index: number) => (
    <tr key={index} className="hover:bg-gray-50">
      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
        {loadingPoint.name}
      </td>
      <td className="px-4 py-2 text-sm text-gray-500">
        {loadingPoint.address}
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
        {loadingPoint.contactNumber || '-'}
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
        {loadingPoint.contactPerson || '-'}
      </td>
    </tr>
  )

  const renderFixedContractPreview = (contract: any, index: number) => (
    <tr key={index} className="hover:bg-gray-50">
      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
        {contract.routeName}
      </td>
      <td className="px-4 py-2 text-sm text-gray-500">
        {contract.contractType}
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
        {contract.driver?.name || '-'}
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
        {contract.monthlyRevenue ? formatCurrency(contract.monthlyRevenue) : 
         contract.dailyRevenue ? formatCurrency(contract.dailyRevenue) : '-'}
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
        {contract.operatingDays?.join(', ') || '-'}
      </td>
    </tr>
  )

  const renderVehiclePreview = (vehicle: any, index: number) => (
    <tr key={index} className="hover:bg-gray-50">
      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
        {vehicle.plateNumber}
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
        {vehicle.vehicleType}
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
        {vehicle.ownership === 'OWNED' ? '고정' : 
         vehicle.ownership === 'CHARTER' ? '용차' : '지입'}
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
        {vehicle.year || '-'}
      </td>
    </tr>
  )

  const renderRoutePreview = (route: any, index: number) => (
    <tr key={index} className="hover:bg-gray-50">
      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
        {route.routeName}
      </td>
      <td className="px-4 py-2 text-sm text-gray-500">
        {route.departure} → {route.destination}
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
        {route.distance ? `${route.distance}km` : '-'}
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
        {route.baseFare ? formatCurrency(route.baseFare) : '-'}
      </td>
    </tr>
  )

  const renderTripPreview = (trip: any, index: number) => (
    <tr key={index} className="hover:bg-gray-50">
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
        {new Date(trip.date).toLocaleDateString('ko-KR', { 
          month: 'short', 
          day: 'numeric',
          weekday: 'short' 
        })}
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
        <div>{trip.driver}</div>
        <div className="text-xs text-gray-500">{trip.driverPhone}</div>
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
        {trip.vehicle}
      </td>
      <td className="px-4 py-2 text-sm text-gray-500">
        {trip.route}
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm">
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          trip.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
          trip.status === 'ABSENCE' ? 'bg-red-100 text-red-800' :
          trip.status === 'SUBSTITUTE' ? 'bg-orange-100 text-orange-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {trip.status === 'COMPLETED' ? '완료' :
           trip.status === 'ABSENCE' ? '결행' :
           trip.status === 'SUBSTITUTE' ? '대차' : '예정'}
        </span>
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
        {formatCurrency(trip.driverFare)}
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
        {formatCurrency(trip.billingFare)}
      </td>
    </tr>
  )

  const renderPreview = (item: any, index: number) => {
    switch (type) {
      case 'drivers':
        return renderDriverPreview(item, index)
      case 'loading-points':
        return renderLoadingPointPreview(item, index)
      case 'fixed-contracts':
        return renderFixedContractPreview(item, index)
      case 'vehicles':
        return renderVehiclePreview(item, index)
      case 'routes':
        return renderRoutePreview(item, index)
      case 'trips':
        return renderTripPreview(item, index)
      default:
        return null
    }
  }

  // 데이터 셀 렌더링 (정상 데이터용)
  const renderDataCells = (item: any) => {
    switch (type) {
      case 'drivers':
        return (
          <>
            <td className="px-3 py-2 text-sm">{item.name}</td>
            <td className="px-3 py-2 text-sm">{item.phone}</td>
            <td className="px-3 py-2 text-sm">{item.vehicleNumber || '-'}</td>
            <td className="px-3 py-2 text-sm">{item.businessName || '-'}</td>
            <td className="px-3 py-2 text-sm">{item.bankName || '-'}</td>
          </>
        )
      case 'loading-points':
        return (
          <>
            <td className="px-3 py-2 text-sm">{item.centerName}</td>
            <td className="px-3 py-2 text-sm">{item.loadingPointName || '-'}</td>
            <td className="px-3 py-2 text-sm">{item.roadAddress || item.lotAddress || '-'}</td>
            <td className="px-3 py-2 text-sm">{item.manager1 || '-'}</td>
            <td className="px-3 py-2 text-sm">{item.phone1 || '-'}</td>
          </>
        )
      case 'fixed-contracts':
        return (
          <>
            <td className="px-3 py-2 text-sm">{item.routeName}</td>
            <td className="px-3 py-2 text-sm">{item.centerName || '-'}</td>
            <td className="px-3 py-2 text-sm">{item.weekdayPattern || '-'}</td>
            <td className="px-3 py-2 text-sm">{item.contractType}</td>
            <td className="px-3 py-2 text-sm">{item.assignedDriverName || '-'}</td>
          </>
        )
      default:
        return <td className="px-3 py-2 text-sm">-</td>
    }
  }

  // 오류 데이터 셀 렌더링
  const renderErrorDataCells = (data: any) => {
    if (!data) return getTableHeaders().map((_, i) => <td key={i} className="px-3 py-2 text-sm text-gray-400">-</td>)
    
    switch (type) {
      case 'drivers':
        return (
          <>
            <td className="px-3 py-2 text-sm text-gray-400">{data.name || '-'}</td>
            <td className="px-3 py-2 text-sm text-gray-400">{data.phone || '-'}</td>
            <td className="px-3 py-2 text-sm text-gray-400">{data.vehicleNumber || '-'}</td>
            <td className="px-3 py-2 text-sm text-gray-400">{data.businessName || '-'}</td>
            <td className="px-3 py-2 text-sm text-gray-400">{data.bankName || '-'}</td>
          </>
        )
      case 'loading-points':
        return (
          <>
            <td className="px-3 py-2 text-sm text-gray-400">{data.centerName || '-'}</td>
            <td className="px-3 py-2 text-sm text-gray-400">{data.loadingPointName || '-'}</td>
            <td className="px-3 py-2 text-sm text-gray-400">{data.roadAddress || data.lotAddress || '-'}</td>
            <td className="px-3 py-2 text-sm text-gray-400">{data.manager1 || '-'}</td>
            <td className="px-3 py-2 text-sm text-gray-400">{data.phone1 || '-'}</td>
          </>
        )
      case 'fixed-contracts':
        return (
          <>
            <td className="px-3 py-2 text-sm text-gray-400">{data.routeName || '-'}</td>
            <td className="px-3 py-2 text-sm text-gray-400">{data.centerName || '-'}</td>
            <td className="px-3 py-2 text-sm text-gray-400">{data.weekdayPattern || '-'}</td>
            <td className="px-3 py-2 text-sm text-gray-400">{data.contractType || '-'}</td>
            <td className="px-3 py-2 text-sm text-gray-400">{data.assignedDriverName || '-'}</td>
          </>
        )
      default:
        return getTableHeaders().map((_, i) => <td key={i} className="px-3 py-2 text-sm text-gray-400">-</td>)
    }
  }

  // 간단한 오류 메시지 변환
  const getSimpleErrorMessage = (error: string) => {
    // 중복 오류
    if (error.includes('중복된 노선명') || error.includes('중복된') || error.includes('이미 등록된')) return '데이터오류(중복)'
    if (error.includes('파일 내 중복된')) return '데이터오류(중복)'
    
    // 필수 항목 누락
    if (error.includes('required') || error.includes('필수')) return '데이터오류(필수값)'
    
    // 참조 오류 (찾을 수 없는 데이터)
    if (error.includes('찾을 수 없습니다') || error.includes('not found')) return '데이터오류(참조값)'
    
    // 형식 오류
    if (error.includes('형식') || error.includes('format') || error.includes('invalid')) return '데이터오류(형식)'
    if (error.includes('유효하지 않은')) return '데이터오류(형식)'
    
    // 계약형태 오류
    if (error.includes('계약형태')) return '데이터오류(계약형태)'
    
    // 요일 오류
    if (error.includes('요일')) return '데이터오류(운행요일)'
    
    // 전화번호 형식 오류
    if (error.includes('전화번호') || error.includes('phone')) return '데이터오류(전화번호)'
    
    // 기본 오류
    return '데이터오류'
  }

  const getTableHeaders = () => {
    switch (type) {
      case 'drivers':
        return ['이름', '전화번호', '차량번호', '회사명', '은행']
      case 'loading-points':
        return ['센터명', '상차지명', '주소', '담당자1', '연락처1']
      case 'fixed-contracts':
        return ['노선명', '센터명', '운행요일', '계약형태', '배정기사명']
      case 'vehicles':
        return ['차량번호', '차량종류', '소유구분', '연식']
      case 'routes':
        return ['노선명', '구간', '거리', '기본요금']
      case 'trips':
        return ['날짜', '기사', '차량', '노선', '상태', '기사요금', '청구요금']
      default:
        return []
    }
  }

  return (
    <div className="space-y-6">
      {/* 요약 헤더 */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 text-gray-600">
            {getTypeIcon()}
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">검증 결과</h3>
            <p className="text-sm text-gray-600">전체 {results.total}개 중 {results.valid}개 정상, {results.invalid}개 오류</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          successRate >= 90 ? 'bg-green-100 text-green-800' : 
          successRate >= 70 ? 'bg-yellow-100 text-yellow-800' : 
          'bg-red-100 text-red-800'
        }`}>
          성공률 {successRate}%
        </div>
      </div>

      {/* 가져오기 완료 상태 */}
      {isSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                가져오기 완료
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>
                  {results.imported}개의 {getTypeName()}가 성공적으로 등록되었습니다.
                  {onViewDetails && (
                    <button
                      onClick={onViewDetails}
                      className="ml-2 font-medium text-green-600 hover:text-green-800"
                    >
                      목록에서 확인하기
                    </button>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 전체 데이터 표시 - 상태별로 구분 */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-white">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">전체 데이터 ({results.total}개)</h4>
              <div className="flex items-center space-x-3 text-xs">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                  정상
                </span>
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                  오류
                </span>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-12">상태</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-12">#</th>
                  {getTableHeaders().map(header => (
                    <th key={header} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      {header}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-32">오류사유</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* 정상 데이터 먼저 표시 */}
                {results.preview && results.preview.map((item, index) => (
                  <tr key={`valid-${index}`} className="hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">{index + 1}</td>
                    {renderDataCells(item)}
                    <td className="px-3 py-2 text-xs text-green-600">-</td>
                  </tr>
                ))}
                
                {/* 오류 데이터 표시 */}
                {results.errors && results.errors.map((error, index) => (
                  <tr key={`error-${index}`} className="hover:bg-red-50">
                    <td className="px-3 py-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">{error.row}</td>
                    {renderErrorDataCells(error.data)}
                    <td className="px-3 py-2 text-xs text-red-600 max-w-32 truncate" title={error.error}>
                      {getSimpleErrorMessage(error.error)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  )
}