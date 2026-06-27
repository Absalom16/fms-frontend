import { useState, useRef, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Calendar, Search, ChevronDown, X, Users, Briefcase, Sparkles, Check } from 'lucide-react'
import Button from '@/components/ui/Button'
import { flightService } from '@/services/flightService'
import type { FlightSearchParams, Airport } from '@/types'
import { cn } from '@/utils/cn'

interface Props {
  onSearch: (params: FlightSearchParams) => void
  loading?: boolean
  variant?: 'hero' | 'inline'
  defaultValues?: Partial<FlightSearchParams>
}

// ── Airport combobox ────────────────────────────────────────────────────────

interface ComboProps {
  value: string
  onChange: (v: string) => void
  placeholder: string
  airports: Airport[]
  isHero: boolean
  hasError: boolean
}

function AirportCombobox({ value, onChange, placeholder, airports, isHero, hasError }: ComboProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen]   = useState(false)
  const containerRef      = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const selected   = airports.find(a => a.iata_code === value)
  const displayVal = open ? query : (selected ? `${selected.iata_code} · ${selected.city}` : '')

  const filtered = (query.trim() === '' ? airports : airports.filter(a => {
    const q = query.toLowerCase()
    return (
      a.iata_code?.toLowerCase().startsWith(q) ||
      a.city?.toLowerCase().includes(q) ||
      a.name?.toLowerCase().includes(q) ||
      a.country?.toLowerCase().includes(q)
    )
  })).slice(0, 30)

  return (
    <div ref={containerRef} className="relative">
      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
      <input
        type="text"
        value={displayVal}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => { setQuery(''); setOpen(true) }}
        placeholder={placeholder}
        autoComplete="off"
        className={cn(
          'input pl-10',
          value ? 'pr-8' : 'pr-4',
          isHero && 'bg-white/15 border-white/20 text-white placeholder-white/50 focus:bg-white/20',
          hasError && 'border-red-400',
        )}
      />
      {value && (
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); onChange(''); setQuery('') }}
          className={cn(
            'absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 transition-colors',
            isHero ? 'text-white/40 hover:text-white/80' : 'text-slate-300 hover:text-slate-500',
          )}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1.5 w-full bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-y-auto max-h-60">
          {filtered.map(a => (
            <button
              key={a.id}
              type="button"
              onMouseDown={e => {
                e.preventDefault()
                onChange(a.iata_code)
                setQuery('')
                setOpen(false)
              }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                a.iata_code === value ? 'bg-brand-50' : 'hover:bg-slate-50',
              )}
            >
              <span className="font-mono font-black text-brand-600 text-sm w-10 shrink-0 tracking-wide">
                {a.iata_code}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{a.city}</p>
                <p className="text-xs text-slate-400 truncate">{a.name}</p>
              </div>
              <span className="ml-auto text-xs text-slate-300 shrink-0">{a.country}</span>
            </button>
          ))}
        </div>
      )}
      {open && query.trim() !== '' && filtered.length === 0 && (
        <div className="absolute z-50 mt-1.5 w-full bg-white rounded-2xl border border-slate-200 shadow-2xl px-4 py-3 text-sm text-slate-400">
          No airports found for "{query}"
        </div>
      )}
    </div>
  )
}

// ── Cabin class dropdown ─────────────────────────────────────────────────────

const CABIN_OPTIONS = [
  {
    value:   'economy',
    label:   'Economy',
    sub:     'Best value',
    Icon:    Users,
    accent:  'text-slate-600',
    bg:      'bg-slate-100',
    selBg:   'bg-slate-50',
    dot:     'bg-slate-400',
  },
  {
    value:   'business',
    label:   'Business',
    sub:     'Premium comfort',
    Icon:    Briefcase,
    accent:  'text-brand-600',
    bg:      'bg-brand-50',
    selBg:   'bg-brand-50',
    dot:     'bg-brand-500',
  },
  {
    value:   'first',
    label:   'First Class',
    sub:     'Ultimate luxury',
    Icon:    Sparkles,
    accent:  'text-amber-600',
    bg:      'bg-amber-50',
    selBg:   'bg-amber-50',
    dot:     'bg-amber-500',
  },
] as const

type CabinValue = typeof CABIN_OPTIONS[number]['value']

interface CabinProps {
  value: string
  onChange: (v: string) => void
  isHero: boolean
}

