import api from './api'
import type { Flight, Seat, Airport, Aircraft, Route, ApiResponse, PaginatedResponse, FlightSearchParams } from '@/types'

function toPaginated<T>(raw: any): PaginatedResponse<T> {
  if (Array.isArray(raw?.data)) {
    return { items: raw.data, total: raw.pagination?.total ?? raw.data.length, page: raw.pagination?.page, pages: raw.pagination?.pages }
  }
  if (Array.isArray(raw?.items)) return raw
  return { items: raw?.data ?? [], total: raw?.total ?? 0 }
}

function normaliseRoute(r: any): Route {
  return {
    ...r,
    origin_airport:      r.origin_airport      ?? r.origin      ?? null,
    destination_airport: r.destination_airport  ?? r.destination ?? null,
  }
}

function normaliseAircraft(a: any): Aircraft {
  if (!a) return a
  return {
    ...a,
    // DB column is registration_number; frontend type expects registration
    registration: a.registration ?? a.registration_number ?? '',
  }
}

function normaliseFlight(f: any): Flight {
  if (f?.route)    f.route    = normaliseRoute(f.route)
  if (f?.aircraft) f.aircraft = normaliseAircraft(f.aircraft)
  // price field aliases: backend uses economy_price / first_class_price
  if (f.base_price   == null) f.base_price   = f.economy_price    ?? null
  if (f.first_price  == null) f.first_price  = f.first_class_price ?? null
  return f as Flight
}

export const flightService = {
  async search(params: FlightSearchParams): Promise<Flight[]> {
    const { data } = await api.get<ApiResponse<any[]>>('/flights', { params })
    return Array.isArray(data.data) ? data.data.map(normaliseFlight) : []
  },

  async list(params?: Record<string, unknown>): Promise<PaginatedResponse<Flight>> {
    const { data } = await api.get('/flights', { params })
    const page = toPaginated<any>(data)
    return { ...page, items: page.items.map(normaliseFlight) }
  },

  async get(id: number): Promise<Flight> {
    const { data } = await api.get<ApiResponse<any>>(`/flights/${id}`)
    return normaliseFlight(data.data)
  },

  getById(id: number): Promise<Flight> {
    return flightService.get(id)
  },

  async create(payload: object): Promise<Flight> {
    const { data } = await api.post<ApiResponse<Flight>>('/flights', payload)
    return data.data
  },

  async update(id: number, payload: object): Promise<Flight> {
    const { data } = await api.put<ApiResponse<Flight>>(`/flights/${id}`, payload)
    return data.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/flights/${id}`)
  },

  async updateStatus(id: number, status: string, extras?: Record<string, unknown>): Promise<Flight> {
    const { data } = await api.patch<ApiResponse<Flight>>(`/flights/${id}/status`, { status, ...extras })
    return data.data
  },

  async getSeats(flightId: number): Promise<Seat[]> {
    const { data } = await api.get<ApiResponse<Seat[]>>(`/flights/${flightId}/seats`)
    return Array.isArray(data.data) ? data.data : []
  },

  async getFlightBookings(flightId: number): Promise<any[]> {
    const { data } = await api.get<ApiResponse<any[]>>(`/flights/${flightId}/bookings`)
    return Array.isArray(data.data) ? data.data : []
  },

  async getAirports(): Promise<Airport[]> {
    const { data } = await api.get<ApiResponse<Airport[]>>('/airports')
    return Array.isArray(data.data) ? data.data : []
  },

  async getRoutes(): Promise<Route[]> {
    const { data } = await api.get<ApiResponse<any[]>>('/airports/routes')
    return Array.isArray(data.data) ? data.data.map(normaliseRoute) : []
  },

  async getAircraft(): Promise<Aircraft[]> {
    const { data } = await api.get<ApiResponse<any[]>>('/aircraft', { params: { status: 'active' } })
    return Array.isArray(data.data) ? data.data.map(normaliseAircraft) : []
  },
}
