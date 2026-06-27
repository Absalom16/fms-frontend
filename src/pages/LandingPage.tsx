import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Shield, Zap, Headphones, Star, ArrowRight, ChevronRight, Plane, Globe, Users, Clock } from 'lucide-react'
import FlightSearchForm from '@/components/flight/FlightSearchForm'
import type { FlightSearchParams } from '@/types'

const stats = [
  { value: '500+', label: 'Destinations', icon: <Globe className="w-6 h-6" /> },
  { value: '12M+', label: 'Passengers', icon: <Users className="w-6 h-6" /> },
  { value: '98%', label: 'On-time Rate', icon: <Clock className="w-6 h-6" /> },
  { value: '4.9★', label: 'App Rating', icon: <Star className="w-6 h-6" /> },
]

const routes = [
  { from: 'NBO', to: 'DAR', fromCity: 'Nairobi', toCity: 'Dar es Salaam', price: '$89', duration: '1h 30m', img: '🌍' },
  { from: 'NBO', to: 'ADD', fromCity: 'Nairobi', toCity: 'Addis Ababa', price: '$120', duration: '2h 10m', img: '🌄' },
  { from: 'NBO', to: 'JNB', fromCity: 'Nairobi', toCity: 'Johannesburg', price: '$195', duration: '3h 40m', img: '🏙️' },
  { from: 'NBO', to: 'LOS', fromCity: 'Nairobi', toCity: 'Lagos', price: '$280', duration: '5h 20m', img: '🌊' },
  { from: 'NBO', to: 'DXB', fromCity: 'Nairobi', toCity: 'Dubai', price: '$380', duration: '6h 00m', img: '🌃' },
  { from: 'NBO', to: 'LHR', fromCity: 'Nairobi', toCity: 'London', price: '$520', duration: '9h 05m', img: '🎡' },
]

const features = [
  { icon: <Zap className="w-6 h-6" />, title: 'Instant Booking', desc: 'Book your flight in under 2 minutes. Real-time seat availability and instant confirmation.' },
  { icon: <Shield className="w-6 h-6" />, title: 'Safe & Secure', desc: 'Bank-grade encryption and secure mobile money payments — MTN, Airtel, and major cards.' },
  { icon: <Headphones className="w-6 h-6" />, title: '24/7 Support', desc: 'Round-the-clock customer support via phone, email, and live chat wherever you are.' },
  { icon: <Star className="w-6 h-6" />, title: 'Loyalty Rewards', desc: 'Earn SkyWay Miles on every booking and redeem them for free flights and upgrades.' },
]

const testimonials = [
  { name: 'Amina Hassan', role: 'Business Traveller', quote: 'SkyWay has completely transformed my business travel. The app is intuitive, check-in is seamless, and flights are always on time.' },
  { name: 'David Omondi', role: 'Frequent Flyer', quote: 'I\'ve flown over 50 times with SkyWay. The loyalty program is generous and the crew is always professional and friendly.' },
  { name: 'Nadia Kamau', role: 'Family Traveller', quote: 'Booking for my whole family was so easy. Great prices, excellent service, and the kids loved the entertainment on the flight!' },
]

// Animated counter hook
function useCounter(target: number, duration = 2000) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return count
}

