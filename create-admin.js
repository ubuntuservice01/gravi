import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xcgflsokwcajgvzzpuut.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjZ2Zsc29rd2Nhamd2enpwdXV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMzIxMTMsImV4cCI6MjA4ODgwODExM30.ABrznCgG86TNTE81rRtOqJVkKbV7XE5DOlaiuQjOfNM'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createSuperAdmin() {
  const email = 'admin@motogest.com'
  const password = 'adminPassword123'
  
  console.log('A registar utilizador:', email)
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Super Administrador',
        role: 'super_admin' // Nota: o trigger no BD sobrescreve para 'tecnico' inicialmente
      }
    }
  })

  if (error) {
    console.error('Erro ao criar conta:', error.message)
    return
  }
  
  console.log('🟢 Conta criada com sucesso!')
  console.log('ID do Utilizador:', data.user.id)
  console.log('\n--- PASSO SEGUINTE ---')
  console.log('Vá ao SQL Editor no seu painel Supabase e execute o seguinte comando:')
  console.log(`UPDATE public.profiles SET role = 'super_admin', status = 'active' WHERE id = '${data.user.id}';`)
}

createSuperAdmin()
