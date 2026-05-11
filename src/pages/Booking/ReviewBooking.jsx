import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, CheckCircle2, AlertCircle, CreditCard, Loader2 } from 'lucide-react'
import { useBooking } from '../../context/BookingContext'
import { createBooking } from '../../services/bookingService'
import BookingSummary from '../../components/booking/BookingSummary'

export default function ReviewBooking() {
  const navigate = useNavigate()
  const { state, dispatch, nights } = useBooking()
  const { hotel, dates, guests, quotation, guestInfo, specialRequests } = state

  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [result,  setResult]    = useState(null)
  const [error,   setError]     = useState(null)

  const dep = quotation ? (quotation.total_usd * 0.30).toFixed(2) : 0
  const sal = quotation ? (quotation.total_usd * 0.70).toFixed(2) : 0

  async function handleConfirm() {
    if (!accepted) return
    setLoading(true)
    setError(null)
    try {
      const res = await createBooking({
        hotelId:      hotel.id,
        checkIn:      dates.checkIn,
        checkOut:     dates.checkOut,
        adults:       guests.adults,
        children:     guests.children,
        totalAmount:  quotation?.total_usd || 0,
        leadName:     `${guestInfo.firstName} ${guestInfo.lastName}`,
        leadEmail:    guestInfo.email,
        leadPhone:    guestInfo.phone,
        occupancyDesc: `${guests.adults} adultos${guests.children ? ` / ${guests.children} niños` : ''} / ${quotation?.tipo_ocupacion} / ${quotation?.room_name} ${quotation?.view_category}`,
        specialRequests,
      })
      setResult(res)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Pantalla de éxito ──────────────────────────────────────────
  if (result?.booking_reference) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[3rem] p-12 max-w-lg w-full text-center shadow-2xl"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-green-500" />
          </div>
          <h2 className="text-3xl font-black uppercase italic mb-2">¡Reserva Creada!</h2>
          <p className="text-slate-500 mb-6">Recibirás confirmación por email</p>
          <div className="bg-slate-50 rounded-2xl p-6 mb-6">
            <p className="text-xs text-slate-400 font-black uppercase mb-1">Referencia</p>
            <p className="text-2xl font-black text-blue-600">{result.booking_reference}</p>
          </div>
          <p className="text-sm text-slate-500 mb-8">
            Estado: <strong>Pendiente confirmación del proveedor</strong><br/>
            Nuestro equipo contactará a <strong>{guestInfo?.email}</strong> en las próximas horas.
          </p>
          <button
            onClick={() => { dispatch({ type: 'RESET' }); navigate('/') }}
            className="bg-blue-600 text-white px-10 py-4 rounded-3xl font-black uppercase w-full hover:bg-blue-700 transition"
          >
            Volver al Inicio
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors">
            <ChevronLeft size={16} /> Volver
          </button>
          <div className="hidden md:flex items-center gap-2 text-xs font-black uppercase">
            <span className="text-slate-400">1. Habitación</span>
            <span className="text-slate-300 mx-1">›</span>
            <span className="text-slate-400">2. Huéspedes</span>
            <span className="text-slate-300 mx-1">›</span>
            <span className="text-blue-600">3. Confirmar</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <h2 className="text-4xl font-black uppercase italic">Revisar Reserva</h2>

            {/* Resumen reserva */}
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm space-y-4">
              <h3 className="font-black uppercase text-sm text-slate-400 mb-2">Detalles</h3>
              <Row label="Hotel"       value={hotel?.name} />
              <Row label="Habitación"  value={quotation?.room_name} />
              <Row label="Vista"       value={quotation?.view_category} />
              <Row label="Check-in"    value={dates.checkIn  ? format(new Date(dates.checkIn),  "dd 'de' MMMM yyyy", { locale: es }) : ''} />
              <Row label="Check-out"   value={dates.checkOut ? format(new Date(dates.checkOut), "dd 'de' MMMM yyyy", { locale: es }) : ''} />
              <Row label="Noches"      value={`${nights} noches`} />
              <Row label="Huéspedes"   value={`${guests.adults} adultos${guests.children ? ` · ${guests.children} niños` : ''}`} />
              <Row label="Temporada"   value={`${quotation?.season_name || ''} (×${quotation?.season_multiplier})`} />
            </div>

            {/* Titular */}
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm space-y-3">
              <h3 className="font-black uppercase text-sm text-slate-400 mb-2">Titular</h3>
              <Row label="Nombre"    value={`${guestInfo?.firstName} ${guestInfo?.lastName}`} />
              <Row label="Email"     value={guestInfo?.email} />
              <Row label="Teléfono"  value={guestInfo?.phone} />
              {specialRequests?.length > 0 && (
                <Row label="Peticiones" value={specialRequests.join(', ')} />
              )}
            </div>

            {/* Desglose de pagos */}
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
              <h3 className="font-black uppercase text-sm text-slate-400 mb-4">Desglose de Pago</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-slate-600">
                  <span>${quotation?.price_per_night_usd}/noche × {nights} noches × {guests.adults} adultos</span>
                  <span>${quotation?.total_usd}</span>
                </div>
                <div className="flex justify-between text-green-600 font-bold border-t border-slate-100 pt-3">
                  <span>ITBIS (Paquetes turísticos)</span>
                  <span>$0.00 — Exento</span>
                </div>
                <div className="flex justify-between text-xl font-black border-t border-slate-200 pt-3">
                  <span>Total</span>
                  <span>${quotation?.total_usd} USD</span>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
                  <p className="text-xs text-blue-400 font-black uppercase mb-1">Depósito hoy (30%)</p>
                  <p className="text-2xl font-black text-blue-700">${dep}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                  <p className="text-xs text-slate-400 font-black uppercase mb-1">Saldo en destino (70%)</p>
                  <p className="text-2xl font-black text-slate-700">${sal}</p>
                </div>
              </div>
            </div>

            {/* Confirmación requerida */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>Esta reserva está sujeta a <strong>confirmación de disponibilidad y precio</strong> por parte del proveedor. Recibirás respuesta en 2–4 horas hábiles.</p>
            </div>

            {/* Términos */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={accepted}
                onChange={e => setAccepted(e.target.checked)}
                className="w-5 h-5 rounded accent-blue-600"
              />
              <span className="text-sm text-slate-600">
                Acepto los <span className="underline text-blue-600 cursor-pointer">términos y condiciones</span> de Aliun Travel y confirmo que los datos son correctos.
              </span>
            </label>

            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {/* Botón final */}
            <button
              onClick={handleConfirm}
              disabled={!accepted || loading}
              className={`w-full flex items-center justify-center gap-3 py-5 rounded-3xl font-black uppercase text-lg transition-all
                ${accepted && !loading
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-500/30 hover:scale-[1.01]'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
            >
              {loading ? (
                <><Loader2 size={20} className="animate-spin" /> Procesando...</>
              ) : (
                <><CreditCard size={20} /> Confirmar Reserva — ${quotation?.total_usd} USD</>
              )}
            </button>
          </motion.div>

          <BookingSummary step={3} />
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
      <span className="text-slate-400 font-medium">{label}</span>
      <span className="text-slate-800 font-bold text-right max-w-[60%]">{value}</span>
    </div>
  )
}
