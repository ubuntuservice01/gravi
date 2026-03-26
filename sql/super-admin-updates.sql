-- Super Admin Enhancements SQL
-- Support for global logs and statistics

-- 1. Create Super Admin Logs table
CREATE TABLE IF NOT EXISTS public.super_admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    admin_name TEXT,
    action TEXT NOT NULL, -- e.g., 'CREATE_MUNICIPALITY', 'DEACTIVATE_USER'
    target_type TEXT, -- e.g., 'municipality', 'user'
    target_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add RLS policies for Super Admin logs
ALTER TABLE public.super_admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admins can read all logs"
ON public.super_admin_logs FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
));

CREATE POLICY "Super Admins can insert logs"
ON public.super_admin_logs FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
));

-- 3. Function to get global statistics (Optional, can be done via frontend queries too)
CREATE OR REPLACE FUNCTION get_global_stats()
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
