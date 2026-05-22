
import { supabase } from '@/lib/customSupabaseClient';

/**
 * SyncService v2.0
 * Handles manual triggering of synchronization routines for SSOT Multimedia v6.5
 */
export const syncService = {
  
  /**
   * Triggers the dual-write sync function for a specific hotel.
   * This updates both 'hotels' and 'hotels_master' tables based on 'hotel_media'.
   * @param {string} hotelId - UUID of the hotel to sync
   */
  async syncHotelMedia(hotelId) {
    try {
      if (!hotelId) throw new Error("Hotel ID is required");

      console.log(`[SyncService] 🔄 Triggering sync for hotel: ${hotelId}`);
      
      const { error } = await supabase.rpc('sync_hotel_media_mirror_dual', { 
        p_hotel_id: hotelId 
      });

      if (error) throw error;
      
      console.log(`[SyncService] ✅ Sync successful for ${hotelId}`);
      return { success: true, hotelId };

    } catch (error) {
      console.error(`[SyncService] ❌ Sync failed for ${hotelId}:`, error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Triggers a massive synchronization for all hotels.
   * Note: This runs client-side iterations. For large datasets, use the SQL DO block.
   */
  async syncAllHotels() {
    try {
      console.log('[SyncService] 🚀 Starting massive synchronization...');
      
      const { data: hotels, error: fetchError } = await supabase
        .from('hotels_master')
        .select('id');

      if (fetchError) throw fetchError;

      let successCount = 0;
      let failCount = 0;

      for (const hotel of hotels) {
        const result = await this.syncHotelMedia(hotel.id);
        if (result.success) successCount++;
        else failCount++;
      }

      console.log(`[SyncService] 🏁 Massive sync complete. Success: ${successCount}, Fail: ${failCount}`);
      return { success: true, total: hotels.length, synced: successCount, failed: failCount };

    } catch (error) {
      console.error('[SyncService] ❌ Massive sync failed:', error.message);
      return { success: false, error: error.message };
    }
  }
};
