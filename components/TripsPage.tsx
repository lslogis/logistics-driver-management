import React, { useState, useMemo, useEffect } from 'react';
import { Trip, Driver, FixedRoute } from '../types';
import Modal from './Modal';
import { PlusIcon, PencilIcon, TrashIcon, DownloadIcon } from './icons';

interface TripsPageProps {
  trips: Trip[];
  drivers: Driver[];
  fixedRoutes: FixedRoute[];
  onAddTrip: (trip: Omit<Trip, 'id' | 'isSettled'>) => void;
  onUpdateTrip: (trip: Trip) => void;
  onDeleteTrip: (tripId: string) => void;
}

// KST (UTC+9) 기준 날짜 헬퍼 함수
const getKSTDate = (date = new Date()) => {
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    return new Date(utc + (9 * 3600000));
};

const getTodayKSTString = (): string => {
    return getKSTDate().toISOString().split('T')[0];
};

const getMonthStartKSTString = (): string => {
    const kstNow = getKSTDate();
    kstNow.setUTCDate(1);
    return kstNow.toISOString().split('T')[0];
};

const getMonthEndKSTString = (): string => {
    const kstNow = getKSTDate();
    const year = kstNow.getUTCFullYear();
    const month = kstNow.getUTCMonth();
    const lastDay = new Date(Date.UTC(year, month + 1, 0));
    return lastDay.toISOString().split('T')[0];
};


const emptyTripData: Omit<Trip, 'id' | 'isSettled'> = {
  date: getTodayKSTString(),
  driverId: '',
  routeType: 'fixed',
  fixedRouteId: '',
  customRouteName: '',
  departure: '',
  destination: '',
  driverFare: 0,
  billingFare: 0,
  remarks: '',
};

