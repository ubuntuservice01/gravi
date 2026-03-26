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

async function getAdminId() {
  const email = 'admin@motogest.com';
  const password = 'adminPassword123';
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error('Erro:', error.message);
  } else {
    console.log('ID do admin@motogest.com:', data.user.id);
  }
}

getAdminId()
