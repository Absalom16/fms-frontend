import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Edit, Plane, CheckCircle2, Wrench, Archive, Save, Users } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { aircraftService, type AircraftRecord } from '@/services/aircraftService'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Pagination from '@/components/ui/Pagination'
import EmptyState from '@/components/ui/EmptyState'

interface AircraftForm {
  registration_number: string
  model: string
  manufacturer: string
  economy_seats: number
  business_seats: number
  first_class_seats: number
}

const STATUS_CONFIG = {
  active:      { label: 'Active',      accent: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', icon: <CheckCircle2 className="w-3 h-3" /> },
  maintenance: { label: 'Maintenance', accent: 'bg-amber-400',   pill: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',     icon: <Wrench className="w-3 h-3" /> },
  retired:     { label: 'Retired',     accent: 'bg-slate-300',   pill: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',     icon: <Archive className="w-3 h-3" /> },
}

function displayName(manufacturer?: string, model?: string) {
  if (!manufacturer) return model ?? ''
  if (model?.toLowerCase().startsWith(manufacturer.toLowerCase())) return model ?? ''
  return `${manufacturer} ${model ?? ''}`.trim()
}

export default function AircraftPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<AircraftRecord | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null)
  const [openMenu, setOpenMenu] = useState<number | null>(null)
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

  const { data, isLoading } = useQuery({
    queryKey: ['aircraft-admin', page, statusFilter],
    queryFn: () => aircraftService.list({ page, per_page: 12, status: statusFilter || undefined }),
  })

  const aircraft = data?.items ?? []
  const total    = data?.total ?? 0

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<AircraftForm>({
    defaultValues: { business_seats: 0, first_class_seats: 0 },
  })

  const saveMutation = useMutation({
    mutationFn: (form: AircraftForm) => {
      const payload = {
        registration_number: form.registration_number,
        model:               form.model,
        manufacturer:        form.manufacturer || undefined,
        economy_seats:       Number(form.economy_seats),
        business_seats:      Number(form.business_seats) || 0,
        first_class_seats:   Number(form.first_class_seats) || 0,
      }
      return editing ? aircraftService.update(editing.id, payload) : aircraftService.create(payload)
    },
    onSuccess: () => {
      toast.success(editing ? 'Aircraft updated!' : 'Aircraft added!')
      qc.invalidateQueries({ queryKey: ['aircraft-admin'] })
      qc.invalidateQueries({ queryKey: ['aircraft'] })
      closeModal()
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Operation failed'),
  })

  const handleStatusChange = async (a: AircraftRecord, status: AircraftRecord['status']) => {
    setUpdatingStatus(a.id)
    try {
      await aircraftService.updateStatus(a.id, status)
      toast.success(`Status updated to ${status}`)
      qc.invalidateQueries({ queryKey: ['aircraft-admin'] })
      qc.invalidateQueries({ queryKey: ['aircraft'] })
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Update failed')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const openNew  = () => { setEditing(null); reset({ business_seats: 0, first_class_seats: 0 }); setShowModal(true) }
  const openEdit = (a: AircraftRecord) => {
    setEditing(a)
    reset({ registration_number: a.registration_number, model: a.model, manufacturer: a.manufacturer ?? '', economy_seats: a.economy_seats, business_seats: a.business_seats, first_class_seats: a.first_class_seats })
    setShowModal(true)
  }
  const closeModal = () => { setShowModal(false); setEditing(null); reset() }

  // Derived stats
  const counts = aircraft.reduce((acc, a) => { acc[a.status] = (acc[a.status] ?? 0) + 1; return acc }, {} as Record<string, number>)

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Aircraft Fleet</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-slate-500 text-sm">{total} aircraft</span>
            {counts['active'] && (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full ring-1 ring-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> {counts['active']} active
              </span>
            )}
            {counts['maintenance'] && (
              <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full ring-1 ring-amber-200">
                <Wrench className="w-3 h-3" /> {counts['maintenance']} maintenance
              </span>
            )}
            {counts['retired'] && (
              <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full ring-1 ring-slate-200">
                <Archive className="w-3 h-3" /> {counts['retired']} retired
              </span>
            )}
          </div>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4" /> Add Aircraft</Button>
      </motion.div>

      {/* Status filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {[{ v: '', l: 'All' }, { v: 'active', l: 'Active' }, { v: 'maintenance', l: 'Maintenance' }, { v: 'retired', l: 'Retired' }].map(({ v, l }) => (
          <button key={v} onClick={() => { setStatusFilter(v); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${statusFilter === v ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48"><Spinner size="lg" /></div>
      ) : aircraft.length === 0 ? (
        <EmptyState icon={<Plane className="w-10 h-10" />} title="No aircraft found" description="Add your first aircraft to the fleet." action={{ label: 'Add Aircraft', onClick: openNew }} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {aircraft.map((a, i) => {
            const cfg   = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.active
            const total = (a.economy_seats ?? 0) + (a.business_seats ?? 0) + (a.first_class_seats ?? 0)
            const ecoW  = total ? Math.round((a.economy_seats / total) * 100) : 0
            const bizW  = total ? Math.round((a.business_seats / total) * 100) : 0
            const fstW  = total ? 100 - ecoW - bizW : 0

            return (
              <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">

                {/* Status accent bar + header */}
                <div className="relative">
                  <div className={`h-1 w-full ${cfg.accent}`} />
                  <div className="px-4 pt-4 pb-3">
                    <div className="flex items-start justify-between">
                      {/* Tail icon */}
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center shadow-sm">
                        <Plane className="w-5 h-5 text-white -rotate-45" />
                      </div>
                      <button onClick={() => openEdit(a)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-brand-600 hover:bg-brand-50 transition-all opacity-0 group-hover:opacity-100">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Registration + model */}
                    <div className="mt-3">
                      <p className="text-xl font-black text-slate-900 font-mono tracking-wider leading-none">{a.registration_number}</p>
                      <p className="text-xs font-medium text-slate-500 mt-1 truncate">{displayName(a.manufacturer, a.model)}</p>
                    </div>
                  </div>
                </div>

                {/* Seat capacity */}
                <div className="px-4 pb-4">
                  {/* Stacked bar */}
                  <div className="flex h-1.5 rounded-full overflow-hidden mb-3 gap-px">
                    {ecoW > 0 && <div className="bg-slate-300 rounded-l-full" style={{ width: `${ecoW}%` }} />}
                    {bizW > 0 && <div className="bg-amber-400" style={{ width: `${bizW}%` }} />}
                    {fstW > 0 && <div className="bg-violet-500 rounded-r-full" style={{ width: `${fstW}%` }} />}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-sm font-black text-slate-800">{a.economy_seats}</p>
                      <p className="text-[10px] text-slate-400 font-medium">Economy</p>
                    </div>
                    <div>
                      <p className="text-sm font-black text-amber-600">{a.business_seats}</p>
                      <p className="text-[10px] text-slate-400 font-medium">Business</p>
                    </div>
                    <div>
                      <p className="text-sm font-black text-violet-600">{a.first_class_seats}</p>
                      <p className="text-[10px] text-slate-400 font-medium">First</p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-100 mt-3 pt-3 flex items-center justify-between">
                    {/* Status pill */}
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg ${cfg.pill}`}>
                      {cfg.icon} {cfg.label}
                    </span>

                    {/* Status change menu */}
                    <div className="relative" ref={openMenu === a.id ? menuRef : undefined}>
                      {updatingStatus === a.id ? (
                        <Spinner size="sm" />
                      ) : (
                        <>
                          <button
                            onClick={() => setOpenMenu(openMenu === a.id ? null : a.id)}
                            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 font-semibold transition-colors px-2 py-1 rounded-lg hover:bg-slate-50"
                          >
                            Change
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {openMenu === a.id && (
                            <div className="absolute right-0 bottom-8 z-20 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 min-w-[140px]">
                              <p className="px-3 pb-1.5 pt-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 mb-1">Set status</p>
                              {(['active', 'maintenance', 'retired'] as const).filter(s => s !== a.status).map(s => {
                                const c = STATUS_CONFIG[s]
                                return (
                                  <button key={s} onClick={() => { handleStatusChange(a, s); setOpenMenu(null) }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                                    <span className={`w-2 h-2 rounded-full ${c.accent}`} />
                                    {c.label}
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <Pagination page={page} totalPages={Math.ceil(total / 12)} onPageChange={setPage} />

      {/* Add / Edit Modal */}
      <Modal open={showModal} onClose={closeModal} size="md">
        <form onSubmit={handleSubmit(d => saveMutation.mutate(d))}>

          {/* Modal header */}
          <div className="px-6 pt-10 pb-6 rounded-t-2xl"
            style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 55%, #1d4ed8 100%)' }}>
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                    <Plane className="w-4 h-4 text-white -rotate-45" />
                  </div>
                  <span className="text-white/50 text-xs font-semibold uppercase tracking-widest">
                    {editing ? 'Edit Aircraft' : 'New Aircraft'}
                  </span>
                </div>
                <p className="text-4xl font-black text-white font-mono tracking-[0.15em] leading-none">
                  {editing?.registration_number ?? <span className="text-white/20">5Y-???</span>}
                </p>
                <p className="text-white/50 text-sm mt-2 min-h-[1.25rem]">
                  {editing ? displayName(editing.manufacturer, editing.model) : 'New aircraft registration'}
                </p>
              </div>
              <Users className="w-14 h-14 text-white/5" />
            </div>
          </div>

          <div className="px-6 py-5 space-y-5">

            {/* Identity */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Identity</p>
              <div>
                <label className="label">Registration Number *</label>
                <input {...register('registration_number', { required: 'Required' })}
                  placeholder="5Y-KZA" disabled={Boolean(editing)}
                  className="input font-mono uppercase font-black text-xl tracking-widest text-center py-4" />
                {errors.registration_number && <p className="mt-1 text-xs text-red-500">{errors.registration_number.message}</p>}
                {editing && <p className="mt-1 text-xs text-slate-400">Registration cannot be changed after creation.</p>}
              </div>
            </div>

            {/* Aircraft type */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Aircraft Type</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Manufacturer</label>
                  <input {...register('manufacturer')} placeholder="Boeing" className="input" />
                </div>
                <div>
                  <label className="label">Model *</label>
                  <input {...register('model', { required: 'Required' })} placeholder="737-800" className="input" />
                  {errors.model && <p className="mt-1 text-xs text-red-500">{errors.model.message}</p>}
                </div>
              </div>
            </div>

            {/* Seat config */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Seat Configuration</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Economy *</p>
                  <input {...register('economy_seats', { required: 'Required', min: { value: 1, message: '≥ 1' } })}
                    type="number" min={0} placeholder="150"
                    className="input text-center font-black text-lg py-2.5 bg-white" />
                  {errors.economy_seats && <p className="mt-1 text-[10px] text-red-500">{errors.economy_seats.message}</p>}
                </div>
                <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-2">Business</p>
                  <input {...register('business_seats')} type="number" min={0} placeholder="24"
                    className="input text-center font-black text-lg py-2.5 bg-white" />
                </div>
                <div className="rounded-xl bg-violet-50 border border-violet-100 p-3">
                  <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wider mb-2">First</p>
                  <input {...register('first_class_seats')} type="number" min={0} placeholder="8"
                    className="input text-center font-black text-lg py-2.5 bg-white" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-1 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
              <Button type="submit" loading={isSubmitting || saveMutation.isPending}>
                <Save className="w-4 h-4" /> {editing ? 'Save Changes' : 'Add Aircraft'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
