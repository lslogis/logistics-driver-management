// Implemented the FixedRoutesPage component to manage fixed routes.
import React, { useState, useEffect, useRef } from 'react';
import { RouteTemplate, Driver } from '../types';
import Modal from './Modal';
import { PlusIcon, PencilIcon, TrashIcon, DownloadIcon, UploadIcon } from './icons';

interface FixedRoutesPageProps {
  fixedRoutes: FixedRoute[];
  drivers: Driver[];
  onAddFixedRoute: (route: Omit<FixedRoute, 'id'>) => void;
  onUpdateFixedRoute: (route: FixedRoute) => void;
  onDeleteFixedRoute: (routeId: string) => void;
  onImportFixedRoutes: (newRoutes: any[]) => void;
}

const loadingPoints = [
  "동원백암", "동원시화", "동원동이천", "동원시화쿠팡", "동원피자", "동원부발", 
  "동원이천", "동원메가", "한성마평", "한성케이터링", "한성마트웰스", "한성SPC"
];

const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

const emptyRoute: Omit<FixedRoute, 'id' | 'name'> = {
  loadingPoint: loadingPoints[0],
  routeNameSuffix: '',
  driverFare: 0,
  billingFare: 0,
  driverId: '',
  schedule: [],
  paymentType: 'perTrip',
  monthlyFare: 0,
};

