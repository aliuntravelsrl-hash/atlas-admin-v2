const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://oyihiyivdhfxpyiwnmqk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95aWhpeWl2ZGhmeHB5aXdubXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0Mzk5NzUsImV4cCI6MjA3ODAxNTk3NX0.8jbifKF9FCExFN3PF1OeUFDVRoHyf652vMHpIgR1DSE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
  console.log("Simulating Admin Panel loadBookings query...");
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      hotels_master (name, zone, about_image)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Query failed with error:", error);
    return;
  }

  console.log(`Query succeeded. Retrieved ${data.length} records.`);
  
  // Find our recent booking
  const recent = data.find(b => b.booking_reference === 'ALN-73320');
  if (recent) {
    console.log("FOUND RECENT BOOKING IN QUERY RESULTS:");
    console.log(JSON.stringify(recent, null, 2));
  } else {
    console.log("CRITICAL: Recent booking ALN-73320 NOT found in query results!");
  }
}

testQuery();
