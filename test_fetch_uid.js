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

async function testFetch() {
  const uid = 'f95d4d2f-ee40-4b81-8767-aeb56e80572a'
  console.log(`[TEST] Buscando profile para UID: ${uid}`)
  
  const start = Date.now()
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, municipalities(*)')
      .eq('id', uid)
      .maybeSingle()
    
    const duration = Date.now() - start
    console.log(`[TEST] Query concluída em ${duration}ms`)
    
    if (error) {
      console.error('[TEST] Erro:', error)
    } else {
      console.log('[TEST] Dados:', data)
    }
  } catch (err) {
    console.error('[TEST] Excepção:', err)
  }
}

testFetch()
