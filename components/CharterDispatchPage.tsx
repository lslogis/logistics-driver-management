import React, { useState, useMemo, useEffect } from 'react';
import { CharterDispatch, CharterCost, Driver } from '../types';
import Modal from './Modal';
import { PlusIcon, PencilIcon, TrashIcon, DownloadIcon, XIcon } from './icons';

interface CharterDispatchPageProps {
  charterDispatches: CharterDispatch[];
  charterCosts: CharterCost[];
  drivers: Driver[];
  onAddCharterDispatch: (dispatch: Omit<CharterDispatch, 'id'>) => void;
  onUpdateCharterDispatch: (dispatch: CharterDispatch) => void;
  onDeleteCharterDispatch: (dispatchId: string) => void;
  onAddCharterCost: (cost: Omit<CharterCost, 'id'>) => void;
}

const getTodayKSTString = (): string => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const kst = new Date(utc + (9 * 3600000));
    return kst.toISOString().split('T')[0];
};

const emptyDispatch: Omit<CharterDispatch, 'id'> = {
  date: getTodayKSTString(),
  loadingPoint: '',
  vehicleType: '',
  routeName: '',
  destinations: [],
  driverName: '',
  vehicleNumber: '',
  driverContact: '',
  billingBaseFare: 0,
  billingStopoverFee: 0,
  billingRegionMoveFee: 0,
  billingMiscFee: 0,
  totalBillingAmount: 0,
  driverCost: 0,
  margin: 0,
  isInvoiceConfirmed: false,
  remarks: '',
};

// Form state needs extra fields for calculation inputs
type FormData = Omit<CharterDispatch, 'id'> & {
    stopoverCount: number;
    currentDestinationInput: string;
    isManualBilling: boolean;
};

