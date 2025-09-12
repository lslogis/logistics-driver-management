import React from 'react'
import { CheckCircle, XCircle, AlertCircle, TrendingUp, Users, Calendar, Eye } from 'lucide-react'
import { ImportResult } from '@/lib/api/imports'

interface ImportResultsDisplayProps {
  results: ImportResult
  type: 'drivers' | 'trips' | 'vehicles' | 'routes'
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

  const renderDriverPreview = (driver: any, index: number) => (
    <tr key={index} className="hover:bg-gray-50">
      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
        {driver.name}
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
        {driver.phone}
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
        {driver.vehicleNumber || '-'}
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
        {driver.businessName || '-'}
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
        {driver.bankName || '-'}
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

  return (
    <div className="space-y-6">
      {/* 요약 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              type === 'drivers' ? 'bg-blue-100' : 'bg-purple-100'
            } mr-3`}>
              {type === 'drivers' ? (
                <Users className="h-4 w-4 text-blue-600" />
              ) : (
                <Calendar className="h-4 w-4 text-purple-600" />
              )}
            </div>
            <div>
              <div className="text-sm text-blue-600">전체 행</div>
              <div className="text-2xl font-bold text-blue-900">{results.total}</div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 mr-3">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-green-600">유효</div>
              <div className="text-2xl font-bold text-green-900">{results.valid}</div>
            </div>
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 mr-3">
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <div className="text-sm text-red-600">오류</div>
              <div className="text-2xl font-bold text-red-900">{results.invalid}</div>
            </div>
          </div>
        </div>

        <div className={`${
          statusColor === 'green' ? 'bg-green-50' : 
          statusColor === 'yellow' ? 'bg-yellow-50' : 
          'bg-red-50'
        } p-4 rounded-lg`}>
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              statusColor === 'green' ? 'bg-green-100' : 
              statusColor === 'yellow' ? 'bg-yellow-100' : 
              'bg-red-100'
            } mr-3`}>
              <TrendingUp className={`h-4 w-4 ${
                statusColor === 'green' ? 'text-green-600' : 
                statusColor === 'yellow' ? 'text-yellow-600' : 
                'text-red-600'
              }`} />
            </div>
            <div>
              <div className={`text-sm ${
                statusColor === 'green' ? 'text-green-600' : 
                statusColor === 'yellow' ? 'text-yellow-600' : 
                'text-red-600'
              }`}>성공률</div>
              <div className={`text-2xl font-bold ${
                statusColor === 'green' ? 'text-green-900' : 
                statusColor === 'yellow' ? 'text-yellow-900' : 
                'text-red-900'
              }`}>{successRate}%</div>
            </div>
          </div>
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
                  {results.imported}개의 {type === 'drivers' ? '기사' : '운행'}가 성공적으로 등록되었습니다.
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

      {/* 미리보기 (검증 모드) */}
      {results.preview && results.preview.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-gray-900">
              미리보기 (처음 {Math.min(results.preview.length, 5)}개)
            </h3>
            {results.preview.length > 5 && (
              <span className="text-sm text-gray-500">
                총 {results.valid}개 중 5개만 표시
              </span>
            )}
          </div>
          
          <div className="bg-white border border-gray-200 rounded-md overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {type === 'drivers' ? (
                    <>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">전화번호</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">차량번호</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">회사명</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">은행</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">기사</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">차량</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">노선</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">기사요금</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">청구요금</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.preview.slice(0, 5).map((item, index) => 
                  type === 'drivers' ? renderDriverPreview(item, index) : renderTripPreview(item, index)
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 오류 목록 */}
      {hasErrors && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              오류 내역 ({results.errors.length}개)
            </h3>
            {results.errors.length > 10 && (
              <span className="text-sm text-gray-500">
                처음 10개만 표시
              </span>
            )}
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-md max-h-64 overflow-y-auto">
            <ul className="divide-y divide-red-200">
              {results.errors.slice(0, 10).map((error, index) => (
                <li key={index} className="p-4">
                  <div className="flex">
                    <XCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="ml-3 flex-1">
                      <div className="text-sm font-medium text-red-800">
                        {error.row}행: {error.error}
                      </div>
                      {error.data && (
                        <div className="mt-1 text-xs text-red-600 font-mono bg-red-100 rounded px-2 py-1">
                          {JSON.stringify(error.data, null, 2)}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            
            {results.errors.length > 10 && (
              <div className="p-4 bg-red-100 border-t border-red-200">
                <p className="text-sm text-red-700">
                  추가로 {results.errors.length - 10}개의 오류가 더 있습니다. 
                  전체 오류를 확인하려면 파일을 수정한 후 다시 업로드해주세요.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Vehicle preview render function
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

// Route preview render function
const renderRoutePreview = (route: any, index: number) => (
  <tr key={index} className="hover:bg-gray-50">
    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
      {route.routeName}
    </td>
    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
      {route.departure} → {route.destination}
    </td>
    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
      {route.distance ? `${route.distance}km` : '-'}
    </td>
    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
      {route.baseFare ? `₩${parseInt(route.baseFare).toLocaleString()}` : '-'}
    </td>
  </tr>
)