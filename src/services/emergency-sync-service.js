

import { supabase } from '@/lib/customSupabaseClient';
import { supabaseDebugger } from '@/lib/supabase-emergency-debug';

const SYNC_CACHE_KEY = 'emergency_sync_hotels';
const SYNC_METADATA_KEY = 'emergency_sync_metadata';

export class EmergencySyncService {
  async syncHotelsFromSupabase() {
    console.group('🚨 EMERGENCY HOTEL SYNC');
    console.log('Sync started at:', new Date().toISOString());
    
    const startTime = Date.now();
    
    try {
      // Step 1: Verify connection
      supabaseDebugger.log('Step 1: Verifying Supabase connection...');
      const connTest = await supabaseDebugger.testConnectivity();
      
      if (!connTest.success) {
        throw new Error('Connectivity test failed: ' + connTest.error);
      }

      // Step 2: Fetch all hotels
      supabaseDebugger.log('Step 2: Fetching hotels from hotels_master...');
      const { data: hotels, error } = await supabase
        .from('hotels_master')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        throw new Error('Query failed: ' + error.message);
      }

      // Step 3: Store in localStorage
      supabaseDebugger.log('Step 3: Storing in emergency cache...');
      const metadata = {
        fetch_time: Date.now(),
        count: hotels?.length || 0,
        status: 'success',
        duration: Date.now() - startTime
      };

      localStorage.setItem(SYNC_CACHE_KEY, JSON.stringify(hotels));
      localStorage.setItem(SYNC_METADATA_KEY, JSON.stringify(metadata));

      supabaseDebugger.log('✅ Sync completed successfully', metadata);
      console.log('Hotels synced:', hotels?.length || 0);
      console.log('Duration:', metadata.duration + 'ms');
      console.groupEnd();

      return {
        success: true,
        data: hotels,
        metadata
      };

    } catch (error) {
      const errorMetadata = {
        fetch_time: Date.now(),
        count: 0,
        status: 'error',
        error: error.message,
        duration: Date.now() - startTime
      };

      localStorage.setItem(SYNC_METADATA_KEY, JSON.stringify(errorMetadata));
      supabaseDebugger.log('❌ Sync failed', errorMetadata);
      
      console.error('Sync error:', error);
      console.groupEnd();

      return {
        success: false,
        error: error.message,
        metadata: errorMetadata
      };
    }
  }

  getLastSyncMetadata() {
    try {
      const metadata = localStorage.getItem(SYNC_METADATA_KEY);
      if (!metadata) return null;
      
      const parsed = JSON.parse(metadata);
      const ageMinutes = Math.floor((Date.now() - parsed.fetch_time) / 60000);
      
      return {
        ...parsed,
        age_minutes: ageMinutes,
        age_display: ageMinutes < 60 
          ? `${ageMinutes}m ago` 
          : `${Math.floor(ageMinutes / 60)}h ago`
      };
    } catch (err) {
      console.error('Failed to read sync metadata:', err);
      return null;
    }
  }

  getCachedHotels() {
    try {
      const cached = localStorage.getItem(SYNC_CACHE_KEY);
      if (!cached) return null;
      
      const hotels = JSON.parse(cached);
      supabaseDebugger.log('📬 Retrieved cached hotels', { count: hotels.length });
      return hotels;
    } catch (err) {
      console.error('Failed to read cached hotels:', err);
      return null;
    }
  }

  clearCache() {
    localStorage.removeItem(SYNC_CACHE_KEY);
    localStorage.removeItem(SYNC_METADATA_KEY);
    supabaseDebugger.log('🧹 Emergency sync cache cleared');
  }
}

export const emergencySyncService = new EmergencySyncService();

// Make globally available
if (typeof window !== 'undefined') {
  window.emergencySyncService = emergencySyncService;
}
