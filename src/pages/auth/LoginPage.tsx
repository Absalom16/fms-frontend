import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Plane } from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'
import Button from '@/components/ui/Button'

interface LoginForm { email: string; password: string }

const roleRedirects: Record<string, string> = {
  admin: '/admin/dashboard',
  manager: '/admin/dashboard',
  passenger: '/passenger/dashboard',
  crew: '/crew/schedule',
}

export default function LoginPage() {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  const { state } = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    try {
      const result = await authService.login(data)
      setAuth(result.user, result.access_token, result.refresh_token)
      toast.success(`Welcome back, ${result.user.first_name}!`)
      const redirect = (state as any)?.from ?? roleRedirects[result.user.role] ?? '/'
      navigate(redirect, { replace: true })
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Invalid email or password')
    }
  }

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-56 h-56 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center shadow-lg">
              <Plane className="w-6 h-6 text-white fill-white" />
            </div>
            <span className="text-white font-bold text-2xl">SkyWay</span>
          </Link>
        </div>

        {/* Card */}
        <div className="glass rounded-3xl p-8 shadow-glass">
          <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-white/60 text-sm mb-7">Sign in to your SkyWay account</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                <input
                  {...register('email', { required: 'Email is required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } })}
                  type="email" placeholder="you@example.com" autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-red-300">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-white/80">Password</label>
                <Link to="/forgot-password" className="text-xs text-white/60 hover:text-white transition-colors">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                <input
                  {...register('password', { required: 'Password is required' })}
                  type={showPassword ? 'text' : 'password'} placeholder="••••••••" autoComplete="current-password"
                  className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-300">{errors.password.message}</p>}
            </div>

            <Button
              type="submit" fullWidth loading={isSubmitting}
              className="py-3.5 rounded-xl bg-white text-brand-700 hover:bg-brand-50 font-bold text-base mt-2"
            >
              Sign In
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-white/50">
            Don't have an account?{' '}
            <Link to="/register" className="text-white font-semibold hover:underline">Sign up free</Link>
          </p>
        </div>

        {/* Demo credentials hint */}
        <div className="mt-4 glass rounded-2xl px-5 py-4 text-center">
          <p className="text-white/50 text-xs font-medium">Demo admin: <span className="text-white/80">admin@airline.com</span> / <span className="text-white/80">Admin@1234</span></p>
        </div>
      </motion.div>
    </div>
  )
}
