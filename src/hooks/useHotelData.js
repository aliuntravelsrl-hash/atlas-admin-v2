
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

// Simplified Hook for hotels_master
export const useHotelData = (slug) => {
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) {
        setLoading(false);
        return;
    }

    const fetchHotel = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch from hotels_master only
        const { data, error: dbError } = await supabase
          .from('hotels_master')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (dbError) throw dbError;

        if (!data) {
            throw new Error(`Hotel not found: ${slug}`);
        }

        // Map about_image to image_url for compatibility
        setHotel({
            ...data,
            image_url: data.about_image || (Array.isArray(data.gallery_data) && data.gallery_data[0]) || null
        });

      } catch (err) {
        console.error(`Error in useHotelData for ${slug}:`, err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHotel();
  }, [slug]);

  return { hotel, loading, error };
};
