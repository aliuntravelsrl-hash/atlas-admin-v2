
import { supabase } from '@/lib/customSupabaseClient';
import { ErrorHandler } from '@/utils/ErrorHandler';

/**
 * HotelDataService - SSOT for fetching complete hotel data
 * Optimized for 'hotels_master' and UUID safety.
 */
export const HotelDataService = {
    
    /**
     * Fetches complete hotel profile by ID or Slug.
     * Uses the specialized RPC or direct query.
     */
    async getHotelComplete(identifier) {
        try {
            let query = supabase.from('hotels_master').select('*');
            
            // Check if identifier is UUID
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
            
            if (isUUID) {
                query = query.eq('id', identifier);
            } else {
                query = query.eq('slug', identifier);
            }

            const { data, error } = await query.single();
            if (error) throw error;
            return data;

        } catch (error) {
            ErrorHandler.captureError(error, { service: 'HotelDataService', action: 'getHotelComplete', identifier });
            throw error;
        }
    },

    async getGallery(hotelId) {
        const { data, error } = await supabase
            .from('hotels_master')
            .select('gallery_data')
            .eq('id', hotelId)
            .single();
        if (error) throw error;
        return data.gallery_data || [];
    },

    async getServices(hotelId) {
        const { data, error } = await supabase
            .from('hotels_master')
            .select('services_data')
            .eq('id', hotelId)
            .single();
        if (error) throw error;
        return data.services_data || [];
    },

    async getRooms(hotelId) {
        const { data, error } = await supabase
            .from('hotels_master')
            .select('rooms_data')
            .eq('id', hotelId)
            .single();
        if (error) throw error;
        return data.rooms_data || [];
    },

    async getHeroVideo(hotelId) {
        const { data, error } = await supabase
            .from('hotels_master')
            .select('hero_video')
            .eq('id', hotelId)
            .single();
        if (error) throw error;
        return data.hero_video || null;
    },

    /**
     * Subscribes to realtime updates for a specific hotel
     */
    subscribeToHotel(hotelId, callback) {
        return supabase
            .channel(`public:hotels_master:id=eq.${hotelId}`)
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'hotels_master', filter: `id=eq.${hotelId}` }, 
                payload => callback(payload)
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`[HotelDataService] Subscribed to hotel ${hotelId}`);
                }
            });
    }
};
