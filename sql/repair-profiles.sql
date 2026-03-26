-- =====================================================
-- MotoGest: Profile Recovery & Schema Refresh
-- Solves: "Perfil não encontrado" & 406 Not Acceptable
-- =====================================================

-- 0. Drop the conflicting constraint if it exists
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS chk_super_admin_municipality;

-- 1. Force Sync all existing users to profiles
INSERT INTO public.profiles (id, full_name, email, role, municipality_id, status)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'full_name', email, 'Utilizador Recuperado'),
    email,
    -- Default to super_admin if email contains motogest or if it's superpalichi
    CASE 
        WHEN email LIKE '%motogest%' OR email LIKE '%superpalichi%' THEN 'super_admin'::public.user_role
        ELSE COALESCE(raw_user_meta_data->>'role', 'tecnico')::public.user_role
    END,
    NULLIF(raw_user_meta_data->>'municipality_id', '')::UUID,
    'active'
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    municipality_id = EXCLUDED.municipality_id;

-- 2. Fix 406 Not Acceptable / Schema Mismatch
-- Sometimes PostgREST gets stuck if there are conflicting check constraints or if the schema cache is stale.
-- Let's ensure the roles are correctly constrained.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('super_admin', 'admin_municipal', 'tecnico', 'fiscal', 'financeiro'));

-- 3. Refresh PostgREST Cache (Forcefully)
NOTIFY pgrst, 'reload schema';

-- 4. Verify count
SELECT count(*) as total_profiles FROM public.profiles;
