import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, CreditCard, Smartphone, Check, ArrowLeft,
  Plane, Lock, ChevronRight, BadgeCheck,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { bookingService } from '@/services/bookingService'
import { paymentService } from '@/services/paymentService'
import Button from '@/components/ui/Button'
import { formatCurrency } from '@/utils/helpers'
import type { Flight, Seat } from '@/types'
import { format, parseISO } from 'date-fns'

type PaymentMethod = 'mpesa' | 'airtel_money' | 'credit_card'

interface PaymentForm {
  phone?: string
  card_number?: string
  card_expiry?: string
  card_cvv?: string
  card_name?: string
}

const METHODS = [
  {
    id: 'mpesa' as PaymentMethod,
    label: 'M-Pesa',
    sub: 'Safaricom · Kenya',
    phoneLabel: 'M-Pesa Phone Number',
    phonePlaceholder: '+254 700 000 000',
    promptNote: "You'll receive an M-Pesa STK push prompt on your phone to confirm payment.",
    iconBg: 'bg-green-600',
    activeBorder: 'border-green-500',
    activeBg: 'bg-green-50/60',
    activeText: 'text-green-700',
    checkBg: 'bg-green-600',
    ring: 'ring-green-200',
    // SVG "M" logo
    Logo: () => (
      <svg viewBox="0 0 40 40" className="w-9 h-9">
        <rect width="40" height="40" rx="10" fill="#00A651"/>
        <text x="50%" y="56%" dominantBaseline="middle" textAnchor="middle"
          fill="white" fontSize="18" fontWeight="900" fontFamily="Arial">M</text>
      </svg>
    ),
  },
  {
    id: 'airtel_money' as PaymentMethod,
    label: 'Airtel Money',
    sub: 'Airtel Africa',
    phoneLabel: 'Airtel Phone Number',
    phonePlaceholder: '+254 733 000 000',
    promptNote: "You'll receive an Airtel Money payment prompt on your phone to complete the transaction.",
    iconBg: 'bg-red-600',
    activeBorder: 'border-red-500',
    activeBg: 'bg-red-50/60',
    activeText: 'text-red-700',
    checkBg: 'bg-red-600',
    ring: 'ring-red-200',
    Logo: () => (
      <svg viewBox="0 0 40 40" className="w-9 h-9">
        <rect width="40" height="40" rx="10" fill="#EE1C25"/>
        <text x="50%" y="56%" dominantBaseline="middle" textAnchor="middle"
          fill="white" fontSize="18" fontWeight="900" fontFamily="Arial">A</text>
      </svg>
    ),
  },
  {
    id: 'credit_card' as PaymentMethod,
    label: 'Card',
    sub: 'Visa · Mastercard · Amex',
    iconBg: 'bg-slate-800',
    activeBorder: 'border-slate-700',
    activeBg: 'bg-slate-50/80',
    activeText: 'text-slate-800',
    checkBg: 'bg-slate-800',
    ring: 'ring-slate-200',
    Logo: () => (
      <svg viewBox="0 0 40 40" className="w-9 h-9">
        <rect width="40" height="40" rx="10" fill="#1e293b"/>
        <CreditCard className="w-5 h-5 text-white" style={{ position: 'absolute', top: 10, left: 10 }} />
        <text x="50%" y="56%" dominantBaseline="middle" textAnchor="middle"
          fill="white" fontSize="11" fontWeight="700" fontFamily="Arial">CARD</text>
      </svg>
    ),
  },
] as const

