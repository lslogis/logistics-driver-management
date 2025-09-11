// Common types for the logistics management system

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  businessNumber?: string;
  companyName?: string;
  representativeName?: string;
  bankName?: string;
  accountNumber?: string;
  remarks?: string;
  isActive: boolean;
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

export interface RouteTemplate {
  id: string;
  name: string;
  loadingPoint: string;
  unloadingPoint: string;
  driverFare: number;
  billingFare: number;
  weekdayPattern: number[];
  distance?: number;
  defaultDriverId?: string;
  defaultDriver?: {
    id: string;
    name: string;
    phone: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Trip {
  id: string;
  date: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'ABSENCE' | 'SUBSTITUTE';
  driverId: string;
  driver: {
    id: string;
    name: string;
    phone: string;
  };
  vehicleId: string;
  vehicle: {
    id: string;
    plateNumber: string;
    vehicleType: string;
  };
  routeTemplateId?: string;
  routeTemplate?: RouteTemplate;
  loadingPoint: string;
  unloadingPoint: string;
  driverFare: number;
  billingFare: number;
  deductionAmount?: number;
  substituteDriverId?: string;
  substituteDriver?: {
    id: string;
    name: string;
    phone: string;
  };
  substituteFare?: number;
  absenceReason?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
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
  totalTrips: number;
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
  tripId?: string;
  trip?: Trip;
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

export interface RoutesResponse {
  routes: RouteTemplate[];
  pagination: PaginationInfo;
}

export interface TripsResponse {
  trips: Trip[];
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

export interface CreateRouteData {
  name: string;
  loadingPoint: string;
  unloadingPoint: string;
  driverFare: number;
  billingFare: number;
  weekdayPattern: number[];
  distance?: number;
  defaultDriverId?: string;
}

export interface UpdateRouteData extends Partial<CreateRouteData> {}

export interface CreateTripData {
  date: string;
  driverId: string;
  vehicleId: string;
  routeTemplateId?: string;
  loadingPoint: string;
  unloadingPoint: string;
  driverFare: number;
  billingFare: number;
  status?: 'SCHEDULED' | 'COMPLETED' | 'ABSENCE' | 'SUBSTITUTE';
  remarks?: string;
}

export interface UpdateTripData extends Partial<CreateTripData> {
  status?: 'SCHEDULED' | 'COMPLETED' | 'ABSENCE' | 'SUBSTITUTE';
  deductionAmount?: number;
  substituteDriverId?: string;
  substituteFare?: number;
  absenceReason?: string;
  remarks?: string;
}

// Trip form state type
export interface TripFormData {
  date: string;
  driverId: string;
  vehicleId: string;
  routeType: 'fixed' | 'custom';
  routeTemplateId?: string;
  loadingPoint: string;
  unloadingPoint: string;
  driverFare: number;
  billingFare: number;
  status: 'SCHEDULED' | 'COMPLETED' | 'ABSENCE' | 'SUBSTITUTE';
  remarks?: string;
  deductionAmount?: number;
  substituteDriverId?: string;
  substituteFare?: number;
  absenceReason?: string;
}

// Settlement preview data
export interface SettlementPreviewData {
  driverId: string;
  yearMonth: string;
  totalTrips: number;
  totalBaseFare: number;
  totalDeductions: number;
  totalAdditions: number;
  finalAmount: number;
  trips: Array<{
    id: string;
    date: string;
    status: string;
    loadingPoint: string;
    unloadingPoint: string;
    driverFare: number;
    deductionAmount: number;
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

export interface RoutesQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface TripsQuery {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  driverId?: string;
  vehicleId?: string;
  status?: 'SCHEDULED' | 'COMPLETED' | 'ABSENCE' | 'SUBSTITUTE';
}

export interface SettlementsQuery {
  page?: number;
  limit?: number;
  yearMonth?: string;
  driverId?: string;
  status?: 'DRAFT' | 'CONFIRMED' | 'PAID';
}