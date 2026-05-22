import { supabase } from '@/lib/customSupabaseClient';

export const destinationService = {
  async getDestinations() {
    try {
      // FIX: Use hotels_master and zone/location instead of hotels/location
      const { data, error } = await supabase
        .from('hotels_master')
        .select('zone, location')
        .eq('publish', true);
        
      if (error) {
          console.error("Error fetching destinations:", error);
          return [];
      }
      
      // Extract unique locations/zones
      const locations = new Set();
      data?.forEach(h => {
          if (h.zone) locations.add(h.zone);
          if (h.location) locations.add(h.location);
      });
      
      return [...locations];
    } catch (error) {
      console.error("Unexpected error in getDestinations:", error);
      return [];
    }
  },

  async getHotelsByDestination(destinationSlug) {
    try {
      // FIX: Use hotels_master and correct columns
      let query = supabase
        .from('hotels_master')
        .select('id, slug, name, location, zone, description, publish, video_url') 
        .eq('publish', true);

      if (destinationSlug && destinationSlug !== 'all') {
          // Fuzzy match on zone or location
          query = query.or(`zone.ilike.%${destinationSlug}%,location.ilike.%${destinationSlug}%`);
      }

      const { data, error } = await query;
      
      if (error) {
          console.error("Error fetching hotels by destination:", error);
          return [];
      }
      
      // Map to expected format
      return data.map(h => ({
          ...h,
          is_active: h.publish,
          location: h.location || h.zone
      }));
    } catch (error) {
      console.error("Unexpected error in getHotelsByDestination:", error);
      return [];
    }
  }
};