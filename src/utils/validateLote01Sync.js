
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Validates the Lote 01 Injection and Synchronization status.
 * Executes queries against Supabase to ensure data integrity for the 10 target hotels.
 */
export const validateLote01Sync = async () => {
    console.log("🚀 Starting Lote 01 Validation...");

    const targetNames = [
        'Bahia Principe Grand Aquamarine',
        'Bahia Principe Grand Bavaro',
        'Bahia Principe Luxury Ambar',
        'Bahia Principe Luxury Esmeralda',
        'Bahia Principe Grand Turquesa',
        'Bahia Principe Luxury Punta Cana',
        'Bahia Principe Fantasia Punta Cana',
        'Barcelo Bavaro Palace',
        'Barcelo Bavaro Beach',
        'Be Live Collection Punta Cana'
    ];

    const report = {
        timestamp: new Date().toISOString(),
        total_hotels: targetNames.length,
        hotels_processed: [],
        summary: {
            total_rooms: 0,
            total_media: 0,
            all_synced: false
        },
        errors: []
    };

    try {
        // 1. Get Hotel IDs
        const { data: hotels, error: hotelsError } = await supabase
            .from('hotels_master')
            .select('id, name')
            .in('name', targetNames);

        if (hotelsError) throw hotelsError;

        let allSynced = true;

        for (const hotel of hotels) {
            // 2. Validate Rooms
            const { count: roomCount, error: roomError } = await supabase
                .from('rooms')
                .select('*', { count: 'exact', head: true })
                .eq('hotel_id', hotel.id)
                .eq('is_active', true);
            
            if (roomError) report.errors.push(`Room fetch error for ${hotel.name}: ${roomError.message}`);

            // 3. Validate Media
            const { count: mediaCount, error: mediaError } = await supabase
                .from('hotel_media')
                .select('*', { count: 'exact', head: true })
                .eq('hotel_id', hotel.id)
                .eq('is_active', true);

            if (mediaError) report.errors.push(`Media fetch error for ${hotel.name}: ${mediaError.message}`);

            // 4. Validate Sync Log
            const { data: syncLog, error: syncError } = await supabase
                .from('rooms_sync_log')
                .select('*')
                .eq('hotel_id', hotel.id)
                .order('synced_at', { ascending: false })
                .limit(1)
                .single();

            const isSynced = syncLog && syncLog.status === 'synced';
            if (!isSynced) allSynced = false;

            // Hotel Report Status
            const status = (roomCount >= 6 && mediaCount >= 3 && isSynced) ? '✅ OK' : '❌ FAIL';

            report.hotels_processed.push({
                name: hotel.name,
                id: hotel.id,
                rooms: roomCount,
                media: mediaCount,
                sync_status: isSynced ? 'SYNCED' : 'PENDING',
                status_icon: status
            });

            report.summary.total_rooms += (roomCount || 0);
            report.summary.total_media += (mediaCount || 0);
        }

        report.summary.all_synced = allSynced && report.errors.length === 0;

        console.log("📊 Validation Report Generated:", report);
        return report;

    } catch (error) {
        console.error("❌ Critical Validation Error:", error);
        return { error: error.message };
    }
};
