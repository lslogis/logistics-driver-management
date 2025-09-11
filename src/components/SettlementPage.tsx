import React, { useState, useMemo, useEffect } from 'react';
import { Trip, Driver, FixedRoute } from '../types';
import Modal from './Modal';
import { PencilIcon, DownloadIcon } from './icons';

interface SettlementPageProps {
  trips: Trip[];
  drivers: Driver[];
  fixedRoutes: FixedRoute[];
  onUpdateTrip: (trip: Trip) => void;
  onSettleMonthForDriver: (year: number, month: number, driverId: string) => void;
}

// KST (UTC+9) 기준 날짜 헬퍼 함수
const getKSTNow = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (9 * 3600000));
};

const SettlementPage: React.FC<SettlementPageProps> = ({ trips, drivers, fixedRoutes, onUpdateTrip, onSettleMonthForDriver }) => {
  const kstNow = getKSTNow();
  const [selectedYear, setSelectedYear] = useState<number>(kstNow.getUTCFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(kstNow.getUTCMonth() + 1);
  const [selectedDriverId, setSelectedDriverId] = useState<string>(drivers.length > 0 ? drivers[0].id : '');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  const selectedDriver = useMemo(() => drivers.find(d => d.id === selectedDriverId), [drivers, selectedDriverId]);

  const fixedRouteMap = useMemo(() => 
    fixedRoutes.reduce((acc, route) => {
        acc[route.id] = route;
        return acc;
    }, {} as Record<string, FixedRoute>), [fixedRoutes]);
  
  const filteredTrips = useMemo(() => {
    if (!selectedDriverId) return [];
    return trips
      .filter(trip => {
        const tripDate = new Date(trip.date + 'T00:00:00Z');
        return (
          trip.driverId === selectedDriverId &&
          tripDate.getUTCFullYear() === selectedYear &&
          tripDate.getUTCMonth() === selectedMonth - 1
        );
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [trips, selectedDriverId, selectedYear, selectedMonth]);

  const settlementSummary = useMemo(() => {
    const summary = { totalTrips: 0, monthlyFareTotal: 0, perTripFareTotal: 0, totalDeduction: 0, unsettledTrips: 0 };
    if (!selectedDriver) return summary;

    const monthlyRoutesInPeriod = new Set<string>();

    summary.totalTrips = filteredTrips.length;
    summary.unsettledTrips = filteredTrips.filter(t => !t.isSettled).length;
    
    // 1. Calculate per-trip total and find all unique monthly routes for the period
    summary.perTripFareTotal = filteredTrips.reduce((acc, trip) => {
      const route = trip.fixedRouteId ? fixedRouteMap[trip.fixedRouteId] : null;
      if (route && route.paymentType === 'monthly') {
        monthlyRoutesInPeriod.add(route.id);
        return acc;
      }
      // Sums up per-trip fixed routes and all custom routes
      return acc + (trip.isAbsence ? 0 : trip.driverFare);
    }, 0);

    // 2. Calculate monthly total from the unique routes
    summary.monthlyFareTotal = Array.from(monthlyRoutesInPeriod).reduce((acc, routeId) => {
      const route = fixedRouteMap[routeId];
      return acc + (route?.monthlyFare || 0);
    }, 0);
    
    // 3. Calculate total deductions
    summary.totalDeduction = filteredTrips.reduce((acc, trip) => acc + (trip.deductionAmount || 0), 0);

    return summary;
  }, [filteredTrips, selectedDriver, fixedRouteMap]);
  
  const handleSettle = () => {
    if(window.confirm(`${selectedYear}년 ${selectedMonth}월 ${selectedDriver?.name} 기사님의 미정산 내역을 일괄 정산하시겠습니까?`)){
        onSettleMonthForDriver(selectedYear, selectedMonth, selectedDriverId);
    }
  }
  
  const openModal = (trip: Trip) => {
      setEditingTrip(trip);
      setIsModalOpen(true);
  }
  const closeModal = () => {
      setEditingTrip(null);
      setIsModalOpen(false);
  }

  const getRouteName = (trip: Trip) => {
    if (trip.routeType === 'fixed' && trip.fixedRouteId && fixedRouteMap[trip.fixedRouteId]) {
      return fixedRouteMap[trip.fixedRouteId].name;
    }
    return trip.customRouteName || "커스텀/기타";
  };

  const handleExportExcel = () => {
    if (!selectedDriver) return;
    
    const driverName = selectedDriver.name;
    const header = ['날짜', '코스명', '지급운임', '비고', '정산 여부'];
    // FIX: Explicitly type `dataToExport` as `any[]` to allow for heterogeneous data structures (detail rows, summary rows, and empty rows).
    const dataToExport: any[] = filteredTrips.map(trip => {
      const route = trip.fixedRouteId ? fixedRouteMap[trip.fixedRouteId] : null;
      const remarks = trip.isAbsence
        ? `사유:${trip.absenceReason || '-'} | 대차:${trip.substituteInfo || '-'} | 용차비:${(trip.substituteFare || 0).toLocaleString()} | 차감:${(trip.deductionAmount || 0).toLocaleString()}`
        : trip.remarks || '';
        
      let fareDisplay = trip.isAbsence ? 0 : trip.driverFare;
      if (route && route.paymentType === 'monthly') {
          fareDisplay = 0; // 월대 운행은 개별 운임 0
      }

      return {
        '날짜': trip.date,
        '코스명': getRouteName(trip),
        '지급운임': fareDisplay,
        '비고': remarks,
        '정산 여부': trip.isSettled ? '완료' : '미정산'
      };
    });
    
    // Add summary rows
    const finalPay = settlementSummary.monthlyFareTotal + settlementSummary.perTripFareTotal - settlementSummary.totalDeduction;
    dataToExport.push(
        {},
        { '날짜': '월대 합계', '지급운임': settlementSummary.monthlyFareTotal },
        { '날짜': '회당 합계', '지급운임': settlementSummary.perTripFareTotal },
        { '날짜': '총 차감액', '지급운임': -settlementSummary.totalDeduction },
        { '날짜': '최종 지급액', '지급운임': finalPay }
    );

    const worksheet = (window as any).XLSX.utils.json_to_sheet(dataToExport, { header, skipHeader: true });
    (window as any).XLSX.utils.sheet_add_aoa(worksheet, [header], { origin: "A1" });
    
    worksheet['!cols'] = [{wch: 12}, {wch: 25}, {wch: 15}, {wch: 60}, {wch: 10}];
    
    // Styling
    const headerStyle = { font: { bold: true } };
    header.forEach((_, colIndex) => {
        const cellAddress = (window as any).XLSX.utils.encode_cell({ c: colIndex, r: 0 });
        worksheet[cellAddress].s = headerStyle;
    });

    const totalRowsStart = filteredTrips.length + 3;
    for(let i=0; i < 5; i++) {
        const fareCell = `C${totalRowsStart + i}`;
        if(worksheet[fareCell]) {
            worksheet[fareCell].t = 'n';
            worksheet[fareCell].z = '#,##0';
            worksheet[fareCell].s = { font: { bold: true } };
        }
    }


    const workbook = (window as any).XLSX.utils.book_new();
    (window as any).XLSX.utils.book_append_sheet(workbook, worksheet, "정산 내역");
    (window as any).XLSX.writeFile(workbook, `${selectedYear}년${selectedMonth}월-${driverName}-정산내역.xlsx`);
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">기사별 정산</h2>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6 flex items-end gap-4">
        {/* Filters */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">년도</label>
            <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="p-2 border rounded-md">
                {years.map(y => <option key={y} value={y}>{y}년</option>)}
            </select>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">월</label>
            <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="p-2 border rounded-md">
                {months.map(m => <option key={m} value={m}>{m}월</option>)}
            </select>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">기사</label>
            <select value={selectedDriverId} onChange={e => setSelectedDriverId(e.target.value)} className="p-2 border rounded-md min-w-[150px]">
                <option value="">기사 선택</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
        </div>
      </div>
        
      {selectedDriver && (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
                <StatCard title="총 운행/근무일수" value={`${settlementSummary.totalTrips}일`} />
                <StatCard title="월대 합계" value={`${settlementSummary.monthlyFareTotal.toLocaleString()}원`} />
                <StatCard title="회당 합계" value={`${settlementSummary.perTripFareTotal.toLocaleString()}원`} />
                <StatCard title="총 차감액" value={`${settlementSummary.totalDeduction.toLocaleString()}원`} isWarning={settlementSummary.totalDeduction > 0} />
                <StatCard title="최종 지급액" value={`${(settlementSummary.monthlyFareTotal + settlementSummary.perTripFareTotal - settlementSummary.totalDeduction).toLocaleString()}원`} isImportant={true} />
            </div>
      
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center flex-wrap gap-2">
                    <h3 className="text-lg font-semibold">{selectedYear}년 {selectedMonth}월 {selectedDriver.name} 기사님 정산 내역</h3>
                    <div className="flex items-center gap-2">
                        <button onClick={handleExportExcel} className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 flex items-center transition-colors">
                            <DownloadIcon className="w-5 h-5 mr-2" />
                            엑셀로 내보내기
                        </button>
                        <button onClick={handleSettle} disabled={settlementSummary.unsettledTrips === 0} className="bg-gray-600 text-white px-4 py-2 rounded-lg shadow hover:bg-gray-700 disabled:bg-gray-300">
                            미정산 내역 일괄 정산
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">날짜</th>
                            <th className="px-6 py-3">코스명</th>
                            <th className="px-6 py-3">지급운임</th>
                            <th className="px-6 py-3">비고</th>
                            <th className="px-6 py-3">정산 여부</th>
                            <th className="px-6 py-3">작업</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTrips.map(trip => {
                            const route = trip.fixedRouteId ? fixedRouteMap[trip.fixedRouteId] : null;
                            const isMonthlyTrip = route?.paymentType === 'monthly';
                            return (
                                <tr key={trip.id} className={`border-b ${trip.isAbsence ? 'bg-gray-100 text-gray-500' : 'bg-white hover:bg-gray-50'}`}>
                                    <td className="px-6 py-4">{trip.date}</td>
                                    <td className="px-6 py-4">{getRouteName(trip)}</td>
                                    <td className="px-6 py-4">{isMonthlyTrip ? '월대' : (trip.isAbsence ? 0 : trip.driverFare).toLocaleString()+'원'}</td>
                                    <td className="px-6 py-4 text-xs">
                                        {trip.isAbsence ? (
                                            <>
                                                <p><b>사유:</b> {trip.absenceReason}</p>
                                                <p><b>대차:</b> {trip.substituteInfo}</p>
                                                <p><b>용차비:</b> {(trip.substituteFare || 0).toLocaleString()}원</p>
                                                <p><b>차감액:</b> {(trip.deductionAmount || 0).toLocaleString()}원</p>
                                            </>
                                        ) : trip.remarks}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${trip.isSettled ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {trip.isSettled ? '완료' : '미정산'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => openModal(trip)} className="p-1 text-blue-600 hover:text-blue-800" disabled={trip.isSettled}>
                                            <PencilIcon className={`w-5 h-5 ${trip.isSettled ? 'text-gray-400' : ''}`} />
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                        {filteredTrips.length === 0 && (
                            <tr><td colSpan={6} className="text-center py-10">해당 기간의 운행 내역이 없습니다.</td></tr>
                        )}
                    </tbody>
                </table>
                </div>
            </div>
        </>
      )}
      {editingTrip && <AbsenceModal trip={editingTrip} isOpen={isModalOpen} onClose={closeModal} onSave={onUpdateTrip} fixedRoutes={fixedRoutes} isMonthly={fixedRouteMap[editingTrip.fixedRouteId!]?.paymentType === 'monthly'} />}
    </div>
  );
};

const StatCard: React.FC<{title: string; value: string; isImportant?: boolean; isWarning?: boolean}> = ({title, value, isImportant, isWarning}) => (
    <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-sm font-semibold text-gray-600">{title}</h3>
        <p className={`text-2xl font-bold mt-2 ${isImportant ? 'text-blue-600' : isWarning ? 'text-red-500' : 'text-gray-800'}`}>{value}</p>
    </div>
);

interface AbsenceModalProps {
    trip: Trip;
    isOpen: boolean;
    onClose: () => void;
    onSave: (trip: Trip) => void;
    fixedRoutes: FixedRoute[];
    isMonthly: boolean;
}

const AbsenceModal: React.FC<AbsenceModalProps> = ({ trip, isOpen, onClose, onSave, fixedRoutes, isMonthly }) => {
    const [formData, setFormData] = useState({
        isAbsence: trip.isAbsence || false,
        absenceReason: trip.absenceReason || '',
        substituteInfo: trip.substituteInfo || '',
        substituteFare: trip.substituteFare || 0,
        deductionAmount: trip.deductionAmount || 0,
        remarks: trip.remarks || '',
    });
    
    useEffect(() => {
        const originalFare = fixedRoutes.find(r => r.id === trip.fixedRouteId)?.driverFare || trip.driverFare;
        const deduction = isMonthly 
            ? formData.substituteFare // 월대 기사는 용차비 전액을 차감할 수 있음
            : Math.max(0, formData.substituteFare - originalFare); // 회당 기사는 차액만 차감
        setFormData(prev => ({ ...prev, deductionAmount: deduction }));
    }, [formData.substituteFare, trip, fixedRoutes, isMonthly]);


    const handleSave = () => {
        onSave({
            ...trip,
            ...formData,
            driverFare: formData.isAbsence ? 0 : (fixedRoutes.find(r => r.id === trip.fixedRouteId)?.driverFare || trip.driverFare),
        });
        onClose();
    };
    
    const handleCancelAbsence = () => {
        const originalFare = fixedRoutes.find(r => r.id === trip.fixedRouteId)?.driverFare || 0;
        onSave({
            ...trip,
            isAbsence: false,
            driverFare: isMonthly ? 0 : originalFare,
            absenceReason: undefined,
            substituteInfo: undefined,
            substituteFare: undefined,
            deductionAmount: undefined,
        });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="휴무/대차 정보 수정">
            <div className="space-y-4">
                 <div>
                    <label className="flex items-center">
                        <input type="checkbox" checked={formData.isAbsence} onChange={e => setFormData({...formData, isAbsence: e.target.checked})} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-2 font-medium">휴무/대차 여부</span>
                    </label>
                </div>
                {formData.isAbsence ? (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">휴무 사유</label>
                            <input type="text" value={formData.absenceReason} onChange={e => setFormData({...formData, absenceReason: e.target.value})} className="w-full mt-1 p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">대차 정보</label>
                            <input type="text" value={formData.substituteInfo} onChange={e => setFormData({...formData, substituteInfo: e.target.value})} className="w-full mt-1 p-2 border rounded-md" placeholder="예: 김대차 / 11가 1111"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">용차비 (원)</label>
                            <input type="number" value={formData.substituteFare} onChange={e => setFormData({...formData, substituteFare: parseInt(e.target.value) || 0})} className="w-full mt-1 p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">차감 금액 (원)</label>
                            <input type="number" value={formData.deductionAmount} onChange={e => setFormData({...formData, deductionAmount: parseInt(e.target.value) || 0})} className="w-full mt-1 p-2 border rounded-md bg-gray-100" />
                            <p className="text-xs text-gray-500 mt-1">{isMonthly ? "월대 코스는 용차비를 직접 입력하여 차감액을 조절할 수 있습니다." : "용차비 - 원운임으로 자동 계산됩니다."}</p>
                        </div>
                    </>
                ) : (
                     <div>
                        <label className="block text-sm font-medium text-gray-700">비고</label>
                         <textarea value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} rows={3} className="w-full mt-1 p-2 border rounded-md" />
                    </div>
                )}
               
                <div className="flex justify-between pt-4">
                     <div>
                        {trip.isAbsence && (
                            <button onClick={handleCancelAbsence} className="text-white bg-gray-600 hover:bg-gray-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center">
                                휴무/대차 취소
                            </button>
                        )}
                    </div>
                    <div className="flex justify-end">
                        <button onClick={onClose} className="text-gray-500 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 mr-2">취소</button>
                        <button onClick={handleSave} className="text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center">저장하기</button>
                    </div>
                </div>
            </div>
        </Modal>
    )
}


export default SettlementPage;