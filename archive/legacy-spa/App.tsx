import React, { useState, useEffect } from 'react';
import Sidebar from './src/components/Sidebar';
import Dashboard from './src/components/Dashboard';
import DriversPage from './src/components/DriversPage';
import TripsPage from './src/components/TripsPage';
import FixedRoutesPage from './src/components/FixedRoutesPage';
import SettlementPage from './src/components/SettlementPage';
import LoadingPointSettlementPage from './src/components/LoadingPointSettlementPage';
import CharterCostsPage from './src/components/CharterCostsPage';
import CharterDispatchPage from './src/components/CharterDispatchPage';
import { Driver, Trip, FixedRoute, CharterCost, CharterDispatch } from './types';

// Basic uuid generator to avoid external dependencies.
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// KST (UTC+9) 기준 현재 날짜 정보를 반환하는 헬퍼 함수
const getKSTNow = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (9 * 3600000));
};


type Page = 'dashboard' | 'drivers' | 'trips' | 'fixedRoutes' | 'settlement' | 'loadingPointSettlement' | 'charterCosts' | 'charterDispatch';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [fixedRoutes, setFixedRoutes] = useState<FixedRoute[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [charterCosts, setCharterCosts] = useState<CharterCost[]>([]);
  const [charterDispatches, setCharterDispatches] = useState<CharterDispatch[]>([]);

  useEffect(() => {
    try {
      setDrivers(JSON.parse(localStorage.getItem('drivers') || '[]'));
      setFixedRoutes(JSON.parse(localStorage.getItem('fixedRoutes') || '[]'));
      setTrips(JSON.parse(localStorage.getItem('trips') || '[]'));
      setCharterCosts(JSON.parse(localStorage.getItem('charterCosts') || '[]'));
      setCharterDispatches(JSON.parse(localStorage.getItem('charterDispatches') || '[]'));
    } catch (error) {
      console.error("Failed to load data from localStorage, resetting data.", error);
      localStorage.clear();
      setDrivers([]);
      setFixedRoutes([]);
      setTrips([]);
      setCharterCosts([]);
      setCharterDispatches([]);
    }
  }, []);

  useEffect(() => { localStorage.setItem('drivers', JSON.stringify(drivers)); }, [drivers]);
  useEffect(() => { localStorage.setItem('fixedRoutes', JSON.stringify(fixedRoutes)); }, [fixedRoutes]);
  useEffect(() => { localStorage.setItem('trips', JSON.stringify(trips)); }, [trips]);
  useEffect(() => { localStorage.setItem('charterCosts', JSON.stringify(charterCosts)); }, [charterCosts]);
  useEffect(() => { localStorage.setItem('charterDispatches', JSON.stringify(charterDispatches)); }, [charterDispatches]);

  // Automatically synchronizes fixed-route trips for the current month based on the schedule.
  // This logic adds, updates, and removes trips as needed to match the fixed routes' configuration.
  useEffect(() => {
    const reconcileFixedTripsForCurrentMonth = () => {
        const kstNow = getKSTNow();
        const currentYear = kstNow.getUTCFullYear();
        const currentMonth = kstNow.getUTCMonth(); // 0-based

        // 1. Generate the "desired" state of fixed trips for the current month
        const desiredTripsMap = new Map<string, Omit<Trip, 'id' | 'isSettled'>>();
        const scheduledRoutes = fixedRoutes.filter(r => r.driverId && r.schedule && r.schedule.length > 0);
        const daysInMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0)).getUTCDate();

        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(Date.UTC(currentYear, currentMonth, day));
            const dayOfWeek = currentDate.getUTCDay();

            scheduledRoutes.forEach(route => {
                if (route.schedule?.includes(dayOfWeek)) {
                    const dateStr = currentDate.toISOString().split('T')[0];
                    const key = `${dateStr}-${route.driverId}-${route.id}`;
                    desiredTripsMap.set(key, {
                        date: dateStr,
                        driverId: route.driverId!,
                        routeType: 'fixed',
                        fixedRouteId: route.id,
                        customRouteName: route.name,
                        departure: route.loadingPoint,
                        destination: route.routeNameSuffix,
                        driverFare: route.paymentType === 'monthly' ? 0 : route.driverFare,
                        billingFare: route.billingFare,
                    });
                }
            });
        }
        
        setTrips(prevTrips => {
            const settledTripKeysInMonth = new Set<string>();
            const currentUnsettledTripsInMonth = new Map<string, Trip>();

            // 2. Index existing trips for the current month
            prevTrips.forEach(trip => {
                const tripDate = new Date(trip.date + 'T00:00:00Z');
                const isCurrentMonthTrip = tripDate.getUTCFullYear() === currentYear && tripDate.getUTCMonth() === currentMonth;

                if (trip.routeType === 'fixed' && isCurrentMonthTrip) {
                    const key = `${trip.date}-${trip.driverId}-${trip.fixedRouteId}`;
                    if (trip.isSettled) {
                        settledTripKeysInMonth.add(key);
                    } else {
                        currentUnsettledTripsInMonth.set(key, trip);
                    }
                }
            });
            
            const reconciledUnsettledTrips: Trip[] = [];

            // 3. Reconcile: Compare desired trips with current unsettled trips
            desiredTripsMap.forEach((desiredTripData, key) => {
                if (settledTripKeysInMonth.has(key)) return;
                
                const existingUnsettledTrip = currentUnsettledTripsInMonth.get(key);

                if (existingUnsettledTrip) {
                    reconciledUnsettledTrips.push({ ...existingUnsettledTrip, ...desiredTripData });
                } else {
                    reconciledUnsettledTrips.push({ ...desiredTripData, id: uuidv4(), isSettled: false });
                }
            });

            // 4. Construct the new full trips array
            const otherTrips = prevTrips.filter(trip => {
                 const tripDate = new Date(trip.date + 'T00:00:00Z');
                 const isCurrentMonthTrip = tripDate.getUTCFullYear() === currentYear && tripDate.getUTCMonth() === currentMonth;
                 return !(trip.routeType === 'fixed' && !trip.isSettled && isCurrentMonthTrip);
            });
            
            return [...otherTrips, ...reconciledUnsettledTrips];
        });
    };
    reconcileFixedTripsForCurrentMonth();
}, [fixedRoutes]);

  const handleAddDriver = (driverData: Omit<Driver, 'id' | 'registrationDate'>) => {
    const newDriver: Driver = { ...driverData, id: uuidv4(), registrationDate: new Date().toISOString().split('T')[0] };
    setDrivers(prev => [...prev, newDriver]);
  };
  const handleUpdateDriver = (updatedDriver: Driver) => { setDrivers(prev => prev.map(d => d.id === updatedDriver.id ? updatedDriver : d)); };
  const handleDeleteDriver = (driverId: string) => {
    setDrivers(prev => prev.filter(d => d.id !== driverId));
    setTrips(prev => prev.filter(t => t.driverId !== driverId));
    setFixedRoutes(prev => prev.map(r => r.driverId === driverId ? {...r, driverId: undefined} : r));
  };
  const handleImportDrivers = (importedDrivers: Omit<Driver, 'id' | 'registrationDate'>[]) => {
    let addedCount = 0, updatedCount = 0, skippedCount = 0;
    setDrivers(prevDrivers => {
      const driversMap = new Map(prevDrivers.map(d => [d.vehicleNumber, d]));
      const newDriversList = [...prevDrivers];
      importedDrivers.forEach(driverData => {
        const trimmedDriver = Object.fromEntries(Object.entries(driverData).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])) as typeof driverData;
        const { vehicleNumber, name, contact } = trimmedDriver;
        if (!vehicleNumber || !name || !contact) { skippedCount++; return; }
        const existingDriver = driversMap.get(vehicleNumber);
        if (existingDriver) {
          const driverIndex = newDriversList.findIndex(d => d.id === existingDriver.id);
          if (driverIndex !== -1) { newDriversList[driverIndex] = { ...existingDriver, ...trimmedDriver }; updatedCount++; }
        } else {
          newDriversList.push({ ...trimmedDriver, id: uuidv4(), registrationDate: new Date().toISOString().split('T')[0] });
          addedCount++;
        }
      });
      return newDriversList;
    });
    alert(`완료: ${addedCount}명 추가, ${updatedCount}명 정보 업데이트, ${skippedCount}명 건너뜀.`);
  };

  const handleAddFixedRoute = (routeData: Omit<FixedRoute, 'id'>) => { setFixedRoutes(prev => [...prev, { ...routeData, id: uuidv4() }]); };
  const handleUpdateFixedRoute = (updatedRoute: FixedRoute) => {
    setFixedRoutes(prev => prev.map(r => r.id === updatedRoute.id ? updatedRoute : r));
    setTrips(prevTrips => prevTrips.map(trip => {
        if (trip.routeType === 'fixed' && trip.fixedRouteId === updatedRoute.id && !trip.isSettled) {
          return { ...trip, driverFare: updatedRoute.paymentType === 'monthly' ? 0 : updatedRoute.driverFare, billingFare: updatedRoute.billingFare, customRouteName: updatedRoute.name, departure: updatedRoute.loadingPoint, destination: updatedRoute.routeNameSuffix };
        }
        return trip;
      })
    );
  };
  const handleDeleteFixedRoute = (routeId: string) => {
    setFixedRoutes(prev => prev.filter(r => r.id !== routeId));
    setTrips(prevTrips => prevTrips.filter(trip => trip.fixedRouteId !== routeId || trip.isSettled));
  };
  const handleImportFixedRoutes = (newRoutes: any[]) => {
      const driverNameToIdMap = new Map(drivers.map(d => [d.name, d.id]));
      const weekdaysMap: { [key: string]: number } = { "일": 0, "월": 1, "화": 2, "수": 3, "목": 4, "금": 5, "토": 6 };
      let addedCount = 0, updatedCount = 0, skippedCount = 0;
      setFixedRoutes(prevRoutes => {
        const routesMap = new Map(prevRoutes.map(r => [r.name, r]));
        const newRoutesList = [...prevRoutes];
        newRoutes.forEach(routeData => {
            const trimmed = Object.fromEntries(Object.entries(routeData).map(([k, v]) => [k, typeof v === 'string' ? String(v).trim() : v]));
            // FIX: Explicitly cast values from Excel to strings to resolve multiple type errors related to 'unknown' type.
            const routeName = String(trimmed['코스명*'] || trimmed['코스명'] || '');
            const paymentType: 'perTrip' | 'monthly' = (trimmed['정산 방식'] === '월대') ? 'monthly' : 'perTrip';
            const driverFare = Number(trimmed['회당 지급운임']) || 0;
            const monthlyFare = Number(trimmed['월 지급운임']) || 0;
            if (!routeName || (paymentType === 'perTrip' && !driverFare) || (paymentType === 'monthly' && !monthlyFare)) { skippedCount++; return; }
            const [loadingPoint, ...rest] = (routeName || '').split(' ');
            const newRouteData = {
                name: routeName,
                loadingPoint: loadingPoint || '알수없음', routeNameSuffix: rest.join(' ') || '',
                driverFare, monthlyFare, billingFare: Number(trimmed['매입운임']) || 0,
                driverId: (trimmed['배정된 기사'] ? driverNameToIdMap.get(String(trimmed['배정된 기사'])) : undefined),
                schedule: String(trimmed['운행 요일'] || '').split(',').map(s => s.trim()).map(day => weekdaysMap[day]).filter(d => d !== undefined),
                paymentType,
            };
            const existingRoute = routesMap.get(routeName);
            if (existingRoute) {
                const idx = newRoutesList.findIndex(r => r.id === existingRoute.id);
                if (idx !== -1) { newRoutesList[idx] = { ...existingRoute, ...newRouteData }; updatedCount++; }
            } else { newRoutesList.push({ id: uuidv4(), ...newRouteData }); addedCount++; }
        });
        return newRoutesList;
      });
      alert(`완료: ${addedCount}개 추가, ${updatedCount}개 정보 업데이트, ${skippedCount}개 건너뜀.`);
  };

  const handleAddTrip = (tripData: Omit<Trip, 'id' | 'isSettled'>) => { setTrips(prev => [...prev, { ...tripData, id: uuidv4(), isSettled: false }]); };
  const handleUpdateTrip = (updatedTrip: Trip) => { setTrips(prev => prev.map(t => t.id === updatedTrip.id ? updatedTrip : t)); };
  const handleDeleteTrip = (tripId: string) => { setTrips(prev => prev.filter(t => t.id !== tripId)); };
  const handleSettleMonthForDriver = (year: number, month: number, driverId: string) => {
    setTrips(prev => prev.map(t => {
      const tripDate = new Date(t.date + 'T00:00:00Z');
      return (t.driverId === driverId && tripDate.getUTCFullYear() === year && tripDate.getUTCMonth() === month - 1 && !t.isSettled) ? { ...t, isSettled: true } : t;
    }));
  };

  const handleAddCharterCost = (costData: Omit<CharterCost, 'id'>) => { setCharterCosts(prev => [...prev, { ...costData, id: uuidv4() }].sort((a, b) => a.loadingPoint.localeCompare(b.loadingPoint))); };
  const handleUpdateCharterCost = (updatedCost: CharterCost) => { setCharterCosts(prev => prev.map(c => c.id === updatedCost.id ? updatedCost : c).sort((a, b) => a.loadingPoint.localeCompare(b.loadingPoint))); };
  const handleDeleteCharterCost = (costId: string) => { setCharterCosts(prev => prev.filter(c => c.id !== costId)); };
  const handleImportCharterCosts = (importedCosts: (Omit<CharterCost, 'id' | 'amount'> & { amount: string | number })[]) => {
      const newCosts = importedCosts.map(cost => ({ ...cost, id: uuidv4(), amount: Number(cost.amount) || 0 })).filter(c => c.loadingPoint && c.vehicleType && c.fareType && c.amount > 0);
      setCharterCosts(newCosts.sort((a, b) => a.loadingPoint.localeCompare(b.loadingPoint)));
      alert(`완료: ${newCosts.length}건의 운임 정보를 불러왔습니다. 기존 정보는 모두 대체되었습니다.`);
  };
  
  const handleAddCharterDispatch = (dispatchData: Omit<CharterDispatch, 'id'>) => { setCharterDispatches(prev => [...prev, { ...dispatchData, id: uuidv4() }]); };
  const handleUpdateCharterDispatch = (updatedDispatch: CharterDispatch) => { setCharterDispatches(prev => prev.map(d => d.id === updatedDispatch.id ? updatedDispatch : d)); };
  const handleDeleteCharterDispatch = (dispatchId: string) => { setCharterDispatches(prev => prev.filter(d => d.id !== dispatchId)); };

  const handleResetData = () => { localStorage.clear(); window.location.reload(); };
  const handleExportData = () => {
    try {
      const dataToExport = { drivers, fixedRoutes, trips, charterCosts, charterDispatches };
      const jsonString = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = getKSTNow().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      link.download = `ls-logistics-data-${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) { console.error("Failed to export data:", error); alert("데이터 내보내기에 실패했습니다."); }
  };
  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        const valid = (arr: any[], fields: string[]) => Array.isArray(arr) ? arr.filter(item => fields.every(f => item[f] !== undefined)) : [];
        const imported = {
            drivers: valid(data.drivers, ['id', 'name', 'vehicleNumber']),
            fixedRoutes: valid(data.fixedRoutes, ['id', 'name', 'driverFare', 'paymentType']),
            trips: valid(data.trips, ['id', 'date', 'driverId']),
            charterCosts: valid(data.charterCosts, ['id', 'loadingPoint', 'vehicleType', 'amount']),
            charterDispatches: valid(data.charterDispatches, ['id', 'date', 'loadingPoint'])
        };
        setDrivers(imported.drivers);
        setFixedRoutes(imported.fixedRoutes);
        setTrips(imported.trips);
        setCharterCosts(imported.charterCosts);
        setCharterDispatches(imported.charterDispatches);
        alert(`데이터를 성공적으로 불러왔습니다.`);
      } catch (error) { console.error("Failed to import data:", error); alert("데이터 불러오기에 실패했습니다. 파일 형식이 올바른지 확인해주세요."); }
    };
    reader.readAsText(file);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard drivers={drivers} trips={trips} fixedRoutes={fixedRoutes} onResetData={handleResetData} onExportData={handleExportData} onImportData={handleImportData} />;
      case 'drivers': return <DriversPage drivers={drivers} fixedRoutes={fixedRoutes} onAddDriver={handleAddDriver} onUpdateDriver={handleUpdateDriver} onDeleteDriver={handleDeleteDriver} onImportDrivers={handleImportDrivers} />;
      case 'trips': return <TripsPage trips={trips} drivers={drivers} fixedRoutes={fixedRoutes} onAddTrip={handleAddTrip} onUpdateTrip={handleUpdateTrip} onDeleteTrip={handleDeleteTrip} />;
      case 'fixedRoutes': return <FixedRoutesPage fixedRoutes={fixedRoutes} drivers={drivers} onAddFixedRoute={handleAddFixedRoute} onUpdateFixedRoute={handleUpdateFixedRoute} onDeleteFixedRoute={handleDeleteFixedRoute} onImportFixedRoutes={handleImportFixedRoutes} />;
      case 'settlement': return <SettlementPage trips={trips} drivers={drivers} fixedRoutes={fixedRoutes} onUpdateTrip={handleUpdateTrip} onSettleMonthForDriver={handleSettleMonthForDriver}/>;
      case 'loadingPointSettlement': return <LoadingPointSettlementPage trips={trips} fixedRoutes={fixedRoutes} drivers={drivers} />;
      case 'charterCosts': return <CharterCostsPage charterCosts={charterCosts} onAddCharterCost={handleAddCharterCost} onUpdateCharterCost={handleUpdateCharterCost} onDeleteCharterCost={handleDeleteCharterCost} onImportCharterCosts={handleImportCharterCosts}/>;
      case 'charterDispatch': return <CharterDispatchPage charterDispatches={charterDispatches} charterCosts={charterCosts} drivers={drivers} onAddCharterDispatch={handleAddCharterDispatch} onUpdateCharterDispatch={handleUpdateCharterDispatch} onDeleteCharterDispatch={handleDeleteCharterDispatch} onAddCharterCost={handleAddCharterCost} />;
      default: return <Dashboard drivers={drivers} trips={trips} fixedRoutes={fixedRoutes} onResetData={handleResetData} onExportData={handleExportData} onImportData={handleImportData} />;
    }
  };

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="flex-1 overflow-y-auto">
        {renderPage()}
      </main>
    </div>
  );
};

export default App;