
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { realtimeConfig } from '@/config/supabaseRealtime';

export const useHotel = (rawSlug) => {
  const slug = rawSlug 
    ? rawSlug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-') 
    : null;

  const [state, setState] = useState({
    hotel: null,
    loading: true,
    error: null,
    source: 'loading'
  });

  const isMounted = useRef(true);

  const fetchHotelData = async () => {
    if (!slug) {
        setState({ hotel: null, loading: false, error: 'No slug', source: 'error' });
        return;
    }

    try {
        // Task 7: Query hotels_master directly (Single Source of Truth)
        // Removed image_url, added about_image
        const { data, error } = await supabase
            .from('hotels_master')
            .select(`
                id, 
                name, 
                slug, 
                zone, 
                location, 
                stars, 
                status, 
                publish, 
                official_web, 
                video_url, 
                rag_knowledge, 
                category,
                about_image
            `)
            .eq('slug', slug)
            .maybeSingle();

        if (error) throw error;

        if (!isMounted.current) return;

        if (data) {
            setState({ 
                hotel: {
                    ...data,
                    // Map about_image to image_url for frontend compatibility
                    image_url: data.about_image
                }, 
                loading: false, 
                error: null, 
                source: 'hotels_master' 
            });
            console.log("✅ [useHotel v4.0] Data Loaded from hotels_master");
        } else {
            setState({ hotel: null, loading: false, error: 'Hotel not found in DB', source: 'error' });
        }

    } catch (error) {
        if (isMounted.current) {
             console.error("Error fetching hotel:", error);
             setState({ hotel: null, loading: false, error: error.message, source: 'error' });
        }
    }
  };

  useEffect(() => {
    isMounted.current = true;
    setState({ hotel: null, loading: true, error: null, source: 'loading' });
    
    fetchHotelData();

    // Configurar Realtime para hotels_master
    const channel = realtimeConfig.subscribeToAll((table, payload) => {
        // Escuchar cambios en hotels_master
        if (table === 'hotels_master') {
             const relevant = 
                (payload.new && payload.new.slug === slug) || 
                (payload.old && payload.old.slug === slug);
             
             if (relevant) fetchHotelData();
        }
    });

    return () => { 
        isMounted.current = false; 
        supabase.removeChannel(channel);
    };
  }, [slug]); 

  return { ...state };
};
