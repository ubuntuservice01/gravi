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

async function testSuperAdminLogin() {
  const email = 'superpalichi@motogest.com'
  const password = 'adminPassword123'
  
  console.log('Testando login para:', email)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    console.error('Falha no login:', error.message)
    return
  }

  console.log('Login realizado com SUCESSO!')
  console.log('User ID:', data.user.id)
  
  // Buscar perfil
  const { data: profile, error: pError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single()

  if (pError) {
    console.error('Erro ao buscar perfil:', pError.message)
  } else {
    console.log('Perfil encontrado:', profile)
  }
}

testSuperAdminLogin()
