import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plane, ChevronRight, CheckCircle2, AlertTriangle,
  Calendar, Clock, Users, Shield,
} from 'lucide-react'
import { format, parseISO, isPast, isWithinInterval, addHours, formatDistanceToNow } from 'date-fns'
import api from '@/services/api'
import Spinner from '@/components/ui/Spinner'
import { cn } from '@/utils/cn'
import type { Flight } from '@/types'

interface Assignment {
  id: number
  flight_id: number
  role_on_flight: string
  assigned_at: string
  flight: Flight
}

interface CrewProfile {
  id: number
  employee_id: string
  crew_role: string
  status: string
  certification_valid: boolean
  medical_valid: boolean
  user: { first_name: string; last_name: string; email: string }
  assignments: Assignment[]
}

const ROLE_CONFIG: Record<string, { label: string; accent: string; bg: string }> = {
  pilot:            { label: 'Pilot',            accent: 'from-brand-900 to-slate-900',  bg: 'bg-brand-700'  },
  co_pilot:         { label: 'Co-Pilot',         accent: 'from-brand-900 to-slate-900',  bg: 'bg-brand-700'  },
  flight_attendant: { label: 'Flight Attendant', accent: 'from-violet-800 to-slate-900', bg: 'bg-violet-600' },
  purser:           { label: 'Purser',           accent: 'from-amber-800 to-slate-900',  bg: 'bg-amber-600'  },
}

