import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env manually
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
} catch (e) {
  console.error('Error reading .env file:', e);
}

const supabaseUrl = envConfig.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: No Supabase keys found. URL:', supabaseUrl, 'Key:', supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Testing Supabase Connection...');
  console.log('URL:', supabaseUrl);
  
  // 1. Test hotels_master
  const { data: hm, count: hmCount, error: hme } = await supabase.from('hotels_master').select('*', { count: 'exact', head: true });
  console.log('hotels_master count:', hme ? 'ERROR: ' + hme.message : hmCount);
  
  // 2. Test hoteles
  const { data: ho, count: hoCount, error: hoe } = await supabase.from('hoteles').select('*', { count: 'exact', head: true });
  console.log('hoteles count:', hoe ? 'ERROR: ' + hoe.message : hoCount);

  // 3. Test rates_2026
  const { data: ra, count: raCount, error: rae } = await supabase.from('rates_2026').select('*', { count: 'exact', head: true });
  console.log('rates_2026 count:', rae ? 'ERROR: ' + rae.message : raCount);
  
  // 4. Test rates
  const { data: r, count: rCount, error: re } = await supabase.from('rates').select('*', { count: 'exact', head: true });
  console.log('rates count:', re ? 'ERROR: ' + re.message : rCount);
}

test();
