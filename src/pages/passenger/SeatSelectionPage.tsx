import { useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowRight, Plane, Clock, Tag, CheckCircle2 } from 'lucide-react'
import { flightService } from '@/services/flightService'
import SeatMap from '@/components/flight/SeatMap'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { formatCurrency } from '@/utils/helpers'
import type { Seat } from '@/types'
import { format, parseISO } from 'date-fns'

const CLASS_LABEL: Record<string, string> = {
  economy:  'Economy',
  business: 'Business',
  first:    'First Class',
}

export default function SeatSelectionPage() {
  const { flightId }    = useParams<{ flightId: string }>()
  const [searchParams]  = useSearchParams()
  const navigate        = useNavigate()
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null)

  const cabinClass = searchParams.get('cabin_class') ?? 'economy'
  const passengers = Number(searchParams.get('passengers') ?? 1)

  const { data: flight, isLoading: loadingFlight } = useQuery({
    queryKey: ['flight', flightId],
    queryFn:  () => flightService.getById(Number(flightId)),
    enabled:  Boolean(flightId),
  })

  const { data: seats = [], isLoading: loadingSeats } = useQuery({
    queryKey: ['flight-seats', flightId],
    queryFn:  () => flightService.getSeats(Number(flightId)),
    enabled:  Boolean(flightId),
  })

  if (loadingFlight || loadingSeats)
    return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  if (!flight)
    return <div className="p-8 text-center text-slate-500">Flight not found.</div>

  const price      = flight.price_for_class?.[cabinClass] ?? flight.base_price
  const origin     = flight.route?.origin_airport
  const dest       = flight.route?.destination_airport
  const depTime    = flight.departure_datetime ? parseISO(flight.departure_datetime) : null
  const arrTime    = flight.arrival_datetime   ? parseISO(flight.arrival_datetime)   : null

  const handleContinue = () => {
    if (!selectedSeat || !flight) return
    navigate('/passenger/payment', {
      state: { flight, seat: selectedSeat, cabin_class: cabinClass, passengers },
    })
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Dark hero banner ──────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0c1220 0%, #0f2a5c 65%, #0d1a3a 100%)' }}>

        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        {/* Bottom glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-16 bg-blue-500/15 blur-3xl rounded-full pointer-events-none" />

        <div className="relative max-w-2xl mx-auto px-6 py-8">
          {/* Route */}
          <div className="flex items-center justify-center gap-4 mb-5">
            <div className="text-center">
              <p className="text-4xl font-black text-white tracking-tight">{origin?.iata_code ?? '—'}</p>
              <p className="text-white/40 text-xs font-medium mt-0.5">{origin?.city ?? ''}</p>
            </div>

            <div className="flex-1 flex flex-col items-center gap-1 px-2">
              <div className="flex items-center gap-1 w-full">
                <div className="flex-1 h-px bg-white/20" />
                <div className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                  <Plane className="w-3.5 h-3.5 text-white/60 fill-white/60" />
                </div>
                <div className="flex-1 h-px bg-white/20" />
              </div>
              <p className="text-[10px] text-white/30 font-semibold">Non-stop</p>
            </div>

            <div className="text-center">
              <p className="text-4xl font-black text-white tracking-tight">{dest?.iata_code ?? '—'}</p>
              <p className="text-white/40 text-xs font-medium mt-0.5">{dest?.city ?? ''}</p>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center justify-center flex-wrap gap-4">
            {depTime && (
              <span className="flex items-center gap-1.5 text-white/50 text-xs font-medium">
                <Clock className="w-3 h-3" />
                {format(depTime, 'EEE, MMM d · HH:mm')}
                {arrTime && <> → {format(arrTime, 'HH:mm')}</>}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-white/50 text-xs font-medium">
              <Tag className="w-3 h-3" />
              {flight.flight_number}
            </span>
            <span className="text-white/30 text-xs">·</span>
            <span className="text-white/50 text-xs font-medium capitalize">
              {CLASS_LABEL[cabinClass] ?? cabinClass} · {passengers} pax
            </span>
          </div>

          {/* Price */}
          <div className="text-center mt-5">
            <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase mb-1">Total fare</p>
            <p className="text-3xl font-black text-white">{formatCurrency(Number(price))}</p>
          </div>
        </div>
      </motion.div>

      {/* ── Seat map ─────────────────────────────────────── */}
      <div className="max-w-sm mx-auto px-4 pt-7 pb-32">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-900">Select Your Seat</p>
            <p className="text-xs text-slate-400 mt-0.5">Tap an available seat to choose</p>
          </div>
          {selectedSeat && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" /> {selectedSeat.seat_number}
            </motion.span>
          )}
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <SeatMap seats={seats} selectedSeatId={selectedSeat?.id ?? null} onSelectSeat={setSelectedSeat} />
        </motion.div>
      </div>

      {/* ── Sticky CTA ───────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="fixed bottom-0 left-0 right-0 z-40">
        {/* Fade blur above bar */}
        <div className="h-8 bg-gradient-to-t from-white/80 to-transparent backdrop-blur-none pointer-events-none" />
        <div className="bg-white border-t border-slate-100 shadow-2xl px-4 py-3">
          <div className="max-w-sm mx-auto flex items-center gap-4">
            {selectedSeat ? (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-9 rounded-t-xl rounded-b-md bg-gradient-to-b from-sky-400 to-blue-600 border border-blue-600 flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-black text-white leading-none">{selectedSeat.seat_number}</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Seat {selectedSeat.seat_number}</p>
                    <p className="text-xs text-slate-400 capitalize">
                      {selectedSeat.seat_class} ·{' '}
                      {selectedSeat.is_window ? 'Window' : selectedSeat.is_aisle ? 'Aisle' : 'Middle'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="flex-1 text-sm text-slate-400 font-medium">No seat selected yet</p>
            )}

            <Button onClick={handleContinue} disabled={!selectedSeat} className="shrink-0 px-5">
              Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