export default function PaymentPage() {
  const { state } = useLocation() as {
    state: { flight: Flight; seat: Seat; cabin_class: string; passengers: number }
  }
  const navigate = useNavigate()
  const [method, setMethod]   = useState<PaymentMethod>('mpesa')
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<PaymentForm>()

  if (!state?.flight)
    return <div className="p-8 text-center text-slate-500">No booking data found.</div>

  const { flight, seat, cabin_class, passengers } = state
  const basePrice  = Number(flight.price_for_class?.[cabin_class] ?? flight.base_price)
  const taxes      = basePrice * 0.16
  const total      = (basePrice + taxes) * passengers
  const origin     = flight.route?.origin_airport
  const dest       = flight.route?.destination_airport
  const depTime    = flight.departure_datetime ? parseISO(flight.departure_datetime) : null

  const selected   = METHODS.find(m => m.id === method)!
  const isMobile   = method !== 'credit_card'

  const onSubmit = async (formData: PaymentForm) => {
    setLoading(true)
    try {
      const booking = await bookingService.create({
        flight_id: flight.id, seat_id: seat.id, cabin_class, passengers,
      })
      await paymentService.create({
        booking_id:     booking.id,
        payment_method: method,
        amount:         total,
        phone_number:   formData.phone,
      })
      await bookingService.confirm(booking.id)
      toast.success('Booking confirmed! Check your email for your e-ticket.')
      navigate(`/passenger/bookings/${booking.id}`, { replace: true })
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Dark top banner ───────────────────────────────── */}
      <div className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0c1220 0%, #0f2a5c 65%, #0d1a3a 100%)' }}>
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="relative max-w-5xl mx-auto px-6 py-5 flex items-center justify-between flex-wrap gap-4">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="text-center flex-1">
            <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase">Complete Payment</p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-white font-black text-lg">{origin?.iata_code}</span>
              <ChevronRight className="w-4 h-4 text-white/30" />
              <span className="text-white font-black text-lg">{dest?.iata_code}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/30 text-[10px] font-bold tracking-widest uppercase">Total</p>
            <p className="text-white font-black text-xl">{formatCurrency(total)}</p>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── Left: payment form ────────────────────────── */}
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3 space-y-5">

            {/* Method tabs */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-4">Payment Method</p>

              <div className="grid grid-cols-3 gap-2 mb-5">
                {METHODS.map(m => {
                  const active = m.id === method
                  return (
                    <button key={m.id} type="button" onClick={() => setMethod(m.id)}
                      className={`relative flex flex-col items-center gap-2 py-4 px-2 rounded-2xl border-2 transition-all duration-200 ${
                        active
                          ? `${m.activeBorder} ${m.activeBg} shadow-sm ring-4 ${m.ring}`
                          : 'border-slate-100 hover:border-slate-200 bg-white'
                      }`}>
                      <m.Logo />
                      <div className="text-center">
                        <p className={`text-xs font-bold leading-tight ${active ? m.activeText : 'text-slate-700'}`}>
                          {m.label}
                        </p>
                        <p className="text-[9px] text-slate-400 mt-0.5 leading-tight hidden sm:block">{m.sub}</p>
                      </div>
                      {active && (
                        <div className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full ${m.checkBg} flex items-center justify-center shadow-sm`}>
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100 mb-5" />

              {/* Fields */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <AnimatePresence mode="wait">
                  {isMobile ? (
                    <motion.div key="mobile"
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      className="space-y-4">
                      {/* Phone input */}
                      <div>
                        <label className="label">{(selected as any).phoneLabel}</label>
                        <div className="relative">
                          <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          <input
                            {...register('phone', { required: 'Phone number is required' })}
                            type="tel"
                            placeholder={(selected as any).phonePlaceholder}
                            className="input pl-10 font-mono tracking-wider"
                          />
                        </div>
                        {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
                      </div>

                      {/* Prompt note */}
                      <div className={`rounded-xl p-3 flex items-start gap-2.5 ${selected.activeBg} border ${selected.activeBorder} border-opacity-30`}>
                        <Smartphone className={`w-4 h-4 mt-0.5 shrink-0 ${selected.activeText}`} />
                        <p className={`text-xs leading-relaxed ${selected.activeText}`}>
                          {(selected as any).promptNote}
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="card"
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      className="space-y-4">
                      {/* Cardholder */}
                      <div>
                        <label className="label">Cardholder Name</label>
                        <input {...register('card_name', { required: 'Required' })}
                          placeholder="JOHN DOE"
                          className="input font-mono tracking-wider uppercase" />
                        {errors.card_name && <p className="mt-1 text-xs text-red-500">{errors.card_name.message}</p>}
                      </div>

                      {/* Card number */}
                      <div>
                        <label className="label">Card Number</label>
                        <div className="relative">
                          <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          <input
                            {...register('card_number', { required: 'Required', pattern: { value: /^\d{16}$/, message: '16 digits required' } })}
                            placeholder="0000 0000 0000 0000"
                            maxLength={16}
                            className="input pl-10 font-mono tracking-widest" />
                        </div>
                        {errors.card_number && <p className="mt-1 text-xs text-red-500">{errors.card_number.message}</p>}
                      </div>

                      {/* Expiry + CVV */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="label">Expiry Date</label>
                          <input {...register('card_expiry', { required: 'Required' })}
                            placeholder="MM / YY" maxLength={5} className="input font-mono tracking-widest" />
                          {errors.card_expiry && <p className="mt-1 text-xs text-red-500">{errors.card_expiry.message}</p>}
                        </div>
                        <div>
                          <label className="label">CVV</label>
                          <div className="relative">
                            <input {...register('card_cvv', { required: 'Required', pattern: { value: /^\d{3,4}$/, message: '3–4 digits' } })}
                              placeholder="•••" maxLength={4} type="password" className="input font-mono tracking-widest pr-10" />
                            <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 pointer-events-none" />
                          </div>
                          {errors.card_cvv && <p className="mt-1 text-xs text-red-500">{errors.card_cvv.message}</p>}
                        </div>
                      </div>

                      {/* Card logos */}
                      <div className="flex items-center gap-2">
                        {['VISA', 'MC', 'AMEX'].map(c => (
                          <div key={c} className="px-2 py-1 rounded-md bg-slate-50 border border-slate-200">
                            <span className="text-[10px] font-black text-slate-500 tracking-widest">{c}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Security note */}
                <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                  <Shield className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  256-bit SSL encryption · Your payment is fully secured
                </div>

                {/* Pay button */}
                <Button type="submit" fullWidth loading={loading}
                  className="py-4 text-base font-bold shadow-lg shadow-brand-200/50">
                  <Lock className="w-4 h-4" />
                  Pay {formatCurrency(total)}
                </Button>
              </form>
            </div>
          </motion.div>

          {/* ── Right: booking summary ────────────────────── */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="lg:col-span-2">
            <div className="sticky top-6 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">

              {/* Summary header */}
              <div className="relative overflow-hidden px-5 py-5"
                style={{ background: 'linear-gradient(135deg, #0c1220 0%, #0f2a5c 65%, #0d1a3a 100%)' }}>
                <div className="absolute inset-0 opacity-[0.04]"
                  style={{ backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '16px 16px' }} />
                <div className="relative">
                  <p className="text-white/30 text-[9px] font-black tracking-widest uppercase mb-3">Booking Summary</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                      <Plane className="w-4 h-4 text-white/70 fill-white/70" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-white font-black text-base">{origin?.iata_code}</span>
                        <span className="text-white/30 text-sm">→</span>
                        <span className="text-white font-black text-base">{dest?.iata_code}</span>
                      </div>
                      <p className="text-white/40 text-xs mt-0.5">
                        {depTime ? format(depTime, 'EEE, MMM d · HH:mm') : '—'}
                      </p>
                      <p className="text-white/40 text-xs">
                        {flight.flight_number} · <span className="capitalize">{cabin_class} class</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line items */}
              <div className="bg-white px-5 py-5">
                <div className="space-y-3">
                  <LineItem label={`Base fare × ${passengers}`} value={formatCurrency(basePrice * passengers)} />
                  <LineItem label="Taxes & Fees (16%)" value={formatCurrency(taxes * passengers)} />
                  {seat && <LineItem label={`Seat ${seat.seat_number}`} value="Included" valueClass="text-emerald-600 font-semibold" />}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-black text-slate-900 text-sm">Total</span>
                  <span className="font-black text-brand-600 text-xl">{formatCurrency(total)}</span>
                </div>

                {/* Perks */}
                <div className="mt-5 space-y-2.5">
                  {[
                    'Free cancellation within 24h',
                    'Instant e-ticket via email',
                    'Mobile boarding pass',
                  ].map(perk => (
                    <div key={perk} className="flex items-center gap-2">
                      <BadgeCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-xs text-slate-500">{perk}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  )
}

function LineItem({ label, value, valueClass = 'text-slate-700 font-medium' }: {
  label: string; value: string; valueClass?: string
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  )
}