const FLIGHT_ROLE_LABELS: Record<string, { label: string; color: string }> = {
  captain:       { label: 'Captain',       color: 'bg-blue-100 text-blue-700' },
  first_officer: { label: 'First Officer', color: 'bg-sky-100 text-sky-700' },
  purser:        { label: 'Purser',        color: 'bg-amber-100 text-amber-700' },
  cabin_crew:    { label: 'Cabin Crew',    color: 'bg-violet-100 text-violet-700' },
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  scheduled: { label: 'Scheduled', bg: 'bg-blue-50',    text: 'text-blue-700',   dot: 'bg-blue-500'   },
  boarding:  { label: 'Boarding',  bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  departed:  { label: 'Departed',  bg: 'bg-slate-100',  text: 'text-slate-500',  dot: 'bg-slate-400'  },
  arrived:   { label: 'Arrived',   bg: 'bg-slate-100',  text: 'text-slate-500',  dot: 'bg-slate-400'  },
  delayed:   { label: 'Delayed',   bg: 'bg-amber-50',   text: 'text-amber-700',  dot: 'bg-amber-500'  },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50',     text: 'text-red-600',    dot: 'bg-red-500'    },
}

type Filter = 'upcoming' | 'past' | 'all'

export default function SchedulePage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('upcoming')

  const { data: profile, isLoading } = useQuery<CrewProfile>({
    queryKey: ['crew-me'],
    queryFn: () => api.get('/crew/me').then(r => r.data.data),
    staleTime: 30_000,
  })

  const assignments = profile?.assignments ?? []
  const roleConf = ROLE_CONFIG[profile?.crew_role ?? ''] ?? { label: profile?.crew_role ?? '', accent: 'from-slate-600 to-slate-800', bg: 'bg-slate-500' }
  const initials = profile ? `${profile.user.first_name[0]}${profile.user.last_name[0]}`.toUpperCase() : ''

  const upcoming = assignments.filter(a => a.flight && !isPast(parseISO(a.flight.departure_datetime)))
  const thisWeek = assignments.filter(a => {
    if (!a.flight) return false
    const dep = parseISO(a.flight.departure_datetime)
    return isWithinInterval(dep, { start: new Date(), end: addHours(new Date(), 168) })
  })

  const filtered = assignments.filter(a => {
    if (!a.flight) return false
    const dep = parseISO(a.flight.departure_datetime)
    if (filter === 'upcoming') return !isPast(dep)
    if (filter === 'past')     return isPast(dep)
    return true
  })

  const hasCertIssue = profile && (!profile.certification_valid || !profile.medical_valid)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-5">

      {/* ── HERO IDENTITY CARD ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className={cn('rounded-2xl bg-gradient-to-br overflow-hidden shadow-md', roleConf.accent)}>
          {/* Top strip with decorative circles */}
          <div className="relative px-6 pt-6 pb-5 flex items-center gap-5">
            {/* Decorative blobs */}
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
            <div className="absolute top-2 right-16 w-24 h-24 rounded-full bg-white/5" />

            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center shrink-0 shadow-lg z-10">
              <span className="text-2xl font-black text-white">{initials}</span>
            </div>

            {/* Name + role */}
            <div className="z-10 flex-1 min-w-0">
              <p className="text-white/60 text-xs font-bold tracking-widest uppercase mb-0.5">Crew Member</p>
              <h1 className="text-xl font-black text-white truncate">
                {profile?.user.first_name} {profile?.user.last_name}
              </h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white">
                  <Shield className="w-3 h-3" />
                  {roleConf.label}
                </span>
                <span className="text-white/50 text-xs font-mono">{profile?.employee_id}</span>
              </div>
            </div>

            {/* Cert status — top right */}
            <div className="z-10 hidden sm:flex flex-col gap-1.5 shrink-0">
              {[
                { label: 'License', valid: profile?.certification_valid },
                { label: 'Medical', valid: profile?.medical_valid },
              ].map(c => (
                <div key={c.label} className={cn(
                  'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full',
                  c.valid ? 'bg-emerald-500/20 text-emerald-200' : 'bg-red-500/30 text-red-200'
                )}>
                  {c.valid
                    ? <CheckCircle2 className="w-3 h-3" />
                    : <AlertTriangle className="w-3 h-3" />}
                  {c.label} {c.valid ? 'OK' : 'Expired'}
                </div>
              ))}
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 divide-x divide-white/10 border-t border-white/10">
            {[
              { label: 'Upcoming',      value: upcoming.length,    icon: <Plane className="w-4 h-4" /> },
              { label: 'This Week',     value: thisWeek.length,    icon: <Calendar className="w-4 h-4" /> },
              { label: 'Total Flights', value: assignments.length, icon: <Users className="w-4 h-4" /> },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center gap-1 py-4 px-3">
                <div className="text-white/40">{s.icon}</div>
                <p className="text-2xl font-black text-white leading-none">{s.value}</p>
                <p className="text-white/50 text-[11px] font-semibold text-center leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── CERT WARNING BANNER ── */}
      <AnimatePresence>
        {hasCertIssue && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-800">Certification issue</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  {[
                    !profile?.certification_valid && 'pilot license',
                    !profile?.medical_valid && 'medical certificate',
                  ].filter(Boolean).join(' and ')} {' '}
                  {(!profile?.certification_valid && !profile?.medical_valid) ? 'have' : 'has'} expired.
                  Contact the crew admin to update your records.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FILTER TABS ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {(['upcoming', 'past', 'all'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-5 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize',
                filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {f}
              {f === 'upcoming' && upcoming.length > 0 && (
                <span className={cn('ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                  filter === f ? 'bg-brand-100 text-brand-600' : 'bg-slate-200 text-slate-500'
                )}>{upcoming.length}</span>
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400 font-medium">{filtered.length} flight{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      {/* ── FLIGHT LIST ── */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Plane className="w-7 h-7 text-slate-300" />
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-600">No {filter === 'all' ? '' : filter} flights</p>
              <p className="text-slate-400 text-sm mt-1">
                {filter === 'upcoming'
                  ? 'You have no upcoming assignments. Check back after the admin assigns you to a flight.'
                  : 'No flights in this category.'}
              </p>
            </div>
          </motion.div>
        ) : (
          filtered.map((a, i) => {
            const f = a.flight
            if (!f) return null
            const dep = parseISO(f.departure_datetime)
            const arr = parseISO(f.arrival_datetime)
            const statusConf = STATUS_CONFIG[f.status] ?? STATUS_CONFIG.scheduled
            const isPastFlight = isPast(dep)
            const flightRoleConf = FLIGHT_ROLE_LABELS[a.role_on_flight] ?? { label: a.role_on_flight.replace(/_/g, ' '), color: 'bg-slate-100 text-slate-600' }
            const durationMin = Math.round((arr.getTime() - dep.getTime()) / 60000)
            const durationStr = `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`

            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/crew/flights/${f.id}`)}
                className={cn(
                  'bg-white rounded-2xl border border-slate-100 shadow-sm cursor-pointer',
                  'hover:shadow-md hover:border-slate-200 transition-all duration-200 group overflow-hidden',
                  isPastFlight && 'opacity-55'
                )}
              >
                {/* Role color accent */}
                <div className={cn('h-1', roleConf.bg.replace('bg-', 'bg-gradient-to-r from-').replace('-500', '-400'), 'opacity-60')} />

                <div className="p-4 sm:p-5">
                  <div className="flex items-center gap-4">

                    {/* Left: flight no. + date */}
                    <div className="shrink-0 w-24">
                      <p className="text-lg font-black text-brand-600 leading-none">{f.flight_number}</p>
                      <p className="text-xs text-slate-400 mt-1">{format(dep, 'dd MMM')}</p>
                      <span className={cn('mt-1.5 inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-md', flightRoleConf.color)}>
                        {flightRoleConf.label}
                      </span>
                    </div>

                    {/* Vertical divider */}
                    <div className="w-px self-stretch bg-slate-100 shrink-0" />

                    {/* Centre: route */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <div className="text-center shrink-0">
                          <p className="text-2xl font-black text-slate-900 leading-none">
                            {f.route?.origin_airport?.iata_code ?? '—'}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {f.route?.origin_airport?.city}
                          </p>
                        </div>

                        <div className="flex-1 flex flex-col items-center gap-0.5 px-1">
                          <p className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{durationStr}</p>
                          <div className="w-full flex items-center gap-1">
                            <div className="h-px flex-1 bg-slate-200" />
                            <Plane className="w-3 h-3 text-slate-300 shrink-0" />
                            <div className="h-px flex-1 bg-slate-200" />
                          </div>
                          <p className="text-[10px] text-slate-400 truncate max-w-[80px]">{f.aircraft?.model}</p>
                        </div>

                        <div className="text-center shrink-0">
                          <p className="text-2xl font-black text-slate-900 leading-none">
                            {f.route?.destination_airport?.iata_code ?? '—'}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {f.route?.destination_airport?.city}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right: time + status (desktop) */}
                    <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0">
                      <div className="text-right">
                        <p className="text-base font-black text-slate-900">{format(dep, 'HH:mm')}</p>
                        <p className="text-xs text-slate-400">{format(dep, 'EEE, dd MMM')}</p>
                      </div>
                      <span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full', statusConf.bg, statusConf.text)}>
                        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', statusConf.dot)} />
                        {statusConf.label}
                      </span>
                      {!isPastFlight && (
                        <p className="text-[11px] text-slate-400">{formatDistanceToNow(dep, { addSuffix: true })}</p>
                      )}
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>

                  {/* Mobile: bottom row */}
                  <div className="sm:hidden mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      {format(dep, 'HH:mm')} · {format(dep, 'dd MMM yyyy')}
                    </div>
                    <span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0', statusConf.bg, statusConf.text)}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', statusConf.dot)} />
                      {statusConf.label}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
