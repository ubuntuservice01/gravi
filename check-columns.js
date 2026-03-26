import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Credentials missing in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkColumns() {
  try {
    const { data, error } = await supabase
      .from('municipalities')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error fetching data:', error.message);
      return;
    }

    if (data && data.length > 0) {
      console.log('Columns found:', Object.keys(data[0]).join(', '));
    } else {
      console.log('No data found in municipalities table to inspect columns.');
    }
  } catch (err) {
    console.error('Exception:', err.message);
  }
}

checkColumns();
