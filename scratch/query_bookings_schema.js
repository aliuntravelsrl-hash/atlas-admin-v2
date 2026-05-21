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
  console.log('--- Inspecting Bookings Schema ---');
  const { data: bookings, error: be } = await supabase.from('bookings').select('*').limit(1);
  if (be) console.error('Bookings Error:', be);
  else console.log('Sample Booking Keys:', Object.keys(bookings[0] || {}));

  console.log('\n--- Inspecting Offer Date Ranges Schema ---');
  const { data: ranges, error: re } = await supabase.from('offer_date_ranges').select('*').limit(1);
  if (re) console.error('Offer Date Ranges Error:', re);
  else console.log('Sample Range Keys:', Object.keys(ranges[0] || {}));
}

test();
