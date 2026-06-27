import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { motion } from 'framer-motion'
import {
  User, Mail, Phone, Globe, FileText, Save,
  Edit2, Award, Calendar, Shield, MapPin, X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { passengerService } from '@/services/passengerService'
import { useAuthStore } from '@/store/authStore'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import Select from '@/components/ui/Select'
import { getInitials } from '@/utils/helpers'

const TIER_STYLE: Record<string, string> = {
  bronze:   'bg-amber-500/20 text-amber-300 border-amber-400/30',
  silver:   'bg-slate-400/20 text-slate-200 border-slate-300/30',
  gold:     'bg-yellow-400/20 text-yellow-200 border-yellow-300/30',
  platinum: 'bg-cyan-400/20 text-cyan-200 border-cyan-300/30',
}

export default function ProfilePage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['passenger-profile'],
    queryFn:  () => passengerService.getMyProfile(),
  })

  const { register, handleSubmit, reset, control, formState: { isSubmitting } } = useForm({
    values: profile ? {
      date_of_birth:           profile.date_of_birth            ?? '',
      gender:                  profile.gender                   ?? '',
      nationality:             profile.nationality              ?? '',
      passport_number:         '',
      passport_expiry:         profile.passport_expiry          ?? '',
      address:                 profile.address                  ?? '',
      emergency_contact_name:  profile.emergency_contact_name   ?? '',
      emergency_contact_phone: profile.emergency_contact_phone  ?? '',
    } : undefined,
  })

  const updateMutation = useMutation({
    mutationFn: (data: object) => passengerService.updateMyProfile(data),
    onSuccess: () => {
      toast.success('Profile updated!')
      setEditing(false)
      qc.invalidateQueries({ queryKey: ['passenger-profile'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Update failed'),
  })

  const tier = (profile?.loyalty_tier ?? 'bronze').toLowerCase()

  if (isLoading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  return (
    <div className="p-5 lg:p-7">
      <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-6">

        {/* ── Left: identity panel ────────────────────── */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
          className="lg:w-72 shrink-0">
          <div className="rounded-3xl overflow-hidden sticky top-6"
            style={{ background: 'linear-gradient(160deg, #0c1220 0%, #0f2a5c 70%, #0d1a3a 100%)' }}>

            {/* Ambient glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />

            {/* Dot texture */}
            <div className="absolute inset-0 opacity-[0.025]"
              style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

            <div className="relative p-6 flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-700 flex items-center justify-center text-white font-black text-2xl shadow-lg mb-4">
                {getInitials(user?.first_name, user?.last_name)}
              </div>

              <h2 className="text-white font-bold text-lg leading-tight">
                {user?.first_name} {user?.last_name}
              </h2>
              <p className="text-white/40 text-xs mt-1 flex items-center gap-1.5">
                <Mail className="w-3 h-3" /> {user?.email}
              </p>
              {user?.phone && (
                <p className="text-white/40 text-xs mt-0.5 flex items-center gap-1.5">
                  <Phone className="w-3 h-3" /> {user.phone}
                </p>
              )}

              {/* Tier badge */}
              <span className={`mt-3 text-[10px] font-bold px-3 py-1 rounded-full border capitalize ${TIER_STYLE[tier] ?? TIER_STYLE.bronze}`}>
                {tier} member
              </span>

              {/* Divider */}
              <div className="w-full border-t border-white/10 my-5" />

              {/* Loyalty stats */}
              <div className="w-full space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-white/35 text-[10px] font-bold tracking-widest uppercase">Sky Miles</p>
                  <p className="text-white font-black text-lg leading-none">
                    {(profile?.loyalty_points ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-white/35 text-[10px] font-bold tracking-widest uppercase">FF Number</p>
                  <p className="text-white/80 font-mono text-xs tracking-widest">
                    {profile?.frequent_flyer_number ?? 'N/A'}
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="w-full border-t border-white/10 my-5" />

              {/* Edit toggle */}
              {!editing ? (
                <button onClick={() => setEditing(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all border border-white/10">
                  <Edit2 className="w-4 h-4" /> Edit Profile
                </button>
              ) : (
                <button onClick={() => { setEditing(false); reset() }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm font-semibold transition-all border border-red-400/20">
                  <X className="w-4 h-4" /> Discard Changes
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Right: form sections ─────────────────────── */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }}
          className="flex-1 min-w-0">
          <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="space-y-px">

            {/* PERSONAL DETAILS */}
            <Section title="Personal Details" icon={User}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Date of Birth" icon={Calendar} editing={editing}>
                  <input {...register('date_of_birth')} type="date" disabled={!editing}
                    className={fieldCls(editing)} />
                </Field>
                <Field label="Gender" icon={User} editing={editing}>
                  <Controller name="gender" control={control} render={({ field }) => (
                    <Select {...field} disabled={!editing} className={editing ? '' : 'opacity-60 pointer-events-none'}>
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </Select>
                  )} />
                </Field>
                <Field label="Nationality" icon={Globe} editing={editing}>
                  <input {...register('nationality')} placeholder="e.g. Kenyan" disabled={!editing}
                    className={fieldCls(editing)} />
                </Field>
                <Field label="Phone" icon={Phone} editing={false}>
                  <input value={user?.phone ?? ''} disabled
                    className={fieldCls(false)} />
                </Field>
              </div>
            </Section>

            {/* TRAVEL DOCUMENTS */}
            <Section title="Travel Documents" icon={FileText}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Passport Number" icon={Shield} editing={editing}>
                  <input {...register('passport_number')}
                    placeholder={editing ? 'Enter passport number' : '••••••••'} disabled={!editing}
                    className={fieldCls(editing)} />
                </Field>
                <Field label="Passport Expiry" icon={Calendar} editing={editing}>
                  <input {...register('passport_expiry')} type="date" disabled={!editing}
                    className={fieldCls(editing)} />
                </Field>
              </div>
            </Section>

            {/* ADDRESS */}
            <Section title="Address" icon={MapPin}>
              <Field label="Home Address" icon={MapPin} editing={editing}>
                <textarea {...register('address')} rows={2} disabled={!editing}
                  placeholder="Your home address"
                  className={`${fieldCls(editing)} resize-none`} />
              </Field>
            </Section>

            {/* EMERGENCY CONTACT */}
            <Section title="Emergency Contact" icon={Phone}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Contact Name" icon={User} editing={editing}>
                  <input {...register('emergency_contact_name')} disabled={!editing}
                    placeholder="Full name" className={fieldCls(editing)} />
                </Field>
                <Field label="Contact Phone" icon={Phone} editing={editing}>
                  <input {...register('emergency_contact_phone')} type="tel" disabled={!editing}
                    placeholder="+1 555 0000" className={fieldCls(editing)} />
                </Field>
              </div>
            </Section>

            {/* Save bar */}
            {editing && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center justify-between gap-3 mt-2">
                <p className="text-xs text-slate-400 font-medium">You have unsaved changes</p>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => { setEditing(false); reset() }}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" loading={isSubmitting}>
                    <Save className="w-4 h-4" /> Save Changes
                  </Button>
                </div>
              </motion.div>
            )}
          </form>
        </motion.div>

      </div>
    </div>
  )
}

function fieldCls(editing: boolean) {
  return `input transition-all ${editing ? '' : 'bg-slate-50 text-slate-500 border-slate-100 cursor-default'}`
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 text-brand-600" />
        </div>
        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{title}</p>
      </div>
      {children}
    </div>
  )
}

function Field({ label, icon: Icon, editing, children }: {
  label: string; icon: React.ElementType; editing: boolean; children: React.ReactNode
}) {
  return (
    <div>
      <label className={`flex items-center gap-1.5 text-xs font-semibold mb-1.5 ${editing ? 'text-slate-600' : 'text-slate-400'}`}>
        <Icon className="w-3 h-3" /> {label}
      </label>
      {children}
    </div>
  )
}
