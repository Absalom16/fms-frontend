import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'
import type { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: ReactNode
  trend?: { value: number; label: string }
  color?: 'blue' | 'green' | 'amber' | 'purple' | 'rose'
  index?: number
}

const colors = {
  blue:   { icon: 'bg-blue-50 text-blue-600',   accent: 'bg-blue-500' },
  green:  { icon: 'bg-green-50 text-green-600',  accent: 'bg-green-500' },
  amber:  { icon: 'bg-amber-50 text-amber-600',  accent: 'bg-amber-500' },
  purple: { icon: 'bg-purple-50 text-purple-600', accent: 'bg-purple-500' },
  rose:   { icon: 'bg-rose-50 text-rose-600',    accent: 'bg-rose-500' },
}

export default function StatCard({ title, value, subtitle, icon, trend, color = 'blue', index = 0 }: StatCardProps) {
  const c = colors[color]
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 relative overflow-hidden group hover:shadow-card-hover transition-shadow duration-300"
    >
      <div className={cn('absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-5', c.accent)} />
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          {trend && (
            <div className={cn(
              'mt-3 inline-flex items-center gap-1 text-xs font-semibold',
              trend.value >= 0 ? 'text-green-600' : 'text-red-500'
            )}>
              <span>{trend.value >= 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-slate-400 font-normal">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn('p-3.5 rounded-2xl shrink-0', c.icon)}>
          {icon}
        </div>
      </div>
    </motion.div>
  )
}
