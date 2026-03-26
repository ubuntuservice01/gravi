import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envContent = fs.readFileSync('.env', 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=')
  if (key && value) env[key.trim()] = value.trim()
})

const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkData() {
  const tables = ['municipalities', 'motorcycles', 'owners', 'licenses'];
  
  for (const table of tables) {
    console.log(`Buscando dados na tabela "${table}"...`);
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error(`Erro em ${table}:`, error.message);
    } else {
      console.log(`Tabela "${table}": ${count} registos.`);
    }
  }
}

checkData()
