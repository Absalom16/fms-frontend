import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plane, Users, DollarSign, TrendingUp, ArrowUpRight, ArrowRight, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { reportService } from '@/services/reportService'
import { flightService } from '@/services/flightService'
import RevenueChart from '@/components/charts/RevenueChart'
import { flightStatusConfig, formatCurrency } from '@/utils/helpers'
import { format, parseISO, subDays } from 'date-fns'

const today    = format(new Date(), 'yyyy-MM-dd')
const thirtyAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd')

const STATUS_DOT: Record<string, string> = {
  scheduled: 'bg-blue-400',
  boarding:  'bg-indigo-500',
  departed:  'bg-slate-400',
  arrived:   'bg-emerald-400',
  delayed:   'bg-amber-400',
  cancelled: 'bg-red-400',
}

export default function AdminDashboardPage() {
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['report-summary'],
    queryFn: () => reportService.summary(),
  })
  const { data: revenueData = [] } = useQuery({
    queryKey: ['report-revenue', thirtyAgo, today],
    queryFn: () => reportService.revenue({ start_date: thirtyAgo, end_date: today, period: 'daily' }),
  })
  const { data: flightsPage, isLoading: loadingFlights } = useQuery({
    queryKey: ['flights-recent'],
    queryFn: () => flightService.list({ page: 1, per_page: 7 }),
  })

  const flights          = flightsPage?.items ?? []
  const totalBookings    = Number(summary?.total_bookings    ?? 0)
  const confirmedCount   = Number(summary?.confirmed_bookings ?? 0)
  const cancelledCount   = Number(summary?.cancelled_bookings ?? 0)
  const pendingCount     = Math.max(totalBookings - confirmedCount - cancelledCount, 0)
  const pct = (n: number) => totalBookings ? Math.round((n / totalBookings) * 100) : 0

  const miniChart = revenueData.slice(-14)
  const miniMax   = Math.max(...miniChart.map(d => d.revenue), 1)

  return (
    <div className="p-5 lg:p-7 bg-slate-50 min-h-screen">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Operations Center</h1>
          <p className="text-slate-400 text-xs mt-0.5">{format(new Date(), 'EEEE, MMMM d yyyy')}</p>
        </div>
        <Link to="/admin/flights"
          className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors">
          All flights <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </motion.div>

      {/* ── Bento Grid ── */}
      <div className="grid grid-cols-12 gap-4 items-start">

        {/* ━━━ Revenue Hero — col 1-5, rows 1-2 ━━━ */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
          className="col-span-12 lg:col-span-5 lg:row-span-2 rounded-2xl p-6 flex flex-col justify-between min-h-[280px]"
          style={{ background: 'linear-gradient(145deg, #0f172a 0%, #1a2f5e 55%, #1d4ed8 100%)' }}
        >
          {/* Top */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                <DollarSign className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-medium text-white/50 uppercase tracking-widest">Total Revenue</span>
            </div>

            {loadingSummary
              ? <div className="h-12 w-44 rounded-xl bg-white/10 animate-pulse" />
              : <p className="text-5xl font-black text-white tracking-tight leading-none">
                  {formatCurrency(Number(summary?.total_revenue ?? 0))}
                </p>
            }

            <div className="mt-3 flex items-center gap-2">
              <span className="flex items-center gap-1 text-emerald-400 text-sm font-semibold">
                <ArrowUpRight className="w-3.5 h-3.5" />
                {formatCurrency(Number(summary?.monthly_revenue ?? 0))}
              </span>
              <span className="text-white/30 text-xs">this month</span>
            </div>
          </div>

          {/* Embedded bar sparkline */}
          <div className="mt-6">
            <div className="h-px bg-white/10 mb-3" />
            <div className="flex items-end gap-0.5 h-14">
              {miniChart.length > 0
                ? miniChart.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end">
                      <div
                        className="rounded-sm bg-white/20 hover:bg-white/35 transition-colors"
                        style={{ height: `${Math.max((d.revenue / miniMax) * 100, 5)}%` }}
                      />
                    </div>
                  ))
                : <p className="text-white/20 text-xs self-center w-full text-center">No revenue data yet</p>
              }
            </div>
            <p className="text-white/30 text-xs mt-2">Last 14 days</p>
          </div>
        </motion.div>

        {/* ━━━ Active Flights ━━━ */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="col-span-6 lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Flights</span>
            <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
              <Plane className="w-3.5 h-3.5 text-violet-600" />
            </div>
          </div>
          {loadingSummary
            ? <div className="h-10 w-20 skeleton rounded-lg" />
            : <p className="text-4xl font-black text-slate-900">{Number(summary?.active_flights ?? 0).toLocaleString()}</p>
          }
          <div className="mt-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-xs text-slate-400">Scheduled &amp; in-air</span>
          </div>
        </motion.div>

        {/* ━━━ Passengers ━━━ */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="col-span-6 lg:col-span-3 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Passengers</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-amber-600" />
            </div>
          </div>
          {loadingSummary
            ? <div className="h-10 w-14 skeleton rounded-lg" />
            : <p className="text-4xl font-black text-slate-900">{Number(summary?.total_passengers ?? 0).toLocaleString()}</p>
          }
          <div className="mt-2">
            <span className="text-xs text-slate-400">Registered users</span>
          </div>
        </motion.div>

        {/* ━━━ Booking Breakdown — animated bars ━━━ */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="col-span-12 lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bookings</span>
            </div>
            {!loadingSummary && (
              <span className="text-xs text-slate-500 font-semibold">{totalBookings} total</span>
            )}
          </div>

          {loadingSummary
            ? <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-7 skeleton rounded" />)}</div>
            : (
              <div className="space-y-3.5">
                {[
                  { label: 'Confirmed', count: confirmedCount,  icon: <CheckCircle2 className="w-3 h-3 text-emerald-500" />, color: 'bg-emerald-400' },
                  { label: 'Pending',   count: pendingCount,    icon: <Clock className="w-3 h-3 text-amber-500" />,         color: 'bg-amber-400' },
                  { label: 'Cancelled', count: cancelledCount,  icon: <XCircle className="w-3 h-3 text-red-400" />,         color: 'bg-red-400' },
                ].map(({ label, count, icon, color }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        {icon}
                        <span className="text-xs font-medium text-slate-700">{label}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-900 tabular-nums">
                        {count}
                        <span className="text-slate-400 font-normal ml-1">({pct(count)}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct(count)}%` }}
                        transition={{ delay: 0.5, duration: 0.7, ease: 'easeOut' }}
                        className={`h-full rounded-full ${color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </motion.div>

        {/* ━━━ Revenue Chart ━━━ */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="col-span-12 lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Revenue Trend</h2>
              <p className="text-xs text-slate-400 mt-0.5">Daily — last 30 days</p>
            </div>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-full uppercase tracking-widest">USD</span>
          </div>
          <RevenueChart data={revenueData} />
        </motion.div>

        {/* ━━━ Flight Timeline ━━━ */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="col-span-12 lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">Upcoming Flights</h2>
            <Link to="/admin/flights" className="text-[10px] font-bold text-brand-600 hover:text-brand-700 uppercase tracking-widest">
              View all →
            </Link>
          </div>

          {loadingFlights
            ? <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 skeleton rounded-xl" />)}</div>
            : flights.length === 0
              ? <div className="text-center py-10 text-slate-400 text-sm">No flights found.</div>
              : (
                <div className="relative">
                  {/* vertical line */}
                  <div className="absolute left-[5px] top-2 bottom-2 w-px bg-slate-100" />
                  <div className="space-y-0.5">
                    {flights.map((f, i) => {
                      const cfg = flightStatusConfig[f.status] ?? {}
                      return (
                        <motion.div key={f.id}
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + i * 0.04 }}
                          className="flex items-start gap-3 py-2.5 px-2 rounded-xl hover:bg-slate-50 transition-colors cursor-default group"
                        >
                          {/* Status dot */}
                          <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 z-10 ring-2 ring-white ${STATUS_DOT[f.status] ?? 'bg-slate-300'}`} />
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900">{f.flight_number}</span>
                              <span className="text-slate-300 text-xs">|</span>
                              <span className="text-xs font-semibold text-slate-600">
                                {f.route?.origin_airport?.iata_code}
                                <span className="text-slate-300 mx-1">→</span>
                                {f.route?.destination_airport?.iata_code}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {f.departure_datetime ? format(parseISO(f.departure_datetime), 'MMM d · HH:mm') : '—'}
                            </p>
                          </div>
                          {/* Status pill */}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${cfg.cssColor ?? 'text-slate-500'} bg-slate-50`}>
                            {cfg.label ?? f.status}
                          </span>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              )
          }
        </motion.div>

      </div>
    </div>
  )
}
