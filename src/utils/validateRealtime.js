
import { HotelDataService } from '@/services/HotelDataService';
import { BookingsClient } from '@/services/BookingsClient';
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Realtime Validation Suite
 * Run this in browser console via: window.validateSystem()
 */
export const validateRealtime = async (hotelId) => {
    console.group('🔍 System Validation');
    
    // 1. Check Realtime Connectivity
    try {
        console.time('Realtime Ping');
        const { count, error } = await supabase.from('hotels_master').select('*', { count: 'exact', head: true });
        console.timeEnd('Realtime Ping');
        
        if (error) throw error;
        console.log(`✅ Supabase Connected (Hotels: ${count})`);
    } catch (e) {
        console.error('❌ Supabase Connection Failed:', e);
    }

    // 2. Validate Service Methods
    try {
        if (!hotelId) {
            console.warn('⚠️ No Hotel ID provided, skipping detailed service checks');
        } else {
            const hotel = await HotelDataService.getHotelComplete(hotelId);
            console.log('✅ HotelDataService.getHotelComplete:', hotel ? 'OK' : 'Empty');

            const rooms = await HotelDataService.getRooms(hotelId);
            console.log(`✅ HotelDataService.getRooms: Found ${rooms.length} items`);
        }
    } catch (e) {
        console.error('❌ Service Validation Failed:', e);
    }

    // 3. Validate BookingsClient Compliance
    const methods = ['createBooking', 'getBooking', 'updateBooking', 'cancelBooking'];
    const compliant = methods.every(m => typeof BookingsClient[m] === 'function');
    console.log(compliant ? '✅ BookingsClient API Compliant' : '❌ BookingsClient API Missing Methods');

    console.groupEnd();
    return "Validation Complete";
};

// Expose to window for easy testing
if (typeof window !== 'undefined') {
    window.validateSystem = validateRealtime;
}
