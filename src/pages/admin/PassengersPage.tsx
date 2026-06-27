import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, User, AlertTriangle, CheckCircle } from 'lucide-react'
import { passengerService } from '@/services/passengerService'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import Pagination from '@/components/ui/Pagination'
import { getInitials } from '@/utils/helpers'
import { format, parseISO } from 'date-fns'

export default function PassengersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['passengers', page, search],
    queryFn: () => passengerService.list({ page, per_page: 15, search: search || undefined }),
  })

  const passengers = data?.items ?? []
  const total = data?.total ?? 0

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-900">Passengers</h1>
        <p className="text-slate-500 text-sm mt-1">{total} registered passenger{total !== 1 ? 's' : ''}</p>
      </motion.div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search by name or email..." className="input pl-9 text-sm" />
      </div>

      <div className="card overflow-x-auto p-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-48"><Spinner size="lg" /></div>
        ) : passengers.length === 0 ? (
          <div className="p-12"><EmptyState icon={<User className="w-10 h-10" />} title="No passengers found" description="Passengers who register on the platform will appear here." /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Passenger', 'Contact', 'Frequent Flyer', 'Passport Expiry', 'Miles', 'Documents'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {passengers.map((p, i) => (
                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-xs shrink-0">
                        {getInitials(p.first_name, p.last_name)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{p.first_name} {p.last_name}</p>
                        <p className="text-xs text-slate-500 capitalize">{p.gender ?? '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">{p.email ?? '—'}</td>
                  <td className="px-4 py-3.5 text-slate-600 font-mono text-xs">{p.frequent_flyer_number ?? '—'}</td>
                  <td className="px-4 py-3.5 text-slate-600">
                    {p.passport_expiry ? format(parseISO(p.passport_expiry), 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-700">{(p.loyalty_points ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3.5">
                    {p.passport_expiry ? (
                      parseISO(p.passport_expiry) < new Date() ? (
                        <Badge color="red" size="sm"><AlertTriangle className="w-3 h-3 mr-1" />Expired</Badge>
                      ) : (
                        <Badge color="green" size="sm"><CheckCircle className="w-3 h-3 mr-1" />Valid</Badge>
                      )
                    ) : (
                      <Badge color="slate" size="sm">No docs</Badge>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} totalPages={Math.ceil(total / 15)} onPageChange={setPage} />
    </div>
  )
}
