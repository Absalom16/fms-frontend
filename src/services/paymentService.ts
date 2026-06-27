import api from './api'
import type { Payment } from '@/types'

export const paymentService = {
  create: (data: object) =>
    api.post<{ data: Payment }>('/payments', data).then(r => r.data.data),

  getById: (id: number) =>
    api.get<{ data: Payment }>(`/payments/${id}`).then(r => r.data.data),

  list: (params?: object) =>
    api.get<{ data: { items: Payment[]; total: number } }>('/payments', { params }).then(r => r.data.data),
}
