import React, { useRef, useState } from 'react';
import { Driver, Trip, FixedRoute } from '../types';
import Modal from './Modal';

interface DashboardProps {
    drivers: Driver[];
    trips: Trip[];
    fixedRoutes: FixedRoute[];
    onResetData: () => void;
    onExportData: () => void;
    onImportData: (file: File) => void;
}

// KST (UTC+9) 기준 현재 날짜 정보를 반환하는 헬퍼 함수
const getKSTNow = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (9 * 3600000));
};


const Dashboard: React.FC<DashboardProps> = ({ drivers, trips, fixedRoutes, onResetData, onExportData, onImportData }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
    const [confirmMessage, setConfirmMessage] = useState({ title: '', body: ''});


    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setConfirmMessage({
            title: "데이터 불러오기 확인",
            body: "파일을 불러오면 현재 데이터는 모두 덮어쓰여집니다. 계속하시겠습니까?"
        });
        setConfirmAction(() => () => {
            onImportData(file);
            if(fileInputRef.current) fileInputRef.current.value = '';
        });
        setIsConfirmModalOpen(true);
    };

    const handleResetClick = () => {
        setConfirmMessage({
            title: "데이터 초기화 확인",
            body: "정말로 모든 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        });
        setConfirmAction(() => onResetData);
        setIsConfirmModalOpen(true);
    };

    const executeConfirm = () => {
        if(confirmAction) {
            confirmAction();
        }
        closeConfirmModal();
    };

    const closeConfirmModal = () => {
        setIsConfirmModalOpen(false);
        setConfirmAction(null);
    };

    const { progress, estimate } = React.useMemo(() => {
        const kstNow = getKSTNow();
        const currentYear = kstNow.getUTCFullYear();
        const currentMonth = kstNow.getUTCMonth();
        const todayDateStr = kstNow.toISOString().split('T')[0];

        const stats = trips.reduce((acc, trip) => {
            const tripDate = new Date(trip.date + 'T00:00:00Z'); // Treat date string as UTC midnight

            if (tripDate.getUTCFullYear() === currentYear && tripDate.getUTCMonth() === currentMonth) {
                // Monthly Estimate Calculation (for the entire current month)
                acc.estimate.totalTrips += 1;
                acc.estimate.totalDriverFare += trip.isAbsence ? 0 : trip.driverFare;
                acc.estimate.totalBillingFare += trip.billingFare;

                // Progress Calculation (from month start up to today)
                if (trip.date <= todayDateStr) {
                    acc.progress.totalTrips += 1;
                    acc.progress.totalDriverFare += trip.isAbsence ? 0 : trip.driverFare;
                    acc.progress.totalBillingFare += trip.billingFare;
                }
            }
            return acc;
        }, {
            progress: { totalTrips: 0, totalDriverFare: 0, totalBillingFare: 0 },
            estimate: { totalTrips: 0, totalDriverFare: 0, totalBillingFare: 0 }
        });
        
        return stats;

    }, [trips]);

    const recentTrips = [...trips]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5);

    const driverMap = React.useMemo(() =>
        drivers.reduce((acc, driver) => {
            acc[driver.id] = driver.name;
            return acc;
        }, {} as Record<string, string>), [drivers]);
        
    const routeMap = React.useMemo(() =>
        fixedRoutes.reduce((acc, route) => {
            acc[route.id] = route.name;
            return acc;
        }, {} as Record<string, string>), [fixedRoutes]);

    const getRouteName = (trip: Trip) => {
        if (trip.routeType === 'fixed' && trip.fixedRouteId) {
            return routeMap[trip.fixedRouteId] || '삭제된 코스';
        }
        return trip.customRouteName || '커스텀';
    }
    
    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
                <h2 className="text-3xl font-bold text-gray-800">대시보드</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onExportData}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg shadow hover:bg-green-600 transition-colors text-sm font-semibold"
                    >
                        데이터 내보내기
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-600 transition-colors text-sm font-semibold"
                    >
                        데이터 불러오기
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept=".json" 
                        className="hidden"
                    />
                    <button
                        onClick={handleResetClick}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg shadow hover:bg-red-600 transition-colors text-sm font-semibold"
                    >
                        데이터 초기화
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-600">총 기사 수</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{drivers.length}명</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-600">이달의 운행 건수</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{progress.totalTrips}건</p>
                    <p className="text-sm text-gray-500 mt-1">(월 예상: {estimate.totalTrips}건)</p>
                </div>
                 <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-600">이달의 총 지급운임</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{progress.totalDriverFare.toLocaleString()}원</p>
                    <p className="text-sm text-gray-500 mt-1">(월 예상: {estimate.totalDriverFare.toLocaleString()}원)</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-600">이달의 총 매입운임</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{progress.totalBillingFare.toLocaleString()}원</p>
                     <p className="text-sm text-gray-500 mt-1">(월 예상: {estimate.totalBillingFare.toLocaleString()}원)</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <h3 className="text-xl font-semibold text-gray-800 p-6 border-b">최근 운행 내역</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-500">
                         <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">날짜</th>
                                <th scope="col" className="px-6 py-3">기사</th>
                                <th scope="col" className="px-6 py-3">코스명</th>
                                <th scope="col" className="px-6 py-3">지급운임</th>
                                <th scope="col" className="px-6 py-3">매입운임</th>
                                <th scope="col" className="px-6 py-3">정산 여부</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentTrips.length > 0 ? recentTrips.map(trip => (
                                <tr key={trip.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4">{trip.date}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{driverMap[trip.driverId] || '삭제된 기사'}</td>
                                    <td className="px-6 py-4">{getRouteName(trip)}</td>
                                    <td className="px-6 py-4">{(trip.isAbsence ? 0 : trip.driverFare).toLocaleString()}원</td>
                                    <td className="px-6 py-4">{trip.billingFare.toLocaleString()}원</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${trip.isSettled ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {trip.isSettled ? '완료' : '미정산'}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-gray-500">운행 내역이 없습니다.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <Modal isOpen={isConfirmModalOpen} onClose={closeConfirmModal} title={confirmMessage.title}>
                <div>
                    <p className="text-gray-700">{confirmMessage.body}</p>
                    <div className="flex justify-end mt-6 space-x-2">
                        <button
                            onClick={closeConfirmModal}
                            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors"
                        >
                            취소
                        </button>
                        <button
                            onClick={executeConfirm}
                            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                        >
                            확인
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Dashboard;