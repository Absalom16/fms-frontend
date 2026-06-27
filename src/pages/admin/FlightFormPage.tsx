import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Plane, Save, MapPin, Clock, DollarSign, Tag,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format, parseISO } from 'date-fns'
import { flightService } from '@/services/flightService'
import { formatCurrency } from '@/utils/helpers'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import Select from '@/components/ui/Select'
import type { FlightStatus } from '@/types'

interface FlightForm {
  flight_number: string
  route_id:      string
  aircraft_id:   string
  departure_time: string
  arrival_time:   string
  base_price:     string
  business_price: string
  first_price:    string
  status:         string
  gate:           string
  terminal:       string
}

const STATUS_OPTIONS: { value: FlightStatus; label: string; ring: string; dot: string; active: string }[] = [
  { value: 'scheduled', label: 'Scheduled', dot: 'bg-blue-500',    ring: 'ring-blue-300',    active: 'bg-blue-50 text-blue-700 ring-2 ring-blue-300' },
  { value: 'boarding',  label: 'Boarding',  dot: 'bg-indigo-500',  ring: 'ring-indigo-300',  active: 'bg-indigo-50 text-indigo-700 ring-2 ring-indigo-300' },
  { value: 'delayed',   label: 'Delayed',   dot: 'bg-amber-400',   ring: 'ring-amber-300',   active: 'bg-amber-50 text-amber-700 ring-2 ring-amber-300' },
  { value: 'departed',  label: 'Departed',  dot: 'bg-slate-400',   ring: 'ring-slate-300',   active: 'bg-slate-100 text-slate-700 ring-2 ring-slate-300' },
  { value: 'arrived',   label: 'Arrived',   dot: 'bg-emerald-500', ring: 'ring-emerald-300', active: 'bg-emerald-50 text-emerald-700 ring-2 ring-emerald-300' },
  { value: 'cancelled', label: 'Cancelled', dot: 'bg-red-500',     ring: 'ring-red-300',     active: 'bg-red-50 text-red-700 ring-2 ring-red-300' },
]

function SectionHeader({ icon, title, accent }: { icon: React.ReactNode; title: string; accent: string }) {
  return (
    <div className={`flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100 border-l-4 ${accent} pl-3`}>
      <span className="text-slate-500">{icon}</span>
      <h2 className="font-bold text-slate-800 text-sm">{title}</h2>
    </div>
  )
}

