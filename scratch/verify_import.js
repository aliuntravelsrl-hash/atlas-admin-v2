import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envConfig = {};
try {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      envConfig[key] = val;
    }
  });
} catch (e) {}

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log('Verificando importación en Supabase...');
  
  // 1. Obtener conteo total en crm_leads
  const { count, error } = await supabase
    .from('crm_leads')
    .select('*', { count: 'exact', head: true });
    
  if (error) {
    console.error('❌ Error al obtener conteo:', error.message);
  } else {
    console.log(`✅ Total de leads en public.crm_leads: ${count}`);
  }
  
  // 2. Obtener los últimos 5 insertados
  const { data: recentLeads, error: recErr } = await supabase
    .from('crm_leads')
    .select('full_name, phone, source, stage, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (recErr) {
    console.error('❌ Error al obtener registros recientes:', recErr.message);
  } else {
    console.log('Últimos 5 leads insertados:');
    recentLeads.forEach((l, idx) => {
      console.log(`  ${idx + 1}. "${l.full_name}" | Tel: ${l.phone} | Stage: ${l.stage} | Creado: ${l.created_at}`);
    });
  }
}

verify();
