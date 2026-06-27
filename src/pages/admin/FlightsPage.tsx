import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Search, Plane, Edit, Trash2, RefreshCw, Eye } from 'lucide-react'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import toast from 'react-hot-toast'
import { flightService } from '@/services/flightService'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import Pagination from '@/components/ui/Pagination'
import Select from '@/components/ui/Select'
import { flightStatusConfig, formatCurrency } from '@/utils/helpers'
import { format, parseISO } from 'date-fns'
import type { Flight } from '@/types'

const STATUS_TRANSITIONS: Record<string, string[]> = {
  scheduled: ['boarding', 'delayed', 'cancelled'],
  boarding: ['departed', 'cancelled'],
  departed: ['arrived', 'diverted'],
  delayed: ['boarding', 'cancelled'],
  arrived: [],
  cancelled: [],
  diverted: ['arrived'],
}

export default function FlightsPage() {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [updating, setUpdating] = useState<number | null>(null)
  const [openMenu, setOpenMenu] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; number: string } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const qc = useQueryClient()

  useEffect(() => {
    if (openMenu === null) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openMenu])

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  // When searching, fetch everything and filter client-side so the search works
  // regardless of backend version. Without a search term, use normal server pagination.
  const { data: pageData, isLoading, isFetching } = useQuery({
    queryKey: ['flights-all', statusFilter],
    queryFn: () => flightService.list({ page: 1, per_page: 9999, status: statusFilter || undefined }),
    enabled: Boolean(search),
    staleTime: 30_000,
  })

  const { data: normalData, isLoading: normalLoading, isFetching: normalFetching } = useQuery({
    queryKey: ['flights', page, statusFilter],
    queryFn: () => flightService.list({ page, per_page: 12, status: statusFilter || undefined }),
    enabled: !search,
    staleTime: 0,
  })

  const allMatching = search
    ? (pageData?.items ?? []).filter(f =>
        f.flight_number.toLowerCase().includes(search.toLowerCase())
      )
    : []

  const searchPage = page - 1
  const flights    = search
    ? allMatching.slice(searchPage * 12, searchPage * 12 + 12)
    : (normalData?.items ?? [])
  const total      = search ? allMatching.length : (normalData?.total ?? 0)
  const loading    = search ? isLoading : normalLoading
  const fetching   = search ? isFetching : normalFetching

  const deleteMutation = useMutation({
    mutationFn: (id: number) => flightService.delete(id),
    onSuccess: () => { toast.success('Flight deleted'); setDeleteTarget(null); qc.invalidateQueries({ queryKey: ['flights'] }) },
    onError: (err: any) => { toast.error(err.response?.data?.message ?? 'Delete failed'); setDeleteTarget(null) },
  })

  const handleStatusChange = async (flight: Flight, newStatus: string) => {
    setUpdating(flight.id)
    try {
      await flightService.updateStatus(flight.id, newStatus)
      toast.success(`Flight status updated to ${newStatus}`)
      qc.invalidateQueries({ queryKey: ['flights'] })
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Status update failed')
    } finally { setUpdating(null) }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Flight Management</h1>
          <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
            {total} {search ? 'matching' : 'total'} flights
            {fetching && !loading && <span className="inline-block w-3 h-3 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />}
          </p>
        </div>
        <Link to="/admin/flights/new" className="btn-primary text-sm px-4 py-2">
          <Plus className="w-4 h-4" /> Add Flight
        </Link>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by flight number..." className="input pl-9 text-sm" />
        </div>
        <Select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className="text-sm w-auto">
          <option value="">All Statuses</option>
          {Object.entries(flightStatusConfig).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
        </Select>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto p-0">
        {loading ? (
          <div className="flex items-center justify-center h-48"><Spinner size="lg" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-left">
                {['Flight', 'Route', 'Aircraft', 'Departure', 'Arrival', 'Price', 'Seats', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {flights.map((f, i) => {
                const cfg = flightStatusConfig[f.status] ?? {}
                const transitions = STATUS_TRANSITIONS[f.status] ?? []
                return (
                  <motion.tr key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-900 whitespace-nowrap">{f.flight_number}</td>
                    <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{f.route?.origin_airport?.iata_code}</span>
                        <Plane className="w-3 h-3 text-slate-300" />
                        <span>{f.route?.destination_airport?.iata_code}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{f.aircraft?.registration ?? '—'}</td>
                    <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{f.departure_datetime ? format(parseISO(f.departure_datetime), 'MMM d · HH:mm') : '—'}</td>
                    <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{f.arrival_datetime ? format(parseISO(f.arrival_datetime), 'MMM d · HH:mm') : '—'}</td>
                    <td className="px-4 py-3.5 font-medium text-slate-700 whitespace-nowrap">{formatCurrency(Number(f.base_price))}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="text-brand-600 font-medium">{(f as any).booked_seats ?? '—'}</span>
                      <span className="text-slate-400"> / {(f as any).total_seats ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {transitions.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <Badge variant={cfg.color as any} size="sm">{cfg.label ?? f.status}</Badge>
                          <div className="relative" ref={openMenu === f.id ? menuRef : undefined}>
                            <button
                              disabled={updating === f.id}
                              onClick={() => setOpenMenu(openMenu === f.id ? null : f.id)}
                              className="p-1 rounded-md text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                            >
                              {updating === f.id ? <Spinner size="sm" /> : <RefreshCw className="w-3.5 h-3.5" />}
                            </button>
                            {openMenu === f.id && (
                              <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-xl py-1 min-w-36">
                                {transitions.map(t => (
                                  <button key={t} onClick={() => { handleStatusChange(f, t); setOpenMenu(null) }}
                                    className="w-full text-left px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 capitalize transition-colors">
                                    → {t}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <Badge variant={cfg.color as any} size="sm">{cfg.label ?? f.status}</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Link to={`/admin/flights/${f.id}`} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-all" title="View manifest & seat map">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link to={`/admin/flights/${f.id}/edit`} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-all">
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button onClick={() => setDeleteTarget({ id: f.id, number: f.flight_number })}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        )}
        {!loading && flights.length === 0 && (
          <p className="text-center py-12 text-slate-400 text-sm">No flights found.</p>
        )}
      </div>

      <Pagination page={page} totalPages={Math.ceil(total / 12)} onPageChange={setPage} />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
        variant="danger"
        title={`Delete flight ${deleteTarget?.number ?? ''}?`}
        message="This will permanently remove the flight and all associated data. This action cannot be undone."
        confirmLabel="Delete Flight"
      />
    </div>
  )
}