export default function FlightFormPage() {
  const { id } = useParams<{ id?: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: routes   = [] } = useQuery({ queryKey: ['routes'],   queryFn: () => flightService.getRoutes() })
  const { data: aircraft = [] } = useQuery({ queryKey: ['aircraft'], queryFn: () => flightService.getAircraft() })

  const { data: flight, isLoading: loadingFlight } = useQuery({
    queryKey: ['flight', id],
    queryFn:  () => flightService.getById(Number(id)),
    enabled:  isEdit,
  })

  const {
    register, handleSubmit, reset, control,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<FlightForm>({
    defaultValues: { status: 'scheduled', base_price: '', business_price: '', first_price: '', gate: '', terminal: '' },
  })

  // live values for preview
  const watched = useWatch({ control })

  useEffect(() => {
    if (flight) {
      reset({
        flight_number:  flight.flight_number,
        route_id:       String(flight.route_id      ?? ''),
        aircraft_id:    String(flight.aircraft_id   ?? ''),
        departure_time: flight.departure_datetime?.slice(0, 16) ?? '',
        arrival_time:   flight.arrival_datetime?.slice(0, 16)   ?? '',
        base_price:     String(flight.base_price     ?? ''),
        business_price: String(flight.business_price ?? ''),
        first_price:    String(flight.first_price    ?? ''),
        status:         flight.status,
        gate:           flight.gate      ?? '',
        terminal:       flight.terminal  ?? '',
      })
    }
  }, [flight, reset])

  const mutation = useMutation({
    mutationFn: (data: FlightForm) => {
      const payload = {
        flight_number:      data.flight_number,
        route_id:           Number(data.route_id),
        aircraft_id:        Number(data.aircraft_id),
        status:             data.status,
        departure_datetime: data.departure_time,
        arrival_datetime:   data.arrival_time,
        economy_price:      Number(data.base_price),
        business_price:     data.business_price ? Number(data.business_price) : undefined,
        first_class_price:  data.first_price    ? Number(data.first_price)    : undefined,
        departure_gate:     data.gate     || undefined,
        terminal:           data.terminal || undefined,
      }
      return isEdit ? flightService.update(Number(id), payload) : flightService.create(payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Flight updated!' : 'Flight created!')
      qc.invalidateQueries({ queryKey: ['flights'] })
      navigate('/admin/flights')
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Failed to save'),
  })

  if (isEdit && loadingFlight) {
    return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  }

  // derive preview data from watched values
  const selectedRoute    = routes.find(r => String(r.id) === watched.route_id)
  const selectedAircraft = aircraft.find(a => String(a.id) === watched.aircraft_id)
  const selectedStatus   = STATUS_OPTIONS.find(s => s.value === watched.status) ?? STATUS_OPTIONS[0]
  const depTime = watched.departure_time ? (() => { try { return format(parseISO(watched.departure_time), 'HH:mm') } catch { return watched.departure_time?.slice(11, 16) } })() : null
  const arrTime = watched.arrival_time   ? (() => { try { return format(parseISO(watched.arrival_time),   'HH:mm') } catch { return watched.arrival_time?.slice(11, 16) } })() : null
  const depDate = watched.departure_time ? (() => { try { return format(parseISO(watched.departure_time), 'MMM d') } catch { return null } })() : null

  return (
    <div className="p-5 lg:p-8 bg-slate-50 min-h-screen">
      {/* Back + page title */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <button onClick={() => navigate('/admin/flights')}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors mb-4 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Flights
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shadow-sm">
            <Plane className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{isEdit ? 'Edit Flight' : 'New Flight'}</h1>
            <p className="text-xs text-slate-400 mt-0.5">{isEdit ? `Editing #${flight?.flight_number}` : 'Schedule a new flight'}</p>
          </div>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit(d => mutation.mutate(d))}>
        <div className="grid grid-cols-12 gap-5 items-start">

          {/* ── Left: form sections ── */}
          <div className="col-span-12 lg:col-span-8 space-y-5">

            {/* Section 1: Identity */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <SectionHeader icon={<Tag className="w-4 h-4" />} title="FLIGHT IDENTITY" accent="border-brand-500" />

              {/* Flight number */}
              <div className="mb-5">
                <label className="label">Flight Number *</label>
                <input
                  {...register('flight_number', { required: 'Required' })}
                  placeholder="SW1234"
                  className={`input font-mono text-lg font-bold tracking-widest ${errors.flight_number ? 'ring-2 ring-red-300 border-red-300' : ''}`}
                />
                {errors.flight_number && <p className="mt-1 text-xs text-red-500">{errors.flight_number.message}</p>}
              </div>

              {/* Status pills */}
              <div>
                <label className="label mb-2">Status</label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setValue('status', opt.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        watched.status === opt.value
                          ? opt.active + ' border-transparent'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${watched.status === opt.value ? opt.dot : 'bg-slate-300'}`} />
                      {opt.label}
                    </button>
                  ))}
                </div>
                <input type="hidden" {...register('status')} />
              </div>
            </motion.div>

            {/* Section 2: Route & Aircraft */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <SectionHeader icon={<MapPin className="w-4 h-4" />} title="ROUTE & AIRCRAFT" accent="border-violet-500" />

              {/* Route selector */}
              <div className="mb-5">
                <label className="label">Route *</label>
                <Select {...register('route_id', { required: 'Required' })} value={watched.route_id ?? ''} error={Boolean(errors.route_id)}>
                  <option value="">Select route</option>
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.origin_airport?.iata_code} ({r.origin_airport?.city}) → {r.destination_airport?.iata_code} ({r.destination_airport?.city})
                    </option>
                  ))}
                </Select>
                {errors.route_id && <p className="mt-1 text-xs text-red-500">{errors.route_id.message}</p>}

                {/* Inline route visual */}
                {selectedRoute && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-violet-50 border border-violet-100">
                    <div className="text-center">
                      <p className="text-lg font-black text-violet-900">{selectedRoute.origin_airport?.iata_code}</p>
                      <p className="text-[10px] text-violet-500 font-medium">{selectedRoute.origin_airport?.city}</p>
                    </div>
                    <div className="flex-1 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                      <div className="flex-1 border-t border-dashed border-violet-300" />
                      <Plane className="w-3.5 h-3.5 text-violet-500 rotate-90" />
                      <div className="flex-1 border-t border-dashed border-violet-300" />
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-black text-violet-900">{selectedRoute.destination_airport?.iata_code}</p>
                      <p className="text-[10px] text-violet-500 font-medium">{selectedRoute.destination_airport?.city}</p>
                    </div>
                    {selectedRoute.distance_km && (
                      <span className="ml-2 text-[10px] text-violet-400 font-medium">{selectedRoute.distance_km.toLocaleString()} km</span>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Aircraft selector */}
              <div>
                <label className="label">Aircraft *</label>
                <Select {...register('aircraft_id', { required: 'Required' })} value={watched.aircraft_id ?? ''} error={Boolean(errors.aircraft_id)}>
                  <option value="">Select aircraft</option>
                  {aircraft.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.registration} — {a.manufacturer ? `${a.manufacturer} ` : ''}{a.model} ({a.total_seats} seats)
                    </option>
                  ))}
                </Select>
                {errors.aircraft_id && <p className="mt-1 text-xs text-red-500">{errors.aircraft_id.message}</p>}

                {/* Aircraft capacity inline */}
                {selectedAircraft && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-3 grid grid-cols-3 gap-2">
                    {[
                      { label: 'Economy',  count: selectedAircraft.economy_seats,      color: 'bg-slate-50 text-slate-700' },
                      { label: 'Business', count: selectedAircraft.business_seats,     color: 'bg-amber-50 text-amber-700' },
                      { label: 'First',    count: selectedAircraft.first_class_seats,  color: 'bg-violet-50 text-violet-700' },
                    ].map(c => (
                      <div key={c.label} className={`text-center py-2 rounded-lg ${c.color}`}>
                        <p className="text-sm font-black">{c.count}</p>
                        <p className="text-[10px] font-medium opacity-70">{c.label}</p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Section 3: Schedule */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <SectionHeader icon={<Clock className="w-4 h-4" />} title="SCHEDULE" accent="border-sky-500" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="label">Departure *</label>
                  <input {...register('departure_time', { required: 'Required' })} type="datetime-local"
                    className={`input ${errors.departure_time ? 'ring-2 ring-red-300 border-red-300' : ''}`} />
                  {errors.departure_time && <p className="mt-1 text-xs text-red-500">{errors.departure_time.message}</p>}
                </div>
                <div>
                  <label className="label">Arrival *</label>
                  <input {...register('arrival_time', { required: 'Required' })} type="datetime-local"
                    className={`input ${errors.arrival_time ? 'ring-2 ring-red-300 border-red-300' : ''}`} />
                  {errors.arrival_time && <p className="mt-1 text-xs text-red-500">{errors.arrival_time.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="label">Terminal</label>
                  <input {...register('terminal')} placeholder="Terminal 1" className="input" />
                </div>
                <div>
                  <label className="label">Gate</label>
                  <input {...register('gate')} placeholder="A12" className="input" />
                </div>
              </div>
            </motion.div>

            {/* Section 4: Pricing */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <SectionHeader icon={<DollarSign className="w-4 h-4" />} title="PRICING (USD)" accent="border-emerald-500" />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { key: 'base_price' as const,     label: 'Economy',  icon: '🪑', required: true,  placeholder: '299.00' },
                  { key: 'business_price' as const,  label: 'Business', icon: '💼', required: false, placeholder: '699.00' },
                  { key: 'first_price' as const,     label: 'First',    icon: '⭐', required: false, placeholder: '1299.00' },
                ].map(({ key, label, icon, required, placeholder }) => (
                  <div key={key}
                    className={`rounded-xl border p-4 transition-all ${watched[key] ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-100 bg-slate-50'}`}>
                    <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                      <span>{icon}</span> {label} {required && <span className="text-red-400">*</span>}
                    </p>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">$</span>
                      <input
                        {...register(key, required ? { required: 'Required', min: { value: 0, message: '>= 0' } } : {})}
                        type="number" step="0.01" placeholder={placeholder}
                        className={`input pl-6 bg-white ${errors[key] ? 'ring-2 ring-red-300' : ''}`}
                      />
                    </div>
                    {errors[key] && <p className="mt-1 text-xs text-red-500">{errors[key]?.message}</p>}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
              className="flex justify-end gap-3 pb-6">
              <Button type="button" variant="outline" onClick={() => navigate('/admin/flights')}>Cancel</Button>
              <Button type="submit" loading={isSubmitting || mutation.isPending}>
                <Save className="w-4 h-4" />
                {isEdit ? 'Save Changes' : 'Create Flight'}
              </Button>
            </motion.div>
          </div>

          {/* ── Right: live preview ── */}
          <div className="col-span-12 lg:col-span-4 lg:sticky lg:top-6">
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 pl-1">Live Preview</p>

              {/* Boarding-pass style card */}
              <div className="rounded-2xl overflow-hidden shadow-lg"
                style={{ background: 'linear-gradient(145deg, #0f172a 0%, #1e3a5f 60%, #1d4ed8 100%)' }}>

                {/* Top section */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                        <Plane className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-white/50 text-xs font-medium">SkyWay</span>
                    </div>
                    {/* Status pill */}
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      watched.status === 'scheduled' ? 'bg-blue-500/20 text-blue-300' :
                      watched.status === 'boarding'  ? 'bg-indigo-500/20 text-indigo-300' :
                      watched.status === 'delayed'   ? 'bg-amber-500/20 text-amber-300' :
                      watched.status === 'cancelled' ? 'bg-red-500/20 text-red-300' :
                      watched.status === 'arrived'   ? 'bg-emerald-500/20 text-emerald-300' :
                      'bg-white/10 text-white/50'
                    } uppercase tracking-widest`}>
                      {selectedStatus?.label ?? 'Scheduled'}
                    </span>
                  </div>

                  {/* Flight number */}
                  <p className="text-3xl font-black text-white tracking-widest mb-5 font-mono">
                    {watched.flight_number || <span className="text-white/20">SW????</span>}
                  </p>

                  {/* Route */}
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-3xl font-black text-white">
                        {selectedRoute?.origin_airport?.iata_code ?? <span className="text-white/20">ORG</span>}
                      </p>
                      <p className="text-[10px] text-white/40 mt-0.5 font-medium">
                        {selectedRoute?.origin_airport?.city ?? 'Origin'}
                      </p>
                    </div>
                    <div className="flex-1 flex items-center gap-1 pt-1">
                      <div className="flex-1 border-t border-dashed border-white/20" />
                      <Plane className="w-4 h-4 text-white/40 rotate-90" />
                      <div className="flex-1 border-t border-dashed border-white/20" />
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-white">
                        {selectedRoute?.destination_airport?.iata_code ?? <span className="text-white/20">DST</span>}
                      </p>
                      <p className="text-[10px] text-white/40 mt-0.5 font-medium">
                        {selectedRoute?.destination_airport?.city ?? 'Destination'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Divider with circles */}
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-slate-50 -ml-2" />
                  <div className="flex-1 border-t border-dashed border-white/10" />
                  <div className="w-4 h-4 rounded-full bg-slate-50 -mr-2" />
                </div>

                {/* Bottom section */}
                <div className="p-5 space-y-4">
                  {/* Times */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-white/40 font-medium uppercase tracking-widest mb-1">Departure</p>
                      <p className="text-xl font-black text-white tabular-nums">{depTime ?? '—:——'}</p>
                      {depDate && <p className="text-[10px] text-white/40 mt-0.5">{depDate}</p>}
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 font-medium uppercase tracking-widest mb-1">Arrival</p>
                      <p className="text-xl font-black text-white tabular-nums">{arrTime ?? '—:——'}</p>
                    </div>
                  </div>

                  {/* Gate + Terminal */}
                  {(watched.gate || watched.terminal) && (
                    <div className="flex gap-4 pt-1 border-t border-white/10">
                      {watched.terminal && (
                        <div>
                          <p className="text-[10px] text-white/40 font-medium uppercase tracking-widest">Terminal</p>
                          <p className="text-sm font-bold text-white mt-0.5">{watched.terminal}</p>
                        </div>
                      )}
                      {watched.gate && (
                        <div>
                          <p className="text-[10px] text-white/40 font-medium uppercase tracking-widest">Gate</p>
                          <p className="text-sm font-bold text-white mt-0.5">{watched.gate}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Prices */}
                  <div className="pt-1 border-t border-white/10">
                    <p className="text-[10px] text-white/40 font-medium uppercase tracking-widest mb-2">Pricing</p>
                    <div className="space-y-1">
                      {[
                        { label: 'Economy',  val: watched.base_price },
                        { label: 'Business', val: watched.business_price },
                        { label: 'First',    val: watched.first_price },
                      ].filter(p => p.val).map(p => (
                        <div key={p.label} className="flex items-center justify-between">
                          <span className="text-xs text-white/50">{p.label}</span>
                          <span className="text-xs font-bold text-white tabular-nums">{formatCurrency(Number(p.val))}</span>
                        </div>
                      ))}
                      {!watched.base_price && !watched.business_price && !watched.first_price && (
                        <p className="text-xs text-white/20">No prices set</p>
                      )}
                    </div>
                  </div>

                  {/* Aircraft */}
                  {selectedAircraft && (
                    <div className="pt-1 border-t border-white/10">
                      <p className="text-[10px] text-white/40 font-medium uppercase tracking-widest mb-1">Aircraft</p>
                      <p className="text-xs font-semibold text-white/70">
                        {selectedAircraft.registration} · {selectedAircraft.model}
                      </p>
                      <p className="text-[10px] text-white/30 mt-0.5">{selectedAircraft.total_seats} seats total</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </form>
    </div>
  )
}
