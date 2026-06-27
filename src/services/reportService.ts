import api from './api'
import type { BookingReportItem, RevenueReportItem, OccupancyReportItem, ApiResponse } from '@/types'

export const reportService = {
  async summary(): Promise<Record<string, unknown>> {
    const { data } = await api.get<ApiResponse<Record<string, unknown>>>('/reports/summary')
    return data.data
  },

  async revenue(params: { start_date: string; end_date: string; period?: string }): Promise<RevenueReportItem[]> {
    const { data } = await api.get<ApiResponse<RevenueReportItem[]>>('/reports/revenue', { params })
    return Array.isArray(data.data) ? data.data : []
  },

  async bookings(params: { start_date: string; end_date: string; period?: string }): Promise<BookingReportItem[]> {
    const { data } = await api.get<ApiResponse<BookingReportItem[]>>('/reports/bookings', { params })
    return Array.isArray(data.data) ? data.data : []
  },

  async occupancy(params?: object): Promise<OccupancyReportItem[]> {
    const { data } = await api.get<ApiResponse<OccupancyReportItem[]>>('/reports/occupancy', { params })
    return Array.isArray(data.data) ? data.data : []
  },
}
