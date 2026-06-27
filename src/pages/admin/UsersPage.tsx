import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, UserCheck, UserX, Shield, Users, Briefcase, User, UserPlus, Eye, EyeOff, X, Mail, Phone, Lock } from 'lucide-react'
import Select from '@/components/ui/Select'
import toast from 'react-hot-toast'
import { userService, type UserRecord, type CreateUserPayload } from '@/services/userService'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import Pagination from '@/components/ui/Pagination'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { format, parseISO } from 'date-fns'
import { cn } from '@/utils/cn'

const ROLE_CONFIG: Record<string, { label: string; color: 'blue' | 'green' | 'amber' | 'red'; icon: React.ReactNode }> = {
  admin:     { label: 'Admin',     color: 'red',   icon: <Shield    className="w-3 h-3" /> },
  manager:   { label: 'Manager',   color: 'blue',  icon: <Briefcase className="w-3 h-3" /> },
  crew:      { label: 'Crew',      color: 'amber', icon: <Users     className="w-3 h-3" /> },
  passenger: { label: 'Passenger', color: 'green', icon: <User      className="w-3 h-3" /> },
}

type ActionTarget = { user: UserRecord; action: 'activate' | 'deactivate' }

interface AddUserForm {
  first_name: string; last_name: string; email: string
  phone?: string; role: 'admin' | 'manager' | 'crew'; password: string; confirm_password: string
  crew_role?: 'pilot' | 'co_pilot' | 'flight_attendant' | 'purser'
  employee_id?: string
}

