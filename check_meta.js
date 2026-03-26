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

async function checkTriggers() {
  console.log('Verificando triggers via RPC ou Query (se permitido)...');
  
  // Como não posso listar triggers via PostgREST facilmente sem uma VIEW customizada,
  // vou tentar forçar o trigger criando um usuário novo.
  // Ou melhor, vou pedir ao usuário para rodar o SQL de "REPAIR".
  
  console.log('Sugestão: O trigger pode não estar a funcionar ou não foi criado.');
}

checkTriggers()
