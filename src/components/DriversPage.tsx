

import React, { useState, useEffect, useRef } from 'react';
import { Driver, FixedRoute } from '../types';
import Modal from './Modal';
import { PlusIcon, PencilIcon, TrashIcon, DownloadIcon, UploadIcon } from './icons';

interface DriversPageProps {
  drivers: Driver[];
  fixedRoutes: FixedRoute[];
  onAddDriver: (driver: Omit<Driver, 'id' | 'registrationDate'>) => void;
  onUpdateDriver: (driver: Driver) => void;
  onDeleteDriver: (driverId: string) => void;
  onImportDrivers: (newDrivers: Omit<Driver, 'id' | 'registrationDate'>[]) => void;
}

const emptyDriver: Omit<Driver, 'id' | 'registrationDate'> = {
  name: '', contact: '', vehicleNumber: '',
  businessNumber: '', companyName: '', representativeName: '',
  bank: '', accountNumber: '', remarks: ''
};

const DriversPage: React.FC<DriversPageProps> = ({ drivers, fixedRoutes, onAddDriver, onUpdateDriver, onDeleteDriver, onImportDrivers }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(emptyDriver);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<string | null>(null);


  useEffect(() => {
    if (editingDriver) {
      const { id, registrationDate, ...editableData } = editingDriver;
      setFormData({
        name: editableData.name,
        contact: editableData.contact,
        vehicleNumber: editableData.vehicleNumber,
        businessNumber: editableData.businessNumber || '',
        companyName: editableData.companyName || '',
        representativeName: editableData.representativeName || '',
        bank: editableData.bank || '',
        accountNumber: editableData.accountNumber || '',
        remarks: editableData.remarks || '',
      });
    } else {
      setFormData(emptyDriver);
    }
  }, [editingDriver]);

  const openModalForNew = () => {
    setEditingDriver(null);
    setFormData(emptyDriver);
    setIsModalOpen(true);
  };

  const openModalForEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDriver(null);
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.contact && formData.vehicleNumber) {
      if (editingDriver) {
        onUpdateDriver({ ...editingDriver, ...formData });
      } else {
        onAddDriver(formData);
      }
      closeModal();
    } else {
      alert("이름, 연락처, 차량번호는 필수입니다.");
    }
  };
  
  const handleDelete = (driverId: string) => {
    setDriverToDelete(driverId);
    setIsConfirmModalOpen(true);
  }

  const confirmDelete = () => {
      if (driverToDelete) {
          onDeleteDriver(driverToDelete);
      }
      setIsConfirmModalOpen(false);
      setDriverToDelete(null);
  };
  
  const driverRouteMap = React.useMemo(() => 
    fixedRoutes.reduce((acc, route) => {
        if (route.driverId) {
            if (!acc[route.driverId]) {
                acc[route.driverId] = [];
            }
            acc[route.driverId].push(route.name);
        }
        return acc;
    }, {} as Record<string, string[]>), [fixedRoutes]);

  const handleExportExcel = () => {
    const header = ['이름*', '연락처*', '차량번호*', '고정 코스', '등록일', '상호', '대표자', '사업자번호', '은행', '계좌번호', '비고'];
    const dataToExport = drivers.map(d => ({
        '이름*': d.name,
        '연락처*': d.contact,
        '차량번호*': d.vehicleNumber,
        '고정 코스': driverRouteMap[d.id]?.join(', ') || '-',
        '등록일': d.registrationDate,
        '상호': d.companyName,
        '대표자': d.representativeName,
        '사업자번호': d.businessNumber,
        '은행': d.bank,
        '계좌번호': d.accountNumber,
        '비고': d.remarks,
    }));

    const worksheet = (window as any).XLSX.utils.json_to_sheet(dataToExport, { header });
    
    // Styling
    const headerStyle = { font: { bold: true } };
    const colWidths = header.map(h => ({ wch: h.includes('코스') || h.includes('계좌번호') ? 25 : 15 }));
    worksheet['!cols'] = colWidths;
    
    header.forEach((_, colIndex) => {
        const cellAddress = (window as any).XLSX.utils.encode_cell({ c: colIndex, r: 0 });
        worksheet[cellAddress].s = headerStyle;
    });

    const workbook = (window as any).XLSX.utils.book_new();
    (window as any).XLSX.utils.book_append_sheet(workbook, worksheet, "기사 목록");
    (window as any).XLSX.writeFile(workbook, "기사_목록.xlsx");
  };

  const handleDownloadTemplate = () => {
    const templateHeader = ['이름*', '연락처*', '차량번호*', '상호', '대표자', '사업자번호', '은행', '계좌번호', '비고'];
    const worksheet = (window as any).XLSX.utils.aoa_to_sheet([templateHeader]);
    worksheet['!cols'] = templateHeader.map(() => ({ wch: 18 }));
    const workbook = (window as any).XLSX.utils.book_new();
    (window as any).XLSX.utils.book_append_sheet(workbook, worksheet, "기사 등록 양식");
    (window as any).XLSX.writeFile(workbook, "기사_등록_양식.xlsx");
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
            
            const newDrivers = json.map((row: any) => ({
                name: row['이름*'] || row['이름'] || '',
                contact: row['연락처*'] || row['연락처'] || '',
                vehicleNumber: row['차량번호*'] || row['차량번호'] || row['차량 번호'] || '',
                companyName: row['상호'] || '',
                representativeName: row['대표자'] || '',
                businessNumber: row['사업자번호'] || '',
                bank: row['은행'] || '',
                accountNumber: row['계좌번호'] || '',
                remarks: row['비고'] || '',
            }));

            onImportDrivers(newDrivers);
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
        <h2 className="text-3xl font-bold text-gray-800">기사 관리</h2>
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
              기사 추가
            </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">이름</th>
                <th scope="col" className="px-6 py-3">연락처</th>
                <th scope="col" className="px-6 py-3">차량 번호</th>
                <th scope="col" className="px-6 py-3">고정 코스</th>
                <th scope="col" className="px-6 py-3">등록일</th>
                <th scope="col" className="px-6 py-3 text-center">작업</th>
              </tr>
            </thead>
            <tbody>
              {drivers.length > 0 ? drivers.map((driver) => (
                <tr key={driver.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{driver.name}</td>
                  <td className="px-6 py-4">{driver.contact}</td>
                  <td className="px-6 py-4">{driver.vehicleNumber}</td>
                  <td className="px-6 py-4">{driverRouteMap[driver.id] ? driverRouteMap[driver.id].join(', ') : '-'}</td>
                  <td className="px-6 py-4">{driver.registrationDate}</td>
                  <td className="px-6 py-4 flex justify-center items-center space-x-2">
                    <button onClick={() => openModalForEdit(driver)} className="p-1 text-blue-600 hover:text-blue-800"><PencilIcon className="w-5 h-5" /></button>
                    <button onClick={() => handleDelete(driver.id)} className="p-1 text-red-600 hover:text-red-800"><TrashIcon className="w-5 h-5" /></button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">등록된 기사가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingDriver ? "기사 정보 수정" : "새 기사 추가"}>
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2 mb-4">필수 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900">이름</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border" required />
                </div>
                <div>
                    <label htmlFor="contact" className="block mb-2 text-sm font-medium text-gray-900">연락처</label>
                    <input type="text" name="contact" id="contact" value={formData.contact} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border" required />
                </div>
                <div>
                    <label htmlFor="vehicleNumber" className="block mb-2 text-sm font-medium text-gray-900">차량 번호</label>
                    <input type="text" name="vehicleNumber" id="vehicleNumber" value={formData.vehicleNumber} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border" required />
                </div>
            </div>
            
            <h3 className="text-lg font-semibold border-b pb-2 mb-4 pt-4">선택 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="companyName" className="block mb-2 text-sm font-medium text-gray-900">상호</label>
                    <input type="text" name="companyName" id="companyName" value={formData.companyName} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border" />
                </div>
                <div>
                    <label htmlFor="representativeName" className="block mb-2 text-sm font-medium text-gray-900">대표자</label>
                    <input type="text" name="representativeName" id="representativeName" value={formData.representativeName} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border" />
                </div>
                <div>
                    <label htmlFor="businessNumber" className="block mb-2 text-sm font-medium text-gray-900">사업자번호</label>
                    <input type="text" name="businessNumber" id="businessNumber" value={formData.businessNumber} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border" />
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="bank" className="block mb-2 text-sm font-medium text-gray-900">은행</label>
                    <input type="text" name="bank" id="bank" value={formData.bank} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border" />
                </div>
                <div>
                    <label htmlFor="accountNumber" className="block mb-2 text-sm font-medium text-gray-900">계좌번호</label>
                    <input type="text" name="accountNumber" id="accountNumber" value={formData.accountNumber} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border" />
                </div>
            </div>
            <div>
                <label htmlFor="remarks" className="block mb-2 text-sm font-medium text-gray-900">비고</label>
                <textarea name="remarks" id="remarks" value={formData.remarks || ''} onChange={handleInputChange} rows={3} className="w-full p-2.5 bg-gray-50 border"></textarea>
            </div>
          <div className="flex justify-end pt-4">
            <button type="button" onClick={closeModal} className="text-gray-500 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 mr-2">취소</button>
            <button type="submit" className="text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center">{editingDriver ? "수정하기" : "추가하기"}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="기사 삭제 확인">
        <div>
          <p className="text-gray-700">정말로 이 기사를 삭제하시겠습니까?</p>
          <p className="text-sm text-gray-500 mt-2">관련된 모든 운행 내역이 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다.</p>
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

export default DriversPage;