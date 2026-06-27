import api from './api'
import type { CrewMember, FlightCrewAssignment, PaginatedResponse } from '@/types'

function normalise(c: any): CrewMember {
  const u = c.user ?? {}
  return {
    ...c,
    first_name: c.first_name ?? u.first_name,
    last_name: c.last_name ?? u.last_name,
    email: c.email ?? u.email,
    phone: c.phone ?? u.phone,
    position: c.position ?? c.crew_role,
    license_expiry: c.license_expiry ?? c.certification_expiry,
    medical_cert_expiry: c.medical_cert_expiry ?? c.medical_expiry,
    is_certification_valid: c.is_certification_valid ?? c.certification_valid,
    is_medical_valid: c.is_medical_valid ?? c.medical_valid,
  }
}

export const crewService = {
  list: async (params?: object): Promise<PaginatedResponse<CrewMember>> => {
    const r = await api.get('/crew', { params })
    const body = r.data
    return {
      items: (body.data ?? []).map(normalise),
      total: body.pagination?.total ?? 0,
      page: body.pagination?.page,
      per_page: body.pagination?.per_page,
      pages: body.pagination?.pages,
    }
  },

  getById: (id: number) =>
    api.get<{ data: any }>(`/crew/${id}`).then(r => normalise(r.data.data)),

  create: async (data: any): Promise<CrewMember> => {
    // Step 1: register a user account with role='crew'
    const regRes = await api.post('/auth/register', {
      email: data.email,
      password: data.password,
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone || undefined,
      role: 'crew',
    })
    const userId = regRes.data.data.user.id
    // Step 2: create the crew profile linked to that user
    const crewRes = await api.post('/crew', {
      user_id: userId,
      employee_id: data.employee_id,
      crew_role: data.position,
      license_number: data.license_number || undefined,
      certification_expiry: data.license_expiry || undefined,
      medical_expiry: data.medical_cert_expiry || undefined,
    })
    return normalise(crewRes.data.data)
  },

  update: (id: number, data: any) =>
    api.put<{ data: any }>(`/crew/${id}`, {
      crew_role: data.position,
      license_number: data.license_number,
      certification_expiry: data.license_expiry,
      medical_expiry: data.medical_cert_expiry,
    }).then(r => normalise(r.data.data)),

  delete: (id: number) => api.delete(`/crew/${id}`),

  assignToFlight: (flightId: number, crewMemberId: number, roleOnFlight: string) =>
    api.post<{ data: FlightCrewAssignment }>(`/crew/flights/${flightId}/crew`, { crew_member_id: crewMemberId, role_on_flight: roleOnFlight }).then(r => r.data.data),

  getFlightCrew: (flightId: number) =>
    api.get<{ data: FlightCrewAssignment[] }>(`/flights/${flightId}/crew`).then(r => r.data.data),

  removeFromFlight: (flightId: number, crewMemberId: number) =>
    api.delete(`/crew/flights/${flightId}/crew/${crewMemberId}`),
}
