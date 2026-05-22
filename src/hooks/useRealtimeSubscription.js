
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { productionLogger } from '@/utils/productionLogger';

/**
 * Custom Hook for Supabase Realtime Subscriptions
 * Wraps the complexities of channel management and lifecycle.
 * 
 * @param {string} table - The table name to subscribe to (e.g., 'rooms', 'hotels')
 * @param {string} hotelId - Optional filter for hotel-specific data (recommended for performance)
 * @param {Function} onDataChange - Optional callback when data changes
 * @returns {Object} { status, lastEvent, error }
 */
export const useRealtimeSubscription = (table, hotelId = null, onDataChange = null) => {
  const [status, setStatus] = useState('CONNECTING'); // 'CONNECTING', 'SUBSCRIBED', 'CHANNEL_ERROR', 'TIMED_OUT', 'DISCONNECTED'
  const [lastEvent, setLastEvent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!table) {
        setStatus('DISCONNECTED');
        return;
    }

    // Task 6: Force subscription
    const channelName = `custom-all-channel-${table}-${hotelId || 'all'}`;
    const logPrefix = `[Realtime] 📡`;
    
    setStatus('CONNECTING');
    console.log(`${logPrefix} Initiating subscription to ${channelName}...`);

    let filter = undefined;
    if (hotelId) {
        filter = `id=eq.${hotelId}`; 
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: filter
        },
        (payload) => {
          console.log(`${logPrefix} Update received on ${table} (Event: ${payload.eventType})`);
          setLastEvent(payload);
          if (onDataChange) {
            onDataChange(payload);
          }
        }
      )
      .subscribe((status) => {
        console.log(`${logPrefix} Status change: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          console.log(`✅ [Realtime] SUBSCRIBED to ${channelName}`);
          setStatus('SUBSCRIBED');
          setError(null);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ [Realtime] CHANNEL_ERROR for ${table}`);
          setStatus('CHANNEL_ERROR');
          setError(`Failed to connect to ${table} stream`);
        } else if (status === 'TIMED_OUT') {
           console.warn(`⚠️ [Realtime] Connection TIMED_OUT for ${table}`);
           setStatus('TIMED_OUT');
        } else {
           setStatus(status);
        }
      });

    // Cleanup function
    return () => {
      console.log(`${logPrefix} Unsubscribing from ${table}...`);
      supabase.removeChannel(channel);
      setStatus('DISCONNECTED');
    };
  }, [table, hotelId]); // Intentionally left out onDataChange to prevent re-subscriptions

  return { status, lastEvent, error };
};
