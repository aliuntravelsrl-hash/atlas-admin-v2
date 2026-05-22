
import { supabase } from '@/lib/customSupabaseClient';
import { ErrorHandler } from '@/utils/ErrorHandler';

/**
 * QuotationService v1.0
 * Handles JSONB quotation storage for flexible pricing and guest data.
 */
export const quotationService = {

  /**
   * Creates a new quotation with JSONB columns.
   * @param {string} hotelId 
   * @param {Object} guestData - {name, email, phone, adults, children, special_requests}
   * @param {Object} pricing - {room_id, room_name, check_in, check_out, days, rate_adult, rate_child, total_amount, formula}
   */
  async createQuotation(hotelId, guestData, pricing) {
    try {
      // JSONB Validation
      if (!guestData || typeof guestData !== 'object') throw new Error("Invalid guestData JSONB");
      if (!pricing || typeof pricing !== 'object') throw new Error("Invalid pricing JSONB");

      const payload = {
        // Since the schema has 'booking_id' but we might create a quote before booking, 
        // we leave booking_id null initially or link if provided in future steps.
        // The schema doesn't strictly enforce hotel_id, but logically it should be there.
        // Note: The provided table definition for 'quotations' only has:
        // id, booking_id, guest_data, pricing, created_at, updated_at.
        // It DOES NOT have hotel_id directly, likely inside pricing or linked via booking.
        // We will store hotel_id inside the pricing JSONB for reference if no column exists.
        
        guest_data: guestData,
        pricing: { ...pricing, hotel_id: hotelId },
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('quotations')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ [quotationService] Quotation creada con éxito: ID ${data.id}`);
      console.log(`   Guest: ${guestData.name || 'Unknown'} | Total: ${pricing.total_amount}`);

      return data;

    } catch (error) {
      ErrorHandler.captureError(error, { component: 'quotationService', action: 'createQuotation' });
      console.error("Error creating quotation:", error);
      throw error;
    }
  },

  async updateQuotation(quotationId, status) {
    try {
      if (!quotationId) throw new Error("Quotation ID required");
      
      // Status is often stored in pricing JSONB or a separate column if it existed.
      // Based on schema, we have `pricing` JSONB. We can update a status field inside it 
      // OR if there's a status column not listed. The prompt says "Updates quotation status".
      // Let's check schema again... only `guest_data` and `pricing`.
      // We will update `pricing.status` to be safe.
      
      // First fetch current to merge jsonb properly if needed, but Supabase can patch JSONB.
      // However, to be safe with `jsonb_set` or simple update, we'll fetch-merge-update.
      
      const { data: current, error: fetchError } = await supabase
        .from('quotations')
        .select('pricing')
        .eq('id', quotationId)
        .single();
        
      if (fetchError) throw fetchError;
      
      const newPricing = { ...current.pricing, status: status };
      
      const { data, error } = await supabase
        .from('quotations')
        .update({ pricing: newPricing, updated_at: new Date().toISOString() })
        .eq('id', quotationId)
        .select()
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      ErrorHandler.captureError(error, { component: 'quotationService', action: 'updateQuotation' });
      throw error;
    }
  },

  async getQuotationById(quotationId) {
    try {
      const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .eq('id', quotationId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching quotation:", error);
      throw error;
    }
  }
};
