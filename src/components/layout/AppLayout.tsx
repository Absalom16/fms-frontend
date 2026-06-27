import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const pageTitles: Record<string, string> = {
  '/admin/dashboard':  'Dashboard',
  '/admin/flights':    'Flight Management',
  '/admin/aircraft':   'Aircraft Fleet',
  '/admin/crew':       'Crew Management',
  '/admin/passengers': 'Passengers',
  '/admin/users':      'User Management',
  '/admin/reports':    'Reports & Analytics',
  '/passenger/dashboard': 'My Dashboard',
  '/passenger/flights':   'Find Flights',
  '/passenger/bookings':  'My Bookings',
  '/passenger/profile':   'My Profile',
  '/crew/schedule':    'My Schedule',
  '/crew/profile':     'My Profile',
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()
  const title = pageTitles[pathname] ?? 'SkyWay'

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
