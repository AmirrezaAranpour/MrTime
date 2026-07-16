import { Navigate, Route, Routes } from 'react-router-dom';
import CustomerLayout from '@/components/CustomerLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

import HomePage from '@/pages/customer/HomePage';
import SearchPage from '@/pages/customer/SearchPage';
import BarberDetailPage from '@/pages/customer/BarberDetailPage';
import BookingPage from '@/pages/customer/BookingPage';
import SuccessPage from '@/pages/customer/SuccessPage';
import AppointmentsPage from '@/pages/customer/AppointmentsPage';
import ProfilePage from '@/pages/customer/ProfilePage';

import BarberLoginPage from '@/pages/barber/BarberLoginPage';
import BarberDashboardLayout from '@/pages/barber/BarberDashboardLayout';
import BarberAppointmentsPage from '@/pages/barber/BarberAppointmentsPage';
import BarberServicesPage from '@/pages/barber/BarberServicesPage';
import WeeklyAvailabilityPage from '@/pages/barber/WeeklyAvailabilityPage';
import DateAvailabilityPage from '@/pages/barber/DateAvailabilityPage';

export default function App() {
  return (
    <Routes>
      {/* Barber panel */}
      <Route path="/barber-panel/login" element={<BarberLoginPage />} />
      <Route element={<ProtectedRoute role="barber" redirectTo="/barber-panel/login" />}>
        <Route path="/barber-panel" element={<BarberDashboardLayout />}>
          <Route index element={<Navigate to="/barber-panel/appointments" replace />} />
          <Route path="appointments" element={<BarberAppointmentsPage />} />
          <Route path="services" element={<BarberServicesPage />} />
          <Route path="availability/weekly" element={<WeeklyAvailabilityPage />} />
          <Route path="availability/dates" element={<DateAvailabilityPage />} />
        </Route>
      </Route>

      {/* Barber profile — standalone page with its own header/chrome */}
      <Route path="/barber/:id" element={<BarberDetailPage />} />

      {/* Customer app */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/booking/:barberId" element={<BookingPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
