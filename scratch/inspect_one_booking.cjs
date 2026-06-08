const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://oyihiyivdhfxpyiwnmqk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95aWhpeWl2ZGhmeHB5aXdubXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0Mzk5NzUsImV4cCI6MjA3ODAxNTk3NX0.8jbifKF9FCExFN3PF1OeUFDVRoHyf652vMHpIgR1DSE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectBookingDetails() {
  console.log("Fetching booking details for ALN-73320...");
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('booking_reference', 'ALN-73320')
    .maybeSingle();

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("Booking data:");
  console.log(JSON.stringify(data, null, 2));
}

inspectBookingDetails();
