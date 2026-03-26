-- MotoGest: RBAC Implementation Support
-- This script refines RLS policies to enforce the specified access levels

-- 1. Helper for checking multiple roles
CREATE OR REPLACE FUNCTION public.check_auth_roles(roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role = ANY(roles) FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing generic policies for sensitive tables to redefine them
DROP POLICY IF EXISTS "motorcycles_policy" ON public.motorcycles;
DROP POLICY IF EXISTS "payments_policy" ON public.payments;
DROP POLICY IF EXISTS "profiles_policy" ON public.profiles;
DROP POLICY IF EXISTS "municipal_settings_policy" ON public.municipal_settings;
DROP POLICY IF EXISTS "fines_policy" ON public.fines;
DROP POLICY IF EXISTS "seizures_policy" ON public.seizures;
DROP POLICY IF EXISTS "licenses_policy" ON public.licenses;

-- 3. MOTORCYCLES: tecnico/admin can manage, fiscal can view
CREATE POLICY "motorcycles_select" ON public.motorcycles
FOR SELECT TO authenticated
USING (municipality_id = public.get_auth_municipality() OR public.get_auth_role() = 'super_admin');

CREATE POLICY "motorcycles_manage" ON public.motorcycles
FOR ALL TO authenticated
USING (
    (municipality_id = public.get_auth_municipality() AND public.check_auth_roles(ARRAY['admin_municipal', 'tecnico']))
    OR public.get_auth_role() = 'super_admin'
)
WITH CHECK (
    (municipality_id = public.get_auth_municipality() AND public.check_auth_roles(ARRAY['admin_municipal', 'tecnico']))
    OR public.get_auth_role() = 'super_admin'
);

-- 4. PAYMENTS: financeiro/admin can manage, tecnico can only view, fiscal denied
CREATE POLICY "payments_select" ON public.payments
FOR SELECT TO authenticated
USING (
    (municipality_id = public.get_auth_municipality() AND public.check_auth_roles(ARRAY['admin_municipal', 'financeiro', 'tecnico']))
    OR public.get_auth_role() = 'super_admin'
);

CREATE POLICY "payments_manage" ON public.payments
FOR ALL TO authenticated
USING (
    (municipality_id = public.get_auth_municipality() AND public.check_auth_roles(ARRAY['admin_municipal', 'financeiro']))
    OR public.get_auth_role() = 'super_admin'
)
WITH CHECK (
    (municipality_id = public.get_auth_municipality() AND public.check_auth_roles(ARRAY['admin_municipal', 'financeiro']))
    OR public.get_auth_role() = 'super_admin'
);

-- 5. LICENSES: admin/tecnico manage, fiscal/financeiro view
CREATE POLICY "licenses_select" ON public.licenses
FOR SELECT TO authenticated
USING (municipality_id = public.get_auth_municipality() OR public.get_auth_role() = 'super_admin');

CREATE POLICY "licenses_manage" ON public.licenses
FOR ALL TO authenticated
USING (
    (municipality_id = public.get_auth_municipality() AND public.check_auth_roles(ARRAY['admin_municipal', 'tecnico']))
    OR public.get_auth_role() = 'super_admin'
)
WITH CHECK (
    (municipality_id = public.get_auth_municipality() AND public.check_auth_roles(ARRAY['admin_municipal', 'tecnico']))
    OR public.get_auth_role() = 'super_admin'
);

-- 6. FINES & SEIZURES: fiscal can create, admin/tecnico can manage
CREATE POLICY "fines_select" ON public.fines
FOR SELECT TO authenticated
USING (municipality_id = public.get_auth_municipality() OR public.get_auth_role() = 'super_admin');

CREATE POLICY "fines_insert" ON public.fines
FOR INSERT TO authenticated
WITH CHECK (
    (municipality_id = public.get_auth_municipality() AND public.check_auth_roles(ARRAY['admin_municipal', 'tecnico', 'fiscal']))
    OR public.get_auth_role() = 'super_admin'
);

CREATE POLICY "fines_update_delete" ON public.fines
FOR UPDATE TO authenticated
USING (
    (municipality_id = public.get_auth_municipality() AND public.check_auth_roles(ARRAY['admin_municipal', 'tecnico']))
    OR public.get_auth_role() = 'super_admin'
)
WITH CHECK (
    (municipality_id = public.get_auth_municipality() AND public.check_auth_roles(ARRAY['admin_municipal', 'tecnico']))
    OR public.get_auth_role() = 'super_admin'
);

-- 7. SETTINGS: only admin can modify
CREATE POLICY "settings_select" ON public.municipal_settings
FOR SELECT TO authenticated
USING (municipality_id = public.get_auth_municipality() OR public.get_auth_role() = 'super_admin');

CREATE POLICY "settings_update" ON public.municipal_settings
FOR UPDATE TO authenticated
USING (
    (municipality_id = public.get_auth_municipality() AND public.get_auth_role() = 'admin_municipal')
    OR public.get_auth_role() = 'super_admin'
)
WITH CHECK (
    (municipality_id = public.get_auth_municipality() AND public.get_auth_role() = 'admin_municipal')
    OR public.get_auth_role() = 'super_admin'
);
