import { useState } from 'react'
import { parseISO } from 'date-fns'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, SlidersHorizontal, X } from 'lucide-react'
import { flightService } from '@/services/flightService'
import FlightSearchForm from '@/components/flight/FlightSearchForm'
import FlightCard from '@/components/flight/FlightCard'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import Select from '@/components/ui/Select'
import type { FlightSearchParams } from '@/types'
import { Plane } from 'lucide-react'

type SortOption = 'price_asc' | 'price_desc' | 'duration_asc' | 'departure_asc'

const sortLabels: Record<SortOption, string> = {
  price_asc: 'Price: Low to High',
  price_desc: 'Price: High to Low',
  duration_asc: 'Shortest Duration',
  departure_asc: 'Earliest Departure',
}

export default function FlightSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [sort, setSort] = useState<SortOption>('price_asc')
  const [showFilters, setShowFilters] = useState(false)
  const [cabinFilter, setCabinFilter] = useState<string[]>([])

  const params: FlightSearchParams = {
    origin: searchParams.get('origin') ?? '',
    destination: searchParams.get('destination') ?? '',
    departure_date: searchParams.get('departure_date') ?? '',
    passengers: Number(searchParams.get('passengers') ?? 1),
    cabin_class: searchParams.get('cabin_class') ?? 'economy',
  }

  const hasSearch = Boolean(params.origin && params.destination && params.departure_date)

  const { data: flights = [], isLoading, isFetching } = useQuery({
    queryKey: ['flight-search', params],
    queryFn: () => flightService.search(params),
    enabled: hasSearch,
  })

  const sorted = [...flights].sort((a, b) => {
    if (sort === 'price_asc') return Number(a.base_price) - Number(b.base_price)
    if (sort === 'price_desc') return Number(b.base_price) - Number(a.base_price)
    if (sort === 'departure_asc') return (a.departure_datetime ? parseISO(a.departure_datetime).getTime() : 0) - (b.departure_datetime ? parseISO(b.departure_datetime).getTime() : 0)
    return 0
  })

  const displayed = cabinFilter.length ? sorted.filter(f => cabinFilter.includes(f.cabin_class ?? 'economy')) : sorted

  const handleSearch = (p: FlightSearchParams) => {
    setSearchParams(Object.fromEntries(Object.entries(p).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])))
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Find Flights</h1>
        <p className="text-slate-500 text-sm">Search from hundreds of routes and fares</p>
      </div>

      {/* Search form */}
      <FlightSearchForm onSearch={handleSearch} variant="inline" defaultValues={params} />

      {/* Results area */}
      {hasSearch && (
        <div>
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <p className="text-sm text-slate-600 font-medium">
              {isLoading || isFetching ? 'Searching...' : `${displayed.length} flight${displayed.length !== 1 ? 's' : ''} found`}
            </p>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowFilters(v => !v)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 font-medium transition-colors">
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {cabinFilter.length > 0 && <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center">{cabinFilter.length}</span>}
              </button>
              <Select value={sort} onChange={e => setSort(e.target.value as SortOption)}
                className="py-1.5 text-sm w-auto min-w-[180px]">
                {(Object.entries(sortLabels) as [SortOption, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </div>
          </div>

          {/* Filter panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900 text-sm">Filters</h3>
                    <button onClick={() => setShowFilters(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Cabin Class</p>
                    <div className="flex flex-wrap gap-2">
                      {['economy', 'business', 'first'].map(c => (
                        <button key={c} onClick={() => setCabinFilter(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all capitalize ${cabinFilter.includes(c) ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          {isLoading || isFetching ? (
            <div className="flex items-center justify-center h-56"><Spinner size="lg" /></div>
          ) : displayed.length === 0 ? (
            <EmptyState icon={<Plane className="w-10 h-10" />} title="No flights found" description="Try different dates or destinations." />
          ) : (
            <div className="space-y-4">
              {displayed.map((f, i) => (
                <motion.div key={f.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <FlightCard flight={f} index={i} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {!hasSearch && (
        <div className="text-center py-16 text-slate-400">
          <Plane className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Enter your trip details above to search flights</p>
        </div>
      )}
    </div>
  )
}
