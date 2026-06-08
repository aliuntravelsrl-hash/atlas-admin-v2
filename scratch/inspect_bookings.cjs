const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://oyihiyivdhfxpyiwnmqk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95aWhpeWl2ZGhmeHB5aXdubXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0Mzk5NzUsImV4cCI6MjA3ODAxNTk3NX0.8jbifKF9FCExFN3PF1OeUFDVRoHyf652vMHpIgR1DSE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testCrmLeadsTable() {
  console.log("Fetching sample crm_leads...");
  const { data, error } = await supabase
    .from('crm_leads')
    .select('*')
    .limit(1);

  if (error) {
    console.log("Error querying 'crm_leads':", error.message);
  } else if (data.length === 0) {
    console.log("No records found in 'crm_leads' table.");
  } else {
    console.log("SUCCESS! Sample crm_lead:", data[0]);
  }
}

testCrmLeadsTable();
