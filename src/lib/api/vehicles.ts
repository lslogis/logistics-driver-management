import { VehicleResponse, CreateVehicleData, UpdateVehicleData, GetVehiclesQuery } from '@/lib/validations/vehicle'

export class VehiclesAPI {
  async getVehicles(params: GetVehiclesQuery) {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.limit) searchParams.set('limit', params.limit.toString())
    if (params.search && typeof params.search === 'string') searchParams.set('search', params.search)
    if (params.ownership && typeof params.ownership === 'string') searchParams.set('ownership', params.ownership)
    if (params.isActive !== undefined && params.isActive !== null) searchParams.set('isActive', params.isActive.toString())

    const response = await fetch(`/api/vehicles?${searchParams}`)
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  async createVehicle(data: CreateVehicleData) {
    const response = await fetch('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  async updateVehicle(id: string, data: UpdateVehicleData) {
    const response = await fetch(`/api/vehicles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  async deleteVehicle(id: string) {
    const response = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' })
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  async assignDriver(vehicleId: string, driverId: string | null) {
    const response = await fetch(`/api/vehicles/${vehicleId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driverId })
    })
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }
}

export const vehiclesAPI = new VehiclesAPI()