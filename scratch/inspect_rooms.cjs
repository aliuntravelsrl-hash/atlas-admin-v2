const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://oyihiyivdhfxpyiwnmqk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95aWhpeWl2ZGhmeHB5aXdubXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0Mzk5NzUsImV4cCI6MjA3ODAxNTk3NX0.8jbifKF9FCExFN3PF1OeUFDVRoHyf652vMHpIgR1DSE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectRooms() {
  console.log("Fetching rooms sample data...");
  const { data: rooms, error } = await supabase
    .from('rooms')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error querying rooms:", error);
    return;
  }

  if (rooms.length === 0) {
    console.log("No rooms found.");
    return;
  }

  console.log("SUCCESS! Sample room fields:");
  console.log(JSON.stringify(rooms[0], null, 2));
}

inspectRooms();
