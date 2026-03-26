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

async function listColumns() {
  console.log('Buscando esquema de colunas para "profiles"...')
  // Note: Standard users usually can't query information_schema via anon key unless RLS/Permissions allow.
  // But let's try.
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(0) // Should returning headers/schema info if possible

  if (error) {
    console.error('Erro ao buscar schema:', error.message)
  } else {
    // If it works, we try to get metadata
    console.log('Query executada com sucesso. Tentando rpc genérico...')
  }

  // Alternative: use a raw SQL if we have an RPC for it
  const { data: cols, error: colsErr } = await supabase.rpc('get_table_columns', { table_name: 'profiles' })
  if (colsErr) {
    console.log('RPC get_table_columns não encontrado.')
  } else {
    console.log('Colunas via RPC:', cols)
  }
}

listColumns()
