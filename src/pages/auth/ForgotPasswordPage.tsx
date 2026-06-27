import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Mail, Plane, ArrowLeft, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '@/services/authService'
import Button from '@/components/ui/Button'

interface Form { email: string }

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>()

  const onSubmit = async ({ email }: Form) => {
    try {
      await authService.forgotPassword(email)
      setSentEmail(email)
      setSent(true)
    } catch {
      toast.error('Something went wrong. Please try again.')
    }
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
          {!sent ? (
            <>
              <h1 className="text-2xl font-bold text-white mb-1">Forgot your password?</h1>
              <p className="text-white/60 text-sm mb-7">
                Enter your email and we'll send you a link to reset it.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-white/80 mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                    <input
                      {...register('email', {
                        required: 'Email is required',
                        pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email address' },
                      })}
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      autoFocus
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
                    />
                  </div>
                  {errors.email && <p className="mt-1.5 text-xs text-red-300">{errors.email.message}</p>}
                </div>

                <Button type="submit" fullWidth loading={isSubmitting} className="py-3.5 rounded-xl bg-white text-brand-700 hover:bg-brand-50 font-bold text-base mt-2">
                  Send Reset Link
                </Button>
              </form>
            </>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Check your inbox</h2>
              <p className="text-white/60 text-sm leading-relaxed">
                We sent a password reset link to<br />
                <span className="text-white font-semibold">{sentEmail}</span>
              </p>
              <p className="text-white/40 text-xs mt-4">
                Didn't receive it? Check your spam folder or{' '}
                <button onClick={() => setSent(false)} className="text-white/60 hover:text-white underline transition-colors">
                  try again
                </button>.
              </p>
              <p className="text-white/30 text-xs mt-2">Link expires in 1 hour.</p>
            </motion.div>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
