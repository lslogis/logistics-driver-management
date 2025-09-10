import React, { useState, useMemo, useRef } from 'react';
import { CharterCost } from '../types';
import Modal from './Modal';
import { PlusIcon, PencilIcon, TrashIcon, DownloadIcon, UploadIcon } from './icons';

interface FareTablePageProps {
  charterCosts: CharterCost[];
  onAddCharterCost: (cost: Omit<CharterCost, 'id'>) => void;
  onUpdateCharterCost: (cost: CharterCost) => void;
  onDeleteCharterCost: (costId: string) => void;
  onImportCharterCosts: (costs: (Omit<CharterCost, 'id' | 'amount'> & { amount: string | number })[]) => void;
}

const emptyFareData: Omit<CharterCost, 'id'> = {
  loadingPoint: '',
  destination: '',
  vehicleType: '',
  fareType: '기본운임',
  amount: 0,
};

const FareTablePage: React.FC<FareTablePageProps> = ({ charterCosts, onAddCharterCost, onUpdateCharterCost, onDeleteCharterCost, onImportCharterCosts }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<CharterCost, 'id'>>(emptyFareData);
  const [editingCost, setEditingCost] = useState<CharterCost | null>(null);
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [costToDelete, setCostToDelete] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filters, setFilters] = useState({
      loadingPoint: '',
      destination: '',
      vehicleType: '',
  });
  
  const uniqueFilterOptions = useMemo(() => {
    const loadingPoints = new Set<string>();
    const vehicleTypes = new Set<string>();
    charterCosts.forEach(cost => {
        loadingPoints.add(cost.loadingPoint);
        vehicleTypes.add(cost.vehicleType);
    });
    return {
        loadingPoints: Array.from(loadingPoints).sort(),
        vehicleTypes: Array.from(vehicleTypes).sort(),
    }
  }, [charterCosts]);

  const filteredCosts = useMemo(() => {
    return charterCosts.filter(cost => {
        const loadingPointMatch = filters.loadingPoint ? cost.loadingPoint === filters.loadingPoint : true;
        const destinationMatch = filters.destination ? cost.destination.toLowerCase().includes(filters.destination.toLowerCase()) : true;
        const vehicleTypeMatch = filters.vehicleType ? cost.vehicleType === filters.vehicleType : true;
        return loadingPointMatch && destinationMatch && vehicleTypeMatch;
    });
  }, [charterCosts, filters]);

  const openModalForNew = () => {
    setEditingCost(null);
    setFormData(emptyFareData);
    setIsModalOpen(true);
  };

  const openModalForEdit = (cost: CharterCost) => {
    setEditingCost(cost);
    const { id, ...editableData } = cost;
    setFormData(editableData);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCost(null);
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).type === 'number' ? parseFloat(value) || 0 : value }));
  };
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.loadingPoint && formData.vehicleType && formData.fareType && formData.amount > 0) {
      if (editingCost) {
        onUpdateCharterCost({ ...editingCost, ...formData });
      } else {
        onAddCharterCost(formData);
      }
      closeModal();
    } else {
      alert("상차지, 차량 종류, 비용 항목, 금액은 필수 항목입니다.");
    }
  };
  
  const handleDelete = (costId: string) => {
    setCostToDelete(costId);
    setIsConfirmModalOpen(true);
  }

  const confirmDelete = () => {
      if (costToDelete) {
          onDeleteCharterCost(costToDelete);
      }
      setIsConfirmModalOpen(false);
      setCostToDelete(null);
  };

  const handleDownloadTemplate = () => {
    const templateHeader = ['center', 'region', 'vehicle_type', 'component_type', 'amount'];
    const worksheet = (window as any).XLSX.utils.aoa_to_sheet([templateHeader]);
    worksheet['!cols'] = templateHeader.map(() => ({ wch: 18 }));
    const workbook = (window as any).XLSX.utils.book_new();
    (window as any).XLSX.utils.book_append_sheet(workbook, worksheet, "운임표 등록 양식");
    (window as any).XLSX.writeFile(workbook, "운임표_등록_양식.xlsx");
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
            const json: any[] = (window as any).XLSX.utils.sheet_to_json(worksheet);
            
            const newCosts = json.map(row => ({
                loadingPoint: row['center'] || '',
                destination: row['region'] || '',
                vehicleType: row['vehicle_type'] || '',
                fareType: row['component_type'] || '',
                amount: row['amount'] || 0,
            }));

            onImportCharterCosts(newCosts);

        } catch (error) {
            console.error(error);
            alert("파일을 처리하는 중 오류가 발생했습니다.");
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };
    reader.readAsArrayBuffer(file);
  };
  
  const handleExportExcel = () => {
      const header = ['center', 'region', 'vehicle_type', 'component_type', 'amount'];
      const dataToExport = filteredCosts.map(cost => ({
          'center': cost.loadingPoint,
          'region': cost.destination,
          'vehicle_type': cost.vehicleType,
          'component_type': cost.fareType,
          'amount': cost.amount,
      }));

      const worksheet = (window as any).XLSX.utils.json_to_sheet(dataToExport, { header });
      
      worksheet['!cols'] = header.map(() => ({ wch: 18 }));
      
      dataToExport.forEach((_, rowIndex) => {
          const costCell = `E${rowIndex + 2}`;
          if (worksheet[costCell]) {
              worksheet[costCell].t = 'n';
              worksheet[costCell].z = '#,##0';
          }
      });

      const workbook = (window as any).XLSX.utils.book_new();
      (window as any).XLSX.utils.book_append_sheet(workbook, worksheet, "운임표");
      (window as any).XLSX.writeFile(workbook, `운임표_내보내기.xlsx`);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <h2 className="text-3xl font-bold text-gray-800">운임표 관리</h2>
        <div className="flex items-center gap-2">
            <button onClick={handleDownloadTemplate} className="bg-gray-500 text-white px-4 py-2 rounded-lg shadow hover:bg-gray-600 flex items-center"><DownloadIcon className="w-5 h-5 mr-2" />양식 다운로드</button>
            <button onClick={() => fileInputRef.current?.click()} className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow hover:bg-purple-700 flex items-center"><UploadIcon className="w-5 h-5 mr-2" />엑셀로 불러오기</button>
            <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".xlsx, .xls, .csv" className="hidden" />
            <button onClick={handleExportExcel} className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 flex items-center"><DownloadIcon className="w-5 h-5 mr-2" />엑셀로 내보내기</button>
            <button onClick={openModalForNew} className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center"><PlusIcon className="w-5 h-5 mr-2" />운임 추가</button>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex items-end gap-4 flex-wrap">
        <div className="flex-grow">
            <label htmlFor="loadingPoint" className="text-sm font-medium">상차지:</label>
            <select name="loadingPoint" value={filters.loadingPoint} onChange={handleFilterChange} className="p-2 border rounded-md ml-2 w-full md:w-auto">
                <option value="">전체</option>
                {uniqueFilterOptions.loadingPoints.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
        </div>
        <div className="flex-grow">
            <label htmlFor="vehicleType" className="text-sm font-medium ml-2">차량 종류:</label>
            <select name="vehicleType" value={filters.vehicleType} onChange={handleFilterChange} className="p-2 border rounded-md ml-2 w-full md:w-auto">
                <option value="">전체</option>
                {uniqueFilterOptions.vehicleTypes.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
        </div>
        <div className="flex-grow">
            <label htmlFor="destination" className="text-sm font-medium ml-2">행선지:</label>
            <input type="text" name="destination" value={filters.destination} onChange={handleFilterChange} className="p-2 border rounded-md ml-2 w-full md:w-auto" placeholder="행선지 검색..." />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">상차지</th>
                <th className="px-6 py-3">행선지</th>
                <th className="px-6 py-3">차량 종류</th>
                <th className="px-6 py-3">비용 항목</th>
                <th className="px-6 py-3">금액</th>
                <th className="px-6 py-3 text-center">작업</th>
              </tr>
            </thead>
            <tbody>
              {filteredCosts.map((cost) => (
                <tr key={cost.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{cost.loadingPoint}</td>
                  <td className="px-6 py-4">{cost.destination || '-'}</td>
                  <td className="px-6 py-4">{cost.vehicleType}</td>
                  <td className="px-6 py-4">{cost.fareType}</td>
                  <td className="px-6 py-4">{cost.amount.toLocaleString()}원</td>
                  <td className="px-6 py-4 flex justify-center items-center space-x-2">
                    <button onClick={() => openModalForEdit(cost)} className="p-1 text-blue-600 hover:text-blue-800"><PencilIcon className="w-5 h-5" /></button>
                    <button onClick={() => handleDelete(cost.id)} className="p-1 text-red-600 hover:text-red-800"><TrashIcon className="w-5 h-5" /></button>
                  </td>
                </tr>
              ))}
              {filteredCosts.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-500">조회된 운임 정보가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingCost ? "운임 정보 수정" : "새 운임 추가"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium">상차지*</label>
              <input type="text" name="loadingPoint" value={formData.loadingPoint} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border" required />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium">행선지</label>
              <input type="text" name="destination" value={formData.destination} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border" />
            </div>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium">차량 종류*</label>
                <input type="text" name="vehicleType" value={formData.vehicleType} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border" required placeholder='예: 1.0톤' />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium">비용 항목*</label>
                <input type="text" name="fareType" value={formData.fareType} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border" required placeholder='예: 기본운임' />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium">금액(원)*</label>
                <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border" required />
              </div>
          </div>
          <div className="flex justify-end pt-4">
            <button type="button" onClick={closeModal} className="text-gray-500 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 mr-2">취소</button>
            <button type="submit" className="text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center">{editingCost ? "수정하기" : "추가하기"}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="운임 정보 삭제 확인">
        <div>
          <p className="text-gray-700">정말로 이 운임 정보를 삭제하시겠습니까?</p>
          <div className="flex justify-end mt-6 space-x-2">
            <button onClick={() => setIsConfirmModalOpen(false)} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300">취소</button>
            <button onClick={confirmDelete} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">삭제</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FareTablePage;