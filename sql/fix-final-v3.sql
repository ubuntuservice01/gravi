-- =====================================================
-- MotoGest: THE DEFINITIVE FIX (v3)
-- Solves: Signup 500, Dashboard 404, Missing Tables
-- =====================================================

-- 0. Enable extensions (if not already there)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. FIX HANDLE_NEW_USER (Signup 500 error source)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    final_role TEXT;
    final_municipality UUID;
BEGIN
    -- Extract role with safety
    final_role := COALESCE(NEW.raw_user_meta_data->>'role', 'tecnico');
    
    -- Robust UUID parsing for municipality_id
    BEGIN
        final_municipality := NULLIF(NEW.raw_user_meta_data->>'municipality_id', '')::UUID;
    EXCEPTION WHEN OTHERS THEN
        final_municipality := NULL;
    END;

    INSERT INTO public.profiles (id, full_name, email, role, municipality_id, status)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Novo Utilizador'),
        NEW.email,
        final_role::public.user_role,
        final_municipality,
        'active'
    ) ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        municipality_id = EXCLUDED.municipality_id,
        status = 'active';
        
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Prevent trigger failure from blocking account creation (log as warning)
    RAISE WARNING 'handle_new_user error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. FIX GET_GLOBAL_STATS (Dashboard 404 error source)
CREATE OR REPLACE FUNCTION public.get_global_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_municipalities', (SELECT count(*) FROM public.municipalities),
        'active_municipalities', (SELECT count(*) FROM public.municipalities WHERE status = 'active'),
        'total_users', (SELECT count(*) FROM public.profiles),
        'total_vehicles', (SELECT count(*) FROM public.motorcycles),
        'total_revenue', (SELECT coalesce(sum(value), 0) FROM public.payments WHERE status = 'Confirmado')
    ) INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Grant permissions for RPC
GRANT EXECUTE ON FUNCTION public.get_global_stats() TO anon, authenticated, service_role;

-- 3. ENSURE MISSING TABLES EXIST
CREATE TABLE IF NOT EXISTS public.edit_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    municipality_id UUID REFERENCES public.municipalities(id),
    requester_id UUID REFERENCES auth.users(id),
    requester_name TEXT,
    target_table TEXT NOT NULL,
    target_id UUID NOT NULL,
    original_data JSONB,
    requested_data JSONB,
    reason TEXT,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    approver_id UUID REFERENCES auth.users(id),
    approver_name TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS and simple policy for edit_requests
ALTER TABLE public.edit_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super Admins can manage all edit requests" ON public.edit_requests FOR ALL TO authenticated USING (public.get_auth_role() = 'super_admin');

-- 4. ENSURE MISSING COLUMNS
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='municipalities' AND column_name='is_production') THEN
        ALTER TABLE public.municipalities ADD COLUMN is_production BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 5. RELOAD SCHEMA
NOTIFY pgrst, 'reload schema';
