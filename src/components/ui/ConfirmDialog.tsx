import { AlertTriangle, Trash2, Info } from 'lucide-react'
import Modal from './Modal'

type Variant = 'danger' | 'warning' | 'info'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: Variant
  loading?: boolean
}

const VARIANT_CONFIG = {
  danger:  { icon: Trash2,         iconBg: 'bg-red-50',    iconColor: 'text-red-500',    btn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500' },
  warning: { icon: AlertTriangle,  iconBg: 'bg-amber-50',  iconColor: 'text-amber-500',  btn: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500' },
  info:    { icon: Info,           iconBg: 'bg-brand-50',  iconColor: 'text-brand-600',  btn: 'bg-brand-600 hover:bg-brand-700 focus:ring-brand-500' },
}

export default function ConfirmDialog({
  open, onClose, onConfirm,
  title, message,
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  variant      = 'danger',
  loading      = false,
}: ConfirmDialogProps) {
  const { icon: Icon, iconBg, iconColor, btn } = VARIANT_CONFIG[variant]

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className={`w-11 h-11 rounded-2xl ${iconBg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <div className="min-w-0 pt-0.5">
            <h3 className="text-base font-bold text-slate-900 leading-snug">{title}</h3>
            {message && <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{message}</p>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-xl text-sm font-bold text-white transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${btn}`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                {confirmLabel}…
              </span>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
