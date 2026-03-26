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

async function inspectColumns() {
  console.log('Inspecionando colunas da tabela "profiles"...')
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Erro:', error.message)
  } else if (data && data.length > 0) {
    console.log('Colunas:', Object.keys(data[0]))
  } else {
    console.log('Tabela vazia. Tentando buscar nomes de colunas via rpc ou meta...')
    // Se a tabela estiver vazia, podemos tentar um insert falho proposital para ver o erro de colunas
    // Ou simplesmente confiar no que vimos antes.
  }
}

inspectColumns()
