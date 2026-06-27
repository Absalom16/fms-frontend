import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Calendar, Download } from 'lucide-react'
import { reportService } from '@/services/reportService'
import RevenueChart from '@/components/charts/RevenueChart'
import BookingsChart from '@/components/charts/BookingsChart'
import { formatCurrency } from '@/utils/helpers'
import { format, parseISO, subDays, subMonths } from 'date-fns'

const presets = [
  { label: '7d',  start: format(subDays(new Date(), 7), 'yyyy-MM-dd') },
  { label: '30d', start: format(subDays(new Date(), 30), 'yyyy-MM-dd') },
  { label: '3mo', start: format(subMonths(new Date(), 3), 'yyyy-MM-dd') },
  { label: '6mo', start: format(subMonths(new Date(), 6), 'yyyy-MM-dd') },
]

const today = format(new Date(), 'yyyy-MM-dd')

function occBar(rate: number) {
  if (rate >= 80) return 'bg-emerald-400'
  if (rate >= 50) return 'bg-amber-400'
  return 'bg-red-400'
}
function occBadge(rate: number) {
  if (rate >= 80) return 'text-emerald-700 bg-emerald-50'
  if (rate >= 50) return 'text-amber-700 bg-amber-50'
  return 'text-red-600 bg-red-50'
}

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(presets[1].start)
  const [endDate,   setEndDate]   = useState(today)
  const [period,    setPeriod]    = useState('daily')
  const activePreset = presets.find(p => p.start === startDate && endDate === today)

  const { data: revenueData  = [], isLoading: loadingRevenue   } = useQuery({
    queryKey: ['revenue', startDate, endDate, period],
    queryFn:  () => reportService.revenue({ start_date: startDate, end_date: endDate, period }),
  })
  const { data: bookingsData = [], isLoading: loadingBookings  } = useQuery({
    queryKey: ['bookings-report', startDate, endDate, period],
    queryFn:  () => reportService.bookings({ start_date: startDate, end_date: endDate, period }),
  })
  const { data: occupancyData = [], isLoading: loadingOccupancy } = useQuery({
    queryKey: ['occupancy', startDate, endDate],
    queryFn:  () => reportService.occupancy({ start_date: startDate, end_date: endDate }),
  })

  const totalRevenue      = revenueData.reduce((s: number, r: any)  => s + Number(r.revenue   ?? 0), 0)
  const totalBookings     = bookingsData.reduce((s: number, b: any) => s + Number(b.confirmed ?? 0) + Number(b.cancelled ?? 0), 0)
  const confirmedBookings = bookingsData.reduce((s: number, b: any) => s + Number(b.confirmed ?? 0), 0)
  const avgOccupancy      = occupancyData.length
    ? occupancyData.reduce((s: any, o: any) => s + (o.occupancy_pct ?? 0), 0) / occupancyData.length
    : 0

  const sorted = [...(occupancyData as any[])].sort((a, b) => (b.occupancy_pct ?? 0) - (a.occupancy_pct ?? 0))

  return (
    <div className="p-6 lg:p-8 space-y-6">

      {/* ── Dark hero panel ─────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0c1220 0%, #0f2a5c 60%, #1a1035 100%)' }}>

        {/* Top bar: title + period selector + export */}
        <div className="flex items-center justify-between flex-wrap gap-3 px-7 pt-6">
          <div>
            <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase">Analytics Report</p>
            <p className="text-white/60 text-sm mt-0.5">
              {format(parseISO(startDate), 'MMM d')} – {format(parseISO(endDate), 'MMM d, yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {presets.map(p => (
              <button key={p.label}
                onClick={() => { setStartDate(p.start); setEndDate(today) }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activePreset?.label === p.label
                    ? 'bg-white text-slate-900 shadow'
                    : 'bg-white/10 text-white/50 hover:bg-white/20 hover:text-white'
                }`}>{p.label}
              </button>
            ))}
            <div className="w-px h-4 bg-white/15 mx-1" />
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 text-white/50 hover:bg-white/20 hover:text-white transition-all">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
        </div>

        {/* KPI numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/8 px-7 py-7 mt-1">
          <div className="pb-6 sm:pb-0 sm:pr-8">
            <p className="text-white/35 text-[10px] font-bold tracking-widest uppercase mb-3">Total Revenue</p>
            {loadingRevenue
              ? <div className="h-10 w-36 rounded-lg bg-white/10 animate-pulse" />
              : <p className="text-5xl font-black text-white tracking-tight leading-none">{formatCurrency(totalRevenue)}</p>}
            <p className="text-white/30 text-xs mt-2">across selected period</p>
          </div>
          <div className="py-6 sm:py-0 sm:px-8">
            <p className="text-white/35 text-[10px] font-bold tracking-widest uppercase mb-3">Total Bookings</p>
            {loadingBookings
              ? <div className="h-10 w-24 rounded-lg bg-white/10 animate-pulse" />
              : <p className="text-5xl font-black text-white tracking-tight leading-none">{totalBookings.toLocaleString()}</p>}
            <p className="text-white/30 text-xs mt-2">{confirmedBookings.toLocaleString()} confirmed</p>
          </div>
          <div className="pt-6 sm:pt-0 sm:pl-8">
            <p className="text-white/35 text-[10px] font-bold tracking-widest uppercase mb-3">Avg Occupancy</p>
            {loadingOccupancy
              ? <div className="h-10 w-20 rounded-lg bg-white/10 animate-pulse" />
              : <p className="text-5xl font-black text-white tracking-tight leading-none">{avgOccupancy.toFixed(1)}%</p>}
            <p className="text-white/30 text-xs mt-2">{occupancyData.length} flights analysed</p>
          </div>
        </div>
      </motion.div>

      {/* ── Chart controls ───────────────────────────────── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Performance</p>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Segmented group-by */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-semibold">
            {[['daily','Day'], ['weekly','Week'], ['monthly','Mo']].map(([val, lbl]) => (
              <button key={val} onClick={() => setPeriod(val)}
                className={`px-3 py-1.5 transition-all ${period === val ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                {lbl}
              </button>
            ))}
          </div>
          {/* Custom date range */}
          <div className="flex items-center gap-2 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input type="date" value={startDate} max={endDate}
              onChange={e => setStartDate(e.target.value)}
              className="input py-1 px-2 text-xs w-32" />
            <span className="text-slate-300 font-bold">→</span>
            <input type="date" value={endDate} min={startDate} max={today}
              onChange={e => setEndDate(e.target.value)}
              className="input py-1 px-2 text-xs w-32" />
          </div>
        </div>
      </motion.div>

      {/* ── Charts ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Revenue */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Revenue trend</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{loadingRevenue ? '—' : formatCurrency(totalRevenue)}</p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-[3px] ring-blue-100 mb-1" />
          </div>
          {loadingRevenue
            ? <div className="h-64 skeleton rounded-xl" />
            : <RevenueChart data={revenueData} />}
        </motion.div>

        {/* Bookings */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Booking trend</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">
                {loadingBookings ? '—' : totalBookings.toLocaleString()}
                <span className="text-sm font-normal text-slate-400 ml-1">total</span>
              </p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500 ring-[3px] ring-violet-100 mb-1" />
          </div>
          {loadingBookings
            ? <div className="h-64 skeleton rounded-xl" />
            : <BookingsChart data={bookingsData} />}
        </motion.div>
      </div>

      {/* ── Flight performance ranked list ──────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Flight performance</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">
              {occupancyData.length}
              <span className="text-sm font-normal text-slate-400 ml-1">flights ranked</span>
            </p>
          </div>
          {avgOccupancy > 0 && (
            <span className={`text-sm font-bold px-3 py-1 rounded-full mb-1 ${occBadge(avgOccupancy)}`}>
              {avgOccupancy.toFixed(1)}% avg
            </span>
          )}
        </div>

        {loadingOccupancy ? (
          <div className="space-y-2.5">
            {[...Array(6)].map((_, i) => <div key={i} className="h-10 skeleton rounded-xl" />)}
          </div>
        ) : sorted.length === 0 ? (
          <p className="py-10 text-center text-slate-400 text-sm">No occupancy data for this period.</p>
        ) : (
          <div className="space-y-1">
            {sorted.map((o, i) => {
              const rate = o.occupancy_pct ?? 0
              return (
                <div key={i}
                  className="grid gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                  style={{ gridTemplateColumns: '1.5rem 5rem 7rem 1fr 5rem 4rem' }}>
                  <span className="text-xs font-bold text-slate-200 group-hover:text-slate-300 self-center text-right transition-colors">
                    {i + 1}
                  </span>
                  <span className="self-center font-bold text-slate-900 font-mono text-xs bg-slate-100 group-hover:bg-slate-200 px-2 py-1 rounded-lg text-center transition-colors">
                    {o.flight_number}
                  </span>
                  <span className="self-center text-xs text-slate-400 truncate">{o.departure ? o.departure.slice(0, 10) : '—'}</span>
                  <div className="self-center h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${occBar(rate)}`}
                      style={{ width: `${Math.min(rate, 100)}%` }} />
                  </div>
                  <span className="self-center text-xs text-slate-400 text-right">
                    {o.booked}<span className="text-slate-300">/{o.total_seats}</span>
                  </span>
                  <span className={`self-center text-xs font-bold px-2 py-0.5 rounded-lg text-center ${occBadge(rate)}`}>
                    {rate.toFixed(1)}%
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>
    </div>
  )
}
