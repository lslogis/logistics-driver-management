/**
 * TypeScript interfaces for Management Pages
 */

// Base interface for all management items
export interface BaseManagementItem {
  id: string
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

// 고정관리 (Fixed Routes Management) 
export interface FixedRoute extends BaseManagementItem {
  routeName: string
  routeCode: string
  origin: string
  destination: string
  distance: number // km
  estimatedTime: number // minutes
  basePrice: number
  fuelSurcharge: number
  tollFee: number
  driverId?: string
  driverName?: string
  vehicleType: 'small' | 'medium' | 'large' | 'extra_large'
  operatingDays: string[] // ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  startTime: string
  frequency: 'daily' | 'weekly' | 'monthly'
  contractStartDate: Date
  contractEndDate: Date
  notes?: string
}

export interface CreateFixedRouteData {
  routeName: string
  routeCode: string
  origin: string
  destination: string
  distance: number
  estimatedTime: number
  basePrice: number
  fuelSurcharge: number
  tollFee: number
  driverId?: string
  vehicleType: 'small' | 'medium' | 'large' | 'extra_large'
  operatingDays: string[]
  startTime: string
  frequency: 'daily' | 'weekly' | 'monthly'
  contractStartDate: Date
  contractEndDate: Date
  notes?: string
}

export interface UpdateFixedRouteData extends Partial<CreateFixedRouteData> {}

// 기사관리 (Driver Management) - Enhanced from existing
export interface Driver extends BaseManagementItem {
  name: string
  phone: string
  email?: string
  licenseNumber: string
  licenseType: 'regular' | 'commercial' | 'special'
  licenseExpiryDate: Date
  vehicleNumber?: string
  vehicleType?: 'small' | 'medium' | 'large' | 'extra_large'
  businessName?: string
  businessNumber?: string
  representative?: string
  bankName?: string
  accountNumber?: string
  address?: string
  emergencyContact?: string
  emergencyPhone?: string
  joinDate: Date
  rating: number // 1-5 stars
  totalTrips: number
  totalRevenue: number
  notes?: string
}

export interface CreateDriverData {
  name: string
  phone: string
  email?: string
  licenseNumber: string
  licenseType: 'regular' | 'commercial' | 'special'
  licenseExpiryDate: Date
  vehicleNumber?: string
  vehicleType?: 'small' | 'medium' | 'large' | 'extra_large'
  businessName?: string
  businessNumber?: string
  representative?: string
  bankName?: string
  accountNumber?: string
  address?: string
  emergencyContact?: string
  emergencyPhone?: string
  joinDate: Date
  notes?: string
}

export interface UpdateDriverData extends Partial<CreateDriverData> {}

// 용차관리 (Vehicle Management)
export interface Vehicle extends BaseManagementItem {
  vehicleNumber: string
  vehicleType: 'small' | 'medium' | 'large' | 'extra_large'
  brand: string
  model: string
  year: number
  fuel: 'gasoline' | 'diesel' | 'lpg' | 'electric' | 'hybrid'
  capacity: number // tons
  dimensions: {
    length: number
    width: number
    height: number
  }
  registrationDate: Date
  insuranceExpiry: Date
  inspectionExpiry: Date
  driverId?: string
  driverName?: string
  ownerType: 'company' | 'individual' | 'rental'
  ownerName: string
  ownerContact: string
  registrationRegion: string
  mileage: number
  fuelEfficiency: number // km/l
  maintenanceHistory: MaintenanceRecord[]
  status: 'available' | 'in_use' | 'maintenance' | 'retired'
  notes?: string
}

export interface MaintenanceRecord {
  id: string
  date: Date
  type: 'routine' | 'repair' | 'inspection' | 'accident'
  description: string
  cost: number
  vendor: string
  mileageAtService: number
}

export interface CreateVehicleData {
  vehicleNumber: string
  vehicleType: 'small' | 'medium' | 'large' | 'extra_large'
  brand: string
  model: string
  year: number
  fuel: 'gasoline' | 'diesel' | 'lpg' | 'electric' | 'hybrid'
  capacity: number
  dimensions: {
    length: number
    width: number
    height: number
  }
  registrationDate: Date
  insuranceExpiry: Date
  inspectionExpiry: Date
  driverId?: string
  ownerType: 'company' | 'individual' | 'rental'
  ownerName: string
  ownerContact: string
  registrationRegion: string
  mileage: number
  fuelEfficiency: number
  notes?: string
}

export interface UpdateVehicleData extends Partial<CreateVehicleData> {}

// 요율관리 (Rate Management)
export interface Rate extends BaseManagementItem {
  rateName: string
  rateCode: string
  rateType: 'distance' | 'time' | 'weight' | 'volume' | 'fixed'
  vehicleType: 'small' | 'medium' | 'large' | 'extra_large' | 'all'
  region: string
  baseRate: number
  minimumCharge: number
  maximumCharge?: number
  units: string // '원/km', '원/시간', '원/톤' etc.
  surcharges: RateSurcharge[]
  validFrom: Date
  validTo?: Date
  priority: number // for overlapping rates
  conditions?: string
  notes?: string
}

export interface RateSurcharge {
  id: string
  name: string
  type: 'percentage' | 'fixed' | 'per_unit'
  value: number
  condition: string
  isActive: boolean
}

export interface CreateRateData {
  rateName: string
  rateCode: string
  rateType: 'distance' | 'time' | 'weight' | 'volume' | 'fixed'
  vehicleType: 'small' | 'medium' | 'large' | 'extra_large' | 'all'
  region: string
  baseRate: number
  minimumCharge: number
  maximumCharge?: number
  units: string
  surcharges: RateSurcharge[]
  validFrom: Date
  validTo?: Date
  priority: number
  conditions?: string
  notes?: string
}

export interface UpdateRateData extends Partial<CreateRateData> {}

// Common types
export type VehicleType = 'small' | 'medium' | 'large' | 'extra_large'
export type LicenseType = 'regular' | 'commercial' | 'special'
export type FuelType = 'gasoline' | 'diesel' | 'lpg' | 'electric' | 'hybrid'
export type OwnerType = 'company' | 'individual' | 'rental'
export type VehicleStatus = 'available' | 'in_use' | 'maintenance' | 'retired'
export type RateType = 'distance' | 'time' | 'weight' | 'volume' | 'fixed'
export type SurchargeType = 'percentage' | 'fixed' | 'per_unit'
export type Frequency = 'daily' | 'weekly' | 'monthly'

// Utility constants
export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  small: '소형',
  medium: '중형', 
  large: '대형',
  extra_large: '특대형'
}

export const LICENSE_TYPE_LABELS: Record<LicenseType, string> = {
  regular: '일반',
  commercial: '사업용',
  special: '특수'
}

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  gasoline: '휘발유',
  diesel: '경유',
  lpg: 'LPG',
  electric: '전기',
  hybrid: '하이브리드'
}

export const OWNER_TYPE_LABELS: Record<OwnerType, string> = {
  company: '회사',
  individual: '개인',
  rental: '임대'
}

export const VEHICLE_STATUS_LABELS: Record<VehicleStatus, string> = {
  available: '사용가능',
  in_use: '운행중',
  maintenance: '정비중',
  retired: '퇴역'
}

export const RATE_TYPE_LABELS: Record<RateType, string> = {
  distance: '거리기준',
  time: '시간기준', 
  weight: '중량기준',
  volume: '부피기준',
  fixed: '정액'
}

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  daily: '매일',
  weekly: '주간',
  monthly: '월간'
}