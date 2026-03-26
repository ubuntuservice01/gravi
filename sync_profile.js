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

// Note: This script uses the anon key, so it might fail if RLS is tight.
// Ideally, this would be run with a service_role key.
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function syncProfile() {
  const uid = 'f95d4d2f-ee40-4b81-8767-aeb56e80572a'
  console.log(`[SYNC] Tentando recuperar/criar profile para UID: ${uid}`)
  
  // Since we don't have service_role, we try a direct insert if we suspect it's missing
  // Normally, this happens via trigger. 
  // If the prompt is correct, the table is empty.
  
  const { data, error } = await supabase
    .from('profiles')
    .insert([
      { 
        id: uid, 
        full_name: 'Usuário Administrativo', 
        role: 'super_admin', // Manually granting super_admin to unblock
        status: 'active'
      }
    ])
    .select()

  if (error) {
    if (error.code === '23505') {
       console.log('[SYNC] Profile já existe.')
    } else {
       console.error('[SYNC] Erro ao sincronizar:', error.message)
       console.log('[TIP] Se falhar por RLS, execute o SQL do arquivo fix-rls-optimized.sql no Dashboard do Supabase.')
    }
  } else {
    console.log('[SYNC] Sucesso! Profile criado:', data)
  }
}

syncProfile()
