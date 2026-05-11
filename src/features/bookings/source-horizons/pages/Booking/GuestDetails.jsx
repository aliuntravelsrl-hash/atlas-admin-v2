import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, User, Mail, Phone } from 'lucide-react'
import { useBooking } from '../../context/BookingContext'
import BookingSummary from '../../components/booking/BookingSummary'

const SPECIAL_OPTIONS = [
  'Cama extra (niño)', 'Luna de miel', 'Aniversario',
  'Cumpleaños', 'Llegada tardía', 'Vista preferida',
]

export default function GuestDetails() {
  const navigate = useNavigate()
  const { state, dispatch } = useBooking()
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
  })
  const [selected, setSelected] = useState([])
  const [errors, setErrors] = useState({})

  function validate() {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'Requerido'
    if (!form.lastName.trim())  e.lastName  = 'Requerido'
    if (!form.email.includes('@')) e.email  = 'Email inválido'
    if (form.phone.length < 7)  e.phone     = 'Teléfono inválido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function toggleRequest(req) {
    setSelected(prev => prev.includes(req) ? prev.filter(r => r !== req) : [...prev, req])
  }

  function handleContinue() {
    if (!validate()) return
    dispatch({ type: 'SET_GUEST_INFO', payload: { ...form } })
    dispatch({ type: 'SET_SPECIAL_REQUESTS', payload: selected })
    navigate(`/hotel/${state.hotel?.slug || 'hotel'}/confirmar`)
  }

  const Field = ({ id, label, icon: Icon, type = 'text', placeholder }) => (
    <div>
      <label className="text-xs font-black uppercase text-slate-400 block mb-1.5">{label}</label>
      <div className="relative">
        <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
        <input
          type={type}
          value={form[id]}
          onChange={e => setForm(p => ({ ...p, [id]: e.target.value }))}
          placeholder={placeholder}
          className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border text-sm font-medium focus:outline-none transition-colors
            ${errors[id] ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-blue-400'}`}
        />
      </div>
      {errors[id] && <p className="text-xs text-red-500 mt-1">{errors[id]}</p>}
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors">
            <ChevronLeft size={16} /> Volver
          </button>
          <div className="hidden md:flex items-center gap-2 text-xs font-black uppercase">
            <span className="text-slate-400">1. Habitación</span>
            <ChevronRight size={12} className="text-slate-300" />
            <span className="text-blue-600">2. Huéspedes</span>
            <ChevronRight size={12} className="text-slate-300" />
            <span className="text-slate-300">3. Confirmar</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-4xl font-black uppercase italic mb-8">Datos del Titular</h2>

            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm space-y-5 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field id="firstName" label="Nombre"   icon={User}  placeholder="Juan" />
                <Field id="lastName"  label="Apellido" icon={User}  placeholder="Pérez" />
              </div>
              <Field id="email" label="Email" icon={Mail}  type="email" placeholder="juan@email.com" />
              <Field id="phone" label="Teléfono" icon={Phone} type="tel" placeholder="+1 809 000 0000" />
            </div>

            {/* Peticiones especiales */}
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm mb-8">
              <h3 className="font-black uppercase text-sm text-slate-400 mb-4">Peticiones especiales</h3>
              <div className="flex flex-wrap gap-2">
                {SPECIAL_OPTIONS.map(req => (
                  <button
                    key={req}
                    onClick={() => toggleRequest(req)}
                    className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all border
                      ${selected.includes(req)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-400'}`}
                  >
                    {req}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-3">Sujeto a disponibilidad. Sin costo adicional garantizado.</p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleContinue}
                className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-3xl font-black uppercase text-lg transition-all shadow-xl shadow-blue-500/30 hover:scale-105"
              >
                Revisar y Confirmar
                <ChevronRight size={20} />
              </button>
            </div>
          </motion.div>

          <BookingSummary step={2} />
        </div>
      </div>
    </div>
  )
}
