export interface RequestSummary {
  id: string
  loadingPointId: string
  loadingPoint?: {
    id: string
    name: string
  }
  centerCarNo: string | null
  vehicleTon: number
  regions: string[]
  stops: number
  notes?: string
  extraAdjustment: number
  adjustmentReason?: string
  createdAt: string
  updatedAt: string
}

export interface RequestDispatchSummary {
  id: string
  requestId: string
  driverId?: string
  driverName: string
  driverPhone: string
  driverVehicle: string
  driverFee: number
  deliveryTime?: string
  createdAt: string
  updatedAt: string
}

export interface RequestFinancialSummary {
  centerBilling: number
  totalDriverFees: number
  totalMargin: number
  marginPercentage: number
  dispatchCount: number
}

export interface RequestDetail extends RequestSummary {
  dispatches: RequestDispatchSummary[]
  financialSummary?: RequestFinancialSummary
}
