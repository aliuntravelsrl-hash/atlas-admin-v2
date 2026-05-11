import { createClient } from '@supabase/supabase-js'
import { format } from 'date-fns'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const N8N_WEBHOOK = 'https://n8n-n8n.xaruuo.easypanel.host/webhook/horizons-booking-api'

// ─── Obtener habitaciones activas de un hotel ──────────────────
export async function getRooms(hotelId) {
  const { data, error } = await supabase
    .from('rooms')
    .select(`
      id, name, room_type, type,
      capacity_adults, capacity_children,
      base_price, image_url, room_images,
      description, amenities,
      view_category, view_multiplier, availability_mode
    `)
    .eq('hotel_id', hotelId)
    .eq('is_active', true)
    .order('base_price', { ascending: true, nullsFirst: false })

  if (error) throw error
  return data
}

// ─── Cotizar via RPC v4 (3 capas) ─────────────────────────────
export async function getQuotation({ hotelId, checkIn, checkOut, adults, children, occupancy = 'DBL' }) {
  const { data, error } = await supabase.rpc('calcular_precio_paquete', {
    p_hotel_id:               hotelId,
    p_check_in:               format(new Date(checkIn),  'yyyy-MM-dd'),
    p_check_out:              format(new Date(checkOut), 'yyyy-MM-dd'),
    p_adultos:                adults,
    p_ninos:                  children,
    p_tipo_ocupacion:         occupancy,
    p_tasa_venta:             0,
    p_es_proveedor_local_dop: false,
  })
  if (error) throw error
  return data
}

// ─── Crear booking via n8n ─────────────────────────────────────
export async function createBooking({ hotelId, checkIn, checkOut, adults, children,
                                      totalAmount, leadName, leadEmail, leadPhone,
                                      occupancyDesc, specialRequests }) {
  const res = await fetch(N8N_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action:        'CREATE_BOOKING',
      hotel_id:      hotelId,
      check_in:      format(new Date(checkIn),  'yyyy-MM-dd'),
      check_out:     format(new Date(checkOut), 'yyyy-MM-dd'),
      adults,
      children,
      total_amount:  totalAmount,
      lead_name:     leadName,
      lead_email:    leadEmail,
      lead_phone:    leadPhone,
      occupancy_desc: occupancyDesc,
      special_requests: specialRequests,
    }),
  })
  if (!res.ok) throw new Error(`Error ${res.status} al crear la reserva`)
  return res.json()
}

export { supabase }
