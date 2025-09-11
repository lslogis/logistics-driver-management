// FIX: Provided type definitions for Driver, FixedRoute, and Trip.
export interface Driver {
  id: string;
  name: string;
  contact: string;
  vehicleNumber: string;
  registrationDate: string;
  businessNumber?: string;
  companyName?: string;
  representativeName?: string;
  bank?: string;
  accountNumber?: string;
  remarks?: string;
}

export interface FixedRoute {
  id: string;
  name: string;
  loadingPoint: string;
  routeNameSuffix: string;
  driverFare: number; // For 'perTrip' type
  billingFare: number;
  driverId?: string;
  schedule?: number[]; // 0 for Sunday, 1 for Monday, etc.
  paymentType: 'perTrip' | 'monthly';
  monthlyFare?: number; // For 'monthly' type
}

export interface Trip {
  id: string;
  date: string; // YYYY-MM-DD
  driverId: string;
  routeType: 'fixed' | 'custom';
  fixedRouteId?: string;
  customRouteName?: string;
  departure?: string;
  destination?: string;
  driverFare: number;
  billingFare: number;
  isSettled: boolean;
  remarks?: string;
  
  // Fields for absence
  isAbsence?: boolean;
  absenceReason?: string;
  substituteInfo?: string; // 대차 정보
  deductionAmount?: number; // 차감 금액
  substituteFare?: number; // 용차비
}

export interface CharterCost {
  id: string;
  loadingPoint: string; // 상차지 (from center)
  destination: string;  // 행선지 (from region)
  vehicleType: string;  // 차량 종류 (from vehicle_type)
  fareType: string;     // 비용 항목 (from component_type)
  amount: number;       // 금액 (from amount)
}

export interface CharterDispatch {
  id: string;
  date: string;
  loadingPoint: string;
  vehicleType: string;
  routeName: string; // 호차
  destinations: string[]; // 지역(여러개)
  
  driverName: string;
  vehicleNumber: string;
  driverContact: string;

  // 우리가 센터에 청구할 금액 (자동 계산 기반)
  billingBaseFare: number;    // 기본운임
  billingStopoverFee: number; // 착수 (경유비)
  billingRegionMoveFee: number; // 지역이동비
  billingMiscFee: number;     // 기타
  totalBillingAmount: number; // 합계 (우리가 받을 금액)

  driverCost: number; // 용차비 (기사에게 줄 금액)
  margin: number;     // 마진

  isInvoiceConfirmed: boolean; // 계산서 확인
  remarks?: string; // 기타 사유
}