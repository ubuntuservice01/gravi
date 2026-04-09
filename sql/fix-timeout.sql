-- =========================================================================
-- MotoGest: Correção Crítica do Timeout de Autenticação (Recursão RLS)
-- =========================================================================

-- 1. Criação de funções SECURITY DEFINER para buscar dados do usuário.
-- O uso de SECURITY DEFINER força a execução com privilégios de owner (bypass RLS),
-- evitando a recursão infinita ao consultar a mesma tabela (profiles) de dentro de uma política.
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_auth_municipality()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT municipality_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Limpeza de Políticas Problemáticas e Recursivas na tabela PROFILES
-- Removemos todas as variações de políticas antigas que causavam o gargalo.
DROP POLICY IF EXISTS "Admin Municipal can manage local users" ON public.profiles;
DROP POLICY IF EXISTS "Super Admin can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "admin_municipal_manage_local" ON public.profiles;
DROP POLICY IF EXISTS "super_admin_profiles_all" ON public.profiles;
DROP POLICY IF EXISTS "users_view_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "allow_profile_insert_on_signup" ON public.profiles;
DROP POLICY IF EXISTS "profiles_policy" ON public.profiles;

-- 3. Recriação das Políticas da tabela PROFILES (Seguras)
-- --------------------------------------------------------

-- Permite que qualquer usuário autenticado veja APENAS o seu próprio perfil.
CREATE POLICY "profiles_select_own" ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid());

-- Permite que Super Admins gerenciem TODOS os perfis.
CREATE POLICY "profiles_all_super_admin" ON public.profiles
FOR ALL TO authenticated
USING (public.get_auth_role() = 'super_admin');

-- Permite que Admins Municipais gerenciem usuários EXCLUSIVAMENTE do seu município local (evitando subqueries recursivas diretas na tabela).
CREATE POLICY "profiles_all_admin_municipal" ON public.profiles
FOR ALL TO authenticated
USING (
    public.get_auth_role() = 'admin_municipal' 
    AND municipality_id = public.get_auth_municipality()
);

-- Permite INSERT no momento do registo de novos perfis (usado pelo gatilho Supabase)
CREATE POLICY "profiles_insert_generic" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (id = auth.uid() OR public.get_auth_role() = 'super_admin');

-- Recarrega o schema do PostgREST
NOTIFY pgrst, 'reload schema';
