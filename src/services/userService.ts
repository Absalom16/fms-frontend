import api from './api'
import type { PaginatedResponse } from '@/types'

export interface UserRecord {
  id: number
  email: string
  first_name: string
  last_name: string
  full_name: string
  phone: string | null
  role: 'admin' | 'passenger' | 'crew' | 'manager'
  is_active: boolean
  last_login: string | null
  created_at: string
}

export interface CreateUserPayload {
  email: string
  password: string
  first_name: string
  last_name: string
  role: 'admin' | 'manager' | 'crew'
  phone?: string
  crew_role?: string
  employee_id?: string
}

export const userService = {
  create: async (payload: CreateUserPayload): Promise<UserRecord> => {
    const { data } = await api.post('/users', payload)
    return data.data
  },

  list: async (params?: {
    page?: number
    per_page?: number
    search?: string
    role?: string
    status?: string
  }): Promise<PaginatedResponse<UserRecord>> => {
    const { data } = await api.get('/users', { params })
    const items: UserRecord[] = Array.isArray(data.data) ? data.data : []
    return {
      items,
      total: data.pagination?.total ?? items.length,
      page:  data.pagination?.page  ?? 1,
    }
  },

  activate: async (id: number): Promise<UserRecord> => {
    const { data } = await api.patch(`/users/${id}/activate`)
    return data.data
  },

  deactivate: async (id: number): Promise<UserRecord> => {
    const { data } = await api.patch(`/users/${id}/deactivate`)
    return data.data
  },
}