const TripsPage: React.FC<TripsPageProps> = ({ trips, drivers, fixedRoutes, onAddTrip, onUpdateTrip, onDeleteTrip }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(emptyTripData);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<string | null>(null);
  
  const [filters, setFilters] = useState({
      startDate: getMonthStartKSTString(),
      endDate: getMonthEndKSTString(),
      driverId: ''
  });
  const [showFixedRoutes, setShowFixedRoutes] = useState(true);


  const driverMap = useMemo(() => drivers.reduce((acc, d) => ({ ...acc, [d.id]: d.name }), {} as Record<string, string>), [drivers]);
  const routeMap = useMemo(() => fixedRoutes.reduce((acc, r) => ({ ...acc, [r.id]: r }), {} as Record<string, FixedRoute>), [fixedRoutes]);

  useEffect(() => {
    if (editingTrip) {
      setFormData({
        date: editingTrip.date,
        driverId: editingTrip.driverId,
        routeType: editingTrip.routeType,
        fixedRouteId: editingTrip.fixedRouteId || '',
        customRouteName: editingTrip.customRouteName || '',
        departure: editingTrip.departure || '',
        destination: editingTrip.destination || '',
        driverFare: editingTrip.driverFare,
        billingFare: editingTrip.billingFare,
        remarks: editingTrip.remarks || '',
      });
    } else {
      setFormData(emptyTripData);
    }
  }, [editingTrip]);

  useEffect(() => {
    if (formData.routeType === 'fixed' && formData.fixedRouteId && routeMap[formData.fixedRouteId]) {
      const route = routeMap[formData.fixedRouteId];
      setFormData(prev => ({
        ...prev,
        customRouteName: route.name,
        driverFare: route.driverFare,
        billingFare: route.billingFare,
        departure: route.loadingPoint,
        destination: route.routeNameSuffix,
        driverId: route.driverId || prev.driverId || '',
      }));
    } else if (formData.routeType === 'custom' && !editingTrip) {
        setFormData(prev => ({ ...prev, customRouteName: '', driverFare: 0, billingFare: 0, departure: '', destination: '' }));
    }
  }, [formData.routeType, formData.fixedRouteId, routeMap, editingTrip]);

  const openModalForNew = () => {
    setEditingTrip(null);
    setFormData(emptyTripData);
    setIsModalOpen(true);
  };

  const openModalForEdit = (trip: Trip) => {
    setEditingTrip(trip);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTrip(null);
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.date && formData.driverId) {
      if (editingTrip) {
        onUpdateTrip({ ...editingTrip, ...formData });
      } else {
        onAddTrip(formData);
      }
      closeModal();
    } else {
      alert("날짜와 기사는 필수입니다.");
    }
  };
  
  const handleDelete = (tripId: string) => {
    setTripToDelete(tripId);
    setIsConfirmModalOpen(true);
  }

  const confirmDelete = () => {
      if (tripToDelete) {
          onDeleteTrip(tripToDelete);
      }
      setIsConfirmModalOpen(false);
      setTripToDelete(null);
  };
  
  const getRouteName = (trip: Trip) => {
    if (trip.routeType === 'fixed' && trip.fixedRouteId) {
        return routeMap[trip.fixedRouteId]?.name || trip.customRouteName || '삭제된 코스';
    }
    return trip.customRouteName || '커스텀';
  }

  const filteredTrips = useMemo(() => {
    return trips
      .filter(trip => {
        if (filters.startDate && trip.date < filters.startDate) return false;
        if (filters.endDate && trip.date > filters.endDate) return false;
        if (filters.driverId && trip.driverId !== filters.driverId) return false;
        if (!showFixedRoutes && trip.routeType === 'fixed') return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [trips, filters, showFixedRoutes]);

  const handleExportExcel = () => {
      const header = ['날짜', '기사', '코스명', '출발지', '도착지', '지급운임', '매입운임', '정산여부', '비고'];
      const dataToExport = filteredTrips.map(trip => ({
          '날짜': trip.date,
          '기사': driverMap[trip.driverId] || '삭제된 기사',
          '코스명': getRouteName(trip),
          '출발지': trip.departure || (trip.routeType === 'fixed' && trip.fixedRouteId ? routeMap[trip.fixedRouteId]?.loadingPoint : ''),
          '도착지': trip.destination || (trip.routeType === 'fixed' && trip.fixedRouteId ? routeMap[trip.fixedRouteId]?.routeNameSuffix : ''),
          '지급운임': trip.driverFare,
          '매입운임': trip.billingFare,
          '정산여부': trip.isSettled ? '완료' : '미정산',
          '비고': trip.remarks || '',
      }));

      const worksheet = (window as any).XLSX.utils.json_to_sheet([]);
      (window as any).XLSX.utils.sheet_add_aoa(worksheet, [header], { origin: 'A1' });
      (window as any).XLSX.utils.sheet_add_json(worksheet, dataToExport, { origin: 'A2', skipHeader: true });

      const headerStyle = { font: { bold: true } };
      header.forEach((_, colIndex) => {
          const cellAddress = (window as any).XLSX.utils.encode_cell({ c: colIndex, r: 0 });
          if(worksheet[cellAddress]) worksheet[cellAddress].s = headerStyle;
      });
      
      // Set column widths and number formats
      worksheet['!cols'] = [{wch: 12}, {wch: 15}, {wch: 25}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 10}, {wch: 30}];
      filteredTrips.forEach((_, rowIndex) => {
          const fareCellDriver = `F${rowIndex + 2}`;
          const fareCellBilling = `G${rowIndex + 2}`;
          if (worksheet[fareCellDriver]) {
              worksheet[fareCellDriver].t = 'n';
              worksheet[fareCellDriver].z = '#,##0';
          }
          if (worksheet[fareCellBilling]) {
              worksheet[fareCellBilling].t = 'n';
              worksheet[fareCellBilling].z = '#,##0';
          }
      });

      const workbook = (window as any).XLSX.utils.book_new();
      (window as any).XLSX.utils.book_append_sheet(workbook, worksheet, "운행 내역");
      (window as any).XLSX.writeFile(workbook, `운행내역_${filters.startDate}_${filters.endDate}.xlsx`);
  };


  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">운행 내역 관리</h2>
        <button onClick={openModalForNew} className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center transition-colors">
          <PlusIcon className="w-5 h-5 mr-2" />운행 추가
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex items-center gap-4 flex-wrap">
        <label htmlFor="startDate" className="text-sm font-medium">기간:</label>
        <input type="date" name="startDate" id="startDate" value={filters.startDate} onChange={handleFilterChange} className="p-2 border rounded-md" />
        <span>~</span>
        <input type="date" name="endDate" id="endDate" value={filters.endDate} onChange={handleFilterChange} className="p-2 border rounded-md" />
        
        <label htmlFor="driverId" className="text-sm font-medium ml-2">기사:</label>
        <select name="driverId" id="driverId" value={filters.driverId} onChange={handleFilterChange} className="p-2 border rounded-md">
            <option value="">모든 기사</option>
            {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        <div className="flex items-center">
            <input
                type="checkbox"
                id="showFixedRoutes"
                checked={showFixedRoutes}
                onChange={(e) => setShowFixedRoutes(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="showFixedRoutes" className="ml-2 text-sm font-medium">고정 코스 표시</label>
        </div>

        <button onClick={() => {
            setFilters({startDate: getMonthStartKSTString(), endDate: getMonthEndKSTString(), driverId: ''});
            setShowFixedRoutes(true);
            }} 
            className="text-sm text-gray-600 hover:underline">필터 초기화</button>
        <button onClick={handleExportExcel} className="ml-auto bg-green-600 text-white px-3 py-2 rounded-lg shadow hover:bg-green-700 flex items-center transition-colors text-sm">
            <DownloadIcon className="w-4 h-4 mr-2" />
            엑셀로 내보내기
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">날짜</th>
                <th className="px-6 py-3">기사</th>
                <th className="px-6 py-3">코스명</th>
                <th className="px-6 py-3">지급운임</th>
                <th className="px-6 py-3">매입운임</th>
                <th className="px-6 py-3">정산</th>
                <th className="px-6 py-3 text-center">작업</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrips.map((trip) => (
                <tr key={trip.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{trip.date}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{driverMap[trip.driverId] || '삭제된 기사'}</td>
                  <td className="px-6 py-4">{getRouteName(trip)}</td>
                  <td className="px-6 py-4">{trip.driverFare.toLocaleString()}원</td>
                  <td className="px-6 py-4">{trip.billingFare.toLocaleString()}원</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${trip.isSettled ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {trip.isSettled ? '완료' : '미정산'}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex justify-center items-center space-x-2">
                    <button onClick={() => openModalForEdit(trip)} className="p-1 text-blue-600 hover:text-blue-800" disabled={trip.isSettled}><PencilIcon className={`w-5 h-5 ${trip.isSettled ? 'text-gray-400' : ''}`} /></button>
                    <button onClick={() => handleDelete(trip.id)} className="p-1 text-red-600 hover:text-red-800" disabled={trip.isSettled}><TrashIcon className={`w-5 h-5 ${trip.isSettled ? 'text-gray-400' : ''}`} /></button>
                  </td>
                </tr>
              ))}
              {filteredTrips.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-gray-500">운행 내역이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingTrip ? "운행 내역 수정" : "새 운행 추가"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium">날짜</label>
              <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border" required />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium">기사</label>
              <select name="driverId" value={formData.driverId} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border" required>
                <option value="">기사 선택</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium">운행 타입</label>
            <select name="routeType" value={formData.routeType} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border">
              <option value="fixed">고정 코스</option>
              <option value="custom">커스텀/기타</option>
            </select>
          </div>

          {formData.routeType === 'fixed' ? (
            <div>
              <label className="block mb-2 text-sm font-medium">고정 코스 선택</label>
              <select name="fixedRouteId" value={formData.fixedRouteId} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border">
                <option value="">코스 선택</option>
                {fixedRoutes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          ) : (
            <>
              <div>
                <label className="block mb-2 text-sm font-medium">코스명</label>
                <input type="text" name="customRouteName" value={formData.customRouteName} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border" placeholder="예: 긴급 배송 (인천-부산)" required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium">출발지</label>
                  <input type="text" name="departure" value={formData.departure} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border" />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium">도착지</label>
                  <input type="text" name="destination" value={formData.destination} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border" />
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium">지급운임(원)</label>
              <input type="number" name="driverFare" value={formData.driverFare} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border" required readOnly={formData.routeType === 'fixed'}/>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium">매입운임(원)</label>
              <input type="number" name="billingFare" value={formData.billingFare} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border" required readOnly={formData.routeType === 'fixed'}/>
            </div>
          </div>
           <div>
              <label className="block mb-2 text-sm font-medium">비고</label>
              <textarea name="remarks" value={formData.remarks || ''} onChange={handleInputChange} rows={2} className="w-full p-2.5 bg-gray-50 border"></textarea>
          </div>
          <div className="flex justify-end pt-4">
            <button type="button" onClick={closeModal} className="text-gray-500 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 mr-2">취소</button>
            <button type="submit" className="text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center">{editingTrip ? "수정하기" : "추가하기"}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="운행 내역 삭제 확인">
        <div>
          <p className="text-gray-700">정말로 이 운행 내역을 삭제하시겠습니까?</p>
          <div className="flex justify-end mt-6 space-x-2">
            <button
              onClick={() => setIsConfirmModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors"
            >
              취소
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              삭제
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TripsPage;