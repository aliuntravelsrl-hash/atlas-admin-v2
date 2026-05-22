import { supabase } from '@/lib/customSupabaseClient';

export const paymentService = {
    /**
     * Registers a new payment in the database
     */
    async createPayment(paymentData) {
        console.log("💳 Recording Payment:", paymentData);
        
        const { data, error } = await supabase
            .from('payments')
            .insert([{
                booking_id: paymentData.booking_id,
                hotel_id: paymentData.hotel_id,
                amount: paymentData.amount,
                currency: paymentData.currency || 'USD',
                payment_method: paymentData.payment_method,
                payment_type: 'online', // 'deposit' or 'full' could be passed here if schema allows
                transaction_id: paymentData.transaction_id,
                status: paymentData.status || 'completed',
                payer_email: paymentData.payer_email,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) {
            console.error("❌ Error recording payment:", error);
            throw error;
        }

        return data;
    },

    async getPaymentsByBooking(bookingId) {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('booking_id', bookingId);
            
        if (error) throw error;
        return data;
    }
};