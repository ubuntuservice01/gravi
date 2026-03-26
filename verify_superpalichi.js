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

async function verifyLoginAndProfile() {
  const email = 'superpalichi@motogest.com'
  const password = 'adminPassword123'
  
  console.log(`Testando login para ${email}...`)
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })

  if (authError) {
    console.error('Erro no login:', authError.message)
    return
  }

  console.log('Login bem-sucedido! ID:', authData.user.id)
  
  console.log('Buscando perfil...')
  const { data: profile, error: pError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single()

  if (pError) {
    console.error('Erro ao buscar perfil:', pError.message)
    console.log('O utilizador existe na Auth mas o perfil está ausente na tabela public.profiles.')
  } else {
    console.log('Perfil encontrado:', profile)
  }
}

verifyLoginAndProfile()
