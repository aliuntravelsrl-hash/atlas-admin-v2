import { productionLogger } from '@/utils/productionLogger';

const getEnvVar = (key) => {
  return import.meta.env[`VITE_${key}`] || null;
};

const N8N_WEBHOOK_URL = getEnvVar('N8N_WEBHOOK_URL');
const N8N_AUTH_TOKEN = getEnvVar('N8N_AUTH_TOKEN');

const DIAGNOSIS_CACHE_KEY = 'n8n_diagnosis_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const n8nService = {
  
  /**
   * Validate all workflows (D, E, MCP, F)
   * Returns diagnosis object with globalStatus
   */
  diagnoseAllWorkflows: async (forceRefresh = false) => {
    // 1. Check cache first
    if (!forceRefresh) {
      const cached = n8nService.checkCachedDiagnosis();
      if (cached) return cached;
    }

    const tStart = performance.now();
    const workflows = ['D', 'E', 'MCP', 'F'];
    const results = {};
    let onlineCount = 0;

    // Simulate probing different workflows via the main webhook
    // In a real scenario, these would be different endpoints
    for (const wf of workflows) {
      try {
        const response = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Workflow-ID': wf,
            'X-Probe': 'true',
            ...(N8N_AUTH_TOKEN ? { 'Authorization': `Bearer ${N8N_AUTH_TOKEN}` } : {})
          },
          body: JSON.stringify({ action: 'ping', workflow: wf, timestamp: Date.now() })
        });

        if (response.ok) {
          results[wf] = { status: 'ONLINE', latency: Math.round(performance.now() - tStart) };
          onlineCount++;
        } else {
          results[wf] = { status: 'ERROR', error: `HTTP ${response.status}` };
        }
      } catch (e) {
        results[wf] = { status: 'OFFLINE', error: e.message };
      }
    }

    const globalStatus = 
      onlineCount === workflows.length ? 'ALL_ONLINE' :
      onlineCount > 0 ? 'PARTIAL_ONLINE' : 
      'ALL_OFFLINE';

    const diagnosis = {
      globalStatus,
      workflows: results,
      timestamp: new Date().toISOString(),
      details: 'Comprehensive diagnosis completed'
    };

    // Cache the result
    localStorage.setItem(DIAGNOSIS_CACHE_KEY, JSON.stringify(diagnosis));
    
    productionLogger.logInfo('n8nService', `Diagnosis Complete: ${globalStatus}`);
    return diagnosis;
  },

  checkCachedDiagnosis: () => {
    try {
      const cachedRaw = localStorage.getItem(DIAGNOSIS_CACHE_KEY);
      if (!cachedRaw) return null;
      
      const cached = JSON.parse(cachedRaw);
      const age = new Date().getTime() - new Date(cached.timestamp).getTime();
      
      if (age < CACHE_TTL) {
        return cached;
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  getWorkflowStatus: (workflowName) => {
    const cached = n8nService.checkCachedDiagnosis();
    if (cached && cached.workflows && cached.workflows[workflowName]) {
      return cached.workflows[workflowName];
    }
    return { status: 'UNKNOWN' };
  },

  /**
   * Trigger generic workflow with automatic fallback
   */
  triggerWorkflow: async (workflowId, payload, fallbackFn = null) => {
    try {
      if (!N8N_WEBHOOK_URL) throw new Error('N8N_WEBHOOK_URL not configured');

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Workflow-ID': workflowId,
          ...(N8N_AUTH_TOKEN ? { 'Authorization': `Bearer ${N8N_AUTH_TOKEN}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`Workflow ${workflowId} failed with ${response.status}`);
      
      return { success: true, data: await response.json().catch(() => ({})) };

    } catch (error) {
      productionLogger.logError('n8nService', error, { action: `triggerWorkflow:${workflowId}`, fallback: !!fallbackFn });
      
      if (fallbackFn) {
        productionLogger.logWarning('n8nService', 'Executing fallback due to n8n failure');
        return await fallbackFn();
      }
      
      return { success: false, error: error.message };
    }
  },

  // --- Original methods preserved for backward compatibility ---
  diagnoseN8nConnection: async () => {
    const diag = await n8nService.diagnoseAllWorkflows();
    const isConnected = diag.globalStatus === 'ALL_ONLINE' || diag.globalStatus === 'PARTIAL_ONLINE';
    return {
      connected: isConnected,
      errorType: isConnected ? null : 'NETWORK_ERROR',
      message: diag.globalStatus,
      timestamp: diag.timestamp
    };
  },

  triggerWorkflowE: async (hotelId, rateData) => {
     return n8nService.triggerWorkflow('E', { hotel_id: hotelId, data: rateData });
  },

  triggerPriceUpdateWorkflow: async (hotelId, payload) => {
     return n8nService.triggerWorkflow('PRICE_UPDATE', { hotel_id: hotelId, ...payload });
  }
};

// Start background refresh loop
setInterval(() => {
  n8nService.diagnoseAllWorkflows(true).catch(err => console.error("Background diagnosis failed", err));
}, CACHE_TTL);