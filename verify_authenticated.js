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

async function verify() {
  const email = 'antigravity_admin@motogest.com';
  const password = 'MotoGestAdmin123!';

  console.log(`Efetuando login como ${email}...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

  if (authError) {
    console.error('Falha no login:', authError.message);
    return;
  }

  console.log('✅ Login bem-sucedido!');
  console.log('User ID:', authData.user.id);

  // 1. Verificar Perfil
  console.log('Buscando perfil...');
  const { data: profile, error: pError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (pError) {
    console.error('❌ Perfil não encontrado na tabela "profiles":', pError.message);
  } else {
    console.log('✅ Perfil encontrado:', profile);
  }

  // 2. Verificar Municípios
  console.log('Buscando municípios...');
  const { data: mData, error: mError, count: mCount } = await supabase
    .from('municipalities')
    .select('*', { count: 'exact' });

  if (mError) {
    console.error('❌ Erro ao buscar municípios:', mError.message);
  } else {
    console.log(`✅ Municípios encontrados: ${mCount}`);
    if (mData) {
      mData.forEach(m => console.log(`- ${m.name} (${m.status})`));
    }
  }
}

verify()
