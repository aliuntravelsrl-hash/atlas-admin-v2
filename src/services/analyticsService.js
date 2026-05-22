import { supabase } from '@/lib/customSupabaseClient';

export const analyticsService = {
  /**
   * Track a generic event
   */
  async trackEvent(eventName, metadata = {}) {
    try {
      // Get UTM params from URL
      const params = new URLSearchParams(window.location.search);
      const utmSource = params.get('utm_source');
      const utmMedium = params.get('utm_medium');
      const utmCampaign = params.get('utm_campaign');
      
      // Get Session ID (simple implementation)
      let sessionId = sessionStorage.getItem('analytics_session_id');
      if (!sessionId) {
          sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
          sessionStorage.setItem('analytics_session_id', sessionId);
      }

      const { error } = await supabase.from('analytics_events').insert([{
        event_name: eventName,
        hotel_slug: metadata.hotelSlug || null,
        source: utmSource || 'direct',
        medium: utmMedium,
        campaign: utmCampaign,
        session_id: sessionId,
        metadata: metadata
      }]);

      if (error) console.error("Analytics Error:", error);
    } catch (e) {
      console.error("Analytics Exception:", e);
    }
  },

  /**
   * Track a successful booking
   */
  async trackBookingSuccess(bookingId, amount, currency = 'USD') {
      await this.trackEvent('booking_success', {
          bookingId,
          amount,
          currency
      });
  },

  /**
   * Track a view of a hotel page
   */
  async trackHotelView(hotelSlug) {
      await this.trackEvent('hotel_view', { hotelSlug });
  }
};