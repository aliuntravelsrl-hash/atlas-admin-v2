
import { supabase } from '@/lib/customSupabaseClient';
import { seasonService } from './seasonService'; 
import { ErrorHandler } from '@/utils/ErrorHandler';

// Helper for UUID validation
const validateUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * RatesService v2.0 - 2026 Date Range Support & UUID Fix
 */
export const ratesService = {
  
  async getAllRates(hotelId) {
    return this.getAllRatesExtended(hotelId);
  },

  async getAllRatesExtended(hotelId) {
    try {
      // Allow 'all' string for backward compatibility or global fetch, otherwise validate UUID
      if (hotelId && hotelId !== 'all' && !validateUUID(hotelId)) {
        throw new Error(`Invalid UUID provided: ${hotelId}`);
      }

      let query = supabase
        .from('rates')
        .select(`
            id,
            price_per_night,
            currency,
            season_id,
            room_id,
            valid_from,
            valid_to,
            adult_rate,
            child_rate,
            seasons ( id, name, start_date, end_date ),
            rooms!inner (
              id,
              name,
              hotel_id,
              hotels ( id, name )
            )
        `);
      
      if (hotelId && hotelId !== 'all') {
        query = query.eq('rooms.hotel_id', hotelId);
      }
      
      const { data: rates, error } = await query;
      if (error) throw error;

      if (!rates || rates.length === 0) return [];

      return rates.map(rate => ({
          id: rate.id,
          // Support both legacy price_per_night and new specific rates
          base_price_adult: rate.adult_rate || rate.price_per_night,
          base_price_child: rate.child_rate || 0,
          currency: rate.currency,
          
          valid_from: rate.valid_from || rate.seasons?.start_date,
          valid_to: rate.valid_to || rate.seasons?.end_date,
          
          season_name: rate.seasons?.name || 'Manual Range',
          
          hotels: rate.rooms?.hotels || { name: 'Unknown Hotel' },
          rooms: { 
            id: rate.rooms?.id, 
            name: rate.rooms?.name || 'Unknown Room' 
          },
          hotel_id: rate.rooms?.hotel_id
      }));
    } catch (error) {
      ErrorHandler.captureError(error, { component: 'ratesService', action: 'getAllRatesExtended', metadata: { hotelId } });
      console.error("[ratesService] Unexpected error in getAllRatesExtended:", error);
      throw error;
    }
  },

  async getRoomsByHotel(hotelId) {
      try {
        if (!hotelId || !validateUUID(hotelId)) {
            throw new Error(`Invalid UUID provided: ${hotelId}`);
        }
        const { data, error } = await supabase
          .from('rooms')
          .select('id, name, capacity_adults, capacity_kids')
          .eq('hotel_id', hotelId);
        
        if (error) throw error;
        
        return data;
      } catch (error) {
        ErrorHandler.captureError(error, { component: 'ratesService', action: 'getRoomsByHotel', metadata: { hotelId } });
        throw error;
      }
  },

  async createRate(roomId, validFrom, validTo, adultRate, childRate, seasonId = null) {
      try {
        if (!roomId || !validateUUID(roomId)) throw new Error("Invalid Room UUID");

        // Validation
        const fromDate = new Date(validFrom);
        const toDate = new Date(validTo);
        
        if (isNaN(fromDate) || isNaN(toDate)) throw new Error("Invalid date format");
        if (fromDate > toDate) throw new Error("valid_from cannot be greater than valid_to");

        let finalSeasonId = seasonId;
        if (!finalSeasonId) {
             const { data: season } = await supabase
                .from('seasons')
                .select('id')
                .lte('start_date', validFrom)
                .gte('end_date', validFrom)
                .maybeSingle(); 
             
             if (season) {
                 finalSeasonId = season.id;
             } else {
                 console.warn("[ratesService] No season_id provided or found for range.");
             }
        }

        const payload = {
            room_id: roomId,
            valid_from: validFrom,
            valid_to: validTo,
            adult_rate: parseFloat(adultRate),
            child_rate: parseFloat(childRate),
            price_per_night: parseFloat(adultRate),
            base_price_adult: parseFloat(adultRate),
            base_price_child: parseFloat(childRate),
            season_id: finalSeasonId
        };
        
        const { data, error } = await supabase.from('rates').insert([payload]).select().single();
        if (error) throw error;

        console.log(`✅ [ratesService] Tarifa 2026 guardada con éxito`);
        console.log(`   Room: ${roomId} | Adult: $${adultRate} | Child: $${childRate}`);
        console.log(`   Range: ${validFrom} to ${validTo}`);

        return data;
      } catch (error) {
        ErrorHandler.captureError(error, { component: 'ratesService', action: 'createRate' });
        console.error("[ratesService] Error creating rate:", error);
        throw error;
      }
  },

  async updateRate(rateId, validFrom, validTo, adultRate, childRate) {
      try {
        if (!rateId || !validateUUID(rateId)) throw new Error("Invalid Rate UUID");

        const fromDate = new Date(validFrom);
        const toDate = new Date(validTo);
        if (fromDate > toDate) throw new Error("valid_from cannot be greater than valid_to");

        const payload = {
            valid_from: validFrom,
            valid_to: validTo,
            adult_rate: parseFloat(adultRate),
            child_rate: parseFloat(childRate),
            price_per_night: parseFloat(adultRate), 
            base_price_adult: parseFloat(adultRate),
            base_price_child: parseFloat(childRate) 
        };
        
        const { data, error } = await supabase.from('rates').update(payload).eq('id', rateId).select().single();
        if (error) throw error;
        
        console.log(`✅ [ratesService] Tarifa actualizada: ${validFrom} - ${validTo}`);
        return data;
      } catch (error) {
        ErrorHandler.captureError(error, { component: 'ratesService', action: 'updateRate', metadata: { rateId } });
        console.error(`[ratesService] Error updating rate ${rateId}:`, error);
        throw error;
      }
  },
  
  async getRateByDateRange(roomId, checkInDate) {
      try {
          if (!roomId || !validateUUID(roomId)) throw new Error("Invalid Room UUID");

          const { data, error } = await supabase
            .from('rates')
            .select('adult_rate, child_rate, price_per_night, base_price_adult, base_price_child')
            .eq('room_id', roomId)
            .lte('valid_from', checkInDate)
            .gte('valid_to', checkInDate)
            .order('created_at', { ascending: false }) 
            .limit(1)
            .single();

          if (error) {
              if (error.code === 'PGRST116') { // No rows found
                  return null;
              }
              throw error;
          }

          return {
              adult_rate: data.adult_rate || data.base_price_adult || data.price_per_night || 0,
              child_rate: data.child_rate || data.base_price_child || 0
          };

      } catch (error) {
          console.error(`[ratesService] Error fetching rate for ${checkInDate}:`, error);
          return null;
      }
  },

  async deleteRate(id) {
      try {
        if (!id || !validateUUID(id)) throw new Error("Invalid Rate UUID");
        const { error } = await supabase.from('rates').delete().eq('id', id);
        if (error) throw error;
        return true;
      } catch (error) {
        ErrorHandler.captureError(error, { component: 'ratesService', action: 'deleteRate', metadata: { id } });
        console.error("[ratesService] Unexpected error in deleteRate:", error);
        throw error;
      }
  }
};
