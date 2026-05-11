import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { BookingProvider } from '../features/bookings/source-horizons/context/BookingContext'
import RoomSelection from '../features/bookings/source-horizons/pages/Booking/RoomSelection'
import GuestDetails  from '../features/bookings/source-horizons/pages/Booking/GuestDetails'
import ReviewBooking from '../features/bookings/source-horizons/pages/Booking/ReviewBooking'
import { LayoutDashboard, Users, Calendar, Settings } from 'lucide-react'

export function AppShell() {
  return (
    <div className="app-shell min-h-screen bg-slate-900 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 border-r border-slate-700 p-6 flex flex-col">
        <h1 className="text-xl font-black italic tracking-wider mb-8 text-blue-400">ATLAS ADMIN V2</h1>
        <nav className="flex-1 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-blue-600/20 text-blue-400 rounded-xl transition-colors">
            <LayoutDashboard size={20} />
            <span className="font-semibold">Dashboard</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 rounded-xl transition-colors">
            <Calendar size={20} />
            <span className="font-semibold">Bookings (Legacy)</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 rounded-xl transition-colors">
            <Users size={20} />
            <span className="font-semibold">Users</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 rounded-xl transition-colors">
            <Settings size={20} />
            <span className="font-semibold">Settings</span>
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-50 text-slate-900">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Booking Management (Horizons Source)</h2>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-500">
              C3
            </div>
          </div>
        </header>

        <div className="p-8">
          <BrowserRouter>
            <BookingProvider>
              <Routes>
                {/* Ruta principal del booking — slug del hotel */}
                <Route path="/hotel/:hotelSlug/reservar"    element={<RoomSelection />} />
                <Route path="/hotel/:hotelSlug/huespedes"   element={<GuestDetails />} />
                <Route path="/hotel/:hotelSlug/confirmar"   element={<ReviewBooking />} />

                {/* Dev shortcut — sin slug */}
                <Route path="/booking"  element={<RoomSelection />} />
                <Route path="/booking2" element={<GuestDetails />} />
                <Route path="/booking3" element={<ReviewBooking />} />

                {/* Default */}
                <Route path="*" element={<Navigate to="/booking" replace />} />
              </Routes>
            </BookingProvider>
          </BrowserRouter>
        </div>
      </main>
    </div>
  )
}
