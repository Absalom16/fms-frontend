import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Plane, Download, X, CheckCircle2,
  ArrowLeft, User, QrCode, Armchair, Clock, Tag, Shield,
  BadgeCheck,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useRef, useState } from 'react'
import { bookingService } from '@/services/bookingService'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { formatCurrency } from '@/utils/helpers'
import { format, parseISO, differenceInHours, differenceInMinutes } from 'date-fns'
import { useAuthStore } from '@/store/authStore'

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-amber-400/20 text-amber-300 border-amber-400/30',
  confirmed:  'bg-emerald-400/20 text-emerald-300 border-emerald-400/30',
  cancelled:  'bg-red-400/20 text-red-300 border-red-400/30',
  checked_in: 'bg-blue-400/20 text-blue-300 border-blue-400/30',
  boarded:    'bg-purple-400/20 text-purple-300 border-purple-400/30',
  no_show:    'bg-slate-400/20 text-slate-300 border-slate-400/30',
}

const STATUS_LABEL: Record<string, string> = {
  pending:    'Pending',
  confirmed:  'Confirmed',
  cancelled:  'Cancelled',
  checked_in: 'Checked In',
  boarded:    'Boarded',
  no_show:    'No Show',
}

export default function BookingDetailPage() {
  const { id }        = useParams<{ id: string }>()
  const navigate      = useNavigate()
  const qc            = useQueryClient()
  const { user }      = useAuthStore()
  const ticketRef     = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const handleDownload = async () => {
    if (!ticketRef.current || !booking) return
    setDownloading(true)
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f8fafc',
        logging: false,
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf     = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width / 2, canvas.height / 2] })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2)
      pdf.save(`SkyWay-${booking.pnr_code}.pdf`)
      toast.success('Ticket downloaded!')
    } catch {
      toast.error('Download failed. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn:  () => bookingService.getById(Number(id)),
    enabled:  Boolean(id),
  })

  const cancelMutation = useMutation({
    mutationFn: () => bookingService.cancel(Number(id)),
    onSuccess: () => {
      toast.success('Booking cancelled.')
      qc.invalidateQueries({ queryKey: ['booking', id] })
      qc.invalidateQueries({ queryKey: ['my-bookings'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Cancellation failed'),
  })

  const checkInMutation = useMutation({
    mutationFn: () => bookingService.checkIn(Number(id)),
    onSuccess: () => {
      toast.success('Check-in successful! Your boarding pass is ready.')
      qc.invalidateQueries({ queryKey: ['booking', id] })
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Check-in failed'),
  })

  if (isLoading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  if (!booking)  return <div className="p-8 text-center text-slate-500">Booking not found.</div>

  const departure     = booking.flight?.departure_datetime ? parseISO(booking.flight.departure_datetime) : null
  const arrival       = booking.flight?.arrival_datetime   ? parseISO(booking.flight.arrival_datetime)   : null
  const hoursUntil    = departure ? differenceInHours(departure, new Date()) : null
  const durationMins  = departure && arrival ? differenceInMinutes(arrival, departure) : null
  const canCheckIn    = booking.status === 'confirmed' && hoursUntil !== null && hoursUntil <= 24 && hoursUntil >= 0.75
  const canCancel     = ['pending', 'confirmed'].includes(booking.status)

  const origin  = booking.flight?.route?.origin_airport
  const dest    = booking.flight?.route?.destination_airport
  const status  = booking.status ?? 'pending'
  const cabin   = booking.cabin_class ?? 'economy'

  const baseFare = Number(booking.total_price) / 1.16
  const taxes    = Number(booking.total_price) - baseFare

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Dark hero banner ──────────────────────────────── */}
      <div className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0c1220 0%, #0f2a5c 65%, #0d1a3a 100%)' }}>
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-16 bg-blue-500/10 blur-3xl rounded-full" />

        <div className="relative max-w-4xl mx-auto px-6 py-6">
          {/* Back + actions */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <button onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm font-medium transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to bookings
            </button>
            <div className="flex items-center gap-2">
              {canCheckIn && (
                <Button size="sm" variant="success" onClick={() => checkInMutation.mutate()} loading={checkInMutation.isPending}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Check In
                </Button>
              )}
              {canCancel && (
                <Button size="sm" variant="danger"
                  onClick={() => setConfirmCancel(true)}
                  loading={cancelMutation.isPending}>
                  <X className="w-3.5 h-3.5" /> Cancel
                </Button>
              )}
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold transition-all disabled:opacity-50">
                <Download className={`w-3.5 h-3.5 ${downloading ? 'animate-bounce' : ''}`} />
                {downloading ? 'Saving…' : 'Ticket'}
              </button>
            </div>
          </div>

          {/* Route display */}
          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="text-center">
              <p className="text-5xl font-black text-white tracking-tight">{origin?.iata_code ?? '—'}</p>
              <p className="text-white/40 text-xs font-medium mt-1">{origin?.city ?? ''}</p>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-2">
                <div className="w-12 h-px bg-white/20" />
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center">
                  <Plane className="w-3.5 h-3.5 text-white/60 fill-white/60" />
                </div>
                <div className="w-12 h-px bg-white/20" />
              </div>
              {durationMins && (
                <p className="text-[10px] text-white/30 font-semibold">
                  {Math.floor(durationMins / 60)}h {durationMins % 60}m
                </p>
              )}
            </div>
            <div className="text-center">
              <p className="text-5xl font-black text-white tracking-tight">{dest?.iata_code ?? '—'}</p>
              <p className="text-white/40 text-xs font-medium mt-1">{dest?.city ?? ''}</p>
            </div>
          </div>

          {/* PNR + status */}
          <div className="flex items-center justify-center gap-3 pb-1">
            <span className="text-white/30 text-[10px] font-bold tracking-widest uppercase">PNR</span>
            <span className="font-mono font-black text-white tracking-[0.25em] text-sm">{booking.pnr_code}</span>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border capitalize ${STATUS_COLORS[status] ?? STATUS_COLORS.pending}`}>
              {STATUS_LABEL[status] ?? status}
            </span>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-7 space-y-5">

        {/* Check-in alert */}
        {canCheckIn && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-emerald-800">Online check-in is open</p>
              <p className="text-xs text-emerald-600">Departure is within 24 hours — check in now to get your boarding pass.</p>
            </div>
            <Button size="sm" variant="success" onClick={() => checkInMutation.mutate()} loading={checkInMutation.isPending}>
              Check In Now
            </Button>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* ── Boarding pass card ──────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="md:col-span-2">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">

              {/* Boarding pass header */}
              <div className="flex items-stretch">
                {/* Stub */}
                <div className="relative w-20 shrink-0 flex flex-col items-center justify-center py-6 gap-1 rounded-l-3xl"
                  style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e3a8a 100%)' }}>
                  {/* Perforation notches */}
                  <div className="absolute -right-2.5 top-6 w-5 h-5 rounded-full bg-slate-50 border border-slate-100 z-10" />
                  <div className="absolute -right-2.5 bottom-6 w-5 h-5 rounded-full bg-slate-50 border border-slate-100 z-10" />
                  <p className="font-black text-white text-base tracking-wide">{origin?.iata_code ?? '—'}</p>
                  <Plane className="w-4 h-4 text-white/30 rotate-90 my-1" />
                  <p className="font-black text-white text-base tracking-wide">{dest?.iata_code ?? '—'}</p>
                </div>

                {/* Dashed separator */}
                <div className="w-px shrink-0 border-l-2 border-dashed border-slate-100 my-5" />

                {/* Main body */}
                <div className="flex-1 px-5 py-5">
                  {/* Flight number + date row */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1">Flight</p>
                      <p className="font-black text-slate-900 text-lg tracking-wide">{booking.flight?.flight_number ?? '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1">Date</p>
                      <p className="font-bold text-slate-800 text-sm">
                        {departure ? format(departure, 'EEE, MMM d yyyy') : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Times row */}
                  <div className="flex items-center gap-3 mb-5">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Departs</p>
                      <p className="font-black text-slate-900 text-2xl">{departure ? format(departure, 'HH:mm') : '—'}</p>
                      <p className="text-xs text-slate-400">{origin?.city}</p>
                    </div>
                    <div className="flex-1 flex items-center gap-1.5 px-2">
                      <div className="flex-1 h-px bg-slate-100" />
                      {durationMins && (
                        <span className="text-[10px] text-slate-300 font-semibold shrink-0">
                          {Math.floor(durationMins / 60)}h {durationMins % 60}m
                        </span>
                      )}
                      <div className="flex-1 h-px bg-slate-100" />
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Arrives</p>
                      <p className="font-black text-slate-900 text-2xl">{arrival ? format(arrival, 'HH:mm') : '—'}</p>
                      <p className="text-xs text-slate-400">{dest?.city}</p>
                    </div>
                  </div>

                  {/* Detail chips */}
                  <div className="grid grid-cols-3 gap-3">
                    <Chip icon={Armchair} label="Seat" value={booking.seat?.seat_number ?? '—'} />
                    <Chip icon={Tag} label="Cabin" value={cabin.charAt(0).toUpperCase() + cabin.slice(1)} />
                    <Chip icon={User} label="Pax" value={String(booking.passengers ?? 1)} />
                  </div>
                </div>
              </div>

              {/* Divider with notches */}
              <div className="relative flex items-center">
                <div className="absolute left-0 w-5 h-5 rounded-r-full bg-slate-50 border border-slate-100" style={{ left: -1 }} />
                <div className="flex-1 border-t-2 border-dashed border-slate-100 mx-5" />
                <div className="absolute right-0 w-5 h-5 rounded-l-full bg-slate-50 border border-slate-100" style={{ right: -1 }} />
              </div>

              {/* Barcode + aircraft row */}
              <div className="px-6 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Aircraft</p>
                  <p className="font-semibold text-slate-700 text-sm">{booking.flight?.aircraft?.model ?? '—'}</p>
                </div>
                {/* Barcode simulation */}
                <div className="flex items-end gap-px h-8">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <div key={i}
                      className="bg-slate-800 rounded-[1px]"
                      style={{ width: i % 3 === 0 ? 3 : 2, height: `${50 + Math.sin(i * 1.7) * 30}%` }}
                    />
                  ))}
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Passenger</p>
                  <p className="font-bold text-slate-700 text-sm">{user?.first_name} {user?.last_name}</p>
                </div>
              </div>

              {/* Ticket number if issued */}
              {booking.ticket && (
                <div className="px-6 pb-4">
                  <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-center gap-3">
                    <QrCode className="w-5 h-5 text-brand-600 shrink-0" />
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ticket Number</p>
                      <p className="font-mono font-bold text-slate-800 text-sm tracking-widest">{booking.ticket.ticket_number}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* ── Price + perks ───────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="space-y-4">

            {/* Price breakdown */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-50">
                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Price Breakdown</p>
              </div>
              <div className="px-5 py-4 space-y-3">
                <PriceRow label="Base fare" value={formatCurrency(baseFare)} />
                <PriceRow label="Taxes & Fees (16%)" value={formatCurrency(taxes)} />
                {booking.seat && <PriceRow label={`Seat ${booking.seat.seat_number}`} value="Included" valueClass="text-emerald-600 font-semibold" />}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-black text-slate-900 text-sm">Total</span>
                  <span className="font-black text-brand-600 text-xl">{formatCurrency(Number(booking.total_price))}</span>
                </div>
              </div>
            </div>

            {/* Perks */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 space-y-3">
              {[
                { icon: BadgeCheck, text: 'Free cancellation within 24h', color: 'text-emerald-500' },
                { icon: Shield,     text: '256-bit secure payment',        color: 'text-blue-500' },
                { icon: Clock,      text: 'Instant e-ticket via email',    color: 'text-amber-500' },
              ].map(({ icon: Icon, text, color }) => (
                <div key={text} className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 shrink-0 ${color}`} />
                  <span className="text-xs text-slate-500">{text}</span>
                </div>
              ))}
            </div>

            {/* Passenger info (if available) */}
            {booking.passenger && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4">
                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-3">Passenger</p>
                <div className="space-y-2">
                  <PriceRow label="Name" value={`${booking.passenger.first_name ?? ''} ${booking.passenger.last_name ?? ''}`} />
                  <PriceRow label="Nationality" value={booking.passenger.nationality ?? '—'} />
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Hidden print-quality ticket for PDF download */}
      <TicketPrintView booking={booking} userName={`${user?.first_name ?? ''} ${user?.last_name ?? ''}`} ticketRef={ticketRef} />

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => cancelMutation.mutate()}
        loading={cancelMutation.isPending}
        variant="warning"
        title="Cancel this booking?"
        message="Your booking will be cancelled and your seat released. This action cannot be undone."
        confirmLabel="Cancel Booking"
        cancelLabel="Keep Booking"
      />
    </div>
  )
}

