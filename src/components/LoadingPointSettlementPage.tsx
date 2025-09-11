// FIX: Removed invalid CDATA wrapper.
import React, { useState, useMemo } from 'react';
import { Trip, RouteTemplate, Driver } from '../types';
import { DownloadIcon } from './icons';

interface LoadingPointSettlementPageProps {
  trips: Trip[];
  fixedRoutes: RouteTemplate[];
  drivers: Driver[];
}

// KST (UTC+9) 기준 오늘 날짜 문자열을 반환하는 헬퍼 함수
const getTodayKST = (): string => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const kst = new Date(utc + (9 * 3600000));
    return kst.toISOString().split('T')[0];
};

const LoadingPointSettlementPage: React.FC<LoadingPointSettlementPageProps> = ({ trips, fixedRoutes, drivers }) => {
  const todayKST = getTodayKST();
  const [dateRange, setDateRange] = useState({ start: todayKST, end: todayKST });
  const [selectedLoadingPoint, setSelectedLoadingPoint] = useState<string | null>(null);

  const fixedRouteMap = useMemo(() => 
    fixedRoutes.reduce((acc, route) => {
        acc[route.id] = route;
        return acc;
    }, {} as Record<string, FixedRoute>), [fixedRoutes]);

  const driverMap = useMemo(() =>
    drivers.reduce((acc, driver) => {
      acc[driver.id] = driver.name;
      return acc;
    }, {} as Record<string, string>), [drivers]);

  const getLoadingPoint = (trip: Trip) => {
    if (trip.routeType === 'fixed' && trip.fixedRouteId && fixedRouteMap[trip.fixedRouteId]) {
      return fixedRouteMap[trip.fixedRouteId].loadingPoint;
    }
    return trip.departure || "커스텀/기타";
  };

  const getRouteName = (trip: Trip) => {
    if (trip.routeType === 'fixed' && trip.fixedRouteId && fixedRouteMap[trip.fixedRouteId]) {
      return fixedRouteMap[trip.fixedRouteId].name;
    }
    return trip.customRouteName || "커스텀/기타";
  };

  const filteredTrips = useMemo(() => {
    return trips.filter(trip => {
      if (dateRange.start && trip.date < dateRange.start) return false;
      if (dateRange.end && trip.date > dateRange.end) return false;
      return true;
    });
  }, [trips, dateRange]);
  
  const settlementData = useMemo(() => {
    const dataByLoadingPoint = filteredTrips.reduce((acc, trip) => {
      const loadingPoint = getLoadingPoint(trip);
      if (!acc[loadingPoint]) {
        acc[loadingPoint] = { totalBillingFare: 0, totalDriverFare: 0, settledDriverFare: 0, count: 0 };
      }
      
      const route = trip.routeType === 'fixed' && trip.fixedRouteId ? fixedRouteMap[trip.fixedRouteId] : null;

      // Use the current fare from the fixed route if available, otherwise use the trip's historical fare.
      // This ensures the totals match the 'Fixed Routes' page, addressing the user's feedback.
      const currentBillingFare = route ? route.billingFare : trip.billingFare;
      const currentDriverFare = route ? route.driverFare : trip.driverFare;

      acc[loadingPoint].totalBillingFare += currentBillingFare;
      
      const driverFareForTotal = trip.isAbsence ? 0 : currentDriverFare;
      acc[loadingPoint].totalDriverFare += driverFareForTotal;
      
      // Settled amount should always be the historical fare from the trip record.
      if (trip.isSettled) {
          const settledDriverFare = trip.isAbsence ? 0 : trip.driverFare;
          acc[loadingPoint].settledDriverFare += settledDriverFare;
      }
      
      acc[loadingPoint].count += 1;
      return acc;
    }, {} as Record<string, { totalBillingFare: number, totalDriverFare: number, settledDriverFare: number, count: number }>);
    
    return Object.entries(dataByLoadingPoint).sort((a, b) => b[1].totalBillingFare - a[1].totalBillingFare);
  }, [filteredTrips, fixedRouteMap]);
  
  const totals = useMemo(() => settlementData.reduce((acc, [, data]: [string, any]) => {
      acc.totalBillingFare += data.totalBillingFare;
      acc.totalDriverFare += data.totalDriverFare;
      acc.settledDriverFare += data.settledDriverFare;
      return acc;
  }, {totalBillingFare: 0, totalDriverFare: 0, settledDriverFare: 0}), [settlementData]);

  const handleExportExcel = () => {
    const workbook = (window as any).XLSX.utils.book_new();
    const headerStyle = { font: { bold: true } };

    // 1. Summary Sheet
    const summaryHeader = ['상차지', '운행 건수', '총 매입운임', '총 지급운임', '미정산 지급운임'];
    const summaryData = settlementData.map(([loadingPoint, data]) => ({
        '상차지': loadingPoint,
        '운행 건수': data.count,
        '총 매입운임': data.totalBillingFare,
        '총 지급운임': data.totalDriverFare,
        '미정산 지급운임': data.totalDriverFare - data.settledDriverFare,
    }));
    const summaryWorksheet = (window as any).XLSX.utils.json_to_sheet(summaryData, { header: summaryHeader });
    summaryWorksheet['!cols'] = [{wch: 20}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}];
    summaryHeader.forEach((_, colIndex) => {
        const cellAddress = (window as any).XLSX.utils.encode_cell({ c: colIndex, r: 0 });
        summaryWorksheet[cellAddress].s = headerStyle;
    });
    summaryData.forEach((_, rowIndex) => {
        ['C','D','E'].forEach(col => {
            const cell = `${col}${rowIndex + 2}`;
            if(summaryWorksheet[cell]) {
                summaryWorksheet[cell].t = 'n';
                summaryWorksheet[cell].z = '#,##0';
            }
        });
    });
    (window as any).XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "요약");
    
    // 2. Detail Sheet
    const detailHeader = ['날짜', '상차지', '코스명', '기사', '매입운임', '지급운임', '정산여부'];
    const detailData = filteredTrips.map(trip => ({
        '날짜': trip.date,
        '상차지': getLoadingPoint(trip),
        '코스명': getRouteName(trip),
        '기사': driverMap[trip.driverId] || '삭제된 기사',
        '매입운임': trip.billingFare,
        '지급운임': trip.isAbsence ? 0 : trip.driverFare,
        '정산여부': trip.isSettled ? '완료' : '미정산',
    }));
    const detailWorksheet = (window as any).XLSX.utils.json_to_sheet(detailData, { header: detailHeader });
    detailWorksheet['!cols'] = [{wch: 12}, {wch: 20}, {wch: 25}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 10}];
    detailHeader.forEach((_, colIndex) => {
        const cellAddress = (window as any).XLSX.utils.encode_cell({ c: colIndex, r: 0 });
        detailWorksheet[cellAddress].s = headerStyle;
    });
    detailData.forEach((_, rowIndex) => {
        ['E','F'].forEach(col => {
            const cell = `${col}${rowIndex + 2}`;
            if(detailWorksheet[cell]) {
                detailWorksheet[cell].t = 'n';
                detailWorksheet[cell].z = '#,##0';
            }
        });
    });
    (window as any).XLSX.utils.book_append_sheet(workbook, detailWorksheet, "상세 내역");
    
    // 3. Download
    (window as any).XLSX.writeFile(workbook, `상차지별_정산_${dateRange.start}_${dateRange.end}.xlsx`);
  };

  const detailTrips = useMemo(() => {
    if (!selectedLoadingPoint) return [];
    return filteredTrips.filter(trip => getLoadingPoint(trip) === selectedLoadingPoint).sort((a,b) => a.date.localeCompare(b.date));
  }, [filteredTrips, selectedLoadingPoint]);

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">상차지별 정산</h2>
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">기간 선택</label>
                <div className="flex items-center gap-2">
                    <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({...p, start: e.target.value}))} className="p-2 border rounded-md" />
                    <span>~</span>
                    <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({...p, end: e.target.value}))} className="p-2 border rounded-md" />
                </div>
            </div>
            <button
                onClick={handleExportExcel}
                className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 flex items-center transition-colors self-end"
            >
                <DownloadIcon className="w-5 h-5 mr-2" />
                엑셀로 내보내기
            </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-4 border-b grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div><h3 className="text-lg font-semibold text-gray-600">총 운행건수</h3><p className="text-xl font-bold">{filteredTrips.length}건</p></div>
            <div><h3 className="text-lg font-semibold text-gray-600">총 매입운임 (청구액)</h3><p className="text-xl font-bold text-blue-600">{totals.totalBillingFare.toLocaleString()}원</p></div>
            <div><h3 className="text-lg font-semibold text-gray-600">총 지급운임 (비용)</h3><p className="text-xl font-bold text-red-600">{totals.totalDriverFare.toLocaleString()}원</p></div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">상차지</th>
                <th scope="col" className="px-6 py-3">운행 건수</th>
                <th scope="col" className="px-6 py-3">총 매입운임</th>
                <th scope="col" className="px-6 py-3">총 지급운임</th>
                <th scope="col" className="px-6 py-3">미정산 지급운임</th>
              </tr>
            </thead>
            <tbody>
              {settlementData.map(([loadingPoint, data]: [string, any]) => (
                <tr key={loadingPoint} className="bg-white border-b hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedLoadingPoint(loadingPoint)}>
                  <td className="px-6 py-4 font-medium text-gray-900">{loadingPoint}</td>
                  <td className="px-6 py-4">{data.count}건</td>
                  <td className="px-6 py-4">{data.totalBillingFare.toLocaleString()}원</td>
                  <td className="px-6 py-4">{data.totalDriverFare.toLocaleString()}원</td>
                  <td className="px-6 py-4 font-semibold text-orange-600">{(data.totalDriverFare - data.settledDriverFare).toLocaleString()}원</td>
                </tr>
              ))}
               {settlementData.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-gray-500">해당 기간의 데이터가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLoadingPoint && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center">
                  <h3 className="text-lg font-semibold">{selectedLoadingPoint} 상세 내역</h3>
                  <button onClick={() => setSelectedLoadingPoint(null)} className="text-sm text-gray-600">닫기</button>
              </div>
              <div className="overflow-x-auto max-h-96">
                  <table className="min-w-full text-sm text-left text-gray-500">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                          <tr>
                              <th className="px-6 py-3">날짜</th>
                              <th className="px-6 py-3">코스명</th>
                              <th className="px-6 py-3">기사</th>
                              <th className="px-6 py-3">매입운임</th>
                              <th className="px-6 py-3">지급운임</th>
                              <th className="px-6 py-3">정산 여부</th>
                          </tr>
                      </thead>
                      <tbody>
                          {detailTrips.map(trip => (
                              <tr key={trip.id} className={`bg-white border-b ${trip.isAbsence ? 'text-gray-400' : ''}`}>
                                  <td className="px-6 py-4">{trip.date}</td>
                                  <td className="px-6 py-4">{getRouteName(trip)}</td>
                                  <td className="px-6 py-4">{driverMap[trip.driverId] || '삭제된 기사'}</td>
                                  <td className="px-6 py-4">{trip.billingFare.toLocaleString()}원</td>
                                  <td className="px-6 py-4">{(trip.isAbsence ? 0 : trip.driverFare).toLocaleString()}원</td>
                                  <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${trip.isSettled ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                      {trip.isSettled ? '완료' : '미정산'}
                                    </span>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}
    </div>
  );
};

export default LoadingPointSettlementPage;