function CabinClassSelect({ value, onChange, isHero }: CabinProps) {
  const [open, setOpen] = useState(false)
  const ref             = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const selected = CABIN_OPTIONS.find(o => o.value === value) ?? CABIN_OPTIONS[0]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={cn(
          'w-full flex items-center gap-2.5 pl-3.5 pr-3 py-3 rounded-xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-0 text-left',
          isHero
            ? 'bg-white/15 border-white/20 text-white focus:ring-white/30 hover:bg-white/20'
            : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300 focus:border-brand-500 focus:ring-brand-200',
        )}
      >
        {/* Icon badge */}
        <span className={cn('w-6 h-6 rounded-lg flex items-center justify-center shrink-0', isHero ? 'bg-white/15' : selected.bg)}>
          <selected.Icon className={cn('w-3.5 h-3.5', isHero ? 'text-white/70' : selected.accent)} />
        </span>

        <span className="flex-1 min-w-0">
          <span className="block font-semibold leading-none mb-0.5">{selected.label}</span>
          <span className={cn('text-[10px] font-normal', isHero ? 'text-white/40' : 'text-slate-400')}>
            {selected.sub}
          </span>
        </span>

        <ChevronDown className={cn(
          'w-4 h-4 shrink-0 transition-transform duration-200',
          open ? 'rotate-180' : '',
          isHero ? 'text-white/50' : 'text-slate-400',
        )} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
          {CABIN_OPTIONS.map(opt => {
            const isActive = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onMouseDown={e => {
                  e.preventDefault()
                  onChange(opt.value)
                  setOpen(false)
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                  isActive ? opt.selBg : 'hover:bg-slate-50',
                )}
              >
                {/* Icon badge */}
                <span className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', opt.bg)}>
                  <opt.Icon className={cn('w-4 h-4', opt.accent)} />
                </span>

                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-bold leading-none mb-0.5', isActive ? opt.accent : 'text-slate-800')}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-slate-400">{opt.sub}</p>
                </div>

                {/* Tier dot + checkmark */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn('w-1.5 h-1.5 rounded-full', opt.dot)} />
                  {isActive && <Check className={cn('w-3.5 h-3.5', opt.accent)} />}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Main form ────────────────────────────────────────────────────────────────

export default function FlightSearchForm({ onSearch, loading, variant = 'inline', defaultValues }: Props) {
  const { control, register, handleSubmit, formState: { errors } } = useForm<FlightSearchParams>({
    defaultValues: { cabin_class: 'economy', ...defaultValues },
  })

  const { data: airports = [] } = useQuery({
    queryKey: ['airports'],
    queryFn:  () => flightService.getAirports(),
    staleTime: Infinity,
  })

  const isHero = variant === 'hero'

  return (
    <form
      onSubmit={handleSubmit(onSearch)}
      className={cn(
        'rounded-2xl',
        isHero ? 'glass p-6 md:p-8' : 'bg-white border border-slate-100 shadow-card p-6',
      )}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* From */}
        <div>
          <label className={cn('label', isHero && 'text-white/90')}>From</label>
          <Controller
            name="origin"
            control={control}
            rules={{ required: 'Required' }}
            render={({ field }) => (
              <AirportCombobox
                value={field.value ?? ''}
                onChange={field.onChange}
                placeholder="City or airport"
                airports={airports}
                isHero={isHero}
                hasError={Boolean(errors.origin)}
              />
            )}
          />
          {errors.origin && <p className="text-xs text-red-400 mt-1">{errors.origin.message}</p>}
        </div>

        {/* To */}
        <div>
          <label className={cn('label', isHero && 'text-white/90')}>To</label>
          <Controller
            name="destination"
            control={control}
            rules={{ required: 'Required' }}
            render={({ field }) => (
              <AirportCombobox
                value={field.value ?? ''}
                onChange={field.onChange}
                placeholder="City or airport"
                airports={airports}
                isHero={isHero}
                hasError={Boolean(errors.destination)}
              />
            )}
          />
          {errors.destination && <p className="text-xs text-red-400 mt-1">{errors.destination.message}</p>}
        </div>

        {/* Date */}
        <div>
          <label className={cn('label', isHero && 'text-white/90')}>Date</label>
          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="date"
              {...register('departure_date', { required: 'Required' })}
              className={cn(
                'input pl-10',
                isHero && 'bg-white/15 border-white/20 text-white focus:bg-white/20',
                errors.departure_date && 'border-red-400',
              )}
            />
          </div>
        </div>

        {/* Class */}
        <div>
          <label className={cn('label', isHero && 'text-white/90')}>Class</label>
          <Controller
            name="cabin_class"
            control={control}
            render={({ field }) => (
              <CabinClassSelect
                value={field.value ?? 'economy'}
                onChange={field.onChange}
                isHero={isHero}
              />
            )}
          />
        </div>
      </div>

      <div className={cn('mt-5', isHero ? 'flex justify-center' : 'flex justify-end')}>
        <Button
          type="submit" loading={loading} size={isHero ? 'lg' : 'md'}
          className={cn(isHero && 'px-10 bg-white text-brand-700 hover:bg-brand-50 shadow-lg hover:shadow-xl')}
        >
          <Search className="w-4 h-4" />
          Search Flights
        </Button>
      </div>
    </form>
  )
}
