import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface ActionObject { label: string; to?: string; onClick?: () => void }

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode | ActionObject
  className?: string
}

function isActionObject(a: unknown): a is ActionObject {
  return typeof a === 'object' && a !== null && 'label' in a
}

export default function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-2 text-sm text-slate-500 max-w-sm">{description}</p>}
      {action && (
        <div className="mt-6">
          {isActionObject(action) ? (
            action.to ? (
              <Link to={action.to} className="btn-primary text-sm px-5 py-2.5">{action.label}</Link>
            ) : (
              <button onClick={action.onClick} className="btn-primary text-sm px-5 py-2.5">{action.label}</button>
            )
          ) : action}
        </div>
      )}
    </div>
  )
}