function Chip({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3 text-slate-400" />
        <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase">{label}</p>
      </div>
      <p className="font-bold text-slate-800 text-sm">{value}</p>
    </div>
  )
}

function PriceRow({ label, value, valueClass = 'text-slate-700 font-medium' }: {
  label: string; value: string; valueClass?: string
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  )
}

// ── Dedicated off-screen ticket for PDF capture ──────────────────────────────

interface TicketViewProps {
  booking: any
  userName: string
  ticketRef: React.RefObject<HTMLDivElement>
}

const PLANE_PATH = 'M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z'

function TLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ color: '#94a3b8', fontSize: 7.5, fontWeight: 800, letterSpacing: 2.5, textTransform: 'uppercase' as const, marginBottom: 4 }}>
      {children}
    </div>
  )
}

export function TicketPrintView({ booking, userName, ticketRef }: TicketViewProps) {
  const departure    = booking.flight?.departure_datetime ? parseISO(booking.flight.departure_datetime) : null
  const arrival      = booking.flight?.arrival_datetime   ? parseISO(booking.flight.arrival_datetime)   : null
  const durationMins = departure && arrival ? differenceInMinutes(arrival, departure) : null
  const origin       = booking.flight?.route?.origin_airport
  const dest         = booking.flight?.route?.destination_airport
  const cabin        = booking.cabin_class ?? 'economy'
  const baseFare     = Number(booking.total_price) / 1.16
  const taxes        = Number(booking.total_price) - baseFare
  const gate         = booking.flight?.departure_gate ?? 'TBD'
  const seat         = booking.seat?.seat_number ?? '—'
  const boardingTime = departure ? new Date(departure.getTime() - 30 * 60 * 1000) : null
  const durationStr  = durationMins ? `${Math.floor(durationMins / 60)}h ${durationMins % 60}m` : '—'
  const cabinLabel   = ({ economy: 'Economy', business: 'Business', first: 'First Class' } as Record<string,string>)[cabin] ?? cabin
  const isCheckedIn  = booking.status === 'checked_in'
  const navy         = '#0c1a3a'
  const accent       = 'linear-gradient(135deg, #0c1220 0%, #0f2a5c 65%, #0d1a3a 100%)'
  const BARS         = [70,100,45,80,60,100,35,90,55,100,70,45,85,60,100,50,75,40,95,65,100,55,80,45,70,100,60,85,40,95,50,75,100,65,80,55,45,90,70,100]

  return (
    <div ref={ticketRef} style={{ position: 'fixed', left: -9999, top: 0, width: 960, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      {/* Page background */}
      <div style={{ background: '#e8edf4', padding: 28 }}>
        <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 12px 48px rgba(0,0,0,0.18)' }}>

          {/* ── HEADER ── */}
          <div style={{ background: accent, padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.13)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d={PLANE_PATH}/></svg>
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 20, letterSpacing: 0.5 }}>SkyWay</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase' }}>Airlines</div>
              </div>
            </div>
            {/* Title + status */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, letterSpacing: 7, textTransform: 'uppercase' }}>Boarding Pass</div>
              {isCheckedIn && (
                <div style={{ marginTop: 4, display: 'inline-block', background: 'rgba(74,222,128,0.18)', border: '1px solid rgba(74,222,128,0.4)', borderRadius: 20, padding: '2px 10px', color: '#4ade80', fontSize: 8, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' }}>
                  ✓ Checked In
                </div>
              )}
            </div>
            {/* Issue info */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 7.5, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 3 }}>E-Ticket Issued</div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: 600 }}>{format(new Date(), 'EEE, MMM d yyyy · HH:mm')}</div>
            </div>
          </div>

          {/* ── BODY ── */}
          <div style={{ display: 'flex' }}>

            {/* ════ LEFT: main content ════ */}
            <div style={{ flex: 1, padding: '24px 28px 0' }}>

              {/* Passenger */}
              <div style={{ marginBottom: 22 }}>
                <TLabel>Passenger Name</TLabel>
                <div style={{ color: navy, fontWeight: 900, fontSize: 22, textTransform: 'uppercase', letterSpacing: 1 }}>{userName}</div>
              </div>

              {/* Big route */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, marginBottom: 22 }}>

                {/* Origin block */}
                <div>
                  <div style={{ fontWeight: 900, fontSize: 58, color: navy, letterSpacing: -2, lineHeight: 1 }}>{origin?.iata_code ?? '—'}</div>
                  <div style={{ color: '#475569', fontSize: 12, fontWeight: 700, marginTop: 4 }}>{origin?.city ?? ''}</div>
                  <div style={{ marginTop: 14 }}>
                    <TLabel>Departs</TLabel>
                    <div style={{ fontWeight: 900, fontSize: 30, color: '#0f172a', letterSpacing: -0.5, lineHeight: 1 }}>{departure ? format(departure, 'HH:mm') : '—'}</div>
                    <div style={{ color: '#64748b', fontSize: 10, fontWeight: 600, marginTop: 3 }}>{departure ? format(departure, 'EEE, MMM d yyyy') : '—'}</div>
                  </div>
                </div>

                {/* Flight path */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 16px 0', gap: 6 }}>
                  <div style={{ color: '#cbd5e1', fontSize: 9, fontWeight: 700, letterSpacing: 1 }}>{durationStr}</div>
                  <div style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                    <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #e2e8f0, #bfdbfe)' }} />
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#93c5fd', margin: '0 -1px', flexShrink: 0 }} />
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="#3b82f6" style={{ transform: 'rotate(90deg)', flexShrink: 0, margin: '0 2px' }}><path d={PLANE_PATH}/></svg>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#93c5fd', margin: '0 -1px', flexShrink: 0 }} />
                    <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #bfdbfe, #e2e8f0)' }} />
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: 8.5, fontWeight: 600, letterSpacing: 0.5 }}>Direct · {booking.flight?.flight_number ?? ''}</div>
                </div>

                {/* Destination block */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 900, fontSize: 58, color: navy, letterSpacing: -2, lineHeight: 1 }}>{dest?.iata_code ?? '—'}</div>
                  <div style={{ color: '#475569', fontSize: 12, fontWeight: 700, marginTop: 4 }}>{dest?.city ?? ''}</div>
                  <div style={{ marginTop: 14 }}>
                    <TLabel>Arrives</TLabel>
                    <div style={{ fontWeight: 900, fontSize: 30, color: '#0f172a', letterSpacing: -0.5, lineHeight: 1, textAlign: 'right' }}>{arrival ? format(arrival, 'HH:mm') : '—'}</div>
                    <div style={{ color: '#64748b', fontSize: 10, fontWeight: 600, marginTop: 3, textAlign: 'right' }}>{arrival ? format(arrival, 'EEE, MMM d yyyy') : '—'}</div>
                  </div>
                </div>
              </div>

              {/* Detail chips */}
              <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #f1f5f9', paddingTop: 16, paddingBottom: 20 }}>
                {[
                  { label: 'Flight No.',  value: booking.flight?.flight_number ?? '—' },
                  { label: 'Class',       value: cabinLabel },
                  { label: 'Gate',        value: gate },
                  { label: 'Seat',        value: seat },
                  { label: 'Boarding',    value: boardingTime ? format(boardingTime, 'HH:mm') : '—' },
                  { label: 'Aircraft',    value: booking.flight?.aircraft?.model ?? '—' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ flex: 1, background: '#f8fafc', borderRadius: 10, padding: '10px 10px', border: '1px solid #f1f5f9', textAlign: 'center' }}>
                    <div style={{ color: '#94a3b8', fontSize: 7, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase' as const, marginBottom: 5 }}>{label}</div>
                    <div style={{ color: '#0f172a', fontWeight: 800, fontSize: 12.5 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ════ Perforated tear line ════ */}
            <div style={{ position: 'relative', width: 0, flexShrink: 0, margin: '16px 0' }}>
              <div style={{ position: 'absolute', left: -12, top: -16, width: 24, height: 24, borderRadius: '50%', background: '#e8edf4' }} />
              <div style={{ width: 0, height: '100%', borderLeft: '2px dashed #cbd5e1' }} />
              <div style={{ position: 'absolute', left: -12, bottom: -16, width: 24, height: 24, borderRadius: '50%', background: '#e8edf4' }} />
            </div>

            {/* ════ RIGHT: stub ════ */}
            <div style={{ width: 210, background: '#f8fafc', padding: '22px 18px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, flexShrink: 0 }}>

              {/* PNR */}
              <div style={{ textAlign: 'center', width: '100%' }}>
                <TLabel>Booking Reference</TLabel>
                <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 24, color: navy, letterSpacing: 5 }}>{booking.pnr_code}</div>
              </div>

              {/* Seat + Gate tiles */}
              <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                {[{ lbl: 'Seat', val: seat }, { lbl: 'Gate', val: gate }].map(({ lbl, val }) => (
                  <div key={lbl} style={{ flex: 1, background: '#fff', borderRadius: 10, padding: '10px 6px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                    <div style={{ color: '#94a3b8', fontSize: 7, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' as const, marginBottom: 4 }}>{lbl}</div>
                    <div style={{ fontWeight: 900, fontSize: 22, color: navy }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Mini route card */}
              <div style={{ background: '#fff', borderRadius: 10, padding: '10px 14px', width: '100%', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 900, fontSize: 17, color: navy }}>{origin?.iata_code}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#94a3b8" style={{ transform: 'rotate(90deg)' }}><path d={PLANE_PATH}/></svg>
                  <span style={{ fontWeight: 900, fontSize: 17, color: navy }}>{dest?.iata_code}</span>
                </div>
                <div style={{ color: '#64748b', fontSize: 9, marginTop: 5, fontWeight: 600 }}>
                  {departure ? format(departure, 'EEE, MMM d yyyy') : ''}
                </div>
                <div style={{ color: '#94a3b8', fontSize: 8.5, marginTop: 2 }}>
                  {departure ? format(departure, 'HH:mm') : ''} → {arrival ? format(arrival, 'HH:mm') : ''}
                </div>
              </div>

              {/* Barcode */}
              <div style={{ width: '100%', background: '#fff', borderRadius: 10, padding: '10px 10px 6px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: 56, justifyContent: 'center' }}>
                  {BARS.map((h, i) => (
                    <div key={i} style={{ width: i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1.5, height: `${h}%`, background: '#1e293b', borderRadius: 0.5 }} />
                  ))}
                </div>
                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 7.5, fontWeight: 700, marginTop: 5, letterSpacing: 2.5, fontFamily: 'monospace' }}>
                  {booking.pnr_code}
                </div>
              </div>

              {/* Fare */}
              <div style={{ textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: 12, width: '100%' }}>
                <TLabel>Total Fare</TLabel>
                <div style={{ color: '#1d4ed8', fontWeight: 900, fontSize: 22 }}>${Number(booking.total_price).toFixed(2)}</div>
                <div style={{ color: '#94a3b8', fontSize: 8, marginTop: 3 }}>Base ${baseFare.toFixed(2)} + Tax ${taxes.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* ── FOOTER ── */}
          <div style={{ background: accent, padding: '9px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8, fontWeight: 600, letterSpacing: 0.8 }}>
              skyway.com · E-Ticket · Valid photo ID required at boarding
            </div>
            <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8, letterSpacing: 0.5 }}>
              {booking.flight?.flight_number ?? ''} · {origin?.iata_code}–{dest?.iata_code} · {departure ? format(departure, 'dd MMM yyyy') : ''}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8, fontWeight: 600, letterSpacing: 0.8 }}>
              Please arrive at the gate by {boardingTime ? format(boardingTime, 'HH:mm') : '—'}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
