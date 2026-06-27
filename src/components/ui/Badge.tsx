import { cn } from '@/utils/cn'
import type { FlightStatus, BookingStatus } from '@/types'
import { flightStatusConfig, bookingStatusConfig } from '@/utils/helpers'

type BadgeColor = 'blue' | 'green' | 'amber' | 'red' | 'slate' | 'indigo' | 'purple'

interface BadgeProps {
  children: React.ReactNode
  className?: string
  color?: BadgeColor
  variant?: BadgeColor
  size?: 'sm' | 'md'
}

const colors = {
  blue:   'bg-blue-50 text-blue-700 ring-blue-200',
  green:  'bg-green-50 text-green-700 ring-green-200',
  amber:  'bg-amber-50 text-amber-700 ring-amber-200',
  red:    'bg-red-50 text-red-700 ring-red-200',
  slate:  'bg-slate-100 text-slate-700 ring-slate-200',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  purple: 'bg-purple-50 text-purple-700 ring-purple-200',
}

export default function Badge({ children, color = 'blue', size = 'md', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center font-semibold ring-1 ring-inset',
      size === 'sm' ? 'px-2 py-0.5 text-xs rounded-md' : 'px-2.5 py-1 text-xs rounded-lg',
      colors[color], className
    )}>
      {children}
    </span>
  )
}

export function FlightStatusBadge({ status }: { status: FlightStatus }) {
  const cfg = flightStatusConfig[status]
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg ring-1 ring-inset', cfg.color, cfg.bg)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {cfg.label}
    </span>
  )
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const cfg = bookingStatusConfig[status]
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg ring-1 ring-inset', cfg.color, cfg.bg)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {cfg.label}
    </span>
  )
}
