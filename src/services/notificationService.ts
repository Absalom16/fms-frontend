import api from './api'
import type { Notification, PaginatedResponse } from '@/types'

export const notificationService = {
  list: (params?: object) =>
    api.get<{ data: PaginatedResponse<Notification>; unread_count: number }>('/notifications', { params })
      .then(r => r.data),

  markRead: (id: number) =>
    api.patch(`/notifications/${id}/read`),

  markAllRead: () =>
    api.post('/notifications/read-all'),
}
