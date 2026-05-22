import { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const useBookingData = (hotelId) => {
  const [data, setData] = useState({
    roomTypes: [],
    seasons: [],
    rates: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // GUARD: Check for valid UUID before attempting to fetch from tables that require it.
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!hotelId || !uuidRegex.test(hotelId)) {
      // If ID is invalid (e.g. slug from local fallback), we stop here.
      // We don't set error because this is expected for non-DB hotels.
      setLoading(false);
      return;
    }

    const fetchBookingData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log(`[useBookingData] Fetching for Hotel ID: ${hotelId}`);

        // 1. Fetch Room Types (Requires UUID)
        const { data: rooms, error: roomsError } = await supabase
          .from('room_types')
          .select('*')
          .eq('hotel_id', hotelId);

        if (roomsError) throw roomsError;

        // 2. Fetch Active Seasons (Requires UUID)
        const { data: seasons, error: seasonsError } = await supabase
          .from('seasons')
          .select('*')
          .eq('hotel_id', hotelId)
          .eq('is_active', true);

        if (seasonsError) throw seasonsError;

        // 3. Fetch Rates (Text ID allowed, but we are in UUID context)
        const { data: rates, error: ratesError } = await supabase
          .from('rates')
          .select('*')
          .eq('hotel_id', hotelId);

        if (ratesError) throw ratesError;

        if (rooms.length === 0 && seasons.length === 0) {
            console.warn('[useBookingData] No configuration found. Is the DB populated?');
            // We don't throw error here to allow UI to render "No availability" gracefully
        } 
        
        setData({
            roomTypes: rooms || [],
            seasons: seasons || [],
            rates: rates || []
        });

      } catch (err) {
        console.error('[useBookingData] Error:', err);
        setError(err.message || 'Error loading booking data');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [hotelId]);

  return { ...data, loading, error };
};