import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Plane, Search, ChevronRight, MapPin, Tag, CheckCircle2 } from 'lucide-react'
import { bookingService } from '@/services/bookingService'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import Pagination from '@/components/ui/Pagination'
import { formatCurrency } from '@/utils/helpers'
import { format, parseISO, isPast, differenceInHours } from 'date-fns'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = [
  { value: '',           label: 'All' },
  { value: 'pending',    label: 'Pending' },
  { value: 'confirmed',  label: 'Confirmed' },
  { value: 'cancelled',  label: 'Cancelled' },
  { value: 'checked_in', label: 'Checked In' },
]

const STATUS_CONFIG: Record<string, { pill: string; dot: string; label: string }> = {
  pending:    { pill: 'bg-amber-50 text-amber-700 ring-amber-100',   dot: 'bg-amber-400',   label: 'Pending' },
  confirmed:  { pill: 'bg-emerald-50 text-emerald-700 ring-emerald-100', dot: 'bg-emerald-500', label: 'Confirmed' },
  cancelled:  { pill: 'bg-red-50 text-red-600 ring-red-100',         dot: 'bg-red-400',     label: 'Cancelled' },
  checked_in: { pill: 'bg-blue-50 text-blue-700 ring-blue-100',      dot: 'bg-blue-500',    label: 'Checked In' },
  boarded:    { pill: 'bg-purple-50 text-purple-700 ring-purple-100',dot: 'bg-purple-500',  label: 'Boarded' },
  no_show:    { pill: 'bg-slate-100 text-slate-500 ring-slate-200',  dot: 'bg-slate-400',   label: 'No Show' },
}

const CABIN_LABEL: Record<string, string> = {
  economy:  'Economy',
  business: 'Business',
  first:    'First Class',
}

