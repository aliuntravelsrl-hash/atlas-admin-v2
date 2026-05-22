
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Helper to generate SQL statements for data population.
 * NOTE: Does not execute updates automatically for safety.
 * Logs suggested SQL to console.
 */
export const populateHotelMasterColumns = async (localDataList) => {
    console.log("🛠 Generating Population Scripts...");
    const updates = [];

    // Fetch existing DB data
    const { data: dbHotels } = await supabase.from('hotels_master').select('*');

    if (!dbHotels) {
        console.error("Could not fetch DB hotels");
        return;
    }

    localDataList.forEach(local => {
        const dbMatch = dbHotels.find(h => h.slug === local.slug);
        
        if (dbMatch) {
            const updateParts = [];
            
            // Check Description
            if ((!dbMatch.description) && local.description) {
                updateParts.push(`description = '${local.description.replace(/'/g, "''")}'`);
            }
            
            // Check Video
            if ((!dbMatch.video_id) && local.video_id) {
                updateParts.push(`video_id = '${local.video_id}'`);
            }

            // Check JSONB Arrays (Simplified check)
            if ((!dbMatch.rooms_data || dbMatch.rooms_data.length === 0) && local.rooms_data?.length > 0) {
                const jsonStr = JSON.stringify(local.rooms_data).replace(/'/g, "''");
                updateParts.push(`rooms_data = '${jsonStr}'::jsonb`);
            }
            
             if ((!dbMatch.gallery_data || dbMatch.gallery_data.length === 0) && local.gallery_data?.length > 0) {
                const jsonStr = JSON.stringify(local.gallery_data).replace(/'/g, "''");
                updateParts.push(`gallery_data = '${jsonStr}'::jsonb`);
            }

            if (updateParts.length > 0) {
                updates.push(`UPDATE hotels_master SET ${updateParts.join(', ')} WHERE id = '${dbMatch.id}';`);
            }
        }
    });

    if (updates.length > 0) {
        console.log(`\n--- SQL STATEMENTS (${updates.length}) ---`);
        console.log(updates.join('\n'));
        console.log("----------------------------\n");
    } else {
        console.log("✅ No updates needed based on local data comparison.");
    }
};