const CharterDispatchPage: React.FC<CharterDispatchPageProps> = ({ charterDispatches, charterCosts, drivers, onAddCharterDispatch, onUpdateCharterDispatch, onDeleteCharterDispatch, onAddCharterCost }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({ ...emptyDispatch, stopoverCount: 0, currentDestinationInput: '', isManualBilling: false });
  const [editingDispatch, setEditingDispatch] = useState<CharterDispatch | null>(null);
  const [driverSuggestions, setDriverSuggestions] = useState<Driver[]>([]);
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [dispatchToDelete, setDispatchToDelete] = useState<string | null>(null);

  const [dateFilter, setDateFilter] = useState({ start: getTodayKSTString(), end: getTodayKSTString() });
  const [unregisteredDestinations, setUnregisteredDestinations] = useState<string[]>([]);
  
  const uniqueLoadingPoints = useMemo(() => {
    const points = new Set(charterCosts.map(c => c.loadingPoint));
    return Array.from(points).sort();
  }, [charterCosts]);

  const uniqueVehicleTypes = useMemo(() => {
    const types = new Set(charterCosts.map(c => c.vehicleType));
    return Array.from(types).sort();
  }, [charterCosts]);

  // Auto-calculation logic
  useEffect(() => {
    if (formData.isManualBilling) {
      setFormData(prev => ({
        ...prev,
        billingBaseFare: 0,
        billingStopoverFee: 0,
        billingRegionMoveFee: 0,
        stopoverCount: 0,
      }));
      setUnregisteredDestinations([]);
      return;
    }

    if (!formData.loadingPoint || !formData.vehicleType) {
      setFormData(prev => ({ ...prev, billingBaseFare: 0, billingStopoverFee: 0, billingRegionMoveFee: 0 }));
      setUnregisteredDestinations([]);
      return;
    };
    
    const relevantFares = charterCosts.filter(c => c.loadingPoint === formData.loadingPoint && c.vehicleType === formData.vehicleType);
    const getFare = (type: string, dest?: string) => {
        if (type === '기본운임' && dest) {
            return relevantFares.find(c => c.fareType === type && c.destination === dest)?.amount || 0;
        }
        return relevantFares.find(c => c.fareType === type && (!c.destination || c.destination.trim() === ''))?.amount || 0;
    };
    
    // 1. 기본운임 (Base Fare) - Find the max fare among all destinations
    let maxBaseFare = 0;
    const missingDests: string[] = [];
    if (formData.destinations.length > 0) {
        const destinationFares = formData.destinations.map(dest => {
            const fare = getFare('기본운임', dest);
            if(fare === 0) {
                missingDests.push(dest);
            }
            return fare;
        });
        maxBaseFare = Math.max(0, ...destinationFares);
    }
    setUnregisteredDestinations(missingDests);
    
    // 2. 착지수당 (Stopover Fee) - based on user input for total stops
    const stopoverUnitCost = getFare('착지수당');
    const stopoverFee = stopoverUnitCost * (formData.stopoverCount > 1 ? formData.stopoverCount - 1 : 0);
    
    // 3. 지역이동비 (Region Move Fee) - based on number of destinations
    const regionMoveUnitCost = getFare('지역이동');
    const regionMoveFee = regionMoveUnitCost * (formData.destinations.length > 1 ? formData.destinations.length - 1 : 0);

    setFormData(prev => ({ 
        ...prev, 
        billingBaseFare: maxBaseFare, 
        billingStopoverFee: stopoverFee, 
        billingRegionMoveFee: regionMoveFee 
    }));
  }, [formData.loadingPoint, formData.vehicleType, formData.destinations, formData.stopoverCount, formData.isManualBilling, charterCosts]);

  // Update totals and margin
  useEffect(() => {
    const totalBilling = formData.billingBaseFare + formData.billingStopoverFee + formData.billingRegionMoveFee + formData.billingMiscFee;
    const margin = totalBilling - formData.driverCost;
    setFormData(prev => ({ ...prev, totalBillingAmount: totalBilling, margin: margin }));
  }, [formData.billingBaseFare, formData.billingStopoverFee, formData.billingRegionMoveFee, formData.billingMiscFee, formData.driverCost]);


  const openModalForNew = () => {
    setEditingDispatch(null);
    setFormData({ ...emptyDispatch, stopoverCount: 0, currentDestinationInput: '', isManualBilling: false });
    setUnregisteredDestinations([]);
    setIsModalOpen(true);
  };

  const openModalForEdit = (dispatch: CharterDispatch) => {
    const stopoverFeeItem = charterCosts.find(c => c.loadingPoint === dispatch.loadingPoint && c.vehicleType === dispatch.vehicleType && c.fareType === '착지수당');
    const stopoverCount = stopoverFeeItem && stopoverFeeItem.amount > 0 ? (dispatch.billingStopoverFee / stopoverFeeItem.amount) + 1 : 0;
    
    const wasManual = dispatch.billingBaseFare === 0 && dispatch.billingStopoverFee === 0 && dispatch.billingRegionMoveFee === 0 && dispatch.totalBillingAmount === dispatch.billingMiscFee;

    setEditingDispatch(dispatch);
    setFormData({ ...dispatch, stopoverCount, currentDestinationInput: '', isManualBilling: wasManual });
    setUnregisteredDestinations([]);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDispatch(null);
    setDriverSuggestions([]);
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        if (name === 'isManualBilling') {
            setFormData(prev => ({ ...prev, isManualBilling: checked }));
        } else {
             setFormData(prev => ({ ...prev, [name]: checked }));
        }
    } else if (name === 'driverName') {
        setFormData(prev => ({ ...prev, driverName: value }));
        if (value) {
            setDriverSuggestions(drivers.filter(d => d.name.toLowerCase().includes(value.toLowerCase()) || d.vehicleNumber.includes(value)));
        } else {
            setDriverSuggestions([]);
        }
    }
    else {
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    }
  };

  const handleDriverSelect = (driver: Driver) => {
    setFormData(prev => ({
        ...prev,
        driverName: driver.name,
        vehicleNumber: driver.vehicleNumber,
        driverContact: driver.contact,
    }));
    setDriverSuggestions([]);
  };

  const handleDestinationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && formData.currentDestinationInput.trim() !== '') {
          e.preventDefault();
          setFormData(prev => ({
              ...prev,
              destinations: [...prev.destinations, prev.currentDestinationInput.trim()],
              currentDestinationInput: ''
          }));
      }
  };
  
  const removeDestination = (indexToRemove: number) => {
      setFormData(prev => ({
          ...prev,
          destinations: prev.destinations.filter((_, index) => index !== indexToRemove)
      }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.date && formData.loadingPoint && formData.vehicleType) {
      const { currentDestinationInput, isManualBilling, stopoverCount, ...dispatchData } = formData;
      if (editingDispatch) {
        onUpdateCharterDispatch({ ...editingDispatch, ...dispatchData });
      } else {
        onAddCharterDispatch(dispatchData);
      }
      closeModal();
    } else {
      alert("날짜, 상차지, 톤수는 필수입니다.");
    }
  };
  
  const handleDelete = (dispatchId: string) => {
    setDispatchToDelete(dispatchId);
    setIsConfirmModalOpen(true);
  }

  const confirmDelete = () => {
      if (dispatchToDelete) { onDeleteCharterDispatch(dispatchToDelete); }
      setIsConfirmModalOpen(false);
      setDispatchToDelete(null);
  };
  
  const filteredDispatches = useMemo(() => 
    charterDispatches
        .filter(d => d.date >= dateFilter.start && d.date <= dateFilter.end)
        .sort((a,b) => b.date.localeCompare(a.date))
  , [charterDispatches, dateFilter]);
  
  const summary = useMemo(() => 
      filteredDispatches.reduce((acc, dispatch) => {
          acc.totalBilling += dispatch.totalBillingAmount;
          acc.totalCost += dispatch.driverCost;
          acc.totalMargin += dispatch.margin;
          return acc;
      }, { totalBilling: 0, totalCost: 0, totalMargin: 0})
  , [filteredDispatches]);

  const handleAddNewFare = () => {
    const { loadingPoint, vehicleType, destinations } = formData;

    if (!loadingPoint || !vehicleType || destinations.length === 0) {
        alert("운임을 추가하려면 상차지, 톤수, 행선지를 먼저 입력해야 합니다.");
        return;
    }

    const targetDestination = destinations.find(dest => 
        !charterCosts.some(cost => 
            cost.loadingPoint === loadingPoint &&
            cost.vehicleType === vehicleType &&
            cost.destination === dest &&
            cost.fareType === '기본운임'
        )
    );

    if (!targetDestination) {
        alert("입력된 모든 행선지에 대한 기본운임이 이미 운임표에 존재합니다.");
        return;
    }

    const amountStr = prompt(`'${targetDestination}' 행선지의 '기본운임'을 운임표에 추가합니다.\n금액을 입력해주세요:`);

    if (amountStr) {
        const amount = parseInt(amountStr, 10);
        if (!isNaN(amount) && amount > 0) {
            const newFare: Omit<CharterCost, 'id'> = {
                loadingPoint,
                destination: targetDestination,
                vehicleType,
                fareType: '기본운임',
                amount,
            };
            onAddCharterCost(newFare);
            alert(`'${targetDestination}'의 기본운임 ${amount.toLocaleString()}원이 운임표에 추가되었습니다. 잠시 후 자동으로 계산됩니다.`);
        } else {
            alert("유효한 숫자를 입력해주세요.");
        }
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">용차배차 관리</h2>
        <button onClick={openModalForNew} className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center"><PlusIcon className="w-5 h-5 mr-2" />배차 등록</button>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex justify-between items-end flex-wrap gap-4">
          <div>
            <label className="text-sm font-medium">조회 기간:</label>
            <div className="flex items-center gap-2 mt-1">
                <input type="date" value={dateFilter.start} onChange={e => setDateFilter(p => ({...p, start: e.target.value}))} className="p-2 border rounded-md" />
                <span>~</span>
                <input type="date" value={dateFilter.end} onChange={e => setDateFilter(p => ({...p, end: e.target.value}))} className="p-2 border rounded-md" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
              <div><h3 className="text-sm font-semibold text-gray-600">총 청구액</h3><p className="text-lg font-bold text-blue-600">{summary.totalBilling.toLocaleString()}원</p></div>
              <div><h3 className="text-sm font-semibold text-gray-600">총 지급액</h3><p className="text-lg font-bold text-red-600">{summary.totalCost.toLocaleString()}원</p></div>
              <div><h3 className="text-sm font-semibold text-gray-600">총 마진</h3><p className="text-lg font-bold">{summary.totalMargin.toLocaleString()}원</p></div>
          </div>
      </div>


      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">날짜</th>
                <th className="px-6 py-3">상차지/호차</th>
                <th className="px-6 py-3">기사/연락처</th>
                <th className="px-6 py-3">행선지</th>
                <th className="px-6 py-3">청구액</th>
                <th className="px-6 py-3">지급액</th>
                <th className="px-6 py-3">마진</th>
                <th className="px-6 py-3">계산서</th>
                <th className="px-6 py-3 text-center">작업</th>
              </tr>
            </thead>
            <tbody>
              {filteredDispatches.map((d) => (
                <tr key={d.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{d.date}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{d.loadingPoint} {d.routeName} ({d.vehicleType})</td>
                  <td className="px-6 py-4">{d.driverName}<br/>{d.driverContact}</td>
                  <td className="px-6 py-4">{d.destinations.join(', ')}</td>
                  <td className="px-6 py-4 text-blue-600 font-semibold">{d.totalBillingAmount.toLocaleString()}원</td>
                  <td className="px-6 py-4 text-red-600 font-semibold">{d.driverCost.toLocaleString()}원</td>
                  <td className="px-6 py-4">{d.margin.toLocaleString()}원</td>
                  <td className="px-6 py-4 text-center"><input type="checkbox" checked={d.isInvoiceConfirmed} readOnly className="h-4 w-4"/></td>
                  <td className="px-6 py-4 flex justify-center items-center space-x-2">
                    <button onClick={() => openModalForEdit(d)} className="p-1 text-blue-600 hover:text-blue-800"><PencilIcon className="w-5 h-5" /></button>
                    <button onClick={() => handleDelete(d.id)} className="p-1 text-red-600 hover:text-red-800"><TrashIcon className="w-5 h-5" /></button>
                  </td>
                </tr>
              ))}
              {filteredDispatches.length === 0 && (
                <tr><td colSpan={9} className="text-center py-10">해당 기간의 배차 내역이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingDispatch ? "용차배차 수정" : "용차배차 등록"}>
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2 mb-4">기본 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div><label className="block text-sm font-medium">날짜*</label><input type="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded-md" required /></div>
                <div>
                    <label className="block text-sm font-medium">상차지*</label>
                    <select name="loadingPoint" value={formData.loadingPoint} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded-md" required>
                        <option value="">상차지 선택</option>
                        {uniqueLoadingPoints.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium">톤수*</label>
                    <select name="vehicleType" value={formData.vehicleType} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded-md" required>
                        <option value="">톤수 선택</option>
                        {uniqueVehicleTypes.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                </div>
                <div><label className="block text-sm font-medium">호차</label><input type="text" name="routeName" value={formData.routeName} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded-md" /></div>
            </div>
             <div>
                <label className="block text-sm font-medium">지역(행선지)</label>
                <input type="text" name="currentDestinationInput" value={formData.currentDestinationInput} onChange={handleInputChange} onKeyDown={handleDestinationKeyDown} className="w-full mt-1 p-2 border rounded-md" placeholder="지역 입력 후 Enter" />
                <div className="flex flex-wrap gap-2 mt-2">
                    {formData.destinations.map((dest, index) => (
                        <span key={index} className={`text-sm font-medium px-2.5 py-1 rounded-full flex items-center ${unregisteredDestinations.includes(dest) ? 'bg-red-100 text-red-800 ring-1 ring-red-300' : 'bg-gray-200 text-gray-800'}`}>
                            {dest}
                            <button type="button" onClick={() => removeDestination(index)} className="ml-2 text-gray-500 hover:text-gray-800"><XIcon className="w-3 h-3"/></button>
                        </span>
                    ))}
                </div>
                 {unregisteredDestinations.length > 0 && !formData.isManualBilling && (
                    <div className="mt-2 text-sm text-red-600 p-2 bg-red-50 rounded-md">
                        <p><strong className="font-semibold">주의:</strong> 다음 행선지의 운임 정보가 없습니다: <span className="font-semibold">{unregisteredDestinations.join(', ')}</span></p>
                        <p className="mt-1">
                            '신규 운임 등록' 버튼으로 운임표에 추가하거나, '수기 정산'을 선택하여 직접 금액을 입력하세요.
                        </p>
                    </div>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                    <label className="block text-sm font-medium">기사명</label>
                    <input type="text" name="driverName" value={formData.driverName} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded-md" autoComplete="off"/>
                    {driverSuggestions.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white border rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                            {driverSuggestions.map(driver => (
                                <li key={driver.id} onClick={() => handleDriverSelect(driver)} className="p-2 hover:bg-gray-100 cursor-pointer">
                                    {driver.name} ({driver.vehicleNumber})
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div><label className="block text-sm font-medium">차량번호</label><input type="text" name="vehicleNumber" value={formData.vehicleNumber} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded-md" /></div>
                <div><label className="block text-sm font-medium">연락처</label><input type="text" name="driverContact" value={formData.driverContact} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded-md" /></div>
            </div>
            
            <div className="flex justify-between items-center pt-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold border-b pb-2 mb-4">청구 내역 (센터)</h3>
                <button type="button" onClick={handleAddNewFare} className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded mb-4">신규 운임 등록</button>
              </div>
              <label className="flex items-center pb-2 mb-4">
                  <input type="checkbox" name="isManualBilling" checked={formData.isManualBilling} onChange={handleInputChange} className="h-4 w-4" />
                  <span className="ml-2 text-sm font-medium">수기 정산</span>
              </label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="md:col-span-2"><label className="block text-sm font-medium">기본운임</label><input type="number" name="billingBaseFare" value={formData.billingBaseFare} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded-md bg-gray-100" readOnly /></div>
                <div><label className="block text-sm font-medium">착수</label><input type="number" name="stopoverCount" value={formData.stopoverCount} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded-md" disabled={formData.isManualBilling} placeholder="총 경유지 수" /></div>
                <div className="md:col-span-2"><label className="block text-sm font-medium">착지수당 ({formData.stopoverCount > 1 ? formData.stopoverCount - 1 : 0}회)</label><input type="number" name="billingStopoverFee" value={formData.billingStopoverFee} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded-md bg-gray-100" readOnly /></div>
                
                <div className="md:col-span-2"><label className="block text-sm font-medium">지역이동비 ({formData.destinations.length > 1 ? formData.destinations.length - 1 : 0}회)</label><input type="number" name="billingRegionMoveFee" value={formData.billingRegionMoveFee} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded-md bg-gray-100" readOnly /></div>
                <div className="md:col-span-1"><label className="block text-sm font-medium">기타(수기)</label><input type="number" name="billingMiscFee" value={formData.billingMiscFee} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded-md" /></div>
                <div className="md:col-span-2"><label className="block text-sm font-medium">청구 합계</label><input type="number" value={formData.totalBillingAmount} className="w-full mt-1 p-2 border rounded-md bg-blue-100 font-bold" readOnly /></div>
            </div>
            
            <h3 className="text-lg font-semibold border-b pb-2 mb-4 pt-4">지급 및 정산</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1"><label className="block text-sm font-medium">용차비(지급액)</label><input type="number" name="driverCost" value={formData.driverCost} onChange={handleInputChange} className="w-full mt-1 p-2 border rounded-md" /></div>
                <div className="md:col-span-1"><label className="block text-sm font-medium">마진</label><input type="number" name="margin" value={formData.margin} className="w-full mt-1 p-2 border rounded-md bg-green-100 font-bold" readOnly /></div>
                <div className="md:col-span-1 flex items-end pb-2"><label className="flex items-center"><input type="checkbox" name="isInvoiceConfirmed" checked={formData.isInvoiceConfirmed} onChange={handleInputChange} className="h-4 w-4" /><span className="ml-2">계산서 확인</span></label></div>
            </div>
             <div><label className="block text-sm font-medium">기타 사유</label><textarea name="remarks" value={formData.remarks} onChange={(e) => setFormData(prev => ({...prev, remarks: e.target.value}))} rows={2} className="w-full mt-1 p-2 border rounded-md" /></div>
            
             <div className="flex justify-end pt-4">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 mr-2 bg-white border rounded-lg">취소</button>
                <button type="submit" className="px-5 py-2.5 text-white bg-blue-600 rounded-lg">{editingDispatch ? "수정하기" : "등록하기"}</button>
            </div>
        </form>
      </Modal>

      <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="배차 내역 삭제 확인">
        <div>
          <p>정말로 이 배차 내역을 삭제하시겠습니까?</p>
          <div className="flex justify-end mt-6 space-x-2">
            <button onClick={() => setIsConfirmModalOpen(false)} className="px-4 py-2 rounded-lg bg-gray-200">취소</button>
            <button onClick={confirmDelete} className="px-4 py-2 rounded-lg bg-red-600 text-white">삭제</button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default CharterDispatchPage;