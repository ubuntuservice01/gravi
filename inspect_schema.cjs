const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials not found in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectTable(tableName) {
  console.log(`\n--- Inspecting ${tableName} ---`);
  try {
    const { data, error } = await supabase.from(tableName).select('*').limit(1);
    if (error) {
      console.error(`Error fetching ${tableName}:`, error.message);
    } else if (data && data.length > 0) {
      console.log(`Columns: ${Object.keys(data[0]).join(', ')}`);
      // Log some values to check enums
      const statusKey = Object.keys(data[0]).find(k => k.toLowerCase().includes('status'));
      if (statusKey) {
        console.log(`Sample ${statusKey} value: ${data[0][statusKey]}`);
      }
    } else {
      console.log(`Table ${tableName} is empty.`);
    }
  } catch (err) {
    console.error(`Exception in ${tableName}:`, err.message);
  }
}

async function start() {
  const tables = ['municipalities', 'profiles', 'owners', 'motorcycles', 'fines', 'seizures', 'payments', 'licenses'];
  for (const table of tables) {
    await inspectTable(table);
  }
}

start();
