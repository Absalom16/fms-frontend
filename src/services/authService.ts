import api from './api'
import type { User, ApiResponse } from '@/types'

interface LoginPayload { email: string; password: string }
interface RegisterPayload {
  email: string; password: string; first_name: string;
  last_name: string; phone?: string; role: string
}
interface AuthData {
  user: User; access_token: string; refresh_token: string; expires_in?: number
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthData> {
    const { data } = await api.post<ApiResponse<AuthData>>('/auth/login', payload)
    return data.data
  },

  async register(payload: RegisterPayload): Promise<AuthData> {
    const { data } = await api.post<ApiResponse<AuthData>>('/auth/register', payload)
    return data.data
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout').catch(() => {})
  },

  async refresh(): Promise<string> {
    const refreshToken = localStorage.getItem('refresh_token')
    const { data } = await api.post<ApiResponse<{ access_token: string }>>(
      '/auth/refresh', {}, { headers: { Authorization: `Bearer ${refreshToken}` } }
    )
    return data.data.access_token
  },

  async me(): Promise<User> {
    const { data } = await api.get<ApiResponse<User>>('/auth/me')
    return data.data
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email })
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await api.post('/auth/reset-password', { token, password })
  },
}
