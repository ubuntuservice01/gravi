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

async function checkProfiles() {
  console.log('Buscando perfis na tabela "profiles"...')
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(20)

  if (error) {
    console.error('Erro ao buscar perfis:', error.message)
    return
  }

  if (data.length === 0) {
    console.log('Nenhum perfil encontrado na tabela "profiles".')
  } else {
    console.log('Perfis encontrados:')
    data.forEach(profile => {
      console.log(`- ID: ${profile.id}, Nome: ${profile.full_name || profile.nome}, Role: ${profile.role}, Email: ${profile.email || 'N/A'}`)
    })
  }

  // Também verificar se existe o usuário superpalichi
  console.log('\nVerificando se existe "superpalichi" em profiles...')
  const { data: pData, error: pError } = await supabase
    .from('profiles')
    .select('*')
    .or(`email.ilike.%superpalichi%,full_name.ilike.%superpalichi%,nome.ilike.%superpalichi%`)

  if (pError) {
    console.error('Erro ao buscar superpalichi:', pError.message)
    return
  }

  console.log('Resultados para "superpalichi":', pData)
}

checkProfiles()
