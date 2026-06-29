/**
 * useExchangeRate — hook compartido para tasa de cambio DOP/USD
 * Lee de exchange_rates en Supabase. Fallback: 58.5
 * 
 * REGLA DE NEGOCIO:
 *   - total_amount en bookings SIEMPRE en USD (unidad canónica)
 *   - Si cliente paga en DOP: total_dop = total_usd × rate
 *   - Si cliente paga en USD: total_usd directo, sin conversión
 *   - Moneda DOP = transacción local, el rate sí aplica para mostrar equivalente
 *   - Nunca aplicar rate × rate (doble conversión)
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/customSupabaseClient'

export const EXCHANGE_RATE_FALLBACK = 58.5

export function useExchangeRate() {
  const [rate, setRate]       = useState(EXCHANGE_RATE_FALLBACK)
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState(null)

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const { data, error } = await supabase
          .from('exchange_rates')
          .select('rate_sell, updated_at')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single()

        if (!error && data?.rate_sell && parseFloat(data.rate_sell) > 0) {
          setRate(parseFloat(data.rate_sell))
          setUpdatedAt(data.updated_at)
        }
      } catch (e) {
        console.warn('[useExchangeRate] fallback a 58.5:', e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchRate()
  }, [])

  /**
   * Convierte USD a DOP usando la tasa actual
   */
  const usdToDop = (usd) => Math.round(parseFloat(usd || 0) * rate)

  /**
   * Convierte DOP a USD usando la tasa actual
   */
  const dopToUsd = (dop) => parseFloat((parseFloat(dop || 0) / rate).toFixed(2))

  /**
   * Formatea monto según moneda
   * nat='DO' → RD$ DOP  |  nat='US'/'PR'/etc → $ USD
   */
  const fmt = (amountUsd, nationality) => {
    if (nationality === 'DO') {
      return `RD$ ${usdToDop(amountUsd).toLocaleString('es-DO')}`
    }
    return `$${parseFloat(amountUsd || 0).toFixed(2)} USD`
  }

  return { rate, loading, updatedAt, usdToDop, dopToUsd, fmt }
}
