import { supabase } from '@/lib/customSupabaseClient';
import { addDays, isWithinInterval, parseISO, startOfDay, differenceInDays } from 'date-fns';
import { ErrorHandler } from '@/utils/ErrorHandler';

export const seasonService = {
  // --- DATABASE OPERATIONS ---

  async getSeasons(hotelId) {
    try {
      // FIX: Removed hotel_id filter as seasons are global
      // hotelId parameter is kept for interface compatibility but ignored for filtering
      
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .order('start_date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      ErrorHandler.captureError(error, { component: 'seasonService', action: 'getSeasons', metadata: { hotelId } });
      console.error("[seasonService] Unexpected error in getSeasons:", error);
      throw error;
    }
  },

  async saveSeason(seasonData) {
    try {
      const { id, ...payload } = seasonData;
      let query = id 
          ? supabase.from('seasons').update(payload).eq('id', id)
          : supabase.from('seasons').insert([payload]);
      const { data, error } = await query.select().single();
      if (error) throw error;
      return data;
    } catch (error) {
      ErrorHandler.captureError(error, { component: 'seasonService', action: 'saveSeason' });
      console.error("[seasonService] Unexpected error in saveSeason:", error);
      throw error;
    }
  },

  async deleteSeason(id) {
    try {
      const { error } = await supabase.from('seasons').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (error) {
      ErrorHandler.captureError(error, { component: 'seasonService', action: 'deleteSeason', metadata: { id } });
      console.error("[seasonService] Unexpected error in deleteSeason:", error);
      throw error;
    }
  },

  // --- MOTOR INDUSTRIAL (Pricing Engine) ---

  getSeasonForDate(date, seasons) {
    if (!seasons || !Array.isArray(seasons)) return null;
    const targetDate = startOfDay(new Date(date));
    return seasons.find(season => {
      if (season.is_active === false) return false; 
      const start = startOfDay(parseISO(season.start_date));
      const end = startOfDay(parseISO(season.end_date));
      return isWithinInterval(targetDate, { start, end });
    });
  },

  calculateStayPrice({ 
    checkIn, 
    checkOut, 
    roomId, 
    adults, 
    children, 
    seasons, 
    rates 
  }) {
    console.group('🧮 [Industrial Engine] Calculating Price');
    
    if (!checkIn || !checkOut || !roomId) {
        console.groupEnd();
        return { total: 0, breakdown: [], error: 'Parámetros incompletos' };
    }

    let totalPrice = 0;
    let breakdown = [];
    let currentDate = startOfDay(new Date(checkIn));
    const endDate = startOfDay(new Date(checkOut));
    const nights = differenceInDays(endDate, currentDate);

    if (nights <= 0) {
      console.groupEnd();
      return { total: 0, breakdown: [], error: 'Fechas inválidas (Entrada >= Salida)' };
    }

    for (let i = 0; i < nights; i++) {
      const dateStr = new Date(currentDate).toISOString().split('T')[0];
      const season = this.getSeasonForDate(currentDate, seasons);
      
      if (!season) {
        console.warn(`⚠️ No Season for ${dateStr}`);
        console.groupEnd();
        return { 
          total: 0, 
          breakdown: [], 
          error: 'NO_RATE_AVAILABLE', 
          details: `Sin temporada para ${dateStr}`
        };
      }

      const rate = rates.find(r => 
        r.season_name === season.name && 
        r.room_id === roomId
      );

      if (!rate) {
        console.warn(`⚠️ No Rate for ${season.name} / Room ${roomId}`);
        console.groupEnd();
        return { 
          total: 0, 
          breakdown: [], 
          error: 'NO_RATE_AVAILABLE', 
          details: `Sin tarifa para temporada ${season.name}`
        };
      }

      const priceAdult = Number(rate.base_price_adult) || 0;
      const priceChild = Number(rate.base_price_child) || 0;
      
      // FORMULA INDUSTRIAL
      const dailyTotal = (priceAdult * adults) + (priceChild * children);
      
      totalPrice += dailyTotal;
      breakdown.push({
        date: dateStr,
        season: season.name,
        price: dailyTotal,
        details: `${adults}Ad x $${priceAdult} + ${children}Ch x $${priceChild}`
      });

      currentDate = addDays(currentDate, 1);
    }

    console.log(`✅ Calculation Complete: $${totalPrice} (${nights} nights)`);
    console.groupEnd();
    return { total: totalPrice, breakdown, error: null };
  }
};