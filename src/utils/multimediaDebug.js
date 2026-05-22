import { supabase } from '@/lib/customSupabaseClient';

/**
 * Debug helper to quickly inspect multimedia JSONB columns
 */
export const debugMultimedia = async (slug = 'bahia-principe-turquesa') => {
    console.group(`🎬 Multimedia Debug: ${slug}`);
    
    const { data, error } = await supabase
        .from('hotels')
        .select('video_id, gallery_data, restaurants_data, services_data, rooms_data')
        .eq('slug', slug)
        .single();
    
    if (error) {
        console.error("Fetch Error:", error);
    } else {
        console.log("Video ID:", data.video_id ? `✅ ${data.video_id}` : "❌ Missing");
        
        const checkArray = (arr, expected, name) => {
            const len = Array.isArray(arr) ? arr.length : 0;
            const status = len === expected ? "✅" : (len > 0 ? "⚠️" : "❌");
            console.log(`${name}: ${status} ${len}/${expected}`);
            if (len > 0) console.table(arr.slice(0, 3)); // Show preview
        };

        checkArray(data.gallery_data, 12, "Gallery");
        checkArray(data.restaurants_data, 8, "Restaurants");
        checkArray(data.services_data, 12, "Services");
        checkArray(data.rooms_data, 6, "Rooms");
    }
    
    console.groupEnd();
};

if (typeof window !== 'undefined') {
    window.debugMultimedia = debugMultimedia;
}