const FixedRoutesPage: React.FC<FixedRoutesPageProps> = ({ fixedRoutes, drivers, onAddFixedRoute, onUpdateFixedRoute, onDeleteFixedRoute, onImportFixedRoutes }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(emptyRoute);
  const [editingRoute, setEditingRoute] = useState<FixedRoute | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<string | null>(null);

  const driverMap = React.useMemo(() => 
    drivers.reduce((acc, driver) => {
        acc[driver.id] = driver.name;
        return acc;
    }, {} as Record<string, string>), [drivers]);

  useEffect(() => {
    if (editingRoute) {
      const { id, name, ...editableData } = editingRoute;
      setFormData({ 
          ...editableData, 
          driverId: editableData.driverId || '',
          schedule: editableData.schedule || [],
          paymentType: editableData.paymentType || 'perTrip',
          monthlyFare: editableData.monthlyFare || 0,
      });
    } else {
      setFormData(emptyRoute);
    }
  }, [editingRoute]);

  const openModalForNew = () => {
    setEditingRoute(null);
    setFormData(emptyRoute);
    setIsModalOpen(true);
  };

  const openModalForEdit = (route: FixedRoute) => {
    setEditingRoute(route);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRoute(null);
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (name === 'paymentType') {
      setFormData(prev => ({
        ...prev,
        paymentType: value as 'perTrip' | 'monthly',
        driverFare: value === 'monthly' ? 0 : prev.driverFare,
        monthlyFare: value === 'perTrip' ? 0 : prev.monthlyFare,
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    }
  };
  
  const handleScheduleChange = (dayIndex: number) => {
      setFormData(prev => {
          const schedule = prev.schedule ? [...prev.schedule] : [];
          if(schedule.includes(dayIndex)) {
              return { ...prev, schedule: schedule.filter(d => d !== dayIndex) };
          } else {
              return { ...prev, schedule: [...schedule, dayIndex] };
          }
      });
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isPerTripValid = formData.paymentType === 'perTrip' && formData.driverFare > 0;
    const isMonthlyValid = formData.paymentType === 'monthly' && formData.monthlyFare! > 0;

    if (formData.loadingPoint && formData.routeNameSuffix && (isPerTripValid || isMonthlyValid)) {
      const routeData = {
        ...formData,
        name: `${formData.loadingPoint} ${formData.routeNameSuffix}`,
        driverId: formData.driverId === '' ? undefined : formData.driverId,
      };
      if (editingRoute) {
        onUpdateFixedRoute({ ...editingRoute, ...routeData });
      } else {
        onAddFixedRoute(routeData);
      }
      closeModal();
    } else {
      alert("상차지, 호차, 그리고 선택한 정산 방식의 운임을 모두 올바르게 입력해주세요.");
    }
  };
  
  const handleDelete = (routeId: string) => {
    setRouteToDelete(routeId);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = () => {
      if (routeToDelete) {
          onDeleteFixedRoute(routeToDelete);
      }
      setIsConfirmModalOpen(false);
      setRouteToDelete(null);
  };

  const formatSchedule = (schedule?: number[]) => {
      if (!schedule || schedule.length === 0) return '-';
      return schedule.sort().map(dayIndex => weekdays[dayIndex]).join(', ');
  }
  
  const handleExportExcel = () => {
      const header = ['코스명*', '정산 방식', '회당 지급운임', '월 지급운임', '매입운임', '배정된 기사', '운행 요일'];
      const dataToExport = fixedRoutes.map(route => ({
          '코스명*': route.name,
          '정산 방식': route.paymentType === 'monthly' ? '월대' : '회당',
          '회당 지급운임': route.paymentType === 'perTrip' ? route.driverFare : '',
          '월 지급운임': route.paymentType === 'monthly' ? route.monthlyFare : '',
          '매입운임': route.billingFare,
          '배정된 기사': route.driverId ? driverMap[route.driverId] || '삭제된 기사' : '-',
          '운행 요일': formatSchedule(route.schedule)
      }));

      const worksheet = (window as any).XLSX.utils.json_to_sheet([]);
      (window as any).XLSX.utils.sheet_add_aoa(worksheet, [header], { origin: 'A1' });
      (window as any).XLSX.utils.sheet_add_json(worksheet, dataToExport, { origin: 'A2', skipHeader: true });
      
      worksheet['!cols'] = [{wch: 30}, {wch: 10}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 20}];

      const headerStyle = { font: { bold: true } };
      header.forEach((_, colIndex) => {
          const cellAddress = (window as any).XLSX.utils.encode_cell({ c: colIndex, r: 0 });
          if(worksheet[cellAddress]) worksheet[cellAddress].s = headerStyle;
      });

      fixedRoutes.forEach((_, rowIndex) => {
          ['C', 'D', 'E'].forEach(col => {
            const cellAddress = `${col}${rowIndex + 2}`;
            if (worksheet[cellAddress] && worksheet[cellAddress].v) {
                worksheet[cellAddress].t = 'n';
                worksheet[cellAddress].z = '#,##0';
            }
          });
      });

      const workbook = (window as any).XLSX.utils.book_new();
      (window as any).XLSX.utils.book_append_sheet(workbook, worksheet, "고정 코스 목록");
      (window as any).XLSX.writeFile(workbook, "고정_코스_목록.xlsx");
  };

  const handleDownloadTemplate = () => {
    const templateHeader = ['코스명*', '정산 방식', '회당 지급운임', '월 지급운임', '매입운임', '배정된 기사', '운행 요일'];
    const example1 = ['예: 동원백암 A코스', '회당', 150000, '', 180000, '김동민', '월,화,수,목,금'];
    const example2 = ['예: 한성마평 B코스', '월대', '', 3500000, 4000000, '이영희', '월,수,금'];
    const worksheet = (window as any).XLSX.utils.aoa_to_sheet([templateHeader, example1, example2]);
    worksheet['!cols'] = templateHeader.map(h => ({ wch: h.includes('코스') ? 30 : 15 }));
    const workbook = (window as any).XLSX.utils.book_new();
    (window as any).XLSX.utils.book_append_sheet(workbook, worksheet, "고정 코스 등록 양식");
    (window as any).XLSX.writeFile(workbook, "고정_코스_등록_양식.xlsx");
  };
  
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = (window as any).XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = (window as any).XLSX.utils.sheet_to_json(worksheet);
            onImportFixedRoutes(json);
        } catch (error) {
            console.error(error);
            alert("파일을 처리하는 중 오류가 발생했습니다.");
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <h2 className="text-3xl font-bold text-gray-800">고정 코스 관리</h2>
        <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg shadow hover:bg-gray-600 flex items-center transition-colors"
            >
              <DownloadIcon className="w-5 h-5 mr-2" />
              양식 다운로드
            </button>
             <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow hover:bg-purple-700 flex items-center transition-colors"
            >
              <UploadIcon className="w-5 h-5 mr-2" />
              엑셀로 불러오기
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".xlsx, .xls" className="hidden" />
            <button
              onClick={handleExportExcel}
              className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 flex items-center transition-colors"
            >
              <DownloadIcon className="w-5 h-5 mr-2" />
              엑셀로 내보내기
            </button>
            <button
              onClick={openModalForNew}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              코스 추가
            </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">코스명</th>
                <th scope="col" className="px-6 py-3">정산 방식</th>
                <th scope="col" className="px-6 py-3">지급운임</th>
                <th scope="col" className="px-6 py-3">배정된 기사</th>
                <th scope="col" className="px-6 py-3">운행 요일</th>
                <th scope="col" className="px-6 py-3 text-center">작업</th>
              </tr>
            </thead>
            <tbody>
              {fixedRoutes.length > 0 ? fixedRoutes.map((route) => (
                <tr key={route.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{route.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${route.paymentType === 'monthly' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'}`}>
                        {route.paymentType === 'monthly' ? '월대' : '회당'}
                    </span>
                  </td>
                   <td className="px-6 py-4">
                    {route.paymentType === 'monthly' 
                        ? `${(route.monthlyFare || 0).toLocaleString()}원`
                        : `${route.driverFare.toLocaleString()}원`
                    }
                  </td>
                  <td className="px-6 py-4">{route.driverId ? driverMap[route.driverId] || '삭제된 기사' : '-'}</td>
                  <td className="px-6 py-4">{formatSchedule(route.schedule)}</td>
                  <td className="px-6 py-4 flex justify-center items-center space-x-2">
                    <button onClick={() => openModalForEdit(route)} className="p-1 text-blue-600 hover:text-blue-800"><PencilIcon className="w-5 h-5" /></button>
                    <button onClick={() => handleDelete(route.id)} className="p-1 text-red-600 hover:text-red-800"><TrashIcon className="w-5 h-5" /></button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">등록된 고정 코스가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingRoute ? "코스 정보 수정" : "새 코스 추가"}>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="loadingPoint" className="block mb-2 text-sm font-medium text-gray-900">상차지</label>
                <select name="loadingPoint" id="loadingPoint" value={formData.loadingPoint} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border" required>
                    {loadingPoints.map(point => <option key={point} value={point}>{point}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="routeNameSuffix" className="block mb-2 text-sm font-medium text-gray-900">호차</label>
                <input type="text" name="routeNameSuffix" id="routeNameSuffix" value={formData.routeNameSuffix} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border" required placeholder="예: A코스, 1호차" />
            </div>
             <div>
                <label className="block mb-2 text-sm font-medium text-gray-900">운행 요일</label>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {weekdays.map((day, index) => (
                        <label key={day} className="flex items-center space-x-2">
                            <input type="checkbox"
                                checked={formData.schedule?.includes(index)}
                                onChange={() => handleScheduleChange(index)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>{day}</span>
                        </label>
                    ))}
                </div>
            </div>
             <div>
                <label className="block mb-2 text-sm font-medium text-gray-900">정산 방식</label>
                <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                        <input type="radio" name="paymentType" value="perTrip" checked={formData.paymentType === 'perTrip'} onChange={handleInputChange} className="w-4 h-4 text-blue-600" />
                        <span className="ml-2 text-sm font-medium">회당 지급</span>
                    </label>
                    <label className="flex items-center">
                        <input type="radio" name="paymentType" value="monthly" checked={formData.paymentType === 'monthly'} onChange={handleInputChange} className="w-4 h-4 text-blue-600" />
                        <span className="ml-2 text-sm font-medium">월대 지급</span>
                    </label>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.paymentType === 'perTrip' ? (
                  <div>
                      <label htmlFor="driverFare" className="block mb-2 text-sm font-medium text-gray-900">회당 지급운임(원)</label>
                      <input type="number" name="driverFare" id="driverFare" value={formData.driverFare} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border" required min="0" />
                  </div>
                ) : (
                  <div>
                      <label htmlFor="monthlyFare" className="block mb-2 text-sm font-medium text-gray-900">월 고정운임(원)</label>
                      <input type="number" name="monthlyFare" id="monthlyFare" value={formData.monthlyFare} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border" required min="0" />
                  </div>
                )}
              <div>
                  <label htmlFor="billingFare" className="block mb-2 text-sm font-medium text-gray-900">매입운임(원)</label>
                  <input type="number" name="billingFare" id="billingFare" value={formData.billingFare} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border" required min="0" />
              </div>
            </div>
            <div>
                <label htmlFor="driverId" className="block mb-2 text-sm font-medium text-gray-900">기사 배정</label>
                <select name="driverId" id="driverId" value={formData.driverId} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border">
                    <option value="">배정 안함</option>
                    {drivers.map(driver => <option key={driver.id} value={driver.id}>{driver.name}</option>)}
                </select>
            </div>
          <div className="flex justify-end pt-4">
            <button type="button" onClick={closeModal} className="text-gray-500 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 mr-2">취소</button>
            <button type="submit" className="text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center">{editingRoute ? "수정하기" : "추가하기"}</button>
          </div>
        </form>
      </Modal>

       <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="코스 삭제 확인">
        <div>
          <p className="text-gray-700">정말로 이 코스를 삭제하시겠습니까?</p>
          <p className="text-sm text-gray-500 mt-2">이 코스와 관련된 모든 '미정산' 운행 내역도 함께 삭제됩니다.</p>
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

export default FixedRoutesPage;