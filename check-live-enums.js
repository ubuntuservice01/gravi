import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkConstraints() {
  // Query to find check constraints for status columns
  const { data, error } = await supabase.rpc('inspect_constraints');

  // If RPC is not available, we can try a raw select from information_schema via a trick or just assume schema.sql is what they *want* if it matches live.
  // Actually, I can't easily run raw SQL from the JS client unless I have an RPC for it.
  
  // Alternative: Fetch one row from each table and look at the values.
  const tables = ['municipalities', 'profiles', 'motorcycles', 'fines', 'seizures', 'payments', 'licenses'];
  
  console.log('--- LIVE STATUS VALUES ---');
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('status').limit(1);
    if (!error && data && data.length > 0) {
      console.log(`${table}.status: ${data[0].status}`);
    } else {
      console.log(`${table}.status: (no data or error)`);
    }
  }
}

// Since I don't have 'inspect_constraints' defined, let's just use the limit(1) trick to see existing data.
checkConstraints();
