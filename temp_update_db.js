
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Try to use --env-file or manual parse if dotenv is missing
let supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
    try {
        const env = fs.readFileSync('.env', 'utf8');
        const lines = env.split('\n');
        for (const line of lines) {
            const [key, value] = line.split('=');
            if (key?.trim() === 'VITE_SUPABASE_URL') supabaseUrl = value?.trim()?.replace(/['"]/g, '');
            if (key?.trim() === 'VITE_SUPABASE_ANON_KEY') supabaseKey = value?.trim()?.replace(/['"]/g, '');
            if (key?.trim() === 'SUPABASE_SERVICE_ROLE_KEY') supabaseKey = value?.trim()?.replace(/['"]/g, '');
        }
    } catch (e) {
        console.error('Could not read .env file');
    }
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function runSQL() {
  const sqlFile = process.argv[2] || './sql/update_schema.sql';
  console.log('Reading SQL from:', sqlFile);
  
  if (!fs.existsSync(sqlFile)) {
      console.error('SQL file not found:', sqlFile);
      process.exit(1);
  }

  const sql = fs.readFileSync(sqlFile, 'utf8');
  console.log('SQL content length:', sql.length);
  
  const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    console.error('Error executing SQL via RPC:', error);
    // Try a simple health check
    const { error: checkError } = await supabaseAdmin.from('municipalities').select('id').limit(1);
    if (checkError) {
        console.error('Supabase connection/auth failed:', checkError);
    } else {
        console.log('Supabase connection OK, but RPC failed. You might need to enable the "exec_sql" function in your Supabase dashboard.');
    }
  } else {
    console.log('SQL executed successfully.');
  }
}

runSQL();
