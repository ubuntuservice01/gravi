-- =====================================================
-- MotoGest: Optimized RLS & Recovery Fix
-- Run this in Supabase SQL Editor to fix timeouts
-- =====================================================

-- 1. Optimize Helper Functions (SQL Language + search_path)
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT AS $$
  -- Using a subquery with security definer and set search_path
  -- this prevents recursive RLS triggers by running as owner
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_auth_municipality()
RETURNS UUID AS $$
  SELECT municipality_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 2. Drop policies that might cause issues (selective)
-- Instead of dropping everything, we just re-create the critical ones
DROP POLICY IF EXISTS "users_view_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "super_admin_profiles_all" ON public.profiles;
DROP POLICY IF EXISTS "admin_municipal_manage_local" ON public.profiles;

-- 3. Simplified Profiles Policies
-- Rule: The simplest policies should come first or be most robust
CREATE POLICY "users_view_own_profile" ON public.profiles 
FOR SELECT TO authenticated 
USING (id = auth.uid());

CREATE POLICY "super_admin_profiles_all" ON public.profiles 
FOR ALL TO authenticated
USING (public.get_auth_role() = 'super_admin');

-- Allow authenticated users to insert their own profile (recovery)
CREATE POLICY "users_insert_own_profile" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

-- 4. Fix Trigger handle_new_user
-- Ensure it uses COALESCE and handles types correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role TEXT;
    target_municipality UUID;
BEGIN
    default_role := COALESCE(NEW.raw_user_meta_data->>'role', 'tecnico');
    
    -- Safety check for UUID conversion
    BEGIN
        target_municipality := NULLIF(NEW.raw_user_meta_data->>'municipality_id', '')::UUID;
    EXCEPTION WHEN OTHERS THEN
        target_municipality := NULL;
    END;

    INSERT INTO public.profiles (id, full_name, email, role, municipality_id, status)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Novo Utilizador'),
        NEW.email,
        default_role,
        target_municipality,
        'active'
    ) ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        municipality_id = EXCLUDED.municipality_id;
        
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Emergency Recovery: Manual Profile Entry
-- Replace the following with your UID if necessary or let the trigger rerun
-- This part is optional if you run the sync script
-- INSERT INTO public.profiles (id, full_name, email, role, status)
-- VALUES ('f95d4d2f-ee40-4b81-8767-aeb56e80572a', 'Admin', 'f95d4d2f@user.auth', 'super_admin', 'active')
-- ON CONFLICT (id) DO NOTHING;
