import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Plane, Clock, MapPin, Users, Shield,
  AlertTriangle, CheckCircle2, XCircle, Calendar,
  Armchair, Info,
} from 'lucide-react'
import { format, parseISO, differenceInMinutes } from 'date-fns'
import api from '@/services/api'
import Spinner from '@/components/ui/Spinner'
import { cn } from '@/utils/cn'
import { useAuthStore } from '@/store/authStore'
import type { Flight, FlightCrewAssignment } from '@/types'

interface BookingSummary {
  total: number
  confirmed: number
  checked_in: number
  economy: number
  business: number
  first_class: number
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  scheduled:  { label: 'Scheduled',  bg: 'bg-blue-50',    text: 'text-blue-700',   icon: <Clock className="w-4 h-4" /> },
  boarding:   { label: 'Boarding',   bg: 'bg-emerald-50', text: 'text-emerald-700', icon: <CheckCircle2 className="w-4 h-4" /> },
  departed:   { label: 'Departed',   bg: 'bg-slate-100',  text: 'text-slate-600',  icon: <Plane className="w-4 h-4" /> },
  arrived:    { label: 'Arrived',    bg: 'bg-slate-100',  text: 'text-slate-500',  icon: <CheckCircle2 className="w-4 h-4" /> },
  delayed:    { label: 'Delayed',    bg: 'bg-amber-50',   text: 'text-amber-700',  icon: <AlertTriangle className="w-4 h-4" /> },
  cancelled:  { label: 'Cancelled',  bg: 'bg-red-50',     text: 'text-red-600',    icon: <XCircle className="w-4 h-4" /> },
}

const CREW_ROLE_LABELS: Record<string, { label: string; color: string }> = {
  captain:       { label: 'Captain',        color: 'bg-blue-100 text-blue-700' },
  first_officer: { label: 'First Officer',  color: 'bg-sky-100 text-sky-700' },
  purser:        { label: 'Purser',         color: 'bg-amber-100 text-amber-700' },
  cabin_crew:    { label: 'Cabin Crew',     color: 'bg-violet-100 text-violet-700' },
}

const POSITION_LABELS: Record<string, string> = {
  pilot: 'Pilot', co_pilot: 'Co-Pilot',
  flight_attendant: 'Flight Attendant', purser: 'Purser',
}

