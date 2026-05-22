

import { supabase } from './customSupabaseClient';

/**
 * Emergency Supabase Debugging Module
 * Provides aggressive logging, connectivity testing, and fallback mechanisms
 */

const CACHE_KEY = 'supabase_emergency_cache';
const CACHE_TIMESTAMP_KEY = 'supabase_cache_timestamp';

export class SupabaseEmergencyDebug {
  constructor() {
    this.logs = [];
    this.startTime = Date.now();
  }

  log(message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      message,
      data,
      elapsed: Date.now() - this.startTime
    };
    this.logs.push(logEntry);
    console.log(`[SUPABASE DEBUG ${timestamp}]`, message, data || '');
    return logEntry;
  }

  async verifyAuth() {
    this.log('🔐 Verifying authentication...');
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        this.log('❌ Auth error', error);
        return { success: false, error };
      }

      if (!session) {
        this.log('⚠️ No active session');
        return { success: false, error: 'No session' };
      }

      this.log('✅ Auth verified', {
        user_id: session.user.id,
        email: session.user.email
      });

      return { success: true, session };
    } catch (err) {
      this.log('💥 Auth verification failed', err);
      return { success: false, error: err.message };
    }
  }

  async testConnectivity() {
    this.log('🔌 Testing Supabase connectivity...');
    try {
      const { data, error, count } = await supabase
        .from('hotels_master')
        .select('id', { count: 'exact', head: true });

      if (error) {
        this.log('❌ Connectivity test failed', error);
        return { success: false, error };
      }

      this.log('✅ Connectivity test passed', { count });
      return { success: true, count };
    } catch (err) {
      this.log('💥 Connectivity test crashed', err);
      return { success: false, error: err.message };
    }
  }

  async executeQuery(tableName, query = '*', filters = {}) {
    this.log(`📊 Executing query on ${tableName}...`, filters);
    
    try {
      let queryBuilder = supabase.from(tableName).select(query);

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        queryBuilder = queryBuilder.eq(key, value);
      });

      const startTime = Date.now();
      const { data, error, count } = await queryBuilder;
      const duration = Date.now() - startTime;

      if (error) {
        this.log(`❌ Query failed (${duration}ms)`, error);
        return { success: false, error, data: null };
      }

      this.log(`✅ Query succeeded (${duration}ms)`, {
        rows: data?.length || 0,
        duration
      });

      // Cache successful response
      this.cacheData(tableName, data);

      return { success: true, data, count, duration };
    } catch (err) {
      this.log('💥 Query crashed', err);
      return { success: false, error: err.message, data: null };
    }
  }

  cacheData(key, data) {
    try {
      const cacheKey = `${CACHE_KEY}_${key}`;
      localStorage.setItem(cacheKey, JSON.stringify(data));
      localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
      this.log(`💾 Cached data for ${key}`, { rows: data?.length || 0 });
    } catch (err) {
      this.log('⚠️ Cache write failed', err);
    }
  }

  getCachedData(key) {
    try {
      const cacheKey = `${CACHE_KEY}_${key}`;
      const cached = localStorage.getItem(cacheKey);
      const timestamp = localStorage.getItem(`${cacheKey}_timestamp`);
      
      if (!cached) {
        this.log(`📭 No cache found for ${key}`);
        return null;
      }

      const data = JSON.parse(cached);
      const age = Date.now() - parseInt(timestamp || '0');
      const ageMinutes = Math.floor(age / 60000);

      this.log(`📬 Cache hit for ${key}`, {
        rows: data?.length || 0,
        age: `${ageMinutes}m ago`
      });

      return { data, timestamp: parseInt(timestamp), age };
    } catch (err) {
      this.log('⚠️ Cache read failed', err);
      return null;
    }
  }

  getFallbackData(type) {
    const fallbacks = {
      hotels: [],
      destinations: ['punta-cana', 'la-romana', 'puerto-plata'],
      kpis: {
        totalQuotations: 0,
        bookingsCount: 0,
        potentialRevenue: 0,
        conversionRate: 0
      }
    };

    this.log(`🔄 Returning fallback data for ${type}`);
    return fallbacks[type] || null;
  }

  clearAllCaches() {
    this.log('🧹 Clearing all emergency caches...');
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(k => k.startsWith(CACHE_KEY));
      
      cacheKeys.forEach(key => {
        localStorage.removeItem(key);
        localStorage.removeItem(`${key}_timestamp`);
      });

      this.log('✅ Caches cleared', { count: cacheKeys.length });
      return { success: true, cleared: cacheKeys.length };
    } catch (err) {
      this.log('❌ Cache clear failed', err);
      return { success: false, error: err.message };
    }
  }

  getDebugReport() {
    return {
      logs: this.logs,
      totalTime: Date.now() - this.startTime,
      cacheStatus: this.getCacheStatus()
    };
  }

  getCacheStatus() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_KEY));
    return keys.map(key => {
      const timestamp = localStorage.getItem(`${key}_timestamp`);
      const age = timestamp ? Date.now() - parseInt(timestamp) : null;
      return {
        key,
        age: age ? Math.floor(age / 60000) + 'm' : 'unknown',
        size: localStorage.getItem(key)?.length || 0
      };
    });
  }
}

// Singleton instance
export const supabaseDebugger = new SupabaseEmergencyDebug();

// Quick test utilities
export const quickTests = {
  async auth() {
    console.group('🔐 Auth Test');
    const result = await supabaseDebugger.verifyAuth();
    console.log('Result:', result);
    console.groupEnd();
    return result;
  },

  async connectivity() {
    console.group('🔌 Connectivity Test');
    const result = await supabaseDebugger.testConnectivity();
    console.log('Result:', result);
    console.groupEnd();
    return result;
  },

  async hotels() {
    console.group('🏨 Hotels Query Test');
    const result = await supabaseDebugger.executeQuery('hotels_master', '*');
    console.log('Result:', result);
    console.groupEnd();
    return result;
  },

  cache() {
    console.group('💾 Cache Status');
    const status = supabaseDebugger.getCacheStatus();
    console.table(status);
    console.groupEnd();
    return status;
  }
};

// Make available globally for console debugging
if (typeof window !== 'undefined') {
  window.supabaseDebugger = supabaseDebugger;
  window.quickTests = quickTests;
}

export default supabaseDebugger;
