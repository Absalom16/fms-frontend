import api from './api'
import type { PassengerProfile, PaginatedResponse } from '@/types'

function normalise(p: any): PassengerProfile {
  return {
    ...p,
    first_name: p.first_name ?? p.user?.first_name,
    last_name:  p.last_name  ?? p.user?.last_name,
    email:      p.email      ?? p.user?.email,
    phone:      p.phone      ?? p.user?.phone,
    is_active:  p.is_active  ?? p.user?.is_active,
  }
}

export const passengerService = {
  getMyProfile: () =>
    api.get('/passengers/me').then(r => normalise(r.data.data)),

  updateMyProfile: (data: object) =>
    api.put('/passengers/me', data).then(r => normalise(r.data.data)),

  list: async (params?: object): Promise<PaginatedResponse<PassengerProfile>> => {
    const r = await api.get('/passengers', { params })
    const body = r.data
    const raw: any[] = Array.isArray(body.data) ? body.data : []
    return {
      items: raw.map(normalise),
      total: body.pagination?.total ?? raw.length,
      page:  body.pagination?.page  ?? 1,
    }
  },

  getById: (id: number) =>
    api.get(`/passengers/${id}`).then(r => normalise(r.data.data)),
}
