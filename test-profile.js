import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xcgflsokwcajgvzzpuut.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjZ2Zsc29rd2Nhamd2enpwdXV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMzIxMTMsImV4cCI6MjA4ODgwODExM30.ABrznCgG86TNTE81rRtOqJVkKbV7XE5DOlaiuQjOfNM'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testFetchProfile() {
  const email = 'admin@motogest.com'
  const password = 'adminPassword123'
  
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError) {
    console.error('ERRO LOGIN:', authError.message)
    return
  }
  
  const uid = authData.user.id;
  console.log('Login efetuado. UID:', uid)

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .single()

  if (profileError) {
    console.error('ERRO PROFILE:', profileError.message, profileError.details)
  } else {
    console.log('PERFIL ENCONTRADO:')
    console.log(profile)
  }
}

testFetchProfile()
