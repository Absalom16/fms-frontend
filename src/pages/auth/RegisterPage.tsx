import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Phone, Eye, EyeOff, Plane, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'
import Button from '@/components/ui/Button'

interface RegisterForm {
  first_name: string; last_name: string; email: string
  phone?: string; password: string; confirm_password: string
}

const roleRedirects: Record<string, string> = {
  admin: '/admin/dashboard',
  manager: '/admin/dashboard',
  passenger: '/passenger/dashboard',
  crew: '/crew/schedule',
}

const perks = ['Free loyalty miles on first booking', 'Real-time flight tracking', 'Mobile boarding pass', 'Priority check-in']

export default function RegisterPage() {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegisterForm>()
  const password = watch('password')

  const onSubmit = async (data: RegisterForm) => {
    const { confirm_password, ...rest } = data
    const payload = { ...rest, role: 'passenger' }
    try {
      const result = await authService.register(payload)
      setAuth(result.user, result.access_token, result.refresh_token)
      toast.success('Account created! Welcome aboard.')
      navigate(roleRedirects[result.user.role] ?? '/', { replace: true })
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen bg-hero-gradient flex">
      {/* Left panel – perks */}
      <div className="hidden lg:flex w-80 xl:w-96 flex-col justify-center px-12 text-white shrink-0">
        <div className="mb-10">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-12">
            <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center"><Plane className="w-5 h-5 text-white fill-white" /></div>
            <span className="font-bold text-xl">SkyWay</span>
          </Link>
          <h2 className="text-3xl font-black mb-3 leading-tight">Join 12M+ Travellers</h2>
          <p className="text-white/60 leading-relaxed">Create your free account and unlock the world's best flight experience.</p>
        </div>
        <div className="space-y-4">
          {perks.map((p, i) => (
            <motion.div key={p} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
              className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-green-400/20 border border-green-400/30 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-green-400" />
              </div>
              <span className="text-sm text-white/80">{p}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          className="w-full max-w-lg"
        >
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center"><Plane className="w-5 h-5 text-white fill-white" /></div>
              <span className="text-white font-bold text-xl">SkyWay</span>
            </Link>
          </div>

          <div className="glass rounded-3xl p-8 shadow-glass">
            <h1 className="text-2xl font-bold text-white mb-1">Create account</h1>
            <p className="text-white/60 text-sm mb-7">Start your journey with SkyWay today</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <GlassInput label="First Name" icon={<User className="w-4 h-4" />}
                  error={errors.first_name?.message} inputProps={{ ...register('first_name', { required: 'Required' }), placeholder: 'John' }} />
                <GlassInput label="Last Name" icon={<User className="w-4 h-4" />}
                  error={errors.last_name?.message} inputProps={{ ...register('last_name', { required: 'Required' }), placeholder: 'Doe' }} />
              </div>
              <GlassInput label="Email" icon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                inputProps={{ ...register('email', { required: 'Required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } }), type: 'email', placeholder: 'you@example.com' }} />
              <GlassInput label="Phone (optional)" icon={<Phone className="w-4 h-4" />}
                inputProps={{ ...register('phone'), type: 'tel', placeholder: '+254 700 000 000' }} />

              <div className="relative">
                <label className="block text-sm font-semibold text-white/80 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                  <input {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })}
                    type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/30 transition-all" />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1.5 text-xs text-red-300">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/80 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                  <input {...register('confirm_password', { required: 'Required', validate: v => v === password || 'Passwords do not match' })}
                    type="password" placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/30 transition-all" />
                </div>
                {errors.confirm_password && <p className="mt-1.5 text-xs text-red-300">{errors.confirm_password.message}</p>}
              </div>

              <Button type="submit" fullWidth loading={isSubmitting}
                className="py-3.5 rounded-xl bg-white text-brand-700 hover:bg-brand-50 font-bold text-base mt-2">
                Create Account
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-white/50">
              Already have an account?{' '}
              <Link to="/login" className="text-white font-semibold hover:underline">Sign in</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function GlassInput({ label, icon, error, inputProps }: { label: string; icon: React.ReactNode; error?: string; inputProps: React.InputHTMLAttributes<HTMLInputElement> }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-white/80 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">{icon}</span>
        <input {...inputProps} className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/30 transition-all" />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-300">{error}</p>}
    </div>
  )
}
