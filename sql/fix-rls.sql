-- MotoGest v2: Comprehensive Fix for RLS, Automation & Triggers (v2.1)
-- This version is more aggressive in cleaning up existing policies to avoid "already exists" errors.

-- 1. SECURITY DEFINER Functions (Bypass RLS for policy checks)
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

-- 2. Aggressive Policy Cleanup
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    -- Drop EVERY policy in the public schema to ensure a clean slate
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 3. Re-apply Cleaner Policies
-- Municipalities
CREATE POLICY "Super Admin can manage all municipalities" ON public.municipalities 
FOR ALL TO authenticated USING (public.get_auth_role() = 'super_admin');

CREATE POLICY "Users can view their own municipality" ON public.municipalities 
FOR SELECT TO authenticated USING (id = public.get_auth_municipality());

-- Profiles
CREATE POLICY "Super Admin can manage all profiles" ON public.profiles 
FOR ALL TO authenticated USING (public.get_auth_role() = 'super_admin');

CREATE POLICY "Admin Municipal can manage local users" ON public.profiles 
FOR ALL TO authenticated USING (
    municipality_id = public.get_auth_municipality() 
    AND public.get_auth_role() = 'admin_municipal'
);

CREATE POLICY "Users can view their own profile" ON public.profiles 
FOR SELECT TO authenticated USING (id = auth.uid());

-- Universal RLS for other tables
DO $$ 
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT IN ('municipalities', 'profiles')
    LOOP
        EXECUTE format('CREATE POLICY %I_RLS ON public.%I FOR ALL TO authenticated USING (
            municipality_id = public.get_auth_municipality() OR public.get_auth_role() = ''super_admin''
        )', t, t);
    END LOOP;
END $$;

-- 4. Improved User Creation Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role, municipality_id, status)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Novo Utilizador'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'tecnico'),
        (NEW.raw_user_meta_data->>'municipality_id')::UUID,
        'active'
    ) ON CONFLICT (id) DO UPDATE SET
        municipality_id = EXCLUDED.municipality_id,
        role = EXCLUDED.role,
        full_name = EXCLUDED.full_name;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Auto-Settings Trigger
CREATE OR REPLACE FUNCTION public.after_municipality_created()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.municipal_settings (municipality_id)
    VALUES (NEW.id)
    ON CONFLICT (municipality_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_municipality_created ON public.municipalities;
CREATE TRIGGER on_municipality_created AFTER INSERT ON public.municipalities
FOR EACH ROW EXECUTE FUNCTION public.after_municipality_created();
