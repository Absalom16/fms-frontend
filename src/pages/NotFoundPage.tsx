import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Plane } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export default function NotFoundPage() {
  const { user } = useAuthStore()
  const homeLink = user?.role === 'passenger' ? '/passenger/dashboard' : user ? '/admin/dashboard' : '/'

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="text-8xl font-black text-white/20 leading-none mb-4">404</div>
        <div className="text-6xl mb-6 animate-float">✈️</div>
        <h1 className="text-3xl font-black text-white mb-2">Lost in the clouds</h1>
        <p className="text-white/60 text-lg mb-8 max-w-md mx-auto">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to={homeLink} className="inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-700 font-bold rounded-2xl hover:bg-brand-50 shadow-xl transition-colors">
            <Home className="w-5 h-5" /> Go Home
          </Link>
          <Link to="/passenger/flights" className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white/30 text-white font-semibold rounded-2xl hover:bg-white/10 transition-colors">
            <Plane className="w-5 h-5" /> Search Flights
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