export default function FlightBriefingPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const flightId = Number(id)

  const { data: flight, isLoading: flightLoading } = useQuery<Flight>({
    queryKey: ['flight', flightId],
    queryFn: () => api.get(`/flights/${flightId}`).then(r => r.data.data),
    enabled: !!flightId,
  })

  const { data: crewList = [], isLoading: crewLoading } = useQuery<FlightCrewAssignment[]>({
    queryKey: ['flight-crew', flightId],
    queryFn: () => api.get(`/flights/${flightId}/crew`).then(r => r.data.data),
    enabled: !!flightId,
  })

  // Limited booking summary — backend returns counts only for crew
  const { data: bookingSummary } = useQuery<BookingSummary>({
    queryKey: ['flight-bookings-summary', flightId],
    queryFn: () =>
      api.get(`/flights/${flightId}/bookings`).then(r => {
        const items: any[] = r.data.data ?? []
        return {
          total: items.length,
          confirmed: items.filter(b => b.status === 'confirmed').length,
          checked_in: items.filter(b => b.status === 'checked_in').length,
          economy: items.filter(b => b.cabin_class === 'economy').length,
          business: items.filter(b => b.cabin_class === 'business').length,
          first_class: items.filter(b => b.cabin_class === 'first').length,
        }
      }).catch(() => null),
    enabled: !!flightId,
  })

  if (flightLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!flight) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Flight not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-brand-600 hover:underline text-sm font-semibold">
          ← Go back
        </button>
      </div>
    )
  }

  const dep = parseISO(flight.departure_datetime)
  const arr = parseISO(flight.arrival_datetime)
  const durationMin = differenceInMinutes(arr, dep)
  const durationDisplay = `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`
  const statusConf = STATUS_CONFIG[flight.status] ?? STATUS_CONFIG.scheduled

  // Find my assignment
  const myAssignment = crewList.find(a => {
    const cm = (a as any).crew_member
    return cm?.user_id === user?.id
  })

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Back */}
      <button onClick={() => navigate('/crew/schedule')}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 font-semibold transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Schedule
      </button>

      {/* Hero card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden shadow-sm border border-slate-100">
        {/* Header band */}
        <div className="bg-gradient-to-r from-slate-800 to-brand-900 px-6 py-5 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                <Plane className="w-6 h-6 text-white fill-white/30" />
              </div>
              <div>
                <p className="text-white/60 text-xs font-semibold tracking-widest uppercase">Flight Briefing</p>
                <h1 className="text-2xl font-black">{flight.flight_number}</h1>
              </div>
            </div>
            <span className={cn('inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full', statusConf.bg, statusConf.text)}>
              {statusConf.icon}
              {statusConf.label}
            </span>
          </div>

          {/* Route display */}
          <div className="mt-6 flex items-center gap-4">
            <div>
              <p className="text-4xl font-black leading-none">{flight.route?.origin_airport?.iata_code ?? '—'}</p>
              <p className="text-white/60 text-sm mt-1">{flight.route?.origin_airport?.city}</p>
              <p className="text-white/80 font-bold text-lg mt-1">{format(dep, 'HH:mm')}</p>
              <p className="text-white/50 text-xs">{format(dep, 'EEE, dd MMM yyyy')}</p>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1 px-4">
              <p className="text-white/50 text-xs">{durationDisplay}</p>
              <div className="w-full flex items-center gap-2">
                <div className="h-px flex-1 bg-white/20" />
                <Plane className="w-4 h-4 text-white/60 shrink-0" />
                <div className="h-px flex-1 bg-white/20" />
              </div>
              <p className="text-white/40 text-xs">{flight.aircraft?.model}</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-black leading-none">{flight.route?.destination_airport?.iata_code ?? '—'}</p>
              <p className="text-white/60 text-sm mt-1">{flight.route?.destination_airport?.city}</p>
              <p className="text-white/80 font-bold text-lg mt-1">{format(arr, 'HH:mm')}</p>
              <p className="text-white/50 text-xs">{format(arr, 'EEE, dd MMM yyyy')}</p>
            </div>
          </div>
        </div>

        {/* Details strip */}
        <div className="bg-white px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-100">
          {[
            { label: 'Aircraft', value: flight.aircraft?.registration ?? '—', icon: <Plane className="w-3.5 h-3.5" /> },
            { label: 'Gate', value: (flight as any).gate ?? (flight as any).departure_gate ?? 'TBA', icon: <MapPin className="w-3.5 h-3.5" /> },
            { label: 'Terminal', value: (flight as any).terminal ?? 'TBA', icon: <Info className="w-3.5 h-3.5" /> },
            { label: 'Duration', value: durationDisplay, icon: <Clock className="w-3.5 h-3.5" /> },
          ].map(d => (
            <div key={d.label}>
              <div className="flex items-center gap-1 text-xs text-slate-400 font-medium mb-0.5">
                {d.icon} {d.label}
              </div>
              <p className="font-bold text-slate-900 text-sm">{d.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: my role + crew manifest */}
        <div className="lg:col-span-2 space-y-5">
          {/* My role */}
          {myAssignment && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="card p-5 border-l-4 border-brand-500">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">My Assignment</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">
                    {CREW_ROLE_LABELS[myAssignment.role_on_flight]?.label ?? myAssignment.role_on_flight}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Assigned {format(parseISO(myAssignment.assigned_at), 'dd MMM yyyy')}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Crew manifest */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
                <h2 className="font-bold text-slate-900">Crew Manifest</h2>
              </div>
              <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {crewList.length} assigned
              </span>
            </div>
            {crewLoading ? (
              <div className="flex items-center justify-center h-24"><Spinner /></div>
            ) : crewList.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-8">No crew assigned yet.</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {crewList.map(a => {
                  const cm = (a as any).crew_member
                  const roleConf = CREW_ROLE_LABELS[a.role_on_flight] ?? { label: a.role_on_flight, color: 'bg-slate-100 text-slate-600' }
                  const isMe = cm?.user_id === user?.id
                  return (
                    <div key={a.id} className={cn('flex items-center gap-3 px-5 py-3.5', isMe && 'bg-brand-50/50')}>
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-xs font-bold text-slate-600">
                        {cm?.user?.first_name?.[0]}{cm?.user?.last_name?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">
                          {cm?.user?.first_name} {cm?.user?.last_name}
                          {isMe && <span className="ml-1.5 text-[10px] font-bold text-brand-600 bg-brand-100 px-1.5 py-0.5 rounded-full">You</span>}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {POSITION_LABELS[cm?.crew_role] ?? cm?.crew_role} · {cm?.employee_id}
                        </p>
                      </div>
                      <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full shrink-0', roleConf.color)}>
                        {roleConf.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* Right: passenger summary */}
        <div className="space-y-5">
          {bookingSummary && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Armchair className="w-4 h-4 text-slate-500" />
                <h2 className="font-bold text-slate-900">Passenger Load</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">Total booked</p>
                  <p className="font-bold text-slate-900">{bookingSummary.total}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">Checked in</p>
                  <p className="font-bold text-emerald-600">{bookingSummary.checked_in}</p>
                </div>
                <div className="h-px bg-slate-100" />
                {[
                  { label: 'Economy',  value: bookingSummary.economy,    color: 'bg-slate-200' },
                  { label: 'Business', value: bookingSummary.business,   color: 'bg-brand-300' },
                  { label: 'First',    value: bookingSummary.first_class, color: 'bg-amber-300' },
                ].map(c => (
                  <div key={c.label}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-500">{c.label}</span>
                      <span className="font-semibold text-slate-700">{c.value}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', c.color)}
                        style={{ width: bookingSummary.total > 0 ? `${(c.value / bookingSummary.total) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Delay / cancellation info */}
          {(flight.status === 'delayed' || flight.status === 'cancelled') && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className={cn('card p-5', flight.status === 'delayed' ? 'border-l-4 border-amber-400' : 'border-l-4 border-red-400')}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className={cn('w-4 h-4', flight.status === 'delayed' ? 'text-amber-500' : 'text-red-500')} />
                <p className="font-bold text-slate-900 text-sm">
                  {flight.status === 'delayed' ? 'Flight Delayed' : 'Flight Cancelled'}
                </p>
              </div>
              {flight.delay_minutes && (
                <p className="text-xs text-slate-500">Delay: <span className="font-semibold text-amber-600">{flight.delay_minutes} min</span></p>
              )}
              {(flight.delay_reason ?? flight.cancellation_reason) && (
                <p className="text-xs text-slate-500 mt-1">
                  {flight.delay_reason ?? flight.cancellation_reason}
                </p>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
