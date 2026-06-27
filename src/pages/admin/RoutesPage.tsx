import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, MapPin, Globe, Plane, Clock, Save, Search } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import toast from 'react-hot-toast'
import { routeService, type AirportRecord, type RouteRecord } from '@/services/routeService'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import EmptyState from '@/components/ui/EmptyState'

type Tab = 'routes' | 'airports'

interface RouteForm {
  origin_airport_id: string
  destination_airport_id: string
  distance_km: string
  estimated_duration_minutes: string
}

interface AirportForm {
  iata_code: string
  icao_code: string
  name: string
  city: string
  country: string
  timezone: string
  latitude: string
  longitude: string
}

function formatDuration(mins?: number) {
  if (!mins) return '—'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function RoutesPage() {
  const [tab, setTab] = useState<Tab>('routes')
  const [showRouteModal, setShowRouteModal] = useState(false)
  const [showAirportModal, setShowAirportModal] = useState(false)
  const [airportSearch, setAirportSearch] = useState('')
  const qc = useQueryClient()

  const { data: routes = [], isLoading: loadingRoutes } = useQuery<RouteRecord[]>({
    queryKey: ['routes-admin'],
    queryFn: routeService.listRoutes,
  })

  const { data: airportsData, isLoading: loadingAirports } = useQuery({
    queryKey: ['airports-admin'],
    queryFn: () => routeService.listAirports({ per_page: 500 }),
  })
  const airports: AirportRecord[] = airportsData?.items ?? []

  const filteredAirports = airportSearch
    ? airports.filter(a =>
        a.iata_code.toLowerCase().includes(airportSearch.toLowerCase()) ||
        a.city.toLowerCase().includes(airportSearch.toLowerCase()) ||
        a.name.toLowerCase().includes(airportSearch.toLowerCase()) ||
        a.country.toLowerCase().includes(airportSearch.toLowerCase())
      )
    : airports

  // Route form
  const routeForm = useForm<RouteForm>({
    defaultValues: { origin_airport_id: '', destination_airport_id: '', distance_km: '', estimated_duration_minutes: '' },
  })

  const createRouteMutation = useMutation({
    mutationFn: (data: RouteForm) => routeService.createRoute({
      origin_airport_id: Number(data.origin_airport_id),
      destination_airport_id: Number(data.destination_airport_id),
      distance_km: data.distance_km ? Number(data.distance_km) : undefined,
      estimated_duration_minutes: data.estimated_duration_minutes ? Number(data.estimated_duration_minutes) : undefined,
    }),
    onSuccess: () => {
      toast.success('Route added!')
      qc.invalidateQueries({ queryKey: ['routes-admin'] })
      qc.invalidateQueries({ queryKey: ['routes'] })
      setShowRouteModal(false)
      routeForm.reset()
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Failed to add route'),
  })

  // Airport form
  const airportForm = useForm<AirportForm>({
    defaultValues: { iata_code: '', icao_code: '', name: '', city: '', country: '', timezone: '', latitude: '', longitude: '' },
  })

  const createAirportMutation = useMutation({
    mutationFn: (data: AirportForm) => routeService.createAirport({
      iata_code: data.iata_code.toUpperCase(),
      icao_code: data.icao_code?.toUpperCase() || undefined,
      name: data.name,
      city: data.city,
      country: data.country,
      timezone: data.timezone,
      latitude: data.latitude ? Number(data.latitude) : undefined,
      longitude: data.longitude ? Number(data.longitude) : undefined,
    }),
    onSuccess: () => {
      toast.success('Airport added!')
      qc.invalidateQueries({ queryKey: ['airports-admin'] })
      setShowAirportModal(false)
      airportForm.reset()
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Failed to add airport'),
  })

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Network</h1>
          <p className="text-slate-500 text-sm mt-1">Manage airports and routes</p>
        </div>
        <Button onClick={() => tab === 'routes' ? setShowRouteModal(true) : setShowAirportModal(true)}>
          <Plus className="w-4 h-4" /> {tab === 'routes' ? 'Add Route' : 'Add Airport'}
        </Button>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {([['routes', 'Routes', <Plane className="w-4 h-4" />], ['airports', 'Airports', <Globe className="w-4 h-4" />]] as const).map(([v, l, icon]) => (
          <button key={v} onClick={() => setTab(v as Tab)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {icon} {l}
          </button>
        ))}
      </div>

      {/* ── Routes tab ── */}
      {tab === 'routes' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {loadingRoutes ? (
            <div className="flex items-center justify-center h-48"><Spinner size="lg" /></div>
          ) : routes.length === 0 ? (
            <EmptyState icon={<Plane className="w-10 h-10" />} title="No routes yet" description="Add the first route to enable flight scheduling."
              action={{ label: 'Add Route', onClick: () => setShowRouteModal(true) }} />
          ) : (
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr className="text-left">
                    {['Origin', 'Destination', 'Distance', 'Est. Duration'].map(h => (
                      <th key={h} className="px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {routes.map((r, i) => (
                    <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 font-mono text-base">{r.origin_airport?.iata_code}</span>
                          <span className="text-xs text-slate-400">{r.origin_airport?.city}, {r.origin_airport?.country}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <Plane className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          <span className="font-black text-slate-900 font-mono text-base">{r.destination_airport?.iata_code}</span>
                          <span className="text-xs text-slate-400">{r.destination_airport?.city}, {r.destination_airport?.country}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {r.distance_km ? `${r.distance_km.toLocaleString()} km` : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-300" />
                          {formatDuration(r.estimated_duration_minutes)}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Airports tab ── */}
      {tab === 'airports' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input value={airportSearch} onChange={e => setAirportSearch(e.target.value)}
              placeholder="Search by IATA, city, country…" className="input pl-9 text-sm" />
          </div>

          {loadingAirports ? (
            <div className="flex items-center justify-center h-48"><Spinner size="lg" /></div>
          ) : filteredAirports.length === 0 ? (
            <EmptyState icon={<Globe className="w-10 h-10" />} title="No airports found" description="Add airports first, then create routes between them."
              action={{ label: 'Add Airport', onClick: () => setShowAirportModal(true) }} />
          ) : (
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr className="text-left">
                    {['IATA', 'Name', 'City', 'Country', 'Timezone'].map(h => (
                      <th key={h} className="px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAirports.map((a, i) => (
                    <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-black text-slate-900 font-mono">{a.iata_code}</td>
                      <td className="px-4 py-3 text-slate-700">{a.name}</td>
                      <td className="px-4 py-3 text-slate-600">{a.city}</td>
                      <td className="px-4 py-3 text-slate-600">{a.country}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs font-mono">{a.timezone}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-xs text-slate-400">{filteredAirports.length} of {airports.length} airports</p>
        </motion.div>
      )}

      {/* ── Add Route Modal ── */}
      <Modal open={showRouteModal} onClose={() => { setShowRouteModal(false); routeForm.reset() }} size="md">
        <form onSubmit={routeForm.handleSubmit(d => createRouteMutation.mutate(d))}>

          {/* Gradient header — live route preview */}
          {(() => {
            const orig = airports.find(a => String(a.id) === routeForm.watch('origin_airport_id'))
            const dest = airports.find(a => String(a.id) === routeForm.watch('destination_airport_id'))
            const dist = routeForm.watch('distance_km')
            const dur  = routeForm.watch('estimated_duration_minutes')
            return (
              <div className="px-6 pt-10 pb-6 rounded-t-2xl"
                style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1a2f5e 55%, #1d4ed8 100%)' }}>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                    <Plane className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white/50 text-xs font-semibold uppercase tracking-widest">New Route</span>
                </div>

                {/* Route visualizer */}
                <div className="flex items-center gap-3">
                  <div className="text-center min-w-[64px]">
                    <p className="text-3xl font-black text-white font-mono tracking-wider leading-none">
                      {orig?.iata_code ?? <span className="text-white/25">ORG</span>}
                    </p>
                    <p className="text-white/40 text-[10px] mt-1 font-medium truncate max-w-[72px]">
                      {orig?.city ?? 'Origin'}
                    </p>
                  </div>

                  <div className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-center gap-1">
                      <div className="flex-1 border-t border-dashed border-white/20" />
                      <Plane className="w-4 h-4 text-white/50 rotate-90 shrink-0" />
                      <div className="flex-1 border-t border-dashed border-white/20" />
                    </div>
                    {(dist || dur) && (
                      <div className="flex items-center gap-3 mt-0.5">
                        {dist && <span className="text-white/40 text-[10px] font-medium">{Number(dist).toLocaleString()} km</span>}
                        {dur  && <span className="text-white/40 text-[10px] font-medium">{Math.floor(Number(dur)/60)}h {Number(dur)%60}m</span>}
                      </div>
                    )}
                  </div>

                  <div className="text-center min-w-[64px]">
                    <p className="text-3xl font-black text-white font-mono tracking-wider leading-none">
                      {dest?.iata_code ?? <span className="text-white/25">DST</span>}
                    </p>
                    <p className="text-white/40 text-[10px] mt-1 font-medium truncate max-w-[72px]">
                      {dest?.city ?? 'Destination'}
                    </p>
                  </div>
                </div>
              </div>
            )
          })()}

          <div className="px-6 py-5 space-y-5">

            {/* Airport selectors */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Route Endpoints</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Origin *</label>
                  <Controller
                    name="origin_airport_id"
                    control={routeForm.control}
                    rules={{ required: 'Required' }}
                    render={({ field }) => (
                      <Select {...field} error={Boolean(routeForm.formState.errors.origin_airport_id)}>
                        <option value="">Select airport</option>
                        {airports.map(a => (
                          <option key={a.id} value={a.id}>{a.iata_code} — {a.city}</option>
                        ))}
                      </Select>
                    )}
                  />
                  {routeForm.formState.errors.origin_airport_id && (
                    <p className="mt-1 text-xs text-red-500">{routeForm.formState.errors.origin_airport_id.message}</p>
                  )}
                </div>
                <div>
                  <label className="label">Destination *</label>
                  <Controller
                    name="destination_airport_id"
                    control={routeForm.control}
                    rules={{ required: 'Required' }}
                    render={({ field }) => (
                      <Select {...field} error={Boolean(routeForm.formState.errors.destination_airport_id)}>
                        <option value="">Select airport</option>
                        {airports.map(a => (
                          <option key={a.id} value={a.id}>{a.iata_code} — {a.city}</option>
                        ))}
                      </Select>
                    )}
                  />
                  {routeForm.formState.errors.destination_airport_id && (
                    <p className="mt-1 text-xs text-red-500">{routeForm.formState.errors.destination_airport_id.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Flight stats */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Flight Statistics</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 select-none pointer-events-none">KM</span>
                  <input {...routeForm.register('distance_km')} type="number" min={0} placeholder="1 250"
                    className="input pl-10 font-mono text-sm" />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">distance</span>
                </div>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input {...routeForm.register('estimated_duration_minutes')} type="number" min={0} placeholder="120"
                    className="input pl-10 font-mono text-sm" />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">mins</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-1 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => { setShowRouteModal(false); routeForm.reset() }}>Cancel</Button>
              <Button type="submit" loading={createRouteMutation.isPending}>
                <Save className="w-4 h-4" /> Add Route
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* ── Add Airport Modal ── */}
      <Modal open={showAirportModal} onClose={() => { setShowAirportModal(false); airportForm.reset() }} size="md">
        <form onSubmit={airportForm.handleSubmit(d => createAirportMutation.mutate(d))}>

          {/* Gradient header — live preview */}
          <div className="px-6 pt-10 pb-6 rounded-t-2xl"
            style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1a2f5e 55%, #1d4ed8 100%)' }}>
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                    <Globe className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white/50 text-xs font-semibold uppercase tracking-widest">New Airport</span>
                </div>
                <p className="text-5xl font-black text-white font-mono tracking-[0.15em] leading-none">
                  {airportForm.watch('iata_code')?.toUpperCase() || <span className="text-white/20">NBO</span>}
                </p>
                <p className="text-white/50 text-sm mt-2 min-h-[1.25rem]">
                  {[airportForm.watch('city'), airportForm.watch('country')].filter(Boolean).join(', ') || 'City, Country'}
                </p>
              </div>
              <div className="text-right">
                {airportForm.watch('icao_code') && (
                  <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white/10 border border-white/20">
                    <span className="text-white/60 text-xs font-mono font-bold">{airportForm.watch('icao_code')?.toUpperCase()}</span>
                  </div>
                )}
                <Globe className="w-16 h-16 text-white/5 mt-2 ml-auto" />
              </div>
            </div>
          </div>

          {/* Form fields */}
          <div className="px-6 py-5 space-y-5">

            {/* Identification */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Identification</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="label">IATA Code *</label>
                  <input
                    {...airportForm.register('iata_code', { required: 'Required', maxLength: { value: 3, message: 'Max 3 chars' } })}
                    placeholder="NBO" maxLength={3}
                    className="input font-mono uppercase font-black text-2xl tracking-[0.3em] text-center py-4"
                  />
                  {airportForm.formState.errors.iata_code && (
                    <p className="mt-1 text-xs text-red-500">{airportForm.formState.errors.iata_code.message}</p>
                  )}
                </div>
                <div>
                  <label className="label">ICAO</label>
                  <input
                    {...airportForm.register('icao_code')} placeholder="HKJK" maxLength={4}
                    className="input font-mono uppercase text-center py-4"
                  />
                </div>
              </div>
            </div>

            {/* Airport details */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Airport Details</p>
              <div className="space-y-3">
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    {...airportForm.register('name', { required: 'Required' })}
                    placeholder="Full airport name *" className="input pl-10"
                  />
                  {airportForm.formState.errors.name && (
                    <p className="mt-1 text-xs text-red-500">{airportForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input {...airportForm.register('city', { required: 'Required' })} placeholder="City *" className="input" />
                    {airportForm.formState.errors.city && (
                      <p className="mt-1 text-xs text-red-500">{airportForm.formState.errors.city.message}</p>
                    )}
                  </div>
                  <div>
                    <input {...airportForm.register('country', { required: 'Required' })} placeholder="Country *" className="input" />
                    {airportForm.formState.errors.country && (
                      <p className="mt-1 text-xs text-red-500">{airportForm.formState.errors.country.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Location</p>
              <div className="space-y-3">
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    {...airportForm.register('timezone', { required: 'Required' })}
                    placeholder="Timezone — e.g. Africa/Nairobi *" className="input pl-10 font-mono text-sm"
                  />
                  {airportForm.formState.errors.timezone && (
                    <p className="mt-1 text-xs text-red-500">{airportForm.formState.errors.timezone.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 select-none pointer-events-none">LAT</span>
                    <input {...airportForm.register('latitude')} type="number" step="any" placeholder="-1.3192" className="input pl-11 font-mono text-sm" />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 select-none pointer-events-none">LNG</span>
                    <input {...airportForm.register('longitude')} type="number" step="any" placeholder="36.9275" className="input pl-11 font-mono text-sm" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-1 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => { setShowAirportModal(false); airportForm.reset() }}>Cancel</Button>
              <Button type="submit" loading={createAirportMutation.isPending}>
                <Save className="w-4 h-4" /> Add Airport
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
