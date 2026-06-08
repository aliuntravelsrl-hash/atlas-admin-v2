const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://oyihiyivdhfxpyiwnmqk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95aWhpeWl2ZGhmeHB5aXdubXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0Mzk5NzUsImV4cCI6MjA3ODAxNTk3NX0.8jbifKF9FCExFN3PF1OeUFDVRoHyf652vMHpIgR1DSE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCrmLead() {
  console.log("Searching crm_leads by lead_id...");
  const { data: leadById, error: error1 } = await supabase
    .from('crm_leads')
    .select('*')
    .eq('id', '579428eb-5065-4cff-913f-9d5603340a49')
    .maybeSingle();

  if (error1) {
    console.error("Error fetching by ID:", error1);
  } else {
    console.log("Lead by ID found:", leadById);
  }

  console.log("\nSearching crm_leads by full_name ILIKE '%yerelin%'...");
  const { data: leadsByName, error: error2 } = await supabase
    .from('crm_leads')
    .select('*')
    .ilike('full_name', '%yerelin%');

  if (error2) {
    console.error("Error fetching by Name:", error2);
  } else {
    console.log(`Leads by name count: ${leadsByName.length}`);
    leadsByName.forEach(l => {
      console.log(`- ID: ${l.id} | Name: ${l.full_name} | Source: ${l.source} | Stage: ${l.stage}`);
    });
  }
}

checkCrmLead();
