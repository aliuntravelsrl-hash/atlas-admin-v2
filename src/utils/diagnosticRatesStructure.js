import { supabase } from '@/lib/customSupabaseClient';

/**
 * Ejecuta diagnóstico profundo de estructura para tablas de pricing
 * v3.25
 */
export async function runRatesDiagnostic() {
  console.log("🔴 [Diagnóstico Estructura rates v3.25] Iniciado");
  const results = {};

  try {
    // 1. Estructura Rates
    const { data: ratesStructure, error: err1 } = await supabase.rpc('run_sql_query', {
        // Nota: RPC requiere permisos especiales, si falla usamos select directo a tablas si es posible, 
        // pero information_schema suele requerir acceso SQL directo o RPC. 
        // Intentaremos leer metadata si es posible, sino, leeremos un registro para inferir.
    }); 
    
    // Método alternativo: Intentar leer 1 registro de cada tabla para ver qué devuelve
    
    // Check Hotels
    const { data: hotelsData, error: hotelsError } = await supabase
      .from('hotels')
      .select('*')
      .limit(1);
    results.hotelsSample = hotelsData ? hotelsData[0] : 'No data';
    results.hotelsError = hotelsError;

    // Check Rates
    const { data: ratesData, error: ratesError } = await supabase
      .from('rates')
      .select('*')
      .limit(1);
    results.ratesSample = ratesData ? ratesData[0] : 'No data';
    results.ratesError = ratesError;

    // Check Seasons
    const { data: seasonsData, error: seasonsError } = await supabase
      .from('seasons')
      .select('*')
      .limit(1);
    results.seasonsSample = seasonsData ? seasonsData[0] : 'No data';
    results.seasonsError = seasonsError;

    console.log("📊 RESULTADOS DIAGNÓSTICO v3.25:", results);
    
    if (ratesError) console.error("❌ Error leyendo rates:", ratesError);
    if (seasonsError) console.error("❌ Error leyendo seasons:", seasonsError);

    console.log("✅ [Diagnóstico Estructura rates v3.25] Completado");
    return results;

  } catch (e) {
    console.error("❌ Error crítico en diagnóstico:", e);
    return { error: e.message };
  }
}