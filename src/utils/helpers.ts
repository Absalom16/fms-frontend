import { format, formatDistanceToNow, parseISO, differenceInMinutes } from 'date-fns'
import type { CabinClass } from '@/types'

export function formatDate(dateStr: string, fmt = 'MMM d, yyyy'): string {
  try { return format(parseISO(dateStr), fmt) } catch { return dateStr }
}

export function formatDateTime(dateStr: string): string {
  try { return format(parseISO(dateStr), 'MMM d, yyyy HH:mm') } catch { return dateStr }
}

export function formatTime(dateStr: string): string {
  try { return format(parseISO(dateStr), 'HH:mm') } catch { return dateStr }
}

export function timeAgo(dateStr: string): string {
  try { return formatDistanceToNow(parseISO(dateStr), { addSuffix: true }) } catch { return '' }
}

export function flightDuration(departure: string, arrival: string): string {
  try {
    const mins = differenceInMinutes(parseISO(arrival), parseISO(departure))
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `${h}h ${m}m`
  } catch { return '' }
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n)
}

export const flightStatusConfig: Record<string, { label: string; color: string; cssColor: string; bg: string }> = {
  scheduled: { label: 'Scheduled', color: 'blue',   cssColor: 'text-blue-700',   bg: 'bg-blue-50 ring-blue-200' },
  boarding:  { label: 'Boarding',  color: 'indigo', cssColor: 'text-indigo-700', bg: 'bg-indigo-50 ring-indigo-200' },
  departed:  { label: 'Departed',  color: 'slate',  cssColor: 'text-slate-700',  bg: 'bg-slate-100 ring-slate-200' },
  arrived:   { label: 'Arrived',   color: 'green',  cssColor: 'text-green-700',  bg: 'bg-green-50 ring-green-200' },
  delayed:   { label: 'Delayed',   color: 'amber',  cssColor: 'text-amber-700',  bg: 'bg-amber-50 ring-amber-200' },
  cancelled: { label: 'Cancelled', color: 'red',    cssColor: 'text-red-700',    bg: 'bg-red-50 ring-red-200' },
  diverted:  { label: 'Diverted',  color: 'purple', cssColor: 'text-purple-700', bg: 'bg-purple-50 ring-purple-200' },
}

export const bookingStatusConfig: Record<string, { label: string; color: string; cssColor: string; bg: string }> = {
  pending:    { label: 'Pending',    color: 'amber',  cssColor: 'text-amber-700',  bg: 'bg-amber-50 ring-amber-200' },
  confirmed:  { label: 'Confirmed',  color: 'green',  cssColor: 'text-green-700',  bg: 'bg-green-50 ring-green-200' },
  cancelled:  { label: 'Cancelled',  color: 'red',    cssColor: 'text-red-700',    bg: 'bg-red-50 ring-red-200' },
  checked_in: { label: 'Checked In', color: 'blue',   cssColor: 'text-blue-700',   bg: 'bg-blue-50 ring-blue-200' },
  boarded:    { label: 'Boarded',    color: 'indigo', cssColor: 'text-indigo-700', bg: 'bg-indigo-50 ring-indigo-200' },
  no_show:    { label: 'No Show',    color: 'slate',  cssColor: 'text-slate-600',  bg: 'bg-slate-100 ring-slate-200' },
}

export const cabinClassConfig: Record<CabinClass, { label: string; icon: string }> = {
  economy:  { label: 'Economy',        icon: '💺' },
  business: { label: 'Business',       icon: '🛋️' },
  first:    { label: 'First Class',    icon: '⭐' },
}

export function getInitials(firstName?: string, lastName?: string): string {
  if (lastName) return ((firstName?.[0] ?? '') + (lastName?.[0] ?? '')).toUpperCase()
  if (firstName) return firstName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return '?'
}

export function truncate(str: string, length = 30): string {
  return str.length > length ? str.slice(0, length) + '…' : str
}
