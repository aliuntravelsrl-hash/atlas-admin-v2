import { hotelService } from '@/services/hotelService';
import { getHotelBySlug } from '@/lib/hotelData';

/**
 * Scripts for Console Validation
 * Usage: Import these in main.jsx temporarily or expose via window object
 */

export const diagnoseHotel = async (slug = 'occidental-caribe') => {
    console.group(`🕵️‍♂️ DIAGNOSIS REPORT: ${slug}`);
    
    // 1. Check Local
    const local = getHotelBySlug(slug);
    console.log('1. Local Data:', local ? '✅ Found' : '❌ Not Found', local);

    // 2. Check Supabase
    try {
        console.time('Supabase Fetch');
        const db = await hotelService.getHotelBySlug(slug);
        console.timeEnd('Supabase Fetch');
        console.log('2. Supabase Data:', db ? '✅ Found' : '❌ Not Found', db);
        
        if (db) {
            console.log('   - video_id:', db.video_id);
            console.log('   - gallery_data:', db.gallery_data?.length || 0, 'items');
            console.log('   - restaurants_data:', db.restaurants_data?.length || 0, 'items');
        }
    } catch (e) {
        console.error('2. Supabase Error:', e);
    }

    console.groupEnd();
};

// Make available globally for quick debugging
if (typeof window !== 'undefined') {
    window.diagnoseHotel = diagnoseHotel;
}