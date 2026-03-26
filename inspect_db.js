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

async function inspect() {
  // We try to fetch a single profile. If the table is empty, we get an empty array.
  // To find columns, we can use a trick: select a non-existent column and see the error message 
  // or just look at what fields are available if there was data.
  // But wait! If the table is empty and RLS is on, we get NOTHING.
  
  // Let's try to find a user we KNOW exists.
  const uid = 'e30afd95-7272-4381-9e74-4628f237bc9d' // From screenshot
  const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).single()
  
  if (error) {
    console.error('Erro ao buscar profile do user atual:', error.message)
  } else {
    console.log('Profile do user atual encontrado!')
    console.log('Colunas:', Object.keys(data))
  }
}

inspect()
