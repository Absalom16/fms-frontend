import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  User, Mail, Phone, Shield, CheckCircle2, AlertCircle,
  Calendar, Briefcase, Globe, Hash, ClipboardList,
} from 'lucide-react'
import { format, parseISO, differenceInDays } from 'date-fns'
import api from '@/services/api'
import Spinner from '@/components/ui/Spinner'
import { cn } from '@/utils/cn'

interface CrewProfile {
  id: number
  employee_id: string
  crew_role: string
  license_number: string | null
  certification_expiry: string | null
  medical_expiry: string | null
  hire_date: string | null
  status: 'active' | 'on_leave' | 'retired'
  certification_valid: boolean
  medical_valid: boolean
  user: {
    id: number
    first_name: string
    last_name: string
    email: string
    phone: string | null
    created_at: string
    last_login: string | null
  }
  assignments: { id: number }[]
}

const ROLE_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  pilot:            { label: 'Pilot',            bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200' },
  co_pilot:         { label: 'Co-Pilot',         bg: 'bg-sky-50',    text: 'text-sky-700',    border: 'border-sky-200'  },
  flight_attendant: { label: 'Flight Attendant', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  purser:           { label: 'Purser',           bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200' },
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string }> = {
  active:   { label: 'Active',   dot: 'bg-emerald-500', text: 'text-emerald-700' },
  on_leave: { label: 'On Leave', dot: 'bg-amber-500',   text: 'text-amber-700'  },
  retired:  { label: 'Retired',  dot: 'bg-slate-400',   text: 'text-slate-500'  },
}

function CertCard({
  label, expiry, valid, icon,
}: { label: string; expiry: string | null; valid: boolean; icon: React.ReactNode }) {
  const daysLeft = expiry ? differenceInDays(parseISO(expiry), new Date()) : null
  const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30

  return (
    <div className={cn(
      'rounded-xl border p-4',
      valid
        ? isExpiringSoon ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'
        : 'border-red-200 bg-red-50'
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={cn(valid ? (isExpiringSoon ? 'text-amber-600' : 'text-emerald-600') : 'text-red-500')}>
            {icon}
          </span>
          <p className="text-sm font-bold text-slate-700">{label}</p>
        </div>
        {valid
          ? <CheckCircle2 className={cn('w-4 h-4', isExpiringSoon ? 'text-amber-500' : 'text-emerald-500')} />
          : <AlertCircle className="w-4 h-4 text-red-500" />}
      </div>
      <p className={cn('text-xs font-semibold', valid ? (isExpiringSoon ? 'text-amber-600' : 'text-emerald-700') : 'text-red-600')}>
        {valid ? (isExpiringSoon ? 'Expiring Soon' : 'Valid') : 'Expired'}
      </p>
      {expiry ? (
        <p className="text-xs text-slate-500 mt-0.5">
          Expires {format(parseISO(expiry), 'dd MMM yyyy')}
          {daysLeft !== null && daysLeft >= 0 && (
            <span className={cn('ml-1 font-semibold', isExpiringSoon ? 'text-amber-600' : '')}> ({daysLeft}d left)</span>
          )}
        </p>
      ) : (
        <p className="text-xs text-slate-400 mt-0.5">No expiry on file</p>
      )}
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <span className="text-slate-400 mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-400 mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-slate-800 truncate">{value ?? '—'}</p>
      </div>
    </div>
  )
}

export default function CrewProfilePage() {
  const { data: profile, isLoading } = useQuery<CrewProfile>({
    queryKey: ['crew-me'],
    queryFn: () => api.get('/crew/me').then(r => r.data.data),
    staleTime: 60_000,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Could not load profile.</p>
      </div>
    )
  }

  const { user } = profile
  const roleConf = ROLE_CONFIG[profile.crew_role] ?? { label: profile.crew_role, bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' }
  const statusConf = STATUS_CONFIG[profile.status] ?? STATUS_CONFIG.active
  const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="card overflow-hidden">
        {/* Top accent */}
        <div className="h-24 bg-gradient-to-br from-brand-800 to-slate-900" />
        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="-mt-12 mb-4 flex items-end justify-between">
            <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center">
              <span className="text-2xl font-black text-brand-700">{initials}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border', roleConf.bg, roleConf.text, roleConf.border)}>
                {roleConf.label}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                <span className={cn('w-2 h-2 rounded-full', statusConf.dot)} />
                <span className={statusConf.text}>{statusConf.label}</span>
              </span>
            </div>
          </div>

          {/* Name */}
          <h1 className="text-xl font-bold text-slate-900">{user.first_name} {user.last_name}</h1>
          <p className="text-slate-500 text-sm mt-0.5 font-mono">{profile.employee_id}</p>

          {/* Stats row */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: 'Flights Assigned', value: profile.assignments.length },
              { label: 'Hire Date', value: profile.hire_date ? format(parseISO(profile.hire_date), 'MMM yyyy') : '—' },
              { label: 'Member Since', value: format(parseISO(user.created_at), 'MMM yyyy') },
            ].map(s => (
              <div key={s.label} className="text-center bg-slate-50 rounded-xl p-3">
                <p className="text-lg font-black text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Contact & account */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-slate-400" />
            <h2 className="font-bold text-slate-900 text-sm">Contact & Account</h2>
          </div>
          <InfoRow icon={<Mail className="w-4 h-4" />}    label="Email"       value={user.email} />
          <InfoRow icon={<Phone className="w-4 h-4" />}   label="Phone"       value={user.phone} />
          <InfoRow icon={<Hash className="w-4 h-4" />}    label="Employee ID" value={profile.employee_id} />
          <InfoRow icon={<Briefcase className="w-4 h-4" />} label="Position"  value={roleConf.label} />
          <InfoRow icon={<Calendar className="w-4 h-4" />} label="Last Login"
            value={user.last_login ? format(parseISO(user.last_login), 'dd MMM yyyy · HH:mm') : 'Never'} />
        </motion.div>

        {/* Certifications */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-slate-400" />
            <h2 className="font-bold text-slate-900 text-sm">Certifications</h2>
          </div>
          <div className="space-y-3">
            <CertCard
              label="Pilot License"
              expiry={profile.certification_expiry}
              valid={profile.certification_valid}
              icon={<ClipboardList className="w-4 h-4" />}
            />
            <CertCard
              label="Medical Certificate"
              expiry={profile.medical_expiry}
              valid={profile.medical_valid}
              icon={<Shield className="w-4 h-4" />}
            />
          </div>
          {profile.license_number && (
            <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <p className="text-xs text-slate-400 font-medium">License Number</p>
              <p className="text-sm font-bold text-slate-800 font-mono mt-0.5">{profile.license_number}</p>
            </div>
          )}
          <p className="text-xs text-slate-400 mt-4 text-center">
            Contact admin to update certifications
          </p>
        </motion.div>
      </div>
    </div>
  )
}
