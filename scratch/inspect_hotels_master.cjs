const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://oyihiyivdhfxpyiwnmqk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95aWhpeWl2ZGhmeHB5aXdubXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0Mzk5NzUsImV4cCI6MjA3ODAxNTk3NX0.8jbifKF9FCExFN3PF1OeUFDVRoHyf652vMHpIgR1DSE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectHotelsMaster() {
  console.log("Fetching hotels_master sample data...");
  const { data: hotels, error } = await supabase
    .from('hotels_master')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error fetching hotels_master:", error);
    return;
  }

  if (hotels.length === 0) {
    console.log("No hotels found in hotels_master.");
    return;
  }

  console.log("SUCCESS! Sample hotels_master fields:");
  console.log(JSON.stringify(hotels[0], null, 2));
}

inspectHotelsMaster();
