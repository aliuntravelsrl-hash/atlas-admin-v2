import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { addDays, format, differenceInCalendarDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarDays, Users, Search, AlertCircle, ChevronRight, Star } from 'lucide-react'
import { useBooking } from '../../context/BookingContext'
import { getRooms, getQuotation } from '../../services/bookingService'
import RoomCard from '../../components/booking/RoomCard'
import BookingSummary from '../../components/booking/BookingSummary'

// ── Mock hotel para desarrollo ─────────────────────────────────
const DEV_HOTEL = {
  id:       '2888b777-b5ff-4d34-8f7e-88bc2f7e502f',
  name:     'Breathless Punta Cana',
  location: 'Punta Cana',
  stars:    5,
  slug:     'breathless-punta-cana',
}

const today     = new Date()
const tomorrow  = addDays(today, 1)
const dayAfter  = addDays(today, 4)

export default function RoomSelection() {
  const { hotelSlug } = useParams()
  const navigate = useNavigate()
  const { state, dispatch } = useBooking()

  // ── Fechas y huéspedes ────────────────────────────────────────
  const [checkIn,   setCheckIn]  = useState(format(tomorrow,  'yyyy-MM-dd'))
  const [checkOut,  setCheckOut] = useState(format(dayAfter,  'yyyy-MM-dd'))
  const [adults,    setAdults]   = useState(2)
  const [children,  setChildren] = useState(0)

  // ── Datos ─────────────────────────────────────────────────────
  const [rooms,      setRooms]     = useState([])
  const [quotations, setQuotations] = useState({})  // roomId → quotation
  const [loading,    setLoading]   = useState(true)
  const [quoting,    setQuoting]   = useState(false)
  const [error,      setError]     = useState(null)
  const [selected,   setSelected]  = useState(null)

  const hotel = state.hotel || DEV_HOTEL
  const nights = differenceInCalendarDays(new Date(checkOut), new Date(checkIn))

  // ── Inicializar hotel en contexto ─────────────────────────────
  useEffect(() => {
    if (!state.hotel) dispatch({ type: 'SET_HOTEL', payload: DEV_HOTEL })
  }, [])

  // ── Cargar habitaciones ───────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await getRooms(hotel.id)
        setRooms(data)
      } catch (e) {
        setError('Error al cargar habitaciones: ' + e.message)
      } finally {
        setLoading(false)
      }
    }
    if (hotel.id) load()
  }, [hotel.id])

  // ── Cotizar todas las habitaciones ────────────────────────────
  const fetchQuotations = useCallback(async () => {
    if (!rooms.length || nights <= 0) return
    setQuoting(true)
    dispatch({ type: 'SET_DATES', payload: { checkIn, checkOut } })
    dispatch({ type: 'SET_GUESTS', payload: { adults, children } })

    const results = {}
    await Promise.allSettled(
      rooms.map(async room => {
        try {
          const q = await getQuotation({ hotelId: hotel.id, checkIn, checkOut, adults, children })
          results[room.id] = q
        } catch {
          results[room.id] = null
        }
      })
    )
    setQuotations(results)
    setQuoting(false)
  }, [rooms, checkIn, checkOut, adults, children, hotel.id, nights])

  useEffect(() => {
    if (rooms.length) fetchQuotations()
  }, [rooms])

  // ── Seleccionar habitación ────────────────────────────────────
  function handleSelect(room) {
    setSelected(room.id)
    const q = quotations[room.id]
    dispatch({ type: 'SET_ROOM_AND_QUOTE', payload: { room, quotation: q } })
  }

  // ── Continuar al paso 2 ───────────────────────────────────────
  function handleContinue() {
    if (!selected) return
    navigate(`/hotel/${hotel.slug || 'hotel'}/huespedes`)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black uppercase italic text-slate-900">ALIUN</span>
            <span className="text-slate-300">|</span>
            <span className="text-sm text-slate-500 font-medium">Selección de Habitación</span>
          </div>
          {/* Breadcrumb */}
          <div className="hidden md:flex items-center gap-2 text-xs font-black uppercase">
            <span className="text-blue-600">1. Habitación</span>
            <ChevronRight size={12} className="text-slate-300" />
            <span className="text-slate-300">2. Huéspedes</span>
            <ChevronRight size={12} className="text-slate-300" />
            <span className="text-slate-300">3. Confirmar</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">

          {/* Columna principal */}
          <div>
            {/* Hotel hero */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-1">
                {Array.from({ length: hotel.stars || 5 }).map((_, i) => (
                  <Star key={i} size={14} fill="#F59E0B" className="text-amber-400" />
                ))}
              </div>
              <h1 className="text-4xl md:text-5xl font-black uppercase italic text-slate-900 leading-none">
                {hotel.name}
              </h1>
              <p className="text-slate-400 mt-2">{hotel.location}</p>
            </div>

            {/* Filtros de búsqueda */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 mb-8 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Check-in */}
                <div>
                  <label className="text-xs font-black uppercase text-slate-400 block mb-1.5">Check-in</label>
                  <input
                    type="date"
                    value={checkIn}
                    min={format(tomorrow, 'yyyy-MM-dd')}
                    onChange={e => setCheckIn(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-blue-400"
                  />
                </div>
                {/* Check-out */}
                <div>
                  <label className="text-xs font-black uppercase text-slate-400 block mb-1.5">Check-out</label>
                  <input
                    type="date"
                    value={checkOut}
                    min={format(addDays(new Date(checkIn), 1), 'yyyy-MM-dd')}
                    onChange={e => setCheckOut(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-blue-400"
                  />
                </div>
                {/* Adultos */}
                <div>
                  <label className="text-xs font-black uppercase text-slate-400 block mb-1.5">Adultos</label>
                  <select
                    value={adults}
                    onChange={e => setAdults(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-blue-400"
                  >
                    {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} adulto{n !== 1 ? 's' : ''}</option>)}
                  </select>
                </div>
                {/* Niños */}
                <div>
                  <label className="text-xs font-black uppercase text-slate-400 block mb-1.5">Niños</label>
                  <select
                    value={children}
                    onChange={e => setChildren(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-blue-400"
                  >
                    {[0,1,2,3,4].map(n => <option key={n} value={n}>{n} niño{n !== 1 ? 's' : ''}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                {nights > 0 && (
                  <p className="text-sm text-slate-500">
                    <strong className="text-slate-900">{nights} noches</strong> —{' '}
                    {format(new Date(checkIn), "dd 'de' MMMM", { locale: es })} al{' '}
                    {format(new Date(checkOut), "dd 'de' MMMM yyyy", { locale: es })}
                  </p>
                )}
                <button
                  onClick={fetchQuotations}
                  disabled={quoting || nights <= 0}
                  className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl text-sm font-black uppercase hover:bg-blue-600 transition-colors disabled:opacity-40"
                >
                  <Search size={14} />
                  {quoting ? 'Cotizando...' : 'Buscar'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 text-red-700 text-sm">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white rounded-[2.5rem] overflow-hidden animate-pulse">
                    <div className="h-56 bg-slate-100" />
                    <div className="p-7 space-y-3">
                      <div className="h-6 bg-slate-100 rounded w-2/3" />
                      <div className="h-4 bg-slate-100 rounded w-full" />
                      <div className="h-4 bg-slate-100 rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Habitaciones */}
            {!loading && (
              <>
                <p className="text-xs font-black uppercase text-slate-400 mb-4">
                  {rooms.length} habitaciones disponibles
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AnimatePresence>
                    {rooms.map(room => (
                      <RoomCard
                        key={room.id}
                        room={room}
                        quotation={quotations[room.id]}
                        isLoading={quoting}
                        isSelected={selected === room.id}
                        onSelect={handleSelect}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </>
            )}

            {/* CTA continuar */}
            {selected && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 flex justify-end"
              >
                <button
                  onClick={handleContinue}
                  className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-3xl font-black uppercase text-lg transition-all shadow-xl shadow-blue-500/30 hover:scale-105"
                >
                  Datos de Huéspedes
                  <ChevronRight size={20} />
                </button>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <BookingSummary step={1} />
        </div>
      </div>
    </div>
  )
}
