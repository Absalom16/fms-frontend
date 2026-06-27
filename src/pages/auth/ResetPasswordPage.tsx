import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, Plane, CheckCircle2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '@/services/authService'
import Button from '@/components/ui/Button'

interface Form { password: string; confirm: string }

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [done, setDone] = useState(false)
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<Form>()

  const onSubmit = async ({ password }: Form) => {
    if (!token) return
    try {
      await authService.resetPassword(token, password)
      setDone(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Reset failed. The link may have expired.')
    }
  }

  const inputClass = 'w-full pl-10 pr-12 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all'

  if (!token) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
        <div className="glass rounded-3xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Invalid reset link</h1>
          <p className="text-white/60 text-sm mb-6">This link is missing a token. Please request a new password reset.</p>
          <Link to="/forgot-password" className="text-white font-semibold hover:underline text-sm">Request a new link →</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-56 h-56 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center shadow-lg">
              <Plane className="w-6 h-6 text-white fill-white" />
            </div>
            <span className="text-white font-bold text-2xl">SkyWay</span>
          </Link>
        </div>

        <div className="glass rounded-3xl p-8 shadow-glass">
          {!done ? (
            <>
              <h1 className="text-2xl font-bold text-white mb-1">Set new password</h1>
              <p className="text-white/60 text-sm mb-7">Choose a strong password for your account.</p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-white/80 mb-1.5">New password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                    <input
                      {...register('password', {
                        required: 'Password is required',
                        minLength: { value: 8, message: 'Must be at least 8 characters' },
                      })}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      autoComplete="new-password"
                      className={inputClass}
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1.5 text-xs text-red-300">{errors.password.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white/80 mb-1.5">Confirm new password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                    <input
                      {...register('confirm', {
                        required: 'Please confirm your password',
                        validate: v => v === watch('password') || 'Passwords do not match',
                      })}
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Repeat your password"
                      autoComplete="new-password"
                      className={inputClass}
                    />
                    <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirm && <p className="mt-1.5 text-xs text-red-300">{errors.confirm.message}</p>}
                </div>

                <Button type="submit" fullWidth loading={isSubmitting} className="py-3.5 rounded-xl bg-white text-brand-700 hover:bg-brand-50 font-bold text-base mt-2">
                  Update Password
                </Button>
              </form>
            </>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Password updated!</h2>
              <p className="text-white/60 text-sm">Your password has been changed. Redirecting you to sign in…</p>
              <Link to="/login" className="inline-block mt-5 text-sm text-white font-semibold hover:underline">
                Sign in now →
              </Link>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
