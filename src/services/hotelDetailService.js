
import { supabase } from '@/lib/customSupabaseClient';
import { hotelService } from './hotelService';
import { productionLogger } from '@/utils/productionLogger';

export const hotelDetailService = {
  /**
   * Loads all 10 sections of a hotel in parallel.
   * Returns a comprehensive object with data and 'hasData' flags.
   */
  async getHotelComplete(hotelId) {
    const tStart = performance.now();
    const result = {
      id: hotelId,
      sections: {},
      meta: { loadedAt: new Date().toISOString() }
    };

    try {
      // Parallel Fetching of all sections
      const [
        hotelBasic,
        rooms,
        seasons,
        rates,
        policies,
        operative
      ] = await Promise.all([
        // 1. General, 2. Location, 6. Multimedia, 7. Amenities, 8. Contact (from hotels_master)
        // Removed image_url, using about_image
        supabase.from('hotels_master').select('*').eq('id', hotelId).maybeSingle(),
        
        // 3. Rooms
        supabase.from('rooms').select('*').eq('hotel_id', hotelId),
        
        // 4. Seasons
        supabase.from('seasons_master').select('*').eq('hotel_id', hotelId),
        
        // 5. Rates
        supabase.from('tariffs_master').select('*').eq('hotel_id', hotelId),
        
        // 9. Policies
        supabase.from('hotel_policies').select('*').eq('hotel_id', hotelId),
        
        // 10. Operative Status (simulated or derived)
        supabase.from('hotels_master').select('status, publish').eq('id', hotelId).maybeSingle()
      ]);

      if (hotelBasic.error) throw hotelBasic.error;
      
      // Handle case where hotel is not found
      if (!hotelBasic.data) {
          throw new Error(`Hotel with ID ${hotelId} not found.`);
      }
      
      const hotel = hotelBasic.data;

      // --- 1. General Info ---
      result.sections.general = {
        name: hotel.name,
        slug: hotel.slug,
        description: hotel.description,
        zone: hotel.zone,
        stars: hotel.stars,
        // Map about_image to image_url for frontend compatibility
        image_url: hotel.about_image || (Array.isArray(hotel.gallery_data) && hotel.gallery_data[0]) || null,
        hasData: !!hotel.name
      };

      // --- 2. Location (Double Precision) ---
      result.sections.location = {
        latitude: hotel.latitude,
        longitude: hotel.longitude,
        address: hotel.address,
        hasData: hotel.latitude != null && hotel.longitude != null
      };

      // --- 3. Rooms ---
      result.sections.rooms = {
        count: rooms.data?.length || 0,
        items: rooms.data || [],
        hasData: (rooms.data?.length || 0) > 0
      };

      // --- 4. Seasons ---
      result.sections.seasons = {
        count: seasons.data?.length || 0,
        items: seasons.data || [],
        hasData: (seasons.data?.length || 0) > 0
      };

      // --- 5. Rates (Double Precision) ---
      result.sections.rates = {
        count: rates.data?.length || 0,
        items: rates.data?.map(r => ({
          ...r,
          price_adult: parseFloat(r.price_adult),
          price_child: parseFloat(r.price_child)
        })) || [],
        hasData: (rates.data?.length || 0) > 0
      };

      // --- 6. Multimedia ---
      const mediaItems = Array.isArray(hotel.gallery_data) ? hotel.gallery_data : [];
      result.sections.multimedia = {
        count: mediaItems.length,
        items: mediaItems,
        skeleton: mediaItems.length === 0,
        hasData: mediaItems.length > 0
      };

      // --- 7. Amenities ---
      const amenityItems = Array.isArray(hotel.amenities) ? hotel.amenities : [];
      result.sections.amenities = {
        count: amenityItems.length,
        items: amenityItems,
        skeleton: amenityItems.length === 0,
        hasData: amenityItems.length > 0
      };

      // --- 8. Contact ---
      result.sections.contact = {
        email: hotel.email,
        phone: hotel.phone,
        website: hotel.official_web,
        hasData: !!hotel.email || !!hotel.phone
      };

      // --- 9. Policies ---
      result.sections.policies = {
        count: policies.data?.length || 0,
        items: policies.data || [],
        hasData: (policies.data?.length || 0) > 0
      };

      // --- 10. Operative Status ---
      result.sections.operative = {
        status: operative.data?.status || 'unknown',
        is_published: operative.data?.publish || false,
        hasData: true
      };

      const duration = Math.round(performance.now() - tStart);
      productionLogger.logInfo('hotelDetailService', `Loaded Hotel Complete (${duration}ms)`, { hotelId });

      return result;

    } catch (error) {
      productionLogger.logError('hotelDetailService', error, { hotelId });
      throw error;
    }
  }
};
