
import { supabase } from '@/lib/customSupabaseClient';
import { ErrorHandler } from '@/utils/ErrorHandler';

/**
 * BookingsClient v2.2.45
 * Swagger Compliant Booking Service
 * Handles Guest Data, Pricing, and Booking Lifecycle
 */
export const BookingsClient = {
  
  /**
   * Creates a new booking in the system.
   * @param {Object} payload - Booking data strictly typed
   * @returns {Promise<Object>} Created booking record
   */
  async createBooking(payload) {
    try {
      // Validate Guest Data Structure (Swagger Schema)
      const { guest_data, pricing_data, hotel_id, room_id } = payload;
      
      if (!hotel_id || !room_id) throw new Error("Missing hotel_id or room_id");
      
      const requiredGuestFields = ['first_name', 'last_name', 'email', 'phone', 'country'];
      const missingFields = requiredGuestFields.filter(field => !guest_data?.[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required guest fields: ${missingFields.join(', ')}`);
      }

      // Prepare DB Record
      const dbRecord = {
        hotel_id,
        lead_id: payload.lead_id || null, // Optional link to lead
        status: 'pending_payment',
        total_amount: pricing_data?.total || 0,
        check_in: pricing_data?.check_in,
        check_out: pricing_data?.check_out,
        payment_status: 'pending',
        metadata: {
          guest: guest_data,
          pricing_breakdown: {
             room_price: pricing_data?.room_price || 0,
             taxes: pricing_data?.taxes || 0,
             fees: pricing_data?.fees || 0,
             currency: pricing_data?.currency || 'USD'
          },
          pax: {
            adults: payload.adults || 2,
            children: payload.children || 0
          }
        },
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert([dbRecord])
        .select()
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('[BookingsClient] createBooking Error:', error);
      ErrorHandler.captureError(error, { component: 'BookingsClient', action: 'createBooking' });
      throw error;
    }
  },

  /**
   * Retrieves a single booking by ID
   * @param {string} bookingId 
   */
  async getBooking(bookingId) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Updates booking status or details
   * @param {string} bookingId 
   * @param {Object} updates 
   */
  async updateBooking(bookingId, updates) {
    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Cancels a booking
   * @param {string} bookingId 
   * @param {string} reason 
   */
  async cancelBooking(bookingId, reason) {
    const { data, error } = await supabase
      .from('bookings')
      .update({ 
        status: 'cancelled', 
        metadata: { cancellation_reason: reason, cancelled_at: new Date().toISOString() } 
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Lists bookings for a specific hotel (Admin use)
   * @param {string} hotelId 
   */
  async listBookingsByHotel(hotelId) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('hotel_id', hotelId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};
