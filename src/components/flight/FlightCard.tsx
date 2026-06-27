import { motion } from 'framer-motion'
import { Plane, Clock, Wifi, Coffee, Tv } from 'lucide-react'
import type { Flight, CabinClass } from '@/types'
import { formatTime, flightDuration, formatCurrency } from '@/utils/helpers'
import { FlightStatusBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import { useNavigate } from 'react-router-dom'

interface FlightCardProps {
  flight: Flight
  selectedClass?: CabinClass
  onSelect?: (flight: Flight) => void
  index?: number
  compact?: boolean
}

export default function FlightCard({ flight, selectedClass = 'economy', onSelect, index = 0, compact = false }: FlightCardProps) {
  const navigate = useNavigate()

  const price = selectedClass === 'business' ? (flight.business_price ?? flight.base_price)
    : selectedClass === 'first' ? (flight.first_price ?? flight.base_price)
    : flight.base_price

  const duration = flightDuration(flight.departure_datetime, flight.arrival_datetime)
  const origin = flight.route?.origin_airport
  const dest = flight.route?.destination_airport

  const handleSelect = () => {
    if (onSelect) { onSelect(flight); return }
    navigate(`/passenger/flights/${flight.id}/seats?cabin_class=${selectedClass}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={cn(
        'bg-white rounded-2xl border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-300',
        compact ? 'p-4' : 'p-5'
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Airline badge */}
        <div className="flex items-center gap-3 sm:w-36">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
            <Plane className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{flight.flight_number}</p>
            <p className="text-xs text-slate-500">{flight.aircraft?.model}</p>
          </div>
        </div>

        {/* Route timeline */}
        <div className="flex-1 flex items-center gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900 tabular-nums">{formatTime(flight.departure_datetime)}</p>
            <p className="text-xs font-semibold text-slate-500">{origin?.iata_code}</p>
            <p className="text-xs text-slate-400">{origin?.city}</p>
          </div>

          <div className="flex-1 flex flex-col items-center gap-1">
            <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" /> {duration}
            </p>
            <div className="w-full flex items-center gap-1">
              <div className="w-2 h-2 rounded-full border-2 border-brand-400" />
              <div className="flex-1 h-px bg-gradient-to-r from-brand-300 to-brand-500" />
              <Plane className="w-3.5 h-3.5 text-brand-500 rotate-90" />
              <div className="flex-1 h-px bg-gradient-to-r from-brand-500 to-brand-300" />
              <div className="w-2 h-2 rounded-full bg-brand-500" />
            </div>
            <p className="text-xs text-slate-400">Non-stop</p>
          </div>

          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900 tabular-nums">{formatTime(flight.arrival_datetime)}</p>
            <p className="text-xs font-semibold text-slate-500">{dest?.iata_code}</p>
            <p className="text-xs text-slate-400">{dest?.city}</p>
          </div>
        </div>

        {/* Price & action */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 sm:w-36">
          <div className="text-right">
            <FlightStatusBadge status={flight.status} />
            {price != null && (
              <div className="mt-2">
                <p className="text-xl font-bold text-slate-900">{formatCurrency(price)}</p>
                <p className="text-xs text-slate-500 capitalize">{selectedClass}</p>
              </div>
            )}
          </div>
          <Button size="sm" onClick={handleSelect} className="shrink-0">
            Select
          </Button>
        </div>
      </div>

      {/* Amenities */}
      {!compact && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-4">
          {[
            { icon: <Wifi className="w-3.5 h-3.5" />, label: 'Wi-Fi' },
            { icon: <Coffee className="w-3.5 h-3.5" />, label: 'Meals' },
            { icon: <Tv className="w-3.5 h-3.5" />, label: 'IFE' },
          ].map(a => (
            <span key={a.label} className="flex items-center gap-1.5 text-xs text-slate-500">
              {a.icon} {a.label}
            </span>
          ))}
          {flight.gate && (
            <span className="ml-auto text-xs text-slate-500 font-medium">
              Gate <span className="text-slate-900 font-bold">{flight.gate}</span>
            </span>
          )}
        </div>
      )}
    </motion.div>
  )
}
