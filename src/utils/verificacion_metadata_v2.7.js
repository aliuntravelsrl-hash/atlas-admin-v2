import { supabase } from '@/lib/customSupabaseClient';

/**
 * Script de Verificación de Metadata KB v2.7
 * Confirma que Gastronomía y Servicios existen en el Knowledge Base
 */
export const verificarMetadata = async (hotelSlug = 'bahia-principe-fantasia') => {
    console.log(`🔍 [Metadata v2.7] Verificando inyección KB para: ${hotelSlug}`);

    try {
        // a) Query knowledge_base
        const { data, error } = await supabase
            .from('knowledge_base')
            .select('metadata')
            .eq('metadata->>hotel_id', hotelSlug)
            .limit(1);

        if (error) throw error;

        if (!data || data.length === 0) {
            return { success: false, message: 'No entry found in KB' };
        }

        const meta = data[0].metadata;
        const gastronomia = meta.gastronomia || [];
        const servicios = meta.servicios || [];

        // b) & c) Verify content
        const results = {
            hotel: hotelSlug,
            has_gastronomia: gastronomia.length > 0,
            gastronomia_count: gastronomia.length,
            has_servicios: servicios.length > 0,
            servicios_count: servicios.length,
            sample_restaurant: gastronomia[0]?.nombre || 'None'
        };

        if (results.has_gastronomia && results.has_servicios) {
             console.log("✅ [Metadata v2.7] Gastronomía y servicios inyectados correctamente");
        } else {
             console.warn("⚠️ [Metadata v2.7] Datos incompletos en KB");
        }

        return results;

    } catch (e) {
        console.error("❌ Error verificando metadata:", e);
        return { success: false, error: e.message };
    }
};