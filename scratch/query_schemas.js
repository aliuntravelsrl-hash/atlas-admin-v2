import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envConfig = {};
try {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      envConfig[key] = val;
    }
  });
} catch (e) {}

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Fetching sample records...');
  
  // Sample room
  const { data: rooms, error: re } = await supabase.from('rooms').select('*').limit(1);
  if (re) console.error('Rooms Error:', re);
  else console.log('Sample Room:', rooms[0]);

  // Sample rate
  const { data: rates, error: rateErr } = await supabase.from('rates').select('*').limit(1);
  if (rateErr) console.error('Rates Error:', rateErr);
  else console.log('Sample Rate:', rates[0]);
}

test();
