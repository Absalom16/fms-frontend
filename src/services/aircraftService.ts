import api from './api'

export interface AircraftRecord {
  id: number
  registration_number: string
  registration: string
  model: string
  manufacturer?: string
  economy_seats: number
  business_seats: number
  first_class_seats: number
  total_seats: number
  status: 'active' | 'maintenance' | 'retired'
}

function normalise(a: any): AircraftRecord {
  return { ...a, registration: a.registration ?? a.registration_number ?? '' }
}

async function list(params: { page?: number; per_page?: number; status?: string } = {}) {
  const res = await api.get('/aircraft', { params })
  const raw = res.data
  const items: AircraftRecord[] = (raw.data ?? []).map(normalise)
  return { items, total: raw.pagination?.total ?? items.length, page: raw.pagination?.page ?? 1 }
}

async function create(data: Omit<AircraftRecord, 'id' | 'registration' | 'total_seats' | 'status'>) {
  const res = await api.post('/aircraft', data)
  return normalise(res.data.data)
}

async function update(id: number, data: Partial<Omit<AircraftRecord, 'id' | 'registration' | 'total_seats'>>) {
  const res = await api.put(`/aircraft/${id}`, data)
  return normalise(res.data.data)
}

async function updateStatus(id: number, status: AircraftRecord['status']) {
  const res = await api.patch(`/aircraft/${id}/status`, { status })
  return normalise(res.data.data)
}

export const aircraftService = { list, create, update, updateStatus }
