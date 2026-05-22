import { supabase } from '@/lib/customSupabaseClient';

/**
 * utility: diagnosticSlugs.js
 * Objetivo: Obtener slugs reales de la base de datos para diagnosticar fallos de inyección.
 * Filtra por cadenas clave: bahia, palladium, barcelo.
 */

console.log("🔍 [SQL v3.13] Query de diagnóstico para obtener slugs REALES creada");

export const fetchDiagnosticSlugs = async () => {
  try {
    console.log("🕵️‍♂️ Iniciando búsqueda de slugs reales en knowledge_base...");

    const { data, error } = await supabase
      .from('knowledge_base')
      .select('slug')
      .or('slug.ilike.%bahia%,slug.ilike.%palladium%,slug.ilike.%barcelo%')
      .order('slug', { ascending: true });

    if (error) {
      console.error("❌ Error fetching diagnostic slugs:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn("⚠️ No se encontraron slugs que coincidan con los filtros.");
      return [];
    }

    const slugs = data.map(row => row.slug);
    console.log("✅ Slugs encontrados:", slugs);
    return slugs;

  } catch (err) {
    console.error("❌ Excepción en fetchDiagnosticSlugs:", err);
    return [];
  }
};