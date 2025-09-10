
import { Driver, FixedRoute, Trip } from './types';

// KST (UTC+9) 기준 날짜 정보를 반환하는 헬퍼 함수
const getKSTComponents = (date: Date) => {
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const kstDate = new Date(utc + (9 * 3600000));
    return {
        dateString: kstDate.toISOString().split('T')[0],
        dayOfWeek: kstDate.getUTCDay() // 0 for Sunday, ..., 6 for Saturday
    };
};


export const sampleDrivers: Driver[] = [
  {
    id: 'driver-kdm',
    name: '김동민',
    contact: '010-5287-4309',
    vehicleNumber: '서울86바5701',
    registrationDate: '2024-05-20',
    companyName: '새봄물류',
    representativeName: '김동민',
    businessNumber: '178-32-00605',
    bank: '우리',
    accountNumber: '08226784202001',
  },
];

export const sampleFixedRoutes: FixedRoute[] = [
  {
    id: 'route-kdm-1',
    name: '동원백암 고정04호',
    loadingPoint: '동원백암',
    routeNameSuffix: '고정04호',
    driverFare: 170000,
    billingFare: 210000,
    driverId: 'driver-kdm',
    schedule: [1, 2, 3, 4, 5, 6], // 월~토
    paymentType: 'perTrip',
    monthlyFare: 0,
  },
  {
    id: 'route-kdm-2',
    name: '동원백암 고정가맹',
    loadingPoint: '동원백암',
    routeNameSuffix: '고정가맹',
    driverFare: 180000,
    billingFare: 195000,
    driverId: 'driver-kdm',
    schedule: [1, 2, 3, 4, 5, 6], // 월~토
    paymentType: 'perTrip',
    monthlyFare: 0,
  }
];

// 스케줄에 맞는 최근 5일치 운행 내역을 생성합니다.
const createSampleTrips = (): Trip[] => {
    const trips: Trip[] = [];
    const today = new Date();

    // 최근 5일간의 데이터를 확인하여 스케줄에 맞는 운행만 추가
    for (let i = 0; i < 5; i++) {
        const targetDate = new Date();
        targetDate.setDate(today.getDate() - i);

        const { dateString, dayOfWeek } = getKSTComponents(targetDate);

        sampleFixedRoutes.forEach(route => {
            // 해당 기사의 코스이고, 운행 요일이 맞는지 확인
            if (route.driverId === 'driver-kdm' && route.schedule?.includes(dayOfWeek)) {
                trips.push({
                    id: `trip-${route.id}-${dateString}`,
                    date: dateString,
                    driverId: 'driver-kdm',
                    routeType: 'fixed',
                    fixedRouteId: route.id,
                    customRouteName: route.name,
                    departure: route.loadingPoint,
                    destination: route.routeNameSuffix,
                    driverFare: route.paymentType === 'perTrip' ? route.driverFare : 0,
                    billingFare: route.billingFare,
                    isSettled: false, // 모든 내역을 '미정산'으로 수정
                    isAbsence: false, // 휴무 아닌 정상 운행으로만 생성
                });
            }
        });
    }

    return trips;
};

export const sampleTrips: Trip[] = createSampleTrips();