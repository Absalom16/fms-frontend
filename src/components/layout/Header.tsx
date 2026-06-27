import { Bell, Menu, LogOut, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/utils/cn'

interface HeaderProps {
  onMenuClick: () => void
  title?: string
}

export default function Header({ onMenuClick, title }: HeaderProps) {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    try { await authService.logout() } catch { /* ignore — clear regardless */ }
    clearAuth()
    queryClient.clear()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <header className="h-16 bg-white border-b border-slate-100 shadow-nav flex items-center gap-4 px-4 sm:px-6 sticky top-0 z-30">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1">
        {title && <h1 className="text-lg font-bold text-slate-900 hidden sm:block">{title}</h1>}
      </div>

      <div className="flex items-center gap-2">
        <button className="relative p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="flex items-center gap-2.5 pl-3 pr-2 py-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-xs">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <span className="hidden sm:block text-sm font-semibold text-slate-700 max-w-[120px] truncate">
              {user?.first_name}
            </span>
            <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', menuOpen && 'rotate-180')} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-12 z-20 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900">{user?.full_name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                  <span className="mt-1 inline-block text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-md font-medium capitalize">
                    {user?.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
