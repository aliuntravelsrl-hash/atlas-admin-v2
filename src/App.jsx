import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { BookingProvider } from './context/BookingContext'
import RoomSelection from './pages/Booking/RoomSelection'
import GuestDetails  from './pages/Booking/GuestDetails'
import ReviewBooking from './pages/Booking/ReviewBooking'

export default function App() {
  return (
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
  )
}
