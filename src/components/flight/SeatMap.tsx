import { cn } from '@/utils/cn'
import type { Seat } from '@/types'

interface SeatMapProps {
  seats: Seat[]
  selectedSeatId: number | null
  onSelectSeat: (seat: Seat) => void
}

const CLASS_CONFIG = {
  first: {
    label: 'First Class',
    cols: 4,
    leftCols: 2,
    colLabels: ['A', 'B', 'C', 'D'],
    available: 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100 hover:border-amber-400 hover:shadow-sm',
    selected:  'bg-gradient-to-b from-amber-400 to-amber-600 border-amber-600 text-white shadow-lg shadow-amber-200/60',
    taken:     'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed opacity-60',
    ring:      'ring-amber-300',
    badgeBg:   'bg-amber-50 border border-amber-200',
    badgeText: 'text-amber-700',
    dot:       'bg-amber-400',
  },
  business: {
    label: 'Business',
    cols: 4,
    leftCols: 2,
    colLabels: ['A', 'B', 'C', 'D'],
    available: 'bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-400 hover:shadow-sm',
    selected:  'bg-gradient-to-b from-indigo-400 to-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200/60',
    taken:     'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed opacity-60',
    ring:      'ring-indigo-300',
    badgeBg:   'bg-indigo-50 border border-indigo-200',
    badgeText: 'text-indigo-700',
    dot:       'bg-indigo-400',
  },
  economy: {
    label: 'Economy',
    cols: 6,
    leftCols: 3,
    colLabels: ['A', 'B', 'C', 'D', 'E', 'F'],
    available: 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100 hover:border-sky-400 hover:shadow-sm',
    selected:  'bg-gradient-to-b from-sky-400 to-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200/60',
    taken:     'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed opacity-60',
    ring:      'ring-sky-300',
    badgeBg:   'bg-sky-50 border border-sky-200',
    badgeText: 'text-sky-700',
    dot:       'bg-sky-400',
  },
} as const

type SeatClass = keyof typeof CLASS_CONFIG

export default function SeatMap({ seats, selectedSeatId, onSelectSeat }: SeatMapProps) {
  const bySeatClass: Record<SeatClass, Seat[]> = { first: [], business: [], economy: [] }
  seats.forEach(s => {
    const cls = s.seat_class as SeatClass
    if (bySeatClass[cls]) bySeatClass[cls].push(s)
  })

  const sections = (['first', 'business', 'economy'] as SeatClass[]).filter(c => bySeatClass[c].length > 0)

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Fuselage container */}
      <div className="max-w-xs mx-auto px-4 pt-6 pb-8">

        {/* Aircraft nose */}
        <div className="flex justify-center mb-8">
          <div className="relative flex flex-col items-center">
            <svg width="80" height="44" viewBox="0 0 80 44" fill="none">
              <path d="M40 2 C20 2 4 20 4 38 L76 38 C76 20 60 2 40 2Z" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1.5"/>
              <path d="M40 10 C26 10 14 22 14 34 L66 34 C66 22 54 10 40 10Z" fill="#e2e8f0"/>
              <circle cx="40" cy="26" r="6" fill="#cbd5e1"/>
              <line x1="4" y1="38" x2="76" y2="38" stroke="#e2e8f0" strokeWidth="1.5"/>
            </svg>
            <p className="text-[9px] font-bold tracking-[0.2em] text-slate-300 uppercase mt-1">Front</p>
          </div>
        </div>

        {/* Sections */}
        {sections.map((cls, si) => {
          const cfg  = CLASS_CONFIG[cls]
          const sectionSeats = bySeatClass[cls]
          const rows: Seat[][] = []
          for (let i = 0; i < sectionSeats.length; i += cfg.cols) rows.push(sectionSeats.slice(i, i + cfg.cols))
          const left = cfg.leftCols as number
          const rightLabels = cfg.colLabels.slice(left)

          return (
            <div key={cls} className={si < sections.length - 1 ? 'mb-7' : ''}>
              {/* Section header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-slate-100" />
                <span className={cn('text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full', cfg.badgeBg, cfg.badgeText)}>
                  {cfg.label}
                </span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              {/* Column labels */}
              <div className="flex items-center justify-center gap-1 mb-2">
                <div className="w-5" />
                <div className="flex gap-1">
                  {cfg.colLabels.slice(0, left).map(l => (
                    <div key={l} className="w-9 text-center text-[10px] font-bold text-slate-300">{l}</div>
                  ))}
                </div>
                <div className="w-5" />
                <div className="flex gap-1">
                  {rightLabels.map(l => (
                    <div key={l} className="w-9 text-center text-[10px] font-bold text-slate-300">{l}</div>
                  ))}
                </div>
              </div>

              {/* Seat rows */}
              <div className="space-y-1.5">
                {rows.map((row, ri) => (
                  <div key={ri} className="flex items-center justify-center gap-1">
                    {/* Row number */}
                    <div className="w-5 text-right text-[10px] font-bold text-slate-300 shrink-0">
                      {ri + 1}
                    </div>
                    {/* Left seats */}
                    <div className="flex gap-1">
                      {row.slice(0, left).map(seat => (
                        <SeatButton key={seat.id} seat={seat} selected={selectedSeatId === seat.id} cfg={cfg} onSelect={onSelectSeat} />
                      ))}
                    </div>
                    {/* Aisle gap */}
                    <div className="w-5 flex flex-col items-center">
                      <div className="w-px h-10 bg-slate-100" />
                    </div>
                    {/* Right seats */}
                    <div className="flex gap-1">
                      {row.slice(left).map(seat => (
                        <SeatButton key={seat.id} seat={seat} selected={selectedSeatId === seat.id} cfg={cfg} onSelect={onSelectSeat} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="border-t border-slate-100 px-6 py-3 flex items-center justify-center flex-wrap gap-x-5 gap-y-2 bg-slate-50/60">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Legend</span>
        {[
          { label: 'Available',  cls: 'bg-sky-100 border border-sky-200' },
          { label: 'Selected',   cls: 'bg-gradient-to-b from-sky-400 to-blue-600 border border-blue-600' },
          { label: 'Occupied',   cls: 'bg-slate-100 border border-slate-200 opacity-60' },
        ].map(l => (
          <span key={l.label} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className={cn('w-4 h-5 rounded-t-lg rounded-b-sm inline-block', l.cls)} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function SeatButton({ seat, selected, cfg, onSelect }: {
  seat: Seat
  selected: boolean
  cfg: typeof CLASS_CONFIG[SeatClass]
  onSelect: (s: Seat) => void
}) {
  const taken = !seat.is_available
  const tip   = [
    seat.seat_number,
    seat.is_window ? 'Window' : seat.is_aisle ? 'Aisle' : 'Middle',
    taken ? 'Occupied' : 'Available',
  ].join(' · ')

  return (
    <button
      disabled={taken}
      onClick={() => !taken && onSelect(seat)}
      title={tip}
      className={cn(
        'w-9 h-10 rounded-t-xl rounded-b-md border text-[9px] font-black transition-all duration-150 flex flex-col items-center justify-center gap-0.5',
        taken    ? cfg.taken :
        selected ? cfg.selected + ' ring-2 ring-offset-1 ' + cfg.ring + ' scale-105' :
                   cfg.available,
      )}
    >
      <span className="leading-none">{seat.seat_number}</span>
      {seat.is_window && !taken && !selected && (
        <span className="w-1 h-1 rounded-full bg-current opacity-40" />
      )}
    </button>
  )
}
