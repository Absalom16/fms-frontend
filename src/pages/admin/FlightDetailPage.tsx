import { useState, useRef, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Plane, Users, CheckCircle, Clock, Armchair,
  Plus, Trash2, Shield, UserCheck,
} from 'lucide-react'
import { flightService } from '@/services/flightService'
import { crewService } from '@/services/crewService'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import { flightStatusConfig, formatCurrency } from '@/utils/helpers'
import { format, parseISO } from 'date-fns'
import toast from 'react-hot-toast'

const BOOKING_STATUS: Record<string, { label: string; color: string; dot: string }> = {
  pending:    { label: 'Pending',    color: 'text-amber-700 bg-amber-50',    dot: 'bg-amber-400'   },
  confirmed:  { label: 'Confirmed',  color: 'text-emerald-700 bg-emerald-50', dot: 'bg-emerald-500' },
  cancelled:  { label: 'Cancelled',  color: 'text-red-600 bg-red-50',        dot: 'bg-red-400'     },
  checked_in: { label: 'Checked In', color: 'text-blue-700 bg-blue-50',      dot: 'bg-blue-500'    },
  boarded:    { label: 'Boarded',    color: 'text-purple-700 bg-purple-50',  dot: 'bg-purple-500'  },
  no_show:    { label: 'No Show',    color: 'text-slate-600 bg-slate-100',   dot: 'bg-slate-400'   },
}

const CLASS_SEAT_COLORS: Record<string, { booked: string; available: string; label: string }> = {
  first:    { booked: 'bg-violet-500 text-white border-violet-600', available: 'bg-violet-50 text-violet-300 border-violet-100', label: 'First' },
  business: { booked: 'bg-brand-600 text-white border-brand-700',  available: 'bg-blue-50 text-blue-200 border-blue-100',       label: 'Business' },
  economy:  { booked: 'bg-slate-700 text-white border-slate-800',  available: 'bg-slate-50 text-slate-300 border-slate-200',    label: 'Economy' },
}

const FLIGHT_ROLES = [
  { value: 'captain',        label: 'Captain',       desc: 'Pilot in Command', accent: 'border-blue-400 bg-blue-50 ring-blue-300',   icon: '✈', iconBg: 'bg-blue-100 text-blue-600'   },
  { value: 'first_officer',  label: 'First Officer', desc: 'Co-Pilot',         accent: 'border-sky-400 bg-sky-50 ring-sky-300',      icon: '🛫', iconBg: 'bg-sky-100 text-sky-600'     },
  { value: 'purser',         label: 'Purser',        desc: 'Lead Cabin Crew',  accent: 'border-amber-400 bg-amber-50 ring-amber-300', icon: '⭐', iconBg: 'bg-amber-100 text-amber-600' },
  { value: 'cabin_crew',     label: 'Cabin Crew',    desc: 'Flight Attendant', accent: 'border-violet-400 bg-violet-50 ring-violet-300', icon: '🙋', iconBg: 'bg-violet-100 text-violet-600' },
]

const CREW_ROLE_COLORS: Record<string, string> = {
  pilot:            'bg-blue-100 text-blue-700',
  co_pilot:         'bg-sky-100 text-sky-700',
  flight_attendant: 'bg-violet-100 text-violet-700',
  purser:           'bg-amber-100 text-amber-700',
}

const FLIGHT_ROLE_BADGE: Record<string, string> = {
  captain:       'bg-blue-100 text-blue-700',
  first_officer: 'bg-sky-100 text-sky-700',
  purser:        'bg-amber-100 text-amber-700',
  cabin_crew:    'bg-violet-100 text-violet-700',
}

const CREW_ROLE_LABELS: Record<string, string> = {
  pilot:            'Pilot',
  co_pilot:         'Co-Pilot',
  flight_attendant: 'Flight Attendant',
  purser:           'Purser',
}

