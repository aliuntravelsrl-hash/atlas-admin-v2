const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://oyihiyivdhfxpyiwnmqk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95aWhpeWl2ZGhmeHB5aXdubXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0Mzk5NzUsImV4cCI6MjA3ODAxNTk3NX0.8jbifKF9FCExFN3PF1OeUFDVRoHyf652vMHpIgR1DSE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectRecentBookings() {
  console.log("Fetching the 10 most recent bookings...");
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, created_at, booking_reference, lead_guest_name, room_id, offer_id, total_amount, status, payment_status, fulfillment_status')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching bookings:", error);
    return;
  }

  console.log("Recent bookings:");
  bookings.forEach(b => {
    console.log(`- Ref: ${b.booking_reference} | Guest: ${b.lead_guest_name} | Created: ${b.created_at} | RoomId: ${b.room_id} | OfferId: ${b.offer_id} | Status: ${b.status} | Payment: ${b.payment_status}`);
  });
}

inspectRecentBookings();
