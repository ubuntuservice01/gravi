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

async function listTables() {
  console.log('Listando tabelas do schema public...')
  const { data, error } = await supabase.rpc('get_tables') // Tentativa de RPC se existir

  if (error) {
    console.log('RPC get_tables não encontrado ou falhou. Tentando via query direta...')
    // Tentativa via query direta (pode falhar se RLS estiver ativo ou permissão restrita para anon)
    const { data: qData, error: qError } = await supabase
      .from('profiles') // Só para testar se conseguimos acessar algo
      .select('count', { count: 'exact', head: true })

    console.log('Acesso a "profiles":', qError ? qError.message : 'OK')
  } else {
    console.log('Tabelas:', data)
  }
  
  // Vamos tentar buscar todas as tabelas via SQL se possível (geralmente não via anon)
  // Mas como estamos tentando descobrir o que aconteceu com superpalichi, 
  // vamos focar em encontrar onde as roles de admin são definidas.
}

listTables()
