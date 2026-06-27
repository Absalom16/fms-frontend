import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Plane, Calendar, Award, Clock, ArrowRight, ChevronRight, MapPin } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { bookingService } from '@/services/bookingService'
import { passengerService } from '@/services/passengerService'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { bookingStatusConfig, formatCurrency } from '@/utils/helpers'
import { format, parseISO } from 'date-fns'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

const STATUS_PILL: Record<string, string> = {
  confirmed: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  pending:   'bg-amber-500/20  text-amber-300  border-amber-500/30',
  cancelled: 'bg-red-500/20    text-red-300    border-red-500/30',
}

const TIER_STYLE: Record<string, string> = {
  bronze:   'bg-amber-900/40 text-amber-300 border-amber-500/30',
  silver:   'bg-slate-400/20 text-slate-200  border-slate-400/30',
  gold:     'bg-yellow-500/20 text-yellow-200 border-yellow-400/30',
  platinum: 'bg-cyan-500/20  text-cyan-200   border-cyan-400/30',
}

export default function PassengerDashboard() {
  const { user } = useAuthStore()

  const { data: profile } = useQuery({
    queryKey: ['passenger-profile'],
    queryFn:  () => passengerService.getMyProfile(),
  })

  const { data: bookingsPage, isLoading } = useQuery({
    queryKey: ['my-bookings', { page: 1, per_page: 5 }],
    queryFn:  () => bookingService.myBookings({ page: 1, per_page: 5 }),
  })

  const bookings  = bookingsPage?.items ?? []
  const confirmed = bookings.filter(b => b.status === 'confirmed').length
  const upcoming  = bookings.filter(b =>
    b.flight?.departure_datetime && parseISO(b.flight.departure_datetime) > new Date()
  ).length
  const skyMiles = profile?.loyalty_points ?? profile?.frequent_flyer_points ?? 0
  const tier     = (profile?.loyalty_tier ?? 'bronze').toLowerCase()

  const stats = [
    { label: 'Total Bookings',   value: bookingsPage?.total ?? 0, icon: Calendar },
    { label: 'Confirmed',        value: confirmed,                 icon: Plane },
    { label: 'Upcoming Flights', value: upcoming,                  icon: Clock },
    { label: 'Sky Miles',        value: skyMiles,                  icon: Award },
  ]

  return (
    <div className="p-5 lg:p-7 space-y-5">

      {/* ── Dark hero: greeting + stats ─────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #0c1220 0%, #0f2a5c 65%, #0d1a3a 100%)' }}>

        {/* Dot-grid texture */}
        <div className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '22px 22px' }} />

        {/* Horizon glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-blue-500/15 blur-3xl rounded-full" />

        <div className="relative px-6 pt-7 pb-6">
          {/* Greeting row */}
          <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
            <div>
              <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase mb-1">Welcome back</p>
              <h1 className="text-2xl font-black text-white leading-tight">
                Good {greeting()}, {user?.first_name} 👋
              </h1>
            </div>
            <Link to="/passenger/flights"
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-blue-50 transition-all shadow-lg shrink-0">
              <Plane className="w-4 h-4" /> Book a Flight
            </Link>
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map((s, i) => (
              <motion.div key={s.label}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 + i * 0.06 }}
                className="bg-white/8 border border-white/10 rounded-2xl px-4 py-4 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-white/35 text-[9px] font-bold tracking-widest uppercase leading-tight">{s.label}</p>
                  <s.icon className="w-3.5 h-3.5 text-white/20" />
                </div>
                <p className="text-3xl font-black text-white tracking-tight leading-none">
                  {s.value.toLocaleString()}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Loyalty card ────────────────────────────────── */}
      {profile && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-3xl overflow-hidden relative p-6"
          style={{ background: 'linear-gradient(135deg, #1a1035 0%, #2d1b69 50%, #1a1035 100%)' }}>

          {/* Ambient glows */}
          <div className="absolute top-0 right-0 w-56 h-56 bg-purple-600/15 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/10 blur-2xl rounded-full pointer-events-none" />

          <div className="relative">
            {/* Card header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                  <Plane className="w-4 h-4 text-white fill-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-none">SkyWay</p>
                  <p className="text-white/40 text-[9px] font-bold tracking-widest uppercase mt-0.5">Frequent Flyer</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full border capitalize ${TIER_STYLE[tier] ?? TIER_STYLE.bronze}`}>
                {tier} member
              </span>
            </div>

            {/* Card chip + number */}
            <div className="mb-5">
              <div className="w-9 h-7 rounded-md mb-3"
                style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }} />
              <p className="font-mono text-base tracking-[0.2em] text-white font-bold">
                {profile.frequent_flyer_number ?? 'SK-000000'}
              </p>
            </div>

            {/* Cardholder + miles */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-white/30 text-[9px] uppercase tracking-widest mb-0.5">Card Holder</p>
                <p className="text-white font-bold">{user?.first_name} {user?.last_name}</p>
              </div>
              <div className="text-right">
                <p className="text-white/30 text-[9px] uppercase tracking-widest mb-0.5">Sky Miles</p>
                <p className="text-3xl font-black text-white leading-none">{skyMiles.toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
              <p className="text-white/25 text-xs">Earn 1 mile per $1 spent</p>
              <button className="text-xs text-white/50 hover:text-white/80 flex items-center gap-1 font-semibold transition-colors">
                Redeem miles <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Recent bookings ──────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Recent Bookings</p>
          <Link to="/passenger/bookings"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40"><Spinner size="lg" /></div>
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={<Plane className="w-10 h-10" />}
            title="No bookings yet"
            description="Ready to explore? Book your first flight."
            action={{ label: 'Book a Flight', to: '/passenger/flights' }}
          />
        ) : (
          <div className="space-y-3">
            {bookings.map((b, i) => {
              const origin = b.flight?.route?.origin_airport?.iata_code ?? '---'
              const dest   = b.flight?.route?.destination_airport?.iata_code ?? '---'
              const city   = b.flight?.route?.destination_airport?.city ?? ''
              const cfg    = bookingStatusConfig[b.status] ?? {}
              const pillCls = STATUS_PILL[b.status] ?? 'bg-slate-100 text-slate-500 border-slate-200'

              return (
                <motion.div key={b.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                  <Link to={`/passenger/bookings/${b.id}`}
                    className="flex rounded-2xl overflow-hidden border border-slate-100 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">

                    {/* Boarding pass stub */}
                    <div className="w-16 shrink-0 flex flex-col items-center justify-center py-5 relative"
                      style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e3a8a 100%)' }}>
                      {/* Perforation notch */}
                      <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-50 z-10 border border-slate-100" />
                      <p className="text-white font-black text-sm tracking-wide">{origin}</p>
                      <Plane className="w-3.5 h-3.5 text-white/30 my-1.5 rotate-90" />
                      <p className="text-white font-black text-sm tracking-wide">{dest}</p>
                    </div>

                    {/* Dashed separator */}
                    <div className="w-px shrink-0 border-l-2 border-dashed border-slate-100 my-4" />

                    {/* Main content */}
                    <div className="flex-1 px-4 py-3.5 flex items-center gap-3 min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">
                            {origin} <span className="text-slate-300 font-normal">→</span> {dest}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${pillCls}`}>
                            {cfg.label ?? b.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {b.flight?.departure_datetime
                              ? format(parseISO(b.flight.departure_datetime), 'MMM d, yyyy · HH:mm')
                              : 'N/A'}
                          </span>
                          {city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {city}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-bold text-slate-900 text-sm">{formatCurrency(Number(b.total_price))}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5 tracking-widest">{b.pnr_code}</p>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-brand-500 transition-colors shrink-0" />
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
