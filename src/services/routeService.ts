import api from './api'

export interface AirportRecord {
  id: number
  iata_code: string
  icao_code?: string
  name: string
  city: string
  country: string
  timezone: string
  latitude?: number
  longitude?: number
}

export interface RouteRecord {
  id: number
  origin_airport_id: number
  destination_airport_id: number
  origin_airport?: AirportRecord
  destination_airport?: AirportRecord
  distance_km?: number
  estimated_duration_minutes?: number
}

function normaliseRoute(r: any): RouteRecord {
  return {
    ...r,
    origin_airport:      r.origin_airport      ?? r.origin      ?? undefined,
    destination_airport: r.destination_airport  ?? r.destination ?? undefined,
  }
}

async function listAirports(params: { page?: number; per_page?: number; q?: string } = {}) {
  const res = await api.get('/airports', { params })
  const raw = res.data
  const items: AirportRecord[] = raw.data ?? []
  return { items, total: raw.pagination?.total ?? items.length }
}

async function createAirport(data: Omit<AirportRecord, 'id'>) {
  const res = await api.post('/airports', data)
  return res.data.data as AirportRecord
}

async function listRoutes() {
  const res = await api.get('/airports/routes')
  return (res.data.data as any[]).map(normaliseRoute)
}

async function createRoute(data: {
  origin_airport_id: number
  destination_airport_id: number
  distance_km?: number
  estimated_duration_minutes?: number
}) {
  const res = await api.post('/airports/routes', data)
  return normaliseRoute(res.data.data)
}

export const routeService = { listAirports, createAirport, listRoutes, createRoute }
