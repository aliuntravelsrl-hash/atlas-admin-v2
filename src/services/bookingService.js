import { supabase } from '@/lib/customSupabaseClient';
import { analyticsService } from './analyticsService';
import { format, differenceInDays } from 'date-fns';
import { generateQuotePDF } from '@/lib/QuotationPDFGenerator';
import { generateVoucherPDF } from '@/lib/VoucherPDFGenerator';
import { ErrorHandler } from '@/utils/ErrorHandler';

// USE ENVIRONMENT VARIABLE FOR PRODUCTION
const WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || "https://n8n-n8n.xaruuo.easypanel.host/webhook/reserva_logic";

export const bookingService = {
  // --- Create Booking & Trigger N8N ---
  async createBooking(bookingData) {
    try {
      console.log("📝 [bookingService] Initiating Booking Request...", bookingData);
      
      // 3) VALIDACIÓN: total_price > 0
      if (!bookingData.total_price || Number(bookingData.total_price) <= 0) {
          throw new Error("El precio total debe ser mayor a 0 para procesar la solicitud.");
      }
      
      // 4) VALIDACIÓN WEBHOOK: Ensure UUID is present
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(bookingData.hotel_id)) {
          console.warn(`⚠️ [BookingService] hotel_id '${bookingData.hotel_id}' is NOT a UUID. Webhook might fail strictly typed checks.`);
      }

      const voucherCode = 'BK-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      
      const checkInDate = new Date(bookingData.check_in);
      const checkOutDate = new Date(bookingData.check_out);
      const nights = differenceInDays(checkOutDate, checkInDate);

      // 1. Prepare DB Payload
      const dbPayload = {
          hotel_id: bookingData.hotel_id, // Should be UUID
          check_in: format(checkInDate, 'yyyy-MM-dd'),
          check_out: format(checkOutDate, 'yyyy-MM-dd'),
          adults: bookingData.adults,
          children: bookingData.children,
          total_price: bookingData.total_price,
          status: 'pending_validation',
          guest_name: bookingData.guest_name,
          guest_email: bookingData.guest_email,
          guest_phone: bookingData.guest_phone,
          voucher_code: voucherCode,
          special_requests: bookingData.special_requests || '',
          payment_status: 'pending',
      };

      if (bookingData.room_id) dbPayload.room_id = bookingData.room_id;
      else if (bookingData.room_type_id) dbPayload.room_type_id = bookingData.room_type_id;

      // 2. Save to Supabase
      const { data: savedBooking, error } = await supabase
        .from('bookings')
        .insert([dbPayload])
        .select(`*, hotels(name, location)`)
        .single();

      if (error) {
          throw new Error(`Error database: ${error.message}`);
      }
      
      // 3. Track Analytics
      if (analyticsService && analyticsService.trackEvent) {
          analyticsService.trackEvent('booking_request_created', {
              booking_id: savedBooking.id,
              total_price: bookingData.total_price,
              currency: 'USD',
              guest_email: savedBooking.guest_email,
              hotel_name: savedBooking.hotels?.name
          });
      }

      // 4. Trigger N8N Webhook (Payload Validated)
      const webhookPayload = {
          booking_id: savedBooking.id,
          type: 'booking_request',
          is_test: false, // Production mode
          voucher_code: savedBooking.voucher_code,
          status: 'pending_validation', 
          hotel_id: bookingData.hotel_id, // UUID Propagation
          hotel_name: savedBooking.hotels?.name || bookingData.hotel_name || "Hotel",
          room_name: bookingData.room_name || "Habitación",
          guest_data: {
              name: bookingData.guest_name,
              email: bookingData.guest_email,
              phone: bookingData.guest_phone
          },
          dates: {
              check_in: format(checkInDate, 'yyyy-MM-dd'),
              check_out: format(checkOutDate, 'yyyy-MM-dd'),
              nights: nights
          },
          pricing: {
              total: bookingData.total_price,
              currency: 'USD',
              payment_status: 'pending'
          },
          utm_params: {
               source: bookingData.utm_source || 'web_booking_form',
               medium: bookingData.utm_medium || 'direct',
               campaign: bookingData.utm_campaign || 'general'
          },
          analytics: {
              event: 'booking_request',
              timestamp: new Date().toISOString()
          }
      };

      await this.triggerWebhook(webhookPayload);

      return { ...savedBooking, room_name: bookingData.room_name };
    } catch (error) {
      ErrorHandler.captureError(error, { component: 'bookingService', action: 'createBooking' });
      console.error("[bookingService] Unexpected error in createBooking:", error);
      throw error;
    }
  },

  async updateBookingStatus(bookingId, newStatus, paymentDetails = null) {
      try {
        const updateData = { status: newStatus };
        if (paymentDetails) {
            updateData.payment_status = paymentDetails.status;
            updateData.payment_method = paymentDetails.method;
            updateData.amount_paid = paymentDetails.amount;
        }
        const { data, error } = await supabase.from('bookings').update(updateData).eq('id', bookingId).select().single();
        if (error) throw error;
        return data;
      } catch (error) {
        ErrorHandler.captureError(error, { component: 'bookingService', action: 'updateBookingStatus', metadata: { bookingId } });
        console.error("[bookingService] Unexpected error in updateBookingStatus:", error);
        throw error;
      }
  },

  async triggerWebhook(payload) {
      try {
          console.log(`🚀 Sending to N8N (${WEBHOOK_URL}):`, payload);
          fetch(WEBHOOK_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          }).then(res => {
              if (res.ok) console.log("✅ N8N Webhook Received");
              else console.warn("⚠️ N8N Webhook Status:", res.status);
          }).catch(err => {
              console.error("⚠️ N8N Connection Error:", err);
          });
      } catch (e) {
          ErrorHandler.captureError(e, { component: 'bookingService', action: 'triggerWebhook' });
          console.error("⚠️ [bookingService] Unexpected error in webhook trigger:", e);
      }
  },

  generateQuotePDF,
  generateVoucherPDF
};