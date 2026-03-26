-- =====================================================
-- MotoGest: Critical Fix - Municipality Creation
-- Run this ENTIRE script in Supabase SQL Editor
-- =====================================================

-- 1. Ensure helper functions exist (bypass RLS safely)
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_auth_municipality()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT municipality_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop ALL existing policies (clean slate)
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 3. Municipalities policies
-- Super admin: full access
CREATE POLICY "super_admin_municipalities_all" ON public.municipalities 
FOR ALL TO authenticated
USING (public.get_auth_role() = 'super_admin')
WITH CHECK (public.get_auth_role() = 'super_admin');

-- Municipal users: read own municipality
CREATE POLICY "municipal_users_view_own" ON public.municipalities 
FOR SELECT TO authenticated 
USING (id = public.get_auth_municipality());

-- 4. Profiles policies
CREATE POLICY "super_admin_profiles_all" ON public.profiles 
FOR ALL TO authenticated
USING (public.get_auth_role() = 'super_admin')
WITH CHECK (public.get_auth_role() = 'super_admin');

CREATE POLICY "admin_municipal_manage_local" ON public.profiles 
FOR ALL TO authenticated 
USING (
    municipality_id = public.get_auth_municipality() 
    AND public.get_auth_role() = 'admin_municipal'
)
WITH CHECK (
    municipality_id = public.get_auth_municipality() 
    AND public.get_auth_role() = 'admin_municipal'
);

CREATE POLICY "users_view_own_profile" ON public.profiles 
FOR SELECT TO authenticated 
USING (id = auth.uid());

-- Allow trigger to insert new profile (service role bypass)
CREATE POLICY "allow_profile_insert_on_signup" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (id = auth.uid() OR public.get_auth_role() = 'super_admin');

-- 5. Municipal Settings policies
CREATE POLICY "municipal_settings_rls" ON public.municipal_settings
FOR ALL TO authenticated
USING (
    municipality_id = public.get_auth_municipality() 
    OR public.get_auth_role() = 'super_admin'
)
WITH CHECK (
    municipality_id = public.get_auth_municipality() 
    OR public.get_auth_role() = 'super_admin'
);

-- 6. Generic RLS for all data tables
DO $$ 
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename NOT IN ('municipalities', 'profiles', 'municipal_settings')
    LOOP
        EXECUTE format(
            'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (
                municipality_id = public.get_auth_municipality() 
                OR public.get_auth_role() = ''super_admin''
            ) WITH CHECK (
                municipality_id = public.get_auth_municipality() 
                OR public.get_auth_role() = ''super_admin''
            )',
            t || '_policy', t
        );
    END LOOP;
END $$;

-- 7. Fix the after_municipality_created trigger
-- This trigger was causing check constraint errors on failed transactions
CREATE OR REPLACE FUNCTION public.after_municipality_created()
RETURNS TRIGGER AS $$
BEGIN
    -- Safely create default settings (ignore if already exists)
    INSERT INTO public.municipal_settings (municipality_id)
    VALUES (NEW.id)
    ON CONFLICT (municipality_id) DO NOTHING;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log but don't fail the parent transaction
    RAISE WARNING 'after_municipality_created: Could not create settings for %. Error: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_municipality_created ON public.municipalities;
CREATE TRIGGER on_municipality_created 
    AFTER INSERT ON public.municipalities
    FOR EACH ROW EXECUTE FUNCTION public.after_municipality_created();

-- 8. Fix handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role, municipality_id, status)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Novo Utilizador'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'tecnico'),
        NULLIF(NEW.raw_user_meta_data->>'municipality_id', '')::UUID,
        'active'
    ) ON CONFLICT (id) DO UPDATE SET
        municipality_id = EXCLUDED.municipality_id,
        role = EXCLUDED.role,
        full_name = EXCLUDED.full_name;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created 
    AFTER INSERT ON auth.users 
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
