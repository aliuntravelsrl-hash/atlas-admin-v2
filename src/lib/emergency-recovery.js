

import { supabase } from './customSupabaseClient';
import { supabaseDebugger } from './supabase-emergency-debug';
import { emergencySyncService } from '@/services/emergency-sync-service';

/**
 * Emergency System Recovery Module
 * Nuclear option to restore system functionality
 */

export class EmergencyRecovery {
  async recoverSystem() {
    console.group('🚨🚨🚨 EMERGENCY SYSTEM RECOVERY 🚨🚨🚨');
    console.log('Recovery initiated at:', new Date().toISOString());
    
    const results = {
      timestamp: new Date().toISOString(),
      steps: [],
      success: false
    };

    try {
      // STEP 1: Clear all caches
      console.log('\n📍 STEP 1: Clearing all caches...');
      try {
        localStorage.clear();
        sessionStorage.clear();
        results.steps.push({
          step: 'clear_caches',
          status: 'success',
          message: 'All caches cleared'
        });
        console.log('✅ Caches cleared');
      } catch (err) {
        results.steps.push({
          step: 'clear_caches',
          status: 'failed',
          error: err.message
        });
        console.error('❌ Cache clear failed:', err);
      }

      // STEP 2: Verify authentication
      console.log('\n📍 STEP 2: Verifying authentication...');
      const authResult = await supabaseDebugger.verifyAuth();
      results.steps.push({
        step: 'verify_auth',
        status: authResult.success ? 'success' : 'failed',
        data: authResult
      });
      
      if (!authResult.success) {
        console.warn('⚠️ Auth verification failed, attempting to continue...');
      } else {
        console.log('✅ Auth verified');
      }

      // STEP 3: Test connectivity
      console.log('\n📍 STEP 3: Testing Supabase connectivity...');
      const connResult = await supabaseDebugger.testConnectivity();
      results.steps.push({
        step: 'test_connectivity',
        status: connResult.success ? 'success' : 'failed',
        data: connResult
      });

      if (!connResult.success) {
        throw new Error('Connectivity test failed: ' + connResult.error);
      }
      console.log('✅ Connectivity verified');

      // STEP 4: Force fresh hotel sync
      console.log('\n📍 STEP 4: Forcing fresh hotel data sync...');
      const syncResult = await emergencySyncService.syncHotelsFromSupabase();
      results.steps.push({
        step: 'sync_hotels',
        status: syncResult.success ? 'success' : 'failed',
        data: syncResult.metadata
      });

      if (!syncResult.success) {
        throw new Error('Hotel sync failed: ' + syncResult.error);
      }
      console.log('✅ Hotels synced:', syncResult.metadata.count);

      // STEP 5: Reload critical tables
      console.log('\n📍 STEP 5: Reloading critical tables...');
      const tables = ['hotels_master', 'rooms', 'seasons', 'rates'];
      
      for (const table of tables) {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

          if (error) throw error;

          results.steps.push({
            step: `reload_${table}`,
            status: 'success',
            count
          });
          console.log(`✅ ${table}: ${count} rows`);
        } catch (err) {
          results.steps.push({
            step: `reload_${table}`,
            status: 'failed',
            error: err.message
          });
          console.error(`❌ ${table} failed:`, err);
        }
      }

      // STEP 6: Get final status
      console.log('\n📍 STEP 6: Generating recovery report...');
      results.success = results.steps.filter(s => s.status === 'success').length >= 3;
      results.summary = {
        total_steps: results.steps.length,
        successful: results.steps.filter(s => s.status === 'success').length,
        failed: results.steps.filter(s => s.status === 'failed').length
      };

      console.log('\n📊 RECOVERY SUMMARY:');
      console.table(results.summary);
      console.log('\n💾 Full results saved to window.lastRecoveryResults');
      
      if (typeof window !== 'undefined') {
        window.lastRecoveryResults = results;
      }

      console.groupEnd();
      return results;

    } catch (error) {
      console.error('\n💥 RECOVERY FAILED:', error);
      results.success = false;
      results.fatal_error = error.message;
      console.groupEnd();
      return results;
    }
  }

  async quickDiagnostic() {
    console.group('🔍 Quick Diagnostic');
    
    const checks = {
      auth: await supabaseDebugger.verifyAuth(),
      connectivity: await supabaseDebugger.testConnectivity(),
      cache: supabaseDebugger.getCacheStatus(),
      sync_metadata: emergencySyncService.getLastSyncMetadata()
    };

    console.log('Auth:', checks.auth.success ? '✅' : '❌');
    console.log('Connectivity:', checks.connectivity.success ? '✅' : '❌');
    console.log('Cache entries:', checks.cache.length);
    console.log('Last sync:', checks.sync_metadata?.age_display || 'Never');
    
    console.groupEnd();
    return checks;
  }
}

export const recovery = new EmergencyRecovery();

// Make globally available
if (typeof window !== 'undefined') {
  window.recoverSystem = () => recovery.recoverSystem();
  window.quickDiagnostic = () => recovery.quickDiagnostic();
  window.emergencyRecovery = recovery;
}

export default recovery;