function SeatGrid({ seats, bookings }: { seats: any[]; bookings: any[] }) {
  const [hovered, setHovered] = useState<string | null>(null)

  const seatBookingMap: Record<number, any> = {}
  for (const b of bookings) {
    if (b.seat?.id) seatBookingMap[b.seat.id] = b
  }

  const classes = ['first', 'business', 'economy'] as const
  const byClass: Record<string, any[]> = { first: [], business: [], economy: [] }
  for (const seat of seats) {
    const cls = seat.seat_class as keyof typeof byClass
    if (byClass[cls]) byClass[cls].push(seat)
  }

  return (
    <div className="space-y-5">
      {classes.map(cls => {
        const clsSeats = byClass[cls]
        if (!clsSeats.length) return null
        const cfg = CLASS_SEAT_COLORS[cls]
        const booked = clsSeats.filter(s => !s.is_available).length
        const rows: any[][] = []
        for (let i = 0; i < clsSeats.length; i += 6) rows.push(clsSeats.slice(i, i + 6))

        return (
          <div key={cls}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black tracking-widest uppercase text-slate-400">{cfg.label}</span>
              <span className="text-xs text-slate-400">
                <span className="font-bold text-slate-700">{booked}</span> / {clsSeats.length} booked
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-1 px-0.5">
              {['A','B','C','','D','E','F'].map((l, i) => (
                <div key={i} className="text-center text-[9px] font-bold text-slate-300">{l}</div>
              ))}
            </div>
            <div className="space-y-1">
              {rows.map((row, ri) => {
                const [a, b, c, d, e, f] = row
                const renderSeat = (seat: any) => {
                  if (!seat) return <div />
                  const isBooked = !seat.is_available
                  const booking  = seatBookingMap[seat.id]
                  const colorCls = isBooked ? cfg.booked : cfg.available
                  return (
                    <div key={seat.id} className="relative flex justify-center"
                      onMouseEnter={() => setHovered(seat.seat_number)}
                      onMouseLeave={() => setHovered(null)}>
                      <button className={`w-8 h-9 rounded-t-xl rounded-b-md border text-[9px] font-bold transition-all duration-150 ${colorCls} ${isBooked ? 'cursor-default' : 'cursor-default opacity-60'}`}>
                        {seat.seat_number}
                      </button>
                      {hovered === seat.seat_number && isBooked && booking && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-20 bg-slate-900 text-white text-[10px] font-semibold rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-xl pointer-events-none">
                          <p>{booking.passenger_name}</p>
                          <p className="text-slate-400 font-mono">{booking.pnr_code}</p>
                        </div>
                      )}
                    </div>
                  )
                }
                return (
                  <div key={ri} className="grid grid-cols-7 gap-1 items-center">
                    {renderSeat(a)}{renderSeat(b)}{renderSeat(c)}
                    <div className="flex justify-center"><span className="text-[9px] font-bold text-slate-300">{ri + 1}</span></div>
                    {renderSeat(d)}{renderSeat(e)}{renderSeat(f)}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
      <div className="flex items-center gap-4 pt-2 border-t border-slate-100 flex-wrap">
        {(['first','business','economy'] as const).map(cls => (
          <div key={cls} className="flex items-center gap-1.5">
            <div className={`w-5 h-5 rounded-t-lg rounded-b-sm border ${CLASS_SEAT_COLORS[cls].booked}`} />
            <span className="text-[10px] font-bold text-slate-500">{CLASS_SEAT_COLORS[cls].label} booked</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-t-lg rounded-b-sm border bg-slate-50 border-slate-200" />
          <span className="text-[10px] font-bold text-slate-400">Available</span>
        </div>
      </div>
    </div>
  )
}

export default function FlightDetailPage() {
  const { id } = useParams<{ id: string }>()
  const flightId = Number(id)
  const queryClient = useQueryClient()

  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedCrewId, setSelectedCrewId] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [crewDropdownOpen, setCrewDropdownOpen] = useState(false)
  const crewDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (crewDropdownRef.current && !crewDropdownRef.current.contains(e.target as Node)) {
        setCrewDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const { data: flight, isLoading: loadingFlight } = useQuery({
    queryKey: ['flight', flightId],
    queryFn: () => flightService.get(flightId),
  })
  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['flight-bookings', flightId],
    queryFn: () => flightService.getFlightBookings(flightId),
  })
  const { data: seats = [], isLoading: loadingSeats } = useQuery({
    queryKey: ['flight-seats', flightId],
    queryFn: () => flightService.getSeats(flightId),
  })
  const { data: crewAssignments = [], isLoading: loadingCrew } = useQuery({
    queryKey: ['flight-crew', flightId],
    queryFn: () => crewService.getFlightCrew(flightId),
  })
  const { data: allCrewPage } = useQuery({
    queryKey: ['crew-list-all'],
    queryFn: () => crewService.list({ per_page: 100 }),
    enabled: showAssignModal,
  })
  const allCrew = allCrewPage?.items ?? []

  const assignedCrewIds = new Set(crewAssignments.map((a: any) => a.crew_member_id))
  const availableCrew = allCrew.filter(c => !assignedCrewIds.has(c.id))

  const assignMutation = useMutation({
    mutationFn: () => crewService.assignToFlight(flightId, Number(selectedCrewId), selectedRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flight-crew', flightId] })
      toast.success('Crew member assigned.')
      setShowAssignModal(false)
      setSelectedCrewId('')
      setSelectedRole('')
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Assignment failed'),
  })

  const removeMutation = useMutation({
    mutationFn: (crewMemberId: number) => crewService.removeFromFlight(flightId, crewMemberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flight-crew', flightId] })
      toast.success('Crew member removed.')
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Remove failed'),
  })

  if (loadingFlight) {
    return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  }
  if (!flight) {
    return <div className="p-8 text-center text-slate-500">Flight not found.</div>
  }

  const origin = flight.route?.origin_airport
  const dest   = flight.route?.destination_airport
  const cfg    = flightStatusConfig[flight.status] ?? { label: flight.status, color: 'slate' }

  const totalSeats = seats.length
  const booked     = seats.filter(s => !(s as any).is_available).length
  const available  = totalSeats - booked
  const occupancy  = totalSeats ? Math.round((booked / totalSeats) * 100) : 0

  const activeBookings    = bookings.filter(b => !['cancelled','no_show'].includes(b.status))
  const cancelledBookings = bookings.filter(b => ['cancelled','no_show'].includes(b.status))

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Dark hero ── */}
      <div className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0c1220 0%, #0f2a5c 65%, #0d1a3a 100%)' }}>
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '20px 20px' }} />

        <div className="relative max-w-7xl mx-auto px-6 py-6">
          <Link to="/admin/flights"
            className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs font-semibold mb-5 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Flights
          </Link>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-black text-white tracking-tight">{flight.flight_number}</h1>
                <Badge variant={cfg.color as any}>{cfg.label}</Badge>
              </div>
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <span className="font-bold text-white/80">{origin?.iata_code ?? '?'}</span>
                <span className="text-white/30">{origin?.city}</span>
                <Plane className="w-3.5 h-3.5 text-white/20 mx-1" />
                <span className="font-bold text-white/80">{dest?.iata_code ?? '?'}</span>
                <span className="text-white/30">{dest?.city}</span>
              </div>
            </div>
            <div className="flex items-start gap-6 flex-wrap">
              <div className="flex gap-6 text-right">
                {flight.departure_datetime && (
                  <div>
                    <p className="text-white/30 text-[10px] font-bold tracking-widest uppercase">Departure</p>
                    <p className="text-white font-bold">{format(parseISO(flight.departure_datetime), 'MMM d · HH:mm')}</p>
                  </div>
                )}
                {flight.arrival_datetime && (
                  <div>
                    <p className="text-white/30 text-[10px] font-bold tracking-widest uppercase">Arrival</p>
                    <p className="text-white font-bold">{format(parseISO(flight.arrival_datetime), 'MMM d · HH:mm')}</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowAssignModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-brand-700 text-sm font-bold hover:bg-brand-50 transition-colors shadow-md shrink-0"
              >
                <Plus className="w-4 h-4" /> Assign Crew
              </button>
            </div>
          </div>

          <div className="flex gap-3 mt-5 flex-wrap">
            {[
              { icon: Armchair,    label: 'Total Seats', value: totalSeats,       color: 'text-white/80' },
              { icon: Users,       label: 'Booked',      value: booked,           color: 'text-emerald-400' },
              { icon: CheckCircle, label: 'Available',   value: available,        color: 'text-sky-400' },
              { icon: Clock,       label: 'Occupancy',   value: `${occupancy}%`,  color: occupancy >= 80 ? 'text-amber-400' : 'text-white/60' },
              { icon: UserCheck,   label: 'Crew',        value: crewAssignments.length, color: 'text-violet-400' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${color} shrink-0`} />
                <div>
                  <p className="text-[10px] text-white/30 font-bold tracking-widest uppercase">{label}</p>
                  <p className={`text-base font-black ${color}`}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* Passenger + Seats row */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

          {/* Passenger manifest (3/5) */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="xl:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">Passenger Manifest</p>
                <p className="text-xs text-slate-400 mt-0.5">{activeBookings.length} active · {cancelledBookings.length} cancelled</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs text-slate-400 font-semibold">Active</span>
              </div>
            </div>
            {loadingBookings ? (
              <div className="flex items-center justify-center h-40"><Spinner /></div>
            ) : bookings.length === 0 ? (
              <div className="py-14 text-center">
                <Users className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">No bookings for this flight yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      {['Passenger', 'Seat', 'Class', 'PNR', 'Status', 'Fare', 'Booked'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {bookings.map((b, i) => {
                      const sc = BOOKING_STATUS[b.status] ?? BOOKING_STATUS.pending
                      const isCancelled = ['cancelled','no_show'].includes(b.status)
                      return (
                        <motion.tr key={b.id}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                          className={`hover:bg-slate-50/80 transition-colors ${isCancelled ? 'opacity-50' : ''}`}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 text-[10px] font-black shrink-0">
                                {b.passenger_name?.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900 text-xs">{b.passenger_name}</p>
                                <p className="text-[10px] text-slate-400">{b.passenger_email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-1 rounded-lg text-slate-700">
                              {b.seat?.seat_number ?? '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="capitalize text-xs text-slate-600 font-medium">{b.cabin_class}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-mono text-xs font-bold text-slate-500 tracking-wider">
                            {b.pnr_code}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                              {sc.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-700 text-xs">
                            {formatCurrency(Number(b.fare_amount))}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400">
                            {b.booked_at ? format(parseISO(b.booked_at), 'MMM d, HH:mm') : '—'}
                          </td>
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

          {/* Seat map (2/5) */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="font-bold text-slate-900">Seat Map</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {flight.aircraft?.registration ?? flight.aircraft?.registration_number ?? 'Aircraft'} · hover a seat for passenger
              </p>
            </div>
            <div className="p-5">
              {loadingSeats ? (
                <div className="flex items-center justify-center h-40"><Spinner /></div>
              ) : seats.length === 0 ? (
                <div className="py-10 text-center">
                  <Armchair className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">No seat data available.</p>
                </div>
              ) : (
                <SeatGrid seats={seats} bookings={bookings} />
              )}
            </div>
          </motion.div>
        </div>

        {/* ── Crew Assignment panel ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900">Crew Assignment</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {crewAssignments.length} member{crewAssignments.length !== 1 ? 's' : ''} assigned to this flight
              </p>
            </div>
            <button
              onClick={() => setShowAssignModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Assign Crew
            </button>
          </div>

          {loadingCrew ? (
            <div className="flex items-center justify-center h-32"><Spinner /></div>
          ) : crewAssignments.length === 0 ? (
            <div className="py-14 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-slate-300" />
              </div>
              <p className="font-semibold text-slate-500">No crew assigned yet</p>
              <p className="text-slate-400 text-sm mt-1">Click "Assign Crew" to add crew members to this flight.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {crewAssignments.map((a: any, i: number) => {
                const cm = a.crew_member
                const name = cm ? `${cm.user?.first_name ?? ''} ${cm.user?.last_name ?? ''}`.trim() : '—'
                const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()
                const crewRoleLabel = CREW_ROLE_LABELS[cm?.crew_role] ?? cm?.crew_role ?? '—'
                const flightRoleBadge = FLIGHT_ROLE_BADGE[a.role_on_flight] ?? 'bg-slate-100 text-slate-600'
                const flightRoleLabel = FLIGHT_ROLES.find(r => r.value === a.role_on_flight)?.label ?? a.role_on_flight

                return (
                  <motion.div key={a.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-colors group">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 text-xs font-black shrink-0">
                      {initials}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-900 text-sm">{name}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${flightRoleBadge}`}>
                          {flightRoleLabel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {crewRoleLabel} · {cm?.employee_id ?? '—'}
                      </p>
                    </div>
                    {/* Assigned at */}
                    <p className="hidden sm:block text-xs text-slate-400 shrink-0">
                      Assigned {a.assigned_at ? format(parseISO(a.assigned_at), 'MMM d, yyyy') : '—'}
                    </p>
                    {/* Remove */}
                    <button
                      onClick={() => removeMutation.mutate(a.crew_member_id)}
                      disabled={removeMutation.isPending}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      title="Remove from flight"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Assign Crew Modal ── */}
      <AnimatePresence>
        {showAssignModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => setShowAssignModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg pointer-events-auto overflow-hidden">
                {/* Header */}
                <div className="h-1 bg-gradient-to-r from-brand-500 to-brand-700" />
                <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-bold text-slate-900 text-lg">Assign Crew Member</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {flight.flight_number} · {origin?.iata_code} → {dest?.iata_code}
                    </p>
                  </div>
                  <button
                    onClick={() => { setShowAssignModal(false); setSelectedCrewId(''); setSelectedRole('') }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0 mt-0.5"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  {/* Crew member dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Select Crew Member</label>
                    <div ref={crewDropdownRef} className="relative">
                      {/* Trigger */}
                      <button
                        type="button"
                        onClick={() => availableCrew.length > 0 && setCrewDropdownOpen(o => !o)}
                        className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-all ${
                          crewDropdownOpen
                            ? 'border-brand-500 ring-2 ring-brand-200'
                            : 'border-slate-200 hover:border-slate-300'
                        } bg-white`}
                      >
                        {selectedCrewId ? (() => {
                          const c = availableCrew.find(x => String(x.id) === selectedCrewId)
                          if (!c) return <span className="text-sm text-slate-400 flex-1">Select a crew member…</span>
                          const initials = `${c.first_name?.[0] ?? ''}${c.last_name?.[0] ?? ''}`.toUpperCase()
                          const roleBadge = CREW_ROLE_COLORS[c.crew_role ?? ''] ?? 'bg-slate-100 text-slate-600'
                          const roleLabel = CREW_ROLE_LABELS[c.crew_role ?? ''] ?? c.crew_role ?? '—'
                          return (
                            <>
                              <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center text-xs font-black shrink-0">{initials}</div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-800 truncate">{c.first_name} {c.last_name}</p>
                                <p className="text-[11px] text-slate-400 font-mono">{c.employee_id}</p>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${roleBadge}`}>{roleLabel}</span>
                            </>
                          )
                        })() : (
                          <>
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                              <Users className="w-4 h-4 text-slate-400" />
                            </div>
                            <span className="text-sm text-slate-400 flex-1">
                              {availableCrew.length === 0
                                ? allCrew.length === 0 ? 'Loading…' : 'All crew already assigned'
                                : 'Select a crew member…'}
                            </span>
                          </>
                        )}
                        <svg className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${crewDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                      </button>

                      {/* Dropdown panel */}
                      <AnimatePresence>
                        {crewDropdownOpen && availableCrew.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, scaleY: 0.95 }}
                            animate={{ opacity: 1, y: 0, scaleY: 1 }}
                            exit={{ opacity: 0, y: -4, scaleY: 0.95 }}
                            transition={{ duration: 0.12 }}
                            style={{ transformOrigin: 'top' }}
                            className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-10 overflow-hidden max-h-52 overflow-y-auto"
                          >
                            {availableCrew.map(c => {
                              const initials = `${c.first_name?.[0] ?? ''}${c.last_name?.[0] ?? ''}`.toUpperCase()
                              const roleLabel = CREW_ROLE_LABELS[c.crew_role ?? ''] ?? c.crew_role ?? '—'
                              const roleBadge = CREW_ROLE_COLORS[c.crew_role ?? ''] ?? 'bg-slate-100 text-slate-600'
                              const isSelected = String(c.id) === selectedCrewId
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => { setSelectedCrewId(String(c.id)); setCrewDropdownOpen(false) }}
                                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors ${
                                    isSelected ? 'bg-brand-50' : 'hover:bg-slate-50'
                                  }`}
                                >
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                                    isSelected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
                                  }`}>{initials}</div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 truncate">{c.first_name} {c.last_name}</p>
                                    <p className="text-[11px] text-slate-400 font-mono">{c.employee_id}</p>
                                  </div>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${roleBadge}`}>{roleLabel}</span>
                                  {isSelected && <svg className="w-4 h-4 text-brand-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                </button>
                              )
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Role on flight */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Role on This Flight</label>
                    <div className="grid grid-cols-2 gap-2">
                      {FLIGHT_ROLES.map(r => {
                        const isSelected = selectedRole === r.value
                        return (
                          <button
                            key={r.value}
                            type="button"
                            onClick={() => setSelectedRole(r.value)}
                            className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-all ${
                              isSelected
                                ? `${r.accent} ring-1`
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 ${r.iconBg}`}>
                              {r.icon}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800 leading-tight">{r.label}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">{r.desc}</p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="px-6 pb-6 flex gap-3">
                  <button
                    onClick={() => { setShowAssignModal(false); setSelectedCrewId(''); setSelectedRole('') }}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => assignMutation.mutate()}
                    disabled={!selectedCrewId || !selectedRole || assignMutation.isPending}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {assignMutation.isPending ? <Spinner size="sm" /> : null}
                    Assign to Flight
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