export default function MyBookingsPage() {
  const [page, setPage]               = useState(1)
  const [status, setStatus]           = useState('')
  const [search, setSearch]           = useState('')
  const [checkingIn, setCheckingIn]   = useState<number | null>(null)
  const perPage = 10
  const qc = useQueryClient()

  const checkInMutation = useMutation({
    mutationFn: (id: number) => bookingService.checkIn(id),
    onMutate: (id) => setCheckingIn(id),
    onSuccess: () => {
      toast.success('Check-in successful! Your boarding pass is ready.')
      qc.invalidateQueries({ queryKey: ['my-bookings'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Check-in failed'),
    onSettled: () => setCheckingIn(null),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['my-bookings', page, status, search],
    queryFn: () => bookingService.myBookings({
      page, per_page: perPage,
      status: status || undefined,
      search: search || undefined,
    }),
  })

  const bookings = data?.items ?? []
  const total    = data?.total ?? 0

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Dark hero header ──────────────────────────── */}
      <div className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0c1220 0%, #0f2a5c 65%, #0d1a3a 100%)' }}>
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-16 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-6 py-7 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-white/30 text-[10px] font-black tracking-widest uppercase mb-1">Passenger</p>
            <h1 className="text-2xl font-black text-white">My Bookings</h1>
            <p className="text-white/40 text-sm mt-1">
              {total} booking{total !== 1 ? 's' : ''}
            </p>
          </div>
          <Link to="/passenger/flights"
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-blue-50 transition-all shadow-lg shrink-0">
            <Plane className="w-4 h-4" /> New Booking
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4">

        {/* ── Search + status filters ───────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search PNR or destination…"
              className="input pl-10 text-sm w-full"
            />
          </div>

          {/* Status pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUS_OPTIONS.map(opt => {
              const active = status === opt.value
              const cfg    = STATUS_CONFIG[opt.value]
              return (
                <button key={opt.value}
                  onClick={() => { setStatus(opt.value); setPage(1) }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    active
                      ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}>
                  {cfg && !active && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />}
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── List ─────────────────────────────────── */}
        {isLoading ? (
          <div className="flex items-center justify-center h-48"><Spinner size="lg" /></div>
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={<Plane className="w-10 h-10" />}
            title="No bookings found"
            description={status ? `No ${STATUS_CONFIG[status]?.label ?? status} bookings.` : "You haven't made any bookings yet."}
            action={{ label: 'Book a Flight', to: '/passenger/flights' }}
          />
        ) : (
          <>
            <AnimatePresence mode="popLayout">
              <div className="space-y-3">
                {bookings.map((b, i) => {
                  const cfg       = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.pending
                  const departure  = b.flight?.departure_datetime ? parseISO(b.flight.departure_datetime) : null
                  const past       = departure ? isPast(departure) : false
                  const hoursUntil = departure ? differenceInHours(departure, new Date()) : null
                  const canCheckIn = b.status === 'confirmed' && hoursUntil !== null && hoursUntil <= 24 && hoursUntil >= 0.75
                  const origin     = b.flight?.route?.origin_airport
                  const dest       = b.flight?.route?.destination_airport

                  return (
                    <motion.div key={b.id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }} transition={{ delay: i * 0.04 }}
                      className="relative">
                      <Link to={`/passenger/bookings/${b.id}`}
                        className="group flex rounded-2xl overflow-hidden border border-slate-100 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">

                        {/* Boarding stub */}
                        <div className="w-16 shrink-0 flex flex-col items-center justify-center py-5 gap-1 relative"
                          style={{ background: past ? 'linear-gradient(180deg,#334155,#475569)' : 'linear-gradient(180deg,#0f172a,#1e3a8a)' }}>
                          <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-50 border border-slate-100 z-10" />
                          <p className="font-black text-white text-xs tracking-wide leading-none">{origin?.iata_code ?? '?'}</p>
                          <Plane className="w-3 h-3 text-white/30 rotate-90 my-1" />
                          <p className="font-black text-white text-xs tracking-wide leading-none">{dest?.iata_code ?? '?'}</p>
                        </div>

                        {/* Dashed separator */}
                        <div className="w-px shrink-0 border-l-2 border-dashed border-slate-100 my-4" />

                        {/* Main content */}
                        <div className="flex-1 px-4 py-3.5 min-w-0">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="min-w-0">
                              {/* Route */}
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="font-black text-slate-900 text-sm">
                                  {origin?.city ?? origin?.iata_code ?? '?'}
                                </span>
                                <span className="text-slate-300 text-xs">→</span>
                                <span className="font-black text-slate-900 text-sm">
                                  {dest?.city ?? dest?.iata_code ?? '?'}
                                </span>
                                {/* Status pill */}
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 shrink-0 ${cfg.pill}`}>
                                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1`} />
                                  {cfg.label}
                                </span>
                              </div>

                              {/* Meta row */}
                              <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
                                <span className="font-mono font-bold text-slate-500 tracking-wider">{b.pnr_code}</span>
                                {departure && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {format(departure, 'MMM d, yyyy · HH:mm')}
                                  </span>
                                )}
                                {b.flight?.flight_number && (
                                  <span className="flex items-center gap-1">
                                    <Tag className="w-3 h-3" />
                                    {b.flight.flight_number}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {CABIN_LABEL[b.cabin_class ?? 'economy'] ?? b.cabin_class}
                                </span>
                              </div>
                            </div>

                            {/* Price + pax */}
                            <div className="text-right shrink-0">
                              <p className="font-black text-slate-900 text-base">{formatCurrency(Number(b.total_price))}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">
                                {b.passengers ?? 1} pax
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Arrow */}
                        <div className="flex items-center pr-4">
                          <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-brand-500 transition-colors shrink-0" />
                        </div>
                      </Link>

                      {canCheckIn && (
                        <div className="absolute right-12 top-1/2 -translate-y-1/2 z-10">
                          <button
                            onClick={e => { e.preventDefault(); checkInMutation.mutate(b.id) }}
                            disabled={checkingIn === b.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-60"
                          >
                            {checkingIn === b.id
                              ? <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                              : <CheckCircle2 className="w-3.5 h-3.5" />}
                            Check In
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </AnimatePresence>

            <Pagination page={page} totalPages={Math.ceil(total / perPage)} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}