export default function UsersPage() {
  const [page, setPage]               = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch]           = useState('')
  const [roleFilter, setRoleFilter]   = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [actionTarget, setActionTarget] = useState<ActionTarget | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const qc = useQueryClient()

  const { register: regAdd, handleSubmit: handleAdd, watch: watchAdd, reset: resetAdd, setValue: setAddValue, formState: { errors: addErrors, isSubmitting: addSubmitting } } = useForm<AddUserForm>({ defaultValues: { role: 'admin' } })
  const addPassword = watchAdd('password')

  const createMutation = useMutation({
    mutationFn: (payload: CreateUserPayload) => userService.create(payload),
    onSuccess: () => {
      toast.success('User created successfully')
      setShowAddModal(false)
      resetAdd()
      qc.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? 'Failed to create user')
    },
  })

  const onAddSubmit = async (data: AddUserForm) => {
    const { confirm_password, ...payload } = data
    createMutation.mutate(payload)
  }

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['users', page, search, roleFilter, statusFilter],
    queryFn: () => userService.list({ page, per_page: 20, search: search || undefined, role: roleFilter || undefined, status: statusFilter || undefined }),
    staleTime: 0,
  })

  const users = data?.items ?? []
  const total = data?.total ?? 0

  const toggleMutation = useMutation({
    mutationFn: ({ user, action }: ActionTarget) =>
      action === 'activate' ? userService.activate(user.id) : userService.deactivate(user.id),
    onSuccess: (_, vars) => {
      toast.success(vars.action === 'activate' ? 'Account activated' : 'Account deactivated')
      setActionTarget(null)
      qc.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? 'Operation failed')
      setActionTarget(null)
    },
  })

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
            {total} total users
            {isFetching && !isLoading && <span className="inline-block w-3 h-3 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" /> Add User
        </button>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by name or email…"
            className="input pl-9 text-sm"
          />
        </div>
        <Select
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
          className="w-40"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="crew">Crew</option>
          <option value="passenger">Passenger</option>
        </Select>
        <Select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="w-40"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto p-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-48"><Spinner size="lg" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-left">
                {['User', 'Email', 'Phone', 'Role', 'Status', 'Last Login', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((u, i) => {
                const role = ROLE_CONFIG[u.role] ?? { label: u.role, color: 'blue' as const, icon: null }
                return (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-brand-700">
                            {u.first_name[0]}{u.last_name[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{u.full_name}</p>
                          <p className="text-xs text-slate-400">ID #{u.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{u.email}</td>
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">{u.phone ?? '—'}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <Badge variant={role.color} size="sm">
                          <span className="flex items-center gap-1">{role.icon}{role.label}</span>
                        </Badge>
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 ring-1 ring-slate-200 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap text-xs">
                      {u.last_login ? format(parseISO(u.last_login), 'MMM d, yyyy · HH:mm') : 'Never'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap text-xs">
                      {format(parseISO(u.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {u.is_active ? (
                        <button
                          onClick={() => setActionTarget({ user: u, action: 'deactivate' })}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <UserX className="w-3.5 h-3.5" /> Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => setActionTarget({ user: u, action: 'activate' })}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Activate
                        </button>
                      )}
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        )}
        {!isLoading && users.length === 0 && (
          <p className="text-center py-12 text-slate-400 text-sm">No users found.</p>
        )}
      </div>

      <Pagination page={page} totalPages={Math.ceil(total / 20)} onPageChange={setPage} />

      <ConfirmDialog
        open={!!actionTarget}
        onClose={() => setActionTarget(null)}
        onConfirm={() => actionTarget && toggleMutation.mutate(actionTarget)}
        loading={toggleMutation.isPending}
        variant={actionTarget?.action === 'deactivate' ? 'danger' : 'info'}
        title={
          actionTarget?.action === 'deactivate'
            ? `Deactivate ${actionTarget.user.full_name}?`
            : `Activate ${actionTarget?.user.full_name}?`
        }
        message={
          actionTarget?.action === 'deactivate'
            ? 'This user will no longer be able to log in. You can re-activate them at any time.'
            : 'This user will regain access to their account.'
        }
        confirmLabel={actionTarget?.action === 'deactivate' ? 'Deactivate' : 'Activate'}
      />

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => { setShowAddModal(false); resetAdd() }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Accent bar */}
              <div className="h-1 w-full bg-gradient-to-r from-brand-500 via-brand-400 to-cyan-400" />

              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                    <UserPlus className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 leading-tight">Add User</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Create a staff account for your team</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); resetAdd() }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleAdd(onAddSubmit)} className="overflow-y-auto px-6 pb-6 space-y-5">

                {/* Name row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">First Name</label>
                    <input {...regAdd('first_name', { required: 'Required' })}
                      placeholder="John" autoComplete="given-name"
                      className={cn('input text-sm', addErrors.first_name && 'border-red-300 focus:ring-red-400 focus:border-red-400')} />
                    {addErrors.first_name && <p className="mt-1 text-xs text-red-500">{addErrors.first_name.message}</p>}
                  </div>
                  <div>
                    <label className="label">Last Name</label>
                    <input {...regAdd('last_name', { required: 'Required' })}
                      placeholder="Doe" autoComplete="family-name"
                      className={cn('input text-sm', addErrors.last_name && 'border-red-300 focus:ring-red-400 focus:border-red-400')} />
                    {addErrors.last_name && <p className="mt-1 text-xs text-red-500">{addErrors.last_name.message}</p>}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="label">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input {...regAdd('email', { required: 'Required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } })}
                      type="email" placeholder="staff@airline.com" autoComplete="email"
                      className={cn('input text-sm pl-10', addErrors.email && 'border-red-300 focus:ring-red-400 focus:border-red-400')} />
                  </div>
                  {addErrors.email && <p className="mt-1 text-xs text-red-500">{addErrors.email.message}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="label">Phone <span className="text-slate-400 font-normal">(optional)</span></label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input {...regAdd('phone')} type="tel" placeholder="+254 700 000 000"
                      className="input text-sm pl-10" />
                  </div>
                </div>

                {/* Role picker */}
                <div>
                  <label className="label">Role</label>
                  <input type="hidden" {...regAdd('role', { required: true })} />
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { value: 'admin',   label: 'Admin',   desc: 'Full system access', icon: Shield,    color: 'text-red-600 bg-red-50 border-red-200',     active: 'border-red-500 bg-red-50 ring-2 ring-red-200'   },
                      { value: 'manager', label: 'Manager', desc: 'Flights & ops',       icon: Briefcase, color: 'text-blue-600 bg-blue-50 border-blue-200',   active: 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' },
                      { value: 'crew',    label: 'Crew',    desc: 'Flight operations',   icon: Users,     color: 'text-amber-600 bg-amber-50 border-amber-200', active: 'border-amber-500 bg-amber-50 ring-2 ring-amber-200' },
                    ] as const).map(r => {
                      const Icon = r.icon
                      const isSelected = watchAdd('role') === r.value
                      return (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => { setAddValue('role', r.value); setAddValue('crew_role', undefined); setAddValue('employee_id', '') }}
                          className={cn(
                            'flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 transition-all duration-150 text-center',
                            isSelected ? r.active : 'border-slate-200 hover:border-slate-300 bg-white'
                          )}
                        >
                          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center border', r.color)}>
                            <Icon className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <p className={cn('text-sm font-bold leading-tight', isSelected ? 'text-slate-900' : 'text-slate-600')}>{r.label}</p>
                            <p className="text-xs text-slate-400 mt-0.5 leading-tight">{r.desc}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Crew-specific fields */}
                {watchAdd('role') === 'crew' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-3">
                      <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Crew Details</p>
                      <div>
                        <label className="label">Position</label>
                        <input type="hidden" {...regAdd('crew_role', { required: watchAdd('role') === 'crew' ? 'Required' : false })} />
                        <div className="grid grid-cols-2 gap-2">
                          {([
                            { value: 'pilot',            label: 'Pilot',            desc: 'Captain / PIC' },
                            { value: 'co_pilot',         label: 'Co-Pilot',         desc: 'First Officer' },
                            { value: 'flight_attendant', label: 'Flight Attendant', desc: 'Cabin crew / Hostess' },
                            { value: 'purser',           label: 'Purser',           desc: 'Lead cabin crew' },
                          ] as const).map(p => {
                            const isSelected = watchAdd('crew_role') === p.value
                            return (
                              <button
                                key={p.value}
                                type="button"
                                onClick={() => setAddValue('crew_role', p.value)}
                                className={cn(
                                  'flex items-center gap-2.5 px-3 py-2.5 rounded-lg border-2 text-left transition-all',
                                  isSelected
                                    ? 'border-amber-500 bg-amber-100 text-amber-900'
                                    : 'border-amber-200 bg-white hover:border-amber-300 text-slate-700'
                                )}
                              >
                                <div className={cn('w-2 h-2 rounded-full shrink-0', isSelected ? 'bg-amber-500' : 'bg-slate-300')} />
                                <div>
                                  <p className="text-xs font-bold leading-tight">{p.label}</p>
                                  <p className="text-[10px] text-slate-400 leading-tight">{p.desc}</p>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                        {addErrors.crew_role && <p className="mt-1 text-xs text-red-500">{addErrors.crew_role.message}</p>}
                      </div>
                      <div>
                        <label className="label">Employee ID</label>
                        <input {...regAdd('employee_id', { required: watchAdd('role') === 'crew' ? 'Required' : false })}
                          placeholder="e.g. EMP-001" className={cn('input text-sm font-mono', addErrors.employee_id && 'border-red-300')} />
                        {addErrors.employee_id && <p className="mt-1 text-xs text-red-500">{addErrors.employee_id.message}</p>}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Password */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input {...regAdd('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 chars' } })}
                        type={showPassword ? 'text' : 'password'} placeholder="Min. 8 chars"
                        className={cn('input text-sm pl-10 pr-10', addErrors.password && 'border-red-300 focus:ring-red-400 focus:border-red-400')} />
                      <button type="button" onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {addErrors.password && <p className="mt-1 text-xs text-red-500">{addErrors.password.message}</p>}
                  </div>
                  <div>
                    <label className="label">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input {...regAdd('confirm_password', { required: 'Required', validate: v => v === addPassword || 'Does not match' })}
                        type="password" placeholder="Repeat password"
                        className={cn('input text-sm pl-10', addErrors.confirm_password && 'border-red-300 focus:ring-red-400 focus:border-red-400')} />
                    </div>
                    {addErrors.confirm_password && <p className="mt-1 text-xs text-red-500">{addErrors.confirm_password.message}</p>}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 pt-1">
                  <button type="button" onClick={() => { setShowAddModal(false); resetAdd() }}
                    className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={addSubmitting || createMutation.isPending}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
                    {(addSubmitting || createMutation.isPending)
                      ? <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      : <UserPlus className="w-4 h-4" />}
                    Create User
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
