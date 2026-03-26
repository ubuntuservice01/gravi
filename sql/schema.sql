-- MotoGest v2: Global Multi-Municipality Schema (Foundation + Phase 2 + Phase 3 + Phase 4)
-- This script is idempotent and safe to run multiple times.

-- 1. Municipalities Table
CREATE TABLE IF NOT EXISTS public.municipalities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    province TEXT NOT NULL,
    district TEXT NOT NULL,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#003366',
    secondary_color TEXT DEFAULT '#ffffff',
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    document_footer TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Profiles Table (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin_municipal', 'tecnico', 'fiscal', 'financeiro')),
    municipality_id UUID REFERENCES public.municipalities(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Municipal Settings (Phase 4)
CREATE TABLE IF NOT EXISTS public.municipal_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    municipality_id UUID UNIQUE REFERENCES public.municipalities(id) ON DELETE CASCADE,
    
    -- Fee Rates
    motorcycle_tax_low DECIMAL(10,2) DEFAULT 500.00,
    motorcycle_tax_mid DECIMAL(10,2) DEFAULT 750.00,
    motorcycle_tax_high DECIMAL(10,2) DEFAULT 1000.00,
    moto_taxi_tax DECIMAL(10,2) DEFAULT 1200.00,
    car_tax DECIMAL(10,2) DEFAULT 2500.00,
    bicycle_tax DECIMAL(10,2) DEFAULT 100.00,
    fine_base_value DECIMAL(10,2) DEFAULT 500.00,
    parking_daily_fee DECIMAL(10,2) DEFAULT 50.00,
    license_issue_fee DECIMAL(10,2) DEFAULT 200.00,
    license_renewal_fee DECIMAL(10,2) DEFAULT 150.00,
    
    -- Rules
    enable_expiration_alerts BOOLEAN DEFAULT TRUE,
    auto_block_on_fine BOOLEAN DEFAULT FALSE,
    
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Owners Table (Phase 2)
CREATE TABLE IF NOT EXISTS public.owners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    bi_number TEXT NOT NULL,
    nuit TEXT,
    phone TEXT,
    municipality_id UUID REFERENCES public.municipalities(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Motorcycles Table (Phase 2)
CREATE TABLE IF NOT EXISTS public.motorcycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plate TEXT UNIQUE NOT NULL,
    chassis TEXT UNIQUE NOT NULL,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    color TEXT NOT NULL,
    year INTEGER NOT NULL,
    cc INTEGER NOT NULL,
    purpose TEXT NOT NULL CHECK (purpose IN ('Particular', 'Moto-Táxi', 'Transporte', 'Serviço', 'Outro')),
    taxi_driver_name TEXT,
    taxi_vest_number TEXT,
    taxi_phone TEXT,
    taxi_association TEXT,
    status TEXT DEFAULT 'Activa' CHECK (status IN ('Activa', 'Inactiva', 'Suspensa', 'Apreendida', 'Roubada', 'À venda', 'Bloqueada')),
    operational_situation TEXT DEFAULT 'Pendente' CHECK (operational_situation IN ('Regular', 'Irregular', 'Pendente')),
    owner_id UUID REFERENCES public.owners(id) ON DELETE CASCADE,
    municipality_id UUID REFERENCES public.municipalities(id) ON DELETE CASCADE,
    technician_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    observations TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Fines Table (Phase 3)
CREATE TABLE IF NOT EXISTS public.fines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fine_number SERIAL UNIQUE,
    vehicle_id UUID REFERENCES public.motorcycles(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES public.owners(id) ON DELETE CASCADE,
    infraction_type TEXT NOT NULL,
    description TEXT,
    value DECIMAL(10,2) NOT NULL,
    location TEXT,
    fiscal_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    municipality_id UUID REFERENCES public.municipalities(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Paga', 'Anulada')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Seizures Table (Phase 3)
CREATE TABLE IF NOT EXISTS public.seizures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seizure_number SERIAL UNIQUE,
    vehicle_id UUID REFERENCES public.motorcycles(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES public.owners(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    location TEXT,
    daily_fee DECIMAL(10,2) DEFAULT 0.00,
    status TEXT DEFAULT 'Activa' CHECK (status IN ('Activa', 'Liberada', 'Cancelada')),
    municipality_id UUID REFERENCES public.municipalities(id) ON DELETE CASCADE,
    fiscal_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    released_at TIMESTAMPTZ,
    observations TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Payments Table (Phase 3)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference TEXT UNIQUE NOT NULL,
    payment_type TEXT NOT NULL CHECK (payment_type IN ('Multa', 'Parqueamento', 'Licença', 'Taxa de registo', 'Outro')),
    vehicle_id UUID REFERENCES public.motorcycles(id) ON DELETE SET NULL,
    owner_id UUID REFERENCES public.owners(id) ON DELETE SET NULL,
    fine_id UUID REFERENCES public.fines(id) ON DELETE SET NULL,
    seizure_id UUID REFERENCES public.seizures(id) ON DELETE SET NULL,
    value DECIMAL(10,2) NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('Numerário', 'Transferência', 'Depósito', 'POS', 'Outro')),
    municipality_id UUID REFERENCES public.municipalities(id) ON DELETE CASCADE,
    collector_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'Confirmado' CHECK (status IN ('Pendente', 'Confirmado', 'Cancelado')),
    observations TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Receipts Table (Phase 3)
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number SERIAL UNIQUE,
    payment_id UUID UNIQUE REFERENCES public.payments(id) ON DELETE CASCADE,
    municipality_id UUID REFERENCES public.municipalities(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Licenses Table (Phase 4)
CREATE TABLE IF NOT EXISTS public.licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_number SERIAL UNIQUE,
    vehicle_id UUID REFERENCES public.motorcycles(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES public.owners(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('Licença de circulação', 'Licença anual', 'Licença de moto-táxi', 'Manifesto / IAV', 'Outro')),
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'Activa' CHECK (status IN ('Activa', 'Expirada', 'Cancelada', 'Renovada')),
    municipality_id UUID REFERENCES public.municipalities(id) ON DELETE CASCADE,
    issuer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    historical_id UUID REFERENCES public.licenses(id) ON DELETE SET NULL,
    observations TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Enable RLS
ALTER TABLE public.municipalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.municipal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motorcycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seizures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- 12. Policy Cleanup & Re-creation (Ensures no "already exists" errors)
DO $$ 
DECLARE
    t TEXT;
BEGIN
    -- Delete all policies to refresh them
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I_RLS ON public.%I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Super Admin can manage all %I" ON public.%I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Users can view their own %I" ON public.%I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Admin Municipal can manage local users" ON public.profiles');
        EXECUTE format('DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles');
    END LOOP;
END $$;

-- 13. Define RLS Access Function
CREATE OR REPLACE FUNCTION public.check_municipality_access(target_municipality_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        target_municipality_id = (SELECT municipality_id FROM public.profiles WHERE profiles.id = auth.uid()) 
        OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND role = 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Apply Policies
CREATE POLICY "Super Admin can manage all municipalities" ON public.municipalities FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'));
CREATE POLICY "Users can view their own municipality" ON public.municipalities FOR SELECT TO authenticated USING (id = (SELECT municipality_id FROM public.profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Super Admin can manage all profiles" ON public.profiles FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'));
CREATE POLICY "Admin Municipal can manage local users" ON public.profiles FOR ALL TO authenticated USING (municipality_id = (SELECT municipality_id FROM public.profiles WHERE profiles.id = auth.uid()) AND (SELECT role FROM public.profiles WHERE profiles.id = auth.uid()) = 'admin_municipal');
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());

-- Generic RLS for all other tables
DO $$ 
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT IN ('municipalities', 'profiles')
    LOOP
        EXECUTE format('CREATE POLICY %I_RLS ON public.%I FOR ALL TO authenticated USING (public.check_municipality_access(municipality_id))', t, t);
    END LOOP;
END $$;

-- 15. Triggers & Functions
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_seizure_status()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.motorcycles SET status = 'Apreendida' WHERE id = NEW.vehicle_id;
    ELSIF (TG_OP = 'UPDATE' AND NEW.status = 'Liberada') THEN
        UPDATE public.motorcycles SET status = 'Activa' WHERE id = NEW.vehicle_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_seizure_status_change ON public.seizures;
CREATE TRIGGER on_seizure_status_change AFTER INSERT OR UPDATE ON public.seizures FOR EACH ROW EXECUTE FUNCTION public.handle_seizure_status();

CREATE OR REPLACE FUNCTION public.handle_payment_actions()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.fine_id IS NOT NULL AND NEW.status = 'Confirmado') THEN
        UPDATE public.fines SET status = 'Paga' WHERE id = NEW.fine_id;
    END IF;
    INSERT INTO public.receipts (payment_id, municipality_id) VALUES (NEW.id, NEW.municipality_id) ON CONFLICT (payment_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_payment_confirmed ON public.payments;
CREATE TRIGGER on_payment_confirmed AFTER INSERT OR UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.handle_payment_actions();

-- 16. Municipality Creation Automation
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

