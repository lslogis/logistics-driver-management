// Common types for the logistics management system

export interface Driver {
  id: string;
  name: string;
  phone: string;
  businessNumber?: string;
  bankName?: string;
  accountNumber?: string;
  remarks?: string;
  isActive: boolean;
  vehicleNumber: string;
  businessName?: string;
  representative?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  vehicleType: string;
  capacityTon?: number;
  ownership: 'OWNED' | 'CHARTER' | 'CONSIGNED';
  driverId?: string;
  driver?: {
    id: string;
    name: string;
    phone: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}


export interface LoadingPoint {
  id: string;
  name: string | null;
  centerName: string;
  loadingPointName: string;
  lotAddress?: string | null;
  roadAddress?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Request {
  id: string;
  loadingPointId: string;
  loadingPoint?: LoadingPoint;
  requestDate: string;
  centerCarNo: string | null;
  vehicleTon: number;
  regions: string[];
  stops: number;
  notes?: string;
  baseFare?: number | null;
  extraStopFee?: number | null;
  extraRegionFee?: number | null;
  extraAdjustment: number;
  adjustmentReason?: string;
  centerBillingTotal: number;
  
  // 기사 정보 (기존 Dispatch에서 이동)
  driverId?: string;
  driver?: Driver;
  driverName?: string;
  driverPhone?: string;
  driverVehicle?: string;
  deliveryTime?: string;
  driverFee?: number;
  driverNotes?: string;
  dispatchedAt?: string;
  
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  
  // 계산된 필드
  financialSummary?: {
    centerBilling: number;
    totalDriverFees: number;
    totalMargin: number;
    marginPercentage: number;
  };
}



export interface Settlement {
  id: string;
  yearMonth: string;
  driverId: string;
  driver: {
    id: string;
    name: string;
    phone: string;
  };
  status: 'DRAFT' | 'CONFIRMED' | 'PAID';
  totalCharters: number;
  totalBaseFare: number;
  totalDeductions: number;
  totalAdditions: number;
  finalAmount: number;
  confirmedAt?: string;
  confirmedBy?: string;
  items?: SettlementItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SettlementItem {
  id: string;
  settlementId: string;
  type: 'TRIP' | 'DEDUCTION' | 'ADDITION' | 'ADJUSTMENT';
  description: string;
  amount: number;
  charterId?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface DriversResponse {
  drivers: Driver[];
  pagination: PaginationInfo;
}

export interface VehiclesResponse {
  vehicles: Vehicle[];
  pagination: PaginationInfo;
}



export interface SettlementsResponse {
  settlements: Settlement[];
  pagination: PaginationInfo;
}

// Form data types for creation/update
export interface CreateDriverData {
  name: string;
  phone: string;
  email?: string;
  businessNumber?: string;
  companyName?: string;
  representativeName?: string;
  bankName?: string;
  accountNumber?: string;
  remarks?: string;
}

export interface UpdateDriverData extends Partial<CreateDriverData> {}

export interface CreateVehicleData {
  plateNumber: string;
  vehicleType: string;
  capacityTon?: number;
  ownership: 'OWNED' | 'CHARTER' | 'CONSIGNED';
  driverId?: string;
}

export interface UpdateVehicleData extends Partial<CreateVehicleData> {}



// Settlement preview data
export interface SettlementPreviewData {
  driverId: string;
  yearMonth: string;
  totalCharters: number;
  totalBaseFare: number;
  totalDeductions: number;
  totalAdditions: number;
  finalAmount: number;
  charters: Array<{
    id: string;
    date: string;
    destinations: Array<{ region: string; order: number }>;
    driverFare: number;
    totalFare: number;
  }>;
  warnings: string[];
}

// Query parameters types
export interface DriversQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface VehiclesQuery {
  page?: number;
  limit?: number;
  search?: string;
  ownership?: 'OWNED' | 'CHARTER' | 'CONSIGNED';
  isActive?: boolean;
}



export interface SettlementsQuery {
  page?: number;
  limit?: number;
  yearMonth?: string;
  driverId?: string;
  status?: 'DRAFT' | 'CONFIRMED' | 'PAID';
}
