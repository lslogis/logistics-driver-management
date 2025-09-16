import { RouteResponse, CreateRouteData, UpdateRouteData, GetRoutesQuery } from '@/lib/validations/route'

export class RoutesAPI {
  async getRoutes(params: GetRoutesQuery) {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.limit) searchParams.set('limit', params.limit.toString())
    if (params.search) searchParams.set('search', params.search)
    if (params.isActive !== undefined) searchParams.set('isActive', params.isActive.toString())
    if (params.defaultDriverId) searchParams.set('defaultDriverId', params.defaultDriverId)
    if (params.weekday !== undefined) searchParams.set('weekday', params.weekday.toString())
    if (params.sortBy) searchParams.set('sortBy', params.sortBy)
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)

    const response = await fetch(`/api/routes?${searchParams}`)
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  async createRoute(data: CreateRouteData) {
    const response = await fetch('/api/routes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  async updateRoute(id: string, data: UpdateRouteData) {
    const response = await fetch(`/api/routes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  async deleteRoute(id: string) {
    const response = await fetch(`/api/routes/${id}`, { method: 'DELETE' })
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  async assignDriver(routeId: string, driverId: string | null) {
    const response = await fetch(`/api/routes/${routeId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driverId })
    })
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  async toggleActive(routeId: string) {
    const response = await fetch(`/api/routes/${routeId}/toggle`, {
      method: 'POST'
    })
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  async searchRoutes(query: string) {
    const response = await fetch(`/api/routes/search?q=${encodeURIComponent(query)}`)
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }

  async getWeekdayRoutes(weekday: number) {
    const response = await fetch(`/api/routes/weekday?weekday=${weekday}`)
    const result = await response.json()
    if (!result.ok) throw new Error(result.error.message)
    return result.data
  }
}

export const routesAPI = new RoutesAPI()