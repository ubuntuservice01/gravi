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

async function probe() {
  console.log('Tentando insert dummy em "profiles" para testar colunas...')
  const dummyId = '00000000-0000-0000-0000-000000000000'
  
  // We try to insert with what we THINK are the correct columns
  const { error } = await supabase
    .from('profiles')
    .insert([
      { 
        id: dummyId, 
        full_name: 'Probe', 
        role: 'tecnico',
        email: 'probe@test.com'
      }
    ])

  if (error) {
    console.log('Resultado do Probe (Erro esperado ou real):', error.message)
    console.log('Código:', error.code)
  } else {
    console.log('Probe de insert funcionou (surpreendente se RLS estiver on e não permitir insert anon)!')
    // Se funcionar, as colunas id, full_name, role, email existem.
  }
}

probe()
