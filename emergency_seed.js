import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Script para criar o primeiro utilizador no novo projecto
// Após correr este script, execute o SQL fornecido no painel do Supabase.

const envContent = fs.readFileSync('.env', 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=')
  if (key && value) env[key.trim()] = value.trim()
})

const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function seed() {
  const email = 'antigravity_admin@motogest.com';
  const password = 'MotoGestAdmin123!';

  console.log(`Tentando registar utilizador: ${email}...`);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Antigravity Admin',
        role: 'super_admin'
      }
    }
  });

  if (error) {
    if (error.message.includes('already registered')) {
      console.log('Utilizador já registado na Auth.');
    } else {
      console.error('Erro ao registar:', error.message);
      return;
    }
  } else {
    console.log('🟢 Utilizador registado com sucesso na Auth!');
    console.log('ID:', data.user.id);
  }

  console.log('\n--- PRÓXIMO PASSO (IMPORTANTE) ---');
  console.log('Execute o seguinte SQL no editor do Supabase para promover este utilizador a Super Admin:');
  console.log(`
UPDATE public.profiles 
SET role = 'super_admin', status = 'active' 
WHERE email = '${email}';

-- Se a tabela de municípios estiver vazia, crie um de teste:
INSERT INTO public.municipalities (name, province, district, status)
VALUES ('Município de Teste', 'Província Teste', 'Distrito Teste', 'active')
ON CONFLICT DO NOTHING;
  `);

  console.log('\nApós executar o SQL, tente fazer login com:');
  console.log(`Email: ${email}`);
  console.log(`Senha: ${password}`);
}

seed()
