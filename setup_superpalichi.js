import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Manually parse .env
const envContent = fs.readFileSync('.env', 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=')
  if (key && value) env[key.trim()] = value.trim()
})

const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function setupSuperpalichi() {
  const email = 'superpalichi@motogest.com'
  const password = 'adminPassword123'
  
  console.log(`Tentando registar/configurar utilizador: ${email}...`)
  
  // 1. Tentar fazer SignUp com metadata de super_admin
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Super Palichi',
        role: 'super_admin'
      }
    }
  })

  if (error) {
    if (error.message.includes('already registered')) {
      console.log('Utilizador já está registado na Auth.')
      console.log('Como a tabela "profiles" está vazia, o perfil precisa de ser criado manualmente via SQL Editor no Supabase.')
      console.log('\n--- COMANDO SQL PARA EXECUTAR NO SUPABASE ---')
      console.log('-- Primeiro, você precisa do ID do utilizador (pode ver no menu Auth do Supabase)')
      console.log(`-- Depois, execute (substituindo O_ID_AQUI se necessário):`)
      console.log(`INSERT INTO public.profiles (id, full_name, email, role, status)
VALUES ('O_ID_DO_USER_AQUI', 'Super Palichi', '${email}', 'super_admin', 'active')
ON CONFLICT (id) DO UPDATE SET role = 'super_admin';`)
    } else {
      console.error('Erro ao registar:', error.message)
    }
    return
  }
  
  console.log('🟢 Utilizador registado com sucesso via Auth!')
  console.log('ID:', data.user.id)
  
  // 2. Verificar se o trigger criou o perfil
  console.log('A verificar se o perfil foi criado automaticamente...')
  // Aguardar um pouco para o trigger processar
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  const { data: profile, error: pError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single()

  if (pError) {
    console.log('O perfil não foi encontrado via query anon (possivelmente devido a RLS ou o trigger não correu).')
    console.log('⚠️ RECOMENDAÇÃO: Execute o seguinte SQL no painel do Supabase para garantir:')
    console.log(`UPDATE public.profiles SET role = 'super_admin' WHERE email = '${email}';`)
  } else {
    console.log('✅ Perfil confirmado:', profile)
    if (profile.role !== 'super_admin') {
      console.log('⚠️ O role está como:', profile.role)
      console.log(`Execute isto no SQL Editor: UPDATE public.profiles SET role = 'super_admin' WHERE id = '${data.user.id}';`)
    }
  }
}

setupSuperpalichi()
