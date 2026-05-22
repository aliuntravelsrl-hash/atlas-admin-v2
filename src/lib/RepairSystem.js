import { createClient } from '@supabase/supabase-js';

const RepairSystem = {
  fixEnvironment: () => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`%c[${timestamp}] 🛠️ Iniciando ALIUN Repair System v1.1...`, 'color: #3b82f6; font-weight: bold;');
    
    // Primary Vite variables
    let url = import.meta.env.VITE_SUPABASE_URL;
    let key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // Legacy Fallbacks
    if (!url) {
        console.warn(`%c[${timestamp}] ⚠️ VITE_SUPABASE_URL no encontrada. Buscando fallback REACT_APP_...`, 'color: #f59e0b;');
        url = import.meta.env.REACT_APP_SUPABASE_URL;
    }
    if (!key) {
        console.warn(`%c[${timestamp}] ⚠️ VITE_SUPABASE_ANON_KEY no encontrada. Buscando fallback REACT_APP_...`, 'color: #f59e0b;');
        key = import.meta.env.REACT_APP_SUPABASE_ANON_KEY;
    }

    const missing = [];
    if (!url) missing.push('SUPABASE_URL');
    if (!key) missing.push('SUPABASE_ANON_KEY');

    if (missing.length > 0) {
      console.warn(`%c[${timestamp}] ⚠️ Variables críticas faltantes: ${missing.join(', ')}`, 'color: #ef4444; font-weight: bold;');
      return { status: 'WARNING', missing, url, key };
    }
    
    console.log(`%c[${timestamp}] ✅ Variables de entorno verificadas correctamente.`, 'color: #22c55e; font-weight: bold;');
    return { status: 'OK', url, key };
  },

  getSafeClient: (createClientFn) => {
    const timestamp = new Date().toLocaleTimeString();
    const env = RepairSystem.fixEnvironment(); // Re-run to get vars safely
    const url = env.url;
    const key = env.key;

    if (!url) {
      const msg = "ERROR_URL_INVALIDA: La URL de Supabase no está definida.";
      console.error(`%c[${timestamp}] ❌ ${msg}`, 'color: #ef4444;');
      throw new Error(msg);
    }

    // Strict validation: Must contain 'supabase.co' AND NOT 'localhost'
    const isLocal = url.includes('localhost') || url.includes('127.0.0.1');
    const isCloud = url.includes('supabase.co');

    if (isLocal) {
        const msg = "ERROR_URL_INVALIDA: Localhost no permitido en producción. Se requiere instancia segura.";
        console.error(`%c[${timestamp}] ❌ ${msg}`, 'color: #ef4444;');
        throw new Error(msg);
    }

    if (!isCloud) {
         // User requested strictly to validate "supabase.co"
         console.warn(`%c[${timestamp}] ⚠️ La URL no contiene 'supabase.co'. Verificando validez...`, 'color: #f59e0b;');
         const msg = "ERROR_URL_INVALIDA: La URL debe pertenecer al dominio 'supabase.co'.";
         console.error(`%c[${timestamp}] ❌ ${msg}`, 'color: #ef4444;');
         throw new Error(msg);
    }

    if (!key) {
        const msg = "ERROR_KEY_FALTANTE: La Anon Key no está presente.";
        console.error(`%c[${timestamp}] ❌ ${msg}`, 'color: #ef4444;');
        throw new Error(msg);
    }

    try {
      const client = createClientFn(url, key);
      console.log(`%c[${timestamp}] ✅ Cliente Supabase inicializado (Safe Mode).`, 'color: #22c55e;');
      return client;
    } catch (error) {
      console.error(`%c[${timestamp}] ❌ Error crítico al inicializar cliente: ${error.message}`, 'color: #ef4444;');
      throw error;
    }
  },

  triggerReingesta: async (slug = 'GLOBAL') => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`%c[${timestamp}] 🚀 Solicitando re-sincronización (Flujo F) para: [${slug}]`, 'color: #8b5cf6; font-weight: bold;');
    
    const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_FLUJO_F || "https://n8n-n8n.xaruuo.easypanel.host/webhook/admin/flujo-f";
    
    // Fallback if VITE var is empty string
    const targetUrl = webhookUrl.length > 5 ? webhookUrl : "https://n8n-n8n.xaruuo.easypanel.host/webhook/admin/flujo-f";

    try {
        console.log(`%c[${timestamp}] 📡 Conectando con N8N: ${targetUrl}`, 'color: #64748b;');
        
        const response = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            slug: slug,
            timestamp: new Date().toISOString(),
            source: 'ALIUN_RepairSystem_v1.1',
            action: 'TRIGGER_REINGESTA'
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        console.log(`%c[${timestamp}] ✅ Re-sincronización activada correctamente.`, 'color: #22c55e; font-weight: bold;');
        return true;

    } catch (error) {
        console.error(`%c[${timestamp}] ❌ Error en Re-ingesta: ${error.message}`, 'color: #ef4444;');
        return false;
    }
  },

  certifySystemHealth: async (supabaseClient) => {
    const timestamp = new Date().toISOString();
    const prettyTime = new Date().toLocaleTimeString();
    
    console.log(`%c[${prettyTime}] 📊 Iniciando Certificación de Salud del Sistema (Deep Check)...`, 'color: #3b82f6; font-weight: bold;');
    
    const report = {
      timestamp,
      status: "PENDING",
      variables: {
        url: !!import.meta.env.VITE_SUPABASE_URL || !!import.meta.env.REACT_APP_SUPABASE_URL,
        key: !!import.meta.env.VITE_SUPABASE_ANON_KEY || !!import.meta.env.REACT_APP_SUPABASE_ANON_KEY
      },
      network: "UNKNOWN",
      data_integrity: "UNKNOWN",
      records_found: 0,
      details: null
    };

    try {
      // 1. Env Check
      if (!report.variables.url || !report.variables.key) {
        throw new Error("ERROR_KEY_FALTANTE");
      }

      // 2. Network & Data Check (Ping + Knowledge Base Count)
      const start = performance.now();
      
      const { count, error } = await supabaseClient
        .from('knowledge_base')
        .select('*', { count: 'exact', head: true });
        
      const latency = Math.round(performance.now() - start);

      if (error) {
        report.network = "ERROR";
        report.data_integrity = "FAILED";
        throw new Error(`ERROR_TECNICO: ${error.message}`);
      }

      report.network = "OK";
      report.records_found = count || 0;

      // 3. Status Determination
      if (report.records_found > 0) {
          report.data_integrity = "VERIFIED";
          report.status = "RESUELTO ✅";
          report.details = { latency: `${latency}ms`, message: "Sistema Operativo" };
          console.log(`%c[${prettyTime}] ✅ SISTEMA OPERATIVO: Ceguera de datos eliminada. (${count} registros)`, 'color: #22c55e; font-weight: bold;');
      } else {
          // Empty DB = CRISIS
          report.data_integrity = "EMPTY";
          report.status = "CRISIS ❌";
          report.details = { latency: `${latency}ms`, message: "Base de datos vacía - Requiere Re-ingesta" };
          console.warn(`%c[${prettyTime}] ❌ SISTEMA EN CRISIS: Base de datos vacía.`, 'color: #f59e0b; font-weight: bold;');
      }

    } catch (e) {
      const isCrisis = e.message.includes('ERROR_KEY') || e.message.includes('ERROR_URL');
      report.status = isCrisis ? "CRISIS ❌" : "ERROR_TECNICO";
      report.details = { error: e.message };
      console.error(`%c[${prettyTime}] ❌ ${report.status}: ${e.message}`, 'color: #ef4444; font-weight: bold;');
    }

    // Dual Persistence
    window.SYSTEM_HEALTH = report;
    try {
      localStorage.setItem('aliun_health_report', JSON.stringify(report));
    } catch (err) { /* ignore */ }

    return report;
  }
};

export default RepairSystem;