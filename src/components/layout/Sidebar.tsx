import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plane, LayoutDashboard, Search, BookOpen, User, Users, Settings,
  BarChart3, Briefcase, MapPin, X, ChevronRight,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuthStore } from '@/store/authStore'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

interface NavItem {
  label: string
  to: string
  icon: React.ReactNode
  roles?: string[]
}

const navItems: NavItem[] = [
  // Admin / Manager
  { label: 'Dashboard',   to: '/admin/dashboard',   icon: <LayoutDashboard className="w-5 h-5" />, roles: ['admin', 'manager'] },
  { label: 'Flights',     to: '/admin/flights',      icon: <Plane className="w-5 h-5" />,           roles: ['admin', 'manager'] },
  { label: 'Aircraft',    to: '/admin/aircraft',     icon: <Settings className="w-5 h-5" />,        roles: ['admin', 'manager'] },
  { label: 'Network',     to: '/admin/network',      icon: <MapPin className="w-5 h-5" />,          roles: ['admin', 'manager'] },
  { label: 'Crew',        to: '/admin/crew',         icon: <Briefcase className="w-5 h-5" />,       roles: ['admin', 'manager'] },
  { label: 'Passengers',  to: '/admin/passengers',   icon: <Users className="w-5 h-5" />,           roles: ['admin', 'manager'] },
  { label: 'Users',       to: '/admin/users',        icon: <User className="w-5 h-5" />,            roles: ['admin'] },
  { label: 'Reports',     to: '/admin/reports',      icon: <BarChart3 className="w-5 h-5" />,       roles: ['admin', 'manager'] },
  // Passenger
  { label: 'Dashboard',   to: '/passenger/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['passenger'] },
  { label: 'Find Flights', to: '/passenger/flights',  icon: <Search className="w-5 h-5" />,           roles: ['passenger'] },
  { label: 'My Bookings', to: '/passenger/bookings',  icon: <BookOpen className="w-5 h-5" />,         roles: ['passenger'] },
  { label: 'Profile',     to: '/passenger/profile',   icon: <User className="w-5 h-5" />,             roles: ['passenger'] },
  // Crew
  { label: 'My Schedule', to: '/crew/schedule', icon: <Plane className="w-5 h-5" />,           roles: ['crew'] },
  { label: 'Profile',     to: '/crew/profile',  icon: <User className="w-5 h-5" />,            roles: ['crew'] },
]

function NavItem({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) => cn(
        'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
        isActive
          ? 'bg-white/15 text-white shadow-sm'
          : 'text-slate-300 hover:bg-white/8 hover:text-white'
      )}
    >
      <span className="shrink-0">{item.icon}</span>
      <span>{item.label}</span>
      <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-60 transition-opacity" />
    </NavLink>
  )
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuthStore()
  const items = navItems.filter(i => !i.roles || i.roles.includes(user?.role ?? ''))

  const content = (
    <div className="flex flex-col h-full bg-gradient-to-b from-brand-900 to-slate-900 py-6 px-3 overflow-y-auto sidebar-scroll">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 mb-8">
        <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
          <Plane className="w-5 h-5 text-white fill-white" />
        </div>
        <span className="text-white font-bold text-xl">SkyWay</span>
      </div>

      {/* User pill */}
      <div className="mx-1 mb-6 p-3 rounded-2xl bg-white/10 border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">{user?.full_name}</p>
            <p className="text-slate-400 text-xs capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {items.map(item => <NavItem key={item.to} item={item} />)}
      </nav>

      <div className="mt-6 px-3">
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
          <Plane className="w-6 h-6 text-brand-400 mx-auto mb-1" />
          <p className="text-xs text-slate-400">SkyWay v1.0</p>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">{content}</aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 z-50 w-72 h-full lg:hidden"
            >
              <div className="relative h-full">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                {content}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
