import api from './api'
import type { Booking, Ticket, ApiResponse, PaginatedResponse, BookingCreatePayload } from '@/types'

function normaliseBooking(b: any): Booking {
  const flight = b.flight ? {
    ...b.flight,
    route: b.flight.route ? {
      ...b.flight.route,
      // backend uses origin_airport / destination_airport already, but guard for alternatives
      origin_airport:      b.flight.route.origin_airport      ?? b.flight.route.origin      ?? null,
      destination_airport: b.flight.route.destination_airport ?? b.flight.route.destination ?? null,
    } : null,
  } : undefined

  return {
    ...b,
    // backend column is fare_amount; type expects total_price
    total_price: b.total_price ?? b.fare_amount ?? 0,
    flight,
  }
}

function toPaginated<T>(raw: any, norm?: (x: any) => T): PaginatedResponse<T> {
  const items: any[] = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw?.items) ? raw.items : []
  return {
    items: norm ? items.map(norm) : items,
    total: raw.pagination?.total ?? raw.total ?? items.length,
    page:  raw.pagination?.page  ?? raw.page,
  }
}

export const bookingService = {
  async create(payload: BookingCreatePayload | object): Promise<Booking> {
    const { data } = await api.post<ApiResponse<Booking>>('/bookings', payload)
    return normaliseBooking(data.data)
  },

  async myBookings(params?: Record<string, unknown>): Promise<PaginatedResponse<Booking>> {
    const { data } = await api.get('/bookings/my', { params })
    return toPaginated<Booking>(data, normaliseBooking)
  },

  async list(params?: Record<string, unknown>): Promise<PaginatedResponse<Booking>> {
    const { data } = await api.get('/bookings', { params })
    return toPaginated<Booking>(data, normaliseBooking)
  },

  async get(id: number): Promise<Booking> {
    const { data } = await api.get<ApiResponse<Booking>>(`/bookings/${id}`)
    return normaliseBooking(data.data)
  },

  getById(id: number): Promise<Booking> {
    return bookingService.get(id)
  },

  async cancel(id: number, reason?: string): Promise<Booking> {
    const { data } = await api.patch<ApiResponse<Booking>>(`/bookings/${id}/cancel`, { reason })
    return data.data
  },

  async confirm(id: number): Promise<Booking> {
    const { data } = await api.post<ApiResponse<Booking>>(`/bookings/${id}/confirm`)
    return data.data
  },

  async checkIn(id: number): Promise<Ticket> {
    const { data } = await api.patch<ApiResponse<Ticket>>(`/bookings/${id}/check-in`)
    return data.data
  },
}
