import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oyihiyivdhfxpyiwnmqk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95aWhpeWl2ZGhmeHB5aXdubXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0Mzk5NzUsImV4cCI6MjA3ODAxNTk3NX0.8jbifKF9FCExFN3PF1OeUFDVRoHyf652vMHpIgR1DSE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log("Consultando triggers de hotels_master...");
  
  const { data, error } = await supabase
    .rpc('rpc_execute_query_test', { // si existiera una rpc de test
      query: "SELECT trigger_name, event_manipulation, event_object_table FROM information_schema.triggers WHERE event_object_table = 'hotels_master'"
    });

  if (error) {
    // Si falla la RPC, hacemos un query directo a postgres a través de un select simple si existiera alguna función
    console.log("RPC no disponible:", error.message);
    
    // Probamos con una consulta directa sobre catalogos si el RLS lo permite (muy improbable)
    const { data: data2, error: error2 } = await supabase
      .from('pg_trigger') // esto fallará casi seguro por RLS
      .select('*')
      .limit(1);
      
    if (error2) {
      console.log("No se pudo leer pg_trigger:", error2.message);
    } else {
      console.log("pg_trigger es legible.");
    }
  } else {
    console.log("Triggers de hotels_master:", data);
  }
}

check();
