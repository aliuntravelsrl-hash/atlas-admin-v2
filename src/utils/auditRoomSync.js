
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Diagnostic tool to verify room synchronization and integrity
 */
export const auditRoomSync = async (hotelId) => {
    console.log("🔍 Starting Room Sync Audit...");
    
    try {
        // 1. Get raw count
        const { count, error: countError } = await supabase
            .from('rooms')
            .select('*', { count: 'exact', head: true })
            .eq('hotel_id', hotelId);
            
        if (countError) throw countError;

        // 2. Get distinct IDs (simulated)
        const { data: rooms, error: fetchError } = await supabase
            .from('rooms')
            .select('id, image_url')
            .eq('hotel_id', hotelId);
            
        if (fetchError) throw fetchError;

        const uniqueIds = new Set(rooms.map(r => r.id));
        const hasDuplicates = rooms.length !== uniqueIds.size;
        
        // 3. Check image_url presence
        const missingImages = rooms.filter(r => !r.image_url || r.image_url.trim() === '');

        console.log(`📊 Audit Results for Hotel ${hotelId}:`);
        console.log(`   - Total Rows: ${count}`);
        console.log(`   - Unique IDs: ${uniqueIds.size}`);
        console.log(`   - Duplicates: ${hasDuplicates ? 'YES' : 'NO'}`);
        console.log(`   - Missing Images: ${missingImages.length}`);

        return {
            passed: !hasDuplicates && count > 0,
            count: count,
            unique: uniqueIds.size,
            missingImages: missingImages.length
        };

    } catch (error) {
        console.error("❌ Audit Failed:", error);
        return { passed: false, error: error.message };
    }
};
