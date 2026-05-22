import { useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

/**
 * Hook to listen for realtime changes in the specific hotel record.
 * Triggers a callback (usually a re-fetch or state update) when the hotel is updated in DB.
 */
export const useHotelRealtime = (hotelId, onUpdate) => {
  const { toast } = useToast();

  useEffect(() => {
    if (!hotelId) return;

    console.log(`[Realtime] Subscribing to changes for hotel: ${hotelId}`);

    const channel = supabase
      .channel(`hotel-updates-${hotelId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'hotels',
          filter: `id=eq.${hotelId}`,
        },
        (payload) => {
          console.log('[Realtime] Hotel updated:', payload);
          toast({
            title: "Datos Actualizados",
            description: "La información del hotel se ha actualizado en tiempo real.",
            duration: 3000,
          });
          if (onUpdate) {
            onUpdate(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hotelId, onUpdate, toast]);
};