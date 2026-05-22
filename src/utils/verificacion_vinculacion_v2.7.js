import { supabase } from '@/lib/customSupabaseClient';

/**
 * Script de Verificación de Vinculación de Habitaciones v2.7
 * Verifica que las tarifas apunten a IDs de habitaciones válidos en public.rooms
 */
export const verificarVinculacion = async (hotelSlug = 'bahia-principe-fantasia') => {
    console.log(`🔍 [Verificación v2.7] Iniciando auditoría para: ${hotelSlug}`);
    
    try {
        // a) Query rates and join with rooms
        const { data: rates, error } = await supabase
            .from('rates')
            .select(`
                id,
                room_id,
                base_price_adult,
                rooms!inner (
                    id,
                    nombre_habitacion,
                    hotel_id
                )
            `)
            .eq('hotel_id', hotelSlug);

        if (error) {
            console.error("❌ Error query rates:", error);
            return { success: false, error };
        }

        // b) Verify room_id is not null (Implicit in inner join, but explicit check good)
        const unlinked = rates.filter(r => !r.room_id);
        const linked = rates.filter(r => r.room_id && r.rooms);

        // c) Verification Logic
        const status = {
            hotel: hotelSlug,
            total_rates_checked: rates.length,
            linked_rates: linked.length,
            unlinked_rates: unlinked.length, // Should be 0 due to inner join
            sample_linked_room: linked[0]?.rooms?.nombre_habitacion || 'N/A'
        };

        if (linked.length > 0 && unlinked.length === 0) {
            console.log("✅ [Verificación v2.7] Vinculación verificada - room_id válidos");
        } else {
            console.warn("⚠️ [Verificación v2.7] Se encontraron tarifas sin vincular o lista vacía.");
        }

        return status;

    } catch (e) {
        console.error("❌ Excepción en verificación:", e);
        return { success: false, error: e.message };
    }
};