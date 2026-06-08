const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://oyihiyivdhfxpyiwnmqk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95aWhpeWl2ZGhmeHB5aXdubXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0Mzk5NzUsImV4cCI6MjA3ODAxNTk3NX0.8jbifKF9FCExFN3PF1OeUFDVRoHyf652vMHpIgR1DSE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectRoom() {
  console.log("Fetching room details...");
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', '13c7a2c3-b75d-44bf-acf2-8c8333c12a5a')
    .maybeSingle();

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("Room data:");
  console.log(JSON.stringify(data, null, 2));
}

inspectRoom();
