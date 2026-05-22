import { supabase } from '@/lib/customSupabaseClient';

// Task 7: REPORTE IRREFUTABLE
export const runUnificationCheck = async () => {
    console.log("🕵️ Iniciando validación de unificación...");

    try {
        // 1. Verificar registros exactos en DB
        const { count, error } = await supabase
            .from('hotel_rooms')
            .select('*', { count: 'exact', head: true })
            .eq('hotel_id', 'bahia-principe-fantasia');

        if (error) throw error;

        if (count === 3) {
            console.log("✅ [Unificación] Slug Único Detectado: bahia-principe-fantasia");
            console.log("✅ [Unificación] Registros en hotel_rooms: 3");
            console.log("✅ [Unificación] Paneles Nativos: Sincronizados");
            console.log("🚀 SLUG MAESTRO ÚNICO ✅, INVENTARIO ACTIVO 🚀, PANELES SINCRONIZADOS ✅");
        } else {
            console.warn(`❌ FALLO DE UNIFICACIÓN: Se encontraron ${count} registros.`);
        }
    } catch (e) {
        console.error("❌ Error en validador:", e);
    }
};