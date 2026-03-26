import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xcgflsokwcajgvzzpuut.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjZ2Zsc29rd2Nhamd2enpwdXV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMzIxMTMsImV4cCI6MjA4ODgwODExM30.ABrznCgG86TNTE81rRtOqJVkKbV7XE5DOlaiuQjOfNM'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testLogin() {
  const email = 'admin@motogest.com'
  const password = 'adminPassword123'
  
  console.log('Testar login com:', email)
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('ERRO DETALHADO:', error.message, error.name, error.status)
    return
  }
  
  console.log('Login efetuado com SUCESSO!')
  console.log('Sessão:', data.session ? 'Criada' : 'Nula')
}

testLogin()
