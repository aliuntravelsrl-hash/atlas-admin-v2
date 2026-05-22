
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Servicio RAG (Retrieval-Augmented Generation) v2.8
 * Sincronizado con kb_documents como fuente única de verdad.
 * Corregido: Referencias a tabla knowledge_base eliminadas.
 */
export const ragService = {
    
    async syncAttributes(hotelId, attributes) {
        try {
            console.log(`🔄 [RAG v2.8] Sincronizando (Mapeo Universal) para ${hotelId}...`);
            
            // Table 'kb_documents' (formerly knowledge_base)
            const { data, error } = await supabase
                .from('kb_documents')
                .upsert({
                    entity_key: hotelId, 
                    entity_type: 'hotel',
                    content_json: { 
                        hotel_id: hotelId,
                        video_aliun: attributes.video_aliun,
                        gastronomia: attributes.gastronomia,
                        servicios: attributes.servicios,
                        updated_by: 'admin_sync_v2.8',
                        timestamp: new Date().toISOString()
                    },
                    content_text: `Info Actualizada (${hotelId}): ${attributes.gastronomia?.length || 0} restaurantes, Video: ${attributes.video_aliun ? 'Si' : 'No'}.`
                })
                .select();

            if (error) throw error;
            console.log("✅ [RAG v2.8] Mapeo universal - Respuestas sincronizadas");
            return data;

        } catch (err) {
            console.error("❌ [RAG] Error sync attributes:", err);
            return null;
        }
    },

    async getEnrichedContext(hotelId, userQuery) {
        try {
            // Check if query is about food/restaurants
            const isFoodQuery = /restaurante|comida|cena|desayuno|buffet|gastronom/i.test(userQuery);
            const isServiceQuery = /servicio|actividad|niños|piscina|teatro/i.test(userQuery);

            if (isFoodQuery || isServiceQuery) {
                // Table 'kb_documents'
                const { data } = await supabase
                    .from('kb_documents')
                    .select('content_json') 
                    .eq('entity_key', hotelId) 
                    .limit(1);

                if (data && data.length > 0) {
                    const meta = data[0].content_json;
                    let context = "";
                    
                    if (isFoodQuery && meta.gastronomia) {
                         const list = meta.gastronomia.map(r => `${r.nombre} (${r.tipo})`).join(', ');
                         context += `\n[FUENTE OFICIAL KB] Restaurantes disponibles: ${list}.`;
                    }
                    if (isServiceQuery && meta.servicios) {
                         const list = meta.servicios.map(s => s.nombre).join(', ');
                         context += `\n[FUENTE OFICIAL KB] Servicios destacados: ${list}.`;
                    }
                    
                    console.log("✅ [RAG v2.8] Gastronomía sincronizada - Contexto enriquecido desde KB");
                    return context;
                }
            }
            return "";
        } catch (e) {
            console.error("[RAG] Context fetch error", e);
            return "";
        }
    },

    async updateKnowledgeFragment(hotelId, content, metadata = {}) {
        try {
            // Table 'kb_documents'
            const { data, error } = await supabase
                .from('kb_documents')
                .insert([{
                    content_text: content, 
                    entity_key: hotelId,
                    entity_type: 'hotel',
                    content_json: { ...metadata, hotel_id: hotelId, timestamp: new Date().toISOString() } 
                }])
                .select();
            if (error) throw error;
            return data;
        } catch (e) {
            console.error(e);
            return null;
        }
    },

    subscribeToKnowledgeUpdates(callback) {
        // Table 'kb_documents'
        const subscription = supabase
            .channel('rag-updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'kb_documents' },
                (payload) => {
                    console.log("🤖 [RAG] Cambio detectado:", payload);
                    if (callback) callback(payload);
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(subscription); };
    },
    
    async getHotelKnowledge(hotelId) {
        // Table 'kb_documents'
        const { data, error } = await supabase
            .from('kb_documents')
            .select('*')
            .eq('entity_key', hotelId);
        if (error) return [];
        return data;
    }
};