export default function LandingPage() {
  const navigate = useNavigate()

  const handleSearch = (params: FlightSearchParams) => {
    const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]))).toString()
    navigate(`/passenger/flights?${qs}`)
  }

  return (
    <div className="overflow-x-hidden">
      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-hero-gradient">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl animate-pulse-slow" />
          <div className="absolute top-1/2 -right-32 w-80 h-80 rounded-full bg-cyan-400/15 blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }} />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        {/* Floating plane */}
        <motion.div
          className="absolute top-20 right-8 md:right-24 text-8xl md:text-9xl opacity-20 pointer-events-none select-none animate-float"
          initial={{ opacity: 0, x: 40 }} animate={{ opacity: 0.2, x: 0 }}
          transition={{ duration: 1.5 }}
        >
          ✈️
        </motion.div>
        <motion.div
          className="absolute bottom-32 left-8 md:left-24 text-6xl opacity-10 pointer-events-none select-none animate-float-slow"
          initial={{ opacity: 0 }} animate={{ opacity: 0.1 }}
          transition={{ duration: 2, delay: 0.5 }}
        >
          🌍
        </motion.div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              98% on-time performance this month
            </span>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white leading-tight tracking-tight text-balance">
              Fly Smarter,
              <br />
              <span className="gradient-text">Travel Further</span>
            </h1>

            <p className="mt-6 text-lg md:text-xl text-white/70 max-w-2xl mx-auto font-medium leading-relaxed">
              Africa's most trusted airline — connecting 500+ destinations with unmatched comfort,
              reliability, and award-winning service.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="#search" className="btn-primary px-8 py-3.5 text-base rounded-2xl bg-white text-brand-700 hover:bg-brand-50 shadow-xl">
                <Plane className="w-5 h-5" />
                Book Now
              </a>
              <button className="px-8 py-3.5 rounded-2xl text-white/90 hover:text-white font-semibold text-base flex items-center gap-2 hover:bg-white/10 transition-colors">
                View Deals <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          {/* Search form */}
          <motion.div
            id="search"
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-12 max-w-4xl mx-auto"
          >
            <FlightSearchForm onSearch={handleSearch} variant="hero" />
          </motion.div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" className="w-full">
            <path d="M0 80L1440 80L1440 40C1200 80 960 0 720 20C480 40 240 80 0 40L0 80Z" fill="#f8faff" />
          </svg>
        </div>
      </section>

      {/* ─── STATS ──────────────────────────────────────────────── */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 text-center border border-slate-100 shadow-card hover:shadow-card-hover transition-shadow"
              >
                <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
                  {stat.icon}
                </div>
                <p className="text-3xl font-black text-slate-900 tabular-nums">{stat.value}</p>
                <p className="mt-1 text-sm text-slate-500 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── POPULAR ROUTES ─────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.h2 className="section-heading" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              Popular Routes
            </motion.h2>
            <motion.p className="section-subheading mx-auto" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              Explore our most-booked routes with unbeatable prices and schedules
            </motion.p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {routes.map((r, i) => (
              <motion.div
                key={r.from + r.to}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="group relative bg-gradient-to-br from-slate-900 to-brand-900 rounded-2xl p-6 text-white overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform duration-300"
              >
                <div className="absolute top-3 right-4 text-4xl opacity-30 group-hover:opacity-50 transition-opacity">{r.img}</div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-white/70 mb-1">
                      <span className="font-bold text-white text-lg">{r.from}</span>
                      <ArrowRight className="w-4 h-4" />
                      <span className="font-bold text-white text-lg">{r.to}</span>
                    </div>
                    <p className="text-white/70 text-xs">{r.fromCity} → {r.toCity}</p>
                    <p className="mt-2 text-xs text-white/50"><Clock className="inline w-3 h-3 mr-1" />{r.duration}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/60">from</p>
                    <p className="text-2xl font-black text-white">{r.price}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-white/50">Multiple daily flights</span>
                  <button className="text-xs text-white/80 hover:text-white font-semibold flex items-center gap-1 transition-colors">
                    Book <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ───────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.h2 className="section-heading" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              Why Fly With Us
            </motion.h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-card hover:shadow-card-hover transition-all hover:-translate-y-1 duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ───────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.h2 className="section-heading" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              Loved By Travellers
            </motion.h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-slate-50 rounded-2xl p-6 border border-slate-100"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-5">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ────────────────────────────────────────────────── */}
      <section className="py-24 bg-cta-gradient">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Ready to Take Flight?</h2>
            <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
              Join 12 million travellers who trust SkyWay for every journey. Create your account in under a minute.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/register" className="px-8 py-4 rounded-2xl bg-white text-brand-700 font-bold text-base hover:bg-brand-50 transition-colors shadow-xl">
                Create Free Account
              </a>
              <a href="/login" className="px-8 py-4 rounded-2xl border-2 border-white/40 text-white font-semibold text-base hover:bg-white/10 transition-colors">
                Sign In
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
