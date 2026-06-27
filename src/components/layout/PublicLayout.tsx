import { Outlet, Link, useLocation } from 'react-router-dom'
import { Plane, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/utils/cn'
import Footer from './Footer'

export default function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isHome
          ? 'bg-transparent'
          : 'bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-nav'
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-8">
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
                <Plane className="w-5 h-5 text-white fill-white" />
              </div>
              <span className={cn('font-bold text-xl', isHome ? 'text-white' : 'text-slate-900')}>SkyWay</span>
            </Link>

            <div className="hidden md:flex items-center gap-1 flex-1">
              {['Flights', 'Destinations', 'Deals', 'About'].map(item => (
                <a
                  key={item} href="#"
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                    isHome
                      ? 'text-white/80 hover:text-white hover:bg-white/10'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  )}
                >
                  {item}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3 ml-auto">
              <Link
                to="/login"
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-semibold transition-colors',
                  isHome
                    ? 'text-white/90 hover:text-white hover:bg-white/10'
                    : 'text-slate-700 hover:bg-slate-100'
                )}
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 transition-colors shadow-sm"
              >
                Get started
              </Link>
            </div>

            <button
              onClick={() => setMobileOpen(v => !v)}
              className={cn('md:hidden ml-auto p-2 rounded-xl transition-colors', isHome ? 'text-white hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100')}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-white border-b border-slate-100 px-4 py-4 space-y-2">
            {['Flights', 'Destinations', 'Deals', 'About'].map(item => (
              <a key={item} href="#" className="block px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100">{item}</a>
            ))}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <Link to="/login" className="block text-center px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100">Sign in</Link>
              <Link to="/register" className="block text-center px-4 py-2.5 rounded-xl text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700">Get started</Link>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}
