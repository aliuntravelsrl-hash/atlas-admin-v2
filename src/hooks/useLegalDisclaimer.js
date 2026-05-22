import { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const useLegalDisclaimer = (hotelId) => {
  const [disclaimer, setDisclaimer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDisclaimer = async () => {
      // GUARD: UUID Check is critical here to prevent 22P02 errors
      // when hotelId is a slug (e.g. from local fallback data)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (!hotelId || !uuidRegex.test(hotelId)) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('booking_rules')
          .select('legal_disclaimer')
          .eq('hotel_id', hotelId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        setDisclaimer(data?.legal_disclaimer || null);
      } catch (err) {
        console.error('Error fetching legal disclaimer:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDisclaimer();
  }, [hotelId]);

  return { disclaimer, loading };
};