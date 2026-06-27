import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Search, Edit, Trash2, User, CheckCircle, XCircle, Save, Mail, Phone, FileText, Shield, Globe, Calendar, Lock } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import toast from 'react-hot-toast'
import { crewService } from '@/services/crewService'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import EmptyState from '@/components/ui/EmptyState'
import Select from '@/components/ui/Select'
import Pagination from '@/components/ui/Pagination'
import { getInitials } from '@/utils/helpers'
import type { CrewMember } from '@/types'

interface CrewForm {
  first_name: string; last_name: string; email: string; phone: string
  password: string; position: string; employee_id: string
  license_number: string; license_expiry: string; medical_cert_expiry: string; nationality: string
}

const positions = ['pilot', 'co_pilot', 'flight_attendant', 'purser']

const ROLE_CONFIG: Record<string, { label: string; accent: string; pill: string }> = {
  pilot:             { label: 'Pilot',            accent: 'bg-blue-500',   pill: 'bg-blue-50 text-blue-700 ring-blue-100' },
  co_pilot:          { label: 'Co-Pilot',         accent: 'bg-sky-500',    pill: 'bg-sky-50 text-sky-700 ring-sky-100' },
  flight_attendant:  { label: 'Flight Attendant', accent: 'bg-violet-500', pill: 'bg-violet-50 text-violet-700 ring-violet-100' },
  purser:            { label: 'Purser',            accent: 'bg-amber-500',  pill: 'bg-amber-50 text-amber-700 ring-amber-100' },
}

const STATUS_CONFIG: Record<string, { label: string; style: string }> = {
  active:   { label: 'Active',   style: 'bg-green-50 text-green-700' },
  on_leave: { label: 'On Leave', style: 'bg-yellow-50 text-yellow-700' },
  retired:  { label: 'Retired',  style: 'bg-slate-100 text-slate-500' },
}

