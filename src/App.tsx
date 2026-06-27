import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import PublicLayout from '@/components/layout/PublicLayout'
import AppLayout from '@/components/layout/AppLayout'

// Pages
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import NotFoundPage from '@/pages/NotFoundPage'

// Passenger
import PassengerDashboard from '@/pages/passenger/DashboardPage'
import FlightSearchPage from '@/pages/passenger/FlightSearchPage'
import SeatSelectionPage from '@/pages/passenger/SeatSelectionPage'
import PaymentPage from '@/pages/passenger/PaymentPage'
import MyBookingsPage from '@/pages/passenger/MyBookingsPage'
import BookingDetailPage from '@/pages/passenger/BookingDetailPage'
import ProfilePage from '@/pages/passenger/ProfilePage'

// Admin
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import FlightsPage from '@/pages/admin/FlightsPage'
import FlightFormPage from '@/pages/admin/FlightFormPage'
import FlightDetailPage from '@/pages/admin/FlightDetailPage'
import CrewPage from '@/pages/admin/CrewPage'
import PassengersPage from '@/pages/admin/PassengersPage'
import ReportsPage from '@/pages/admin/ReportsPage'
import AircraftPage from '@/pages/admin/AircraftPage'
import RoutesPage from '@/pages/admin/RoutesPage'
import UsersPage from '@/pages/admin/UsersPage'

// Crew
import CrewSchedulePage from '@/pages/crew/SchedulePage'
import CrewFlightBriefingPage from '@/pages/crew/FlightBriefingPage'
import CrewProfilePage from '@/pages/crew/ProfilePage'

function roleHome(role?: string): string {
  if (role === 'passenger') return '/passenger/dashboard'
  if (role === 'crew')      return '/crew/schedule'
  return '/admin/dashboard'
}

function RequireAuth({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, isAuthenticated } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to={roleHome(user.role)} replace />
  }
  return <>{children}</>
}

function GuestOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()
  if (isAuthenticated) {
    return <Navigate to={roleHome(user?.role)} replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
        </Route>
        <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
        <Route path="/forgot-password" element={<GuestOnly><ForgotPasswordPage /></GuestOnly>} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Passenger */}
        <Route path="/passenger" element={<RequireAuth roles={['passenger']}><AppLayout /></RequireAuth>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<PassengerDashboard />} />
          <Route path="flights" element={<FlightSearchPage />} />
          <Route path="flights/:flightId/seats" element={<SeatSelectionPage />} />
          <Route path="payment" element={<PaymentPage />} />
          <Route path="bookings" element={<MyBookingsPage />} />
          <Route path="bookings/:id" element={<BookingDetailPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Admin / Manager */}
        <Route path="/admin" element={<RequireAuth roles={['admin', 'manager']}><AppLayout /></RequireAuth>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="flights" element={<FlightsPage />} />
          <Route path="flights/new" element={<FlightFormPage />} />
          <Route path="flights/:id" element={<FlightDetailPage />} />
          <Route path="flights/:id/edit" element={<FlightFormPage />} />
          <Route path="aircraft" element={<AircraftPage />} />
          <Route path="network" element={<RoutesPage />} />
          <Route path="crew" element={<CrewPage />} />
          <Route path="passengers" element={<PassengersPage />} />
          <Route path="reports" element={<ReportsPage />} />
          {/* Admin only */}
          <Route path="users" element={<RequireAuth roles={['admin']}><UsersPage /></RequireAuth>} />
        </Route>

        {/* Crew */}
        <Route path="/crew" element={<RequireAuth roles={['crew']}><AppLayout /></RequireAuth>}>
          <Route index element={<Navigate to="schedule" replace />} />
          <Route path="schedule" element={<CrewSchedulePage />} />
          <Route path="flights/:id" element={<CrewFlightBriefingPage />} />
          <Route path="profile" element={<CrewProfilePage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