export default function CrewPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<CrewMember | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CrewMember | null>(null)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['crew', page, search],
    queryFn: () => crewService.list({ page, per_page: 12, search: search || undefined }),
  })

  const crew = data?.items ?? []
  const total = data?.total ?? 0

  const { register, handleSubmit, reset, control, watch, formState: { errors, isSubmitting } } = useForm<CrewForm>()

  const saveMutation = useMutation({
    mutationFn: (data: CrewForm) => editing ? crewService.update(editing.id, data) : crewService.create(data),
    onSuccess: () => {
      toast.success(editing ? 'Crew member updated!' : 'Crew member added!')
      qc.invalidateQueries({ queryKey: ['crew'] })
      setShowModal(false); setEditing(null); reset()
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Operation failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => crewService.delete(id),
    onSuccess: () => { toast.success('Crew member removed'); setDeleteTarget(null); qc.invalidateQueries({ queryKey: ['crew'] }) },
    onError: (err: any) => { toast.error(err.response?.data?.message ?? 'Delete failed'); setDeleteTarget(null) },
  })

  const openEdit = (c: CrewMember) => {
    setEditing(c)
    reset({
      first_name: c.first_name ?? '',
      last_name: c.last_name ?? '',
      email: c.email ?? '',
      phone: c.phone ?? '',
      password: '',
      position: (c as any).position ?? (c as any).crew_role ?? '',
      employee_id: c.employee_id ?? '',
      license_number: c.license_number ?? '',
      nationality: (c as any).nationality ?? '',
      license_expiry: (c as any).license_expiry ?? (c as any).certification_expiry ?? '',
      medical_cert_expiry: (c as any).medical_cert_expiry ?? (c as any).medical_expiry ?? '',
    })
    setShowModal(true)
  }

  const openNew = () => { setEditing(null); reset(); setShowModal(true) }

  const activeCount = crew.filter(c => c.status === 'active').length
  const onLeaveCount = crew.filter(c => c.status === 'on_leave').length

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Crew Management</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">{total} total</span>
            {activeCount > 0 && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700">{activeCount} active</span>}
            {onLeaveCount > 0 && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700">{onLeaveCount} on leave</span>}
          </div>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4" /> Add Crew Member</Button>
      </motion.div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search crew..." className="input pl-9 text-sm" />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48"><Spinner size="lg" /></div>
      ) : crew.length === 0 ? (
        <EmptyState icon={<User className="w-10 h-10" />} title="No crew members found" description="Add your first crew member to get started." action={{ label: 'Add Crew Member', onClick: openNew }} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {crew.map((c, i) => {
            const role = (c as any).position ?? (c as any).crew_role ?? ''
            const roleConf = ROLE_CONFIG[role] ?? { label: role.replace(/_/g, ' '), accent: 'bg-slate-400', pill: 'bg-slate-100 text-slate-600 ring-slate-200' }
            const status = c.status ?? 'active'
            const statusConf = STATUS_CONFIG[status] ?? STATUS_CONFIG.active
            return (
              <motion.div key={c.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200 overflow-hidden">
                {/* Role accent bar */}
                <div className={`h-1.5 w-full ${roleConf.accent}`} />

                <div className="p-4">
                  {/* Top row: avatar + actions */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                      {getInitials(c.first_name, c.last_name)}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-all"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>

                  {/* Name + role */}
                  <h3 className="font-bold text-slate-900 text-sm leading-tight capitalize">
                    {c.first_name} {c.last_name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ring-1 ${roleConf.pill}`}>
                      {roleConf.label}
                    </span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusConf.style}`}>
                      {statusConf.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-2">{c.employee_id}</p>

                  {/* Divider */}
                  <div className="border-t border-slate-100 my-3" />

                  {/* Cert badges */}
                  <div className="flex gap-2">
                    <div className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg flex-1 justify-center ${c.is_certification_valid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                      {c.is_certification_valid ? <CheckCircle className="w-3 h-3 shrink-0" /> : <XCircle className="w-3 h-3 shrink-0" />}
                      License
                    </div>
                    <div className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg flex-1 justify-center ${c.is_medical_valid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                      {c.is_medical_valid ? <CheckCircle className="w-3 h-3 shrink-0" /> : <XCircle className="w-3 h-3 shrink-0" />}
                      Medical
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <Pagination page={page} totalPages={Math.ceil(total / 12)} onPageChange={setPage} />

      {/* Modal */}
      {(() => {
        const wFirst = watch('first_name') || ''
        const wLast = watch('last_name') || ''
        const wPos = watch('position') || ''
        const initials = `${wFirst[0] || ''}${wLast[0] || ''}`.toUpperCase()
        const fullName = [wFirst, wLast].filter(Boolean).join(' ')
        return (
          <Modal open={showModal} onClose={() => { setShowModal(false); setEditing(null); reset() }} size="lg">
            {/* Gradient header */}
            <div className="rounded-t-2xl px-6 pt-8 pb-6" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)' }}>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                  {initials
                    ? <span className="text-2xl font-bold text-white">{initials}</span>
                    : <User className="w-7 h-7 text-white/40" />}
                </div>
                <div className="min-w-0">
                  <p className="text-white/50 text-xs font-semibold tracking-widest uppercase mb-0.5">
                    {editing ? 'Edit Crew Member' : 'New Crew Member'}
                  </p>
                  <h2 className="text-2xl font-bold text-white truncate">
                    {fullName || <span className="text-white/30 italic font-normal text-lg">Name preview</span>}
                  </h2>
                  {wPos && (
                    <span className="mt-1 inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-white/15 text-white/80 capitalize">
                      {wPos.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="px-6 py-5 space-y-5">
              {/* IDENTITY */}
              <div>
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-3">Identity</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="label">First Name *</label>
                    <input {...register('first_name', { required: 'Required' })} className="input" placeholder="Jane" />
                    {errors.first_name && <p className="mt-1 text-xs text-red-500">{errors.first_name.message}</p>}
                  </div>
                  <div>
                    <label className="label">Last Name *</label>
                    <input {...register('last_name', { required: 'Required' })} className="input" placeholder="Smith" />
                    {errors.last_name && <p className="mt-1 text-xs text-red-500">{errors.last_name.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input {...register('email', { required: 'Required' })} type="email" className="input pl-9 disabled:opacity-60 disabled:cursor-not-allowed" placeholder="jane@airline.com" disabled={!!editing} />
                    </div>
                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input {...register('phone')} type="tel" className="input pl-9 disabled:opacity-60 disabled:cursor-not-allowed" placeholder="+1 555 0000" disabled={!!editing} />
                    </div>
                  </div>
                </div>
                {!editing && (
                  <div className="mt-3">
                    <label className="label">Temporary Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input {...register('password', { required: !editing ? 'Required' : false, minLength: { value: 8, message: 'Min 8 characters' } })} type="password" className="input pl-9" placeholder="Min. 8 characters" />
                    </div>
                    {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
                  </div>
                )}
              </div>

              {/* ROLE */}
              <div>
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-3">Role &amp; Employment</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Position *</label>
                    <Controller
                      name="position"
                      control={control}
                      rules={{ required: 'Required' }}
                      render={({ field }) => (
                        <Select {...field} error={Boolean(errors.position)}>
                          <option value="">Select position</option>
                          {positions.map(p => <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>)}
                        </Select>
                      )}
                    />
                    {errors.position && <p className="mt-1 text-xs text-red-500">{errors.position.message}</p>}
                  </div>
                  <div>
                    <label className="label">Employee ID *</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input {...register('employee_id', { required: 'Required' })} className="input pl-9 font-mono" placeholder="EMP-001" />
                    </div>
                    {errors.employee_id && <p className="mt-1 text-xs text-red-500">{errors.employee_id.message}</p>}
                  </div>
                </div>
              </div>

              {/* CERTIFICATIONS */}
              <div>
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-3">Certifications</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="label">License Number</label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input {...register('license_number')} className="input pl-9 font-mono" placeholder="ATP-12345" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Nationality</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input {...register('nationality')} className="input pl-9" placeholder="e.g. American" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">License Expiry</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input {...register('license_expiry')} type="date" className="input pl-9" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Medical Cert Expiry</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input {...register('medical_cert_expiry')} type="date" className="input pl-9" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => { setShowModal(false); setEditing(null); reset() }}>Cancel</Button>
                <Button type="submit" loading={isSubmitting}><Save className="w-4 h-4" /> {editing ? 'Update' : 'Add Member'}</Button>
              </div>
            </form>
          </Modal>
        )
      })()}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
        variant="danger"
        title={`Remove ${deleteTarget ? [deleteTarget.first_name, deleteTarget.last_name].filter(Boolean).join(' ') : 'crew member'}?`}
        message="This will permanently remove the crew member and their assignments. This action cannot be undone."
        confirmLabel="Remove"
      />
    </div>
  )
}
