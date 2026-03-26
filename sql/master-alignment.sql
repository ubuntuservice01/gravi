-- MotoGest v2: Master Alignment SQL (High-Rigor Version)
-- Purpose: Standardizes all tables to English schema and consistent lowercase English enums.
-- UI components will map these to Portuguese labels.

DO $$ 
BEGIN

    ---------------------------------------------------------------------------
    -- 1. MUNICIPALITIES Table
    ---------------------------------------------------------------------------
    -- Columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='municipalities' AND column_name='contact_email') THEN
        ALTER TABLE public.municipalities ADD COLUMN contact_email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='municipalities' AND column_name='primary_color') THEN
        ALTER TABLE public.municipalities ADD COLUMN primary_color TEXT DEFAULT '#003366';
    END IF;

    -- Standardize Status Enum (active/inactive)
    ALTER TABLE public.municipalities ALTER COLUMN status TYPE TEXT USING status::TEXT;
    ALTER TABLE public.municipalities DROP CONSTRAINT IF EXISTS municipalities_status_check;
    UPDATE public.municipalities SET status = 'active' WHERE status IN ('active', 'activo', 'Activa');
    UPDATE public.municipalities SET status = 'inactive' WHERE status IN ('inactive', 'inactivo', 'Inactiva');
    ALTER TABLE public.municipalities ADD CONSTRAINT municipalities_status_check CHECK (status IN ('active', 'inactive'));

    ---------------------------------------------------------------------------
    -- 2. PROFILES Table
    ---------------------------------------------------------------------------
    -- Standardize Status Enum
    ALTER TABLE public.profiles ALTER COLUMN status TYPE TEXT USING status::TEXT;
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
    UPDATE public.profiles SET status = 'active' WHERE status IN ('active', 'activo', 'Activa');
    UPDATE public.profiles SET status = 'inactive' WHERE status IN ('inactive', 'inactivo', 'Inactiva');
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check CHECK (status IN ('active', 'inactive'));

    -- Standardize Role Enum (confirming existing)
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('super_admin', 'admin_municipal', 'tecnico', 'fiscal', 'financeiro'));

    ---------------------------------------------------------------------------
    -- 3. OWNERS Table
    ---------------------------------------------------------------------------
    -- Rename if legacy exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='owners' AND column_name='identity_document') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='owners' AND column_name='bi_number') THEN
        ALTER TABLE public.owners RENAME COLUMN identity_document TO bi_number;
    END IF;

    ---------------------------------------------------------------------------
    -- 4. MOTORCYCLES Table
    ---------------------------------------------------------------------------
    -- Column Renames
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='motorcycles' AND column_name='registration_number') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='motorcycles' AND column_name='plate') THEN
        ALTER TABLE public.motorcycles RENAME COLUMN registration_number TO plate;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='motorcycles' AND column_name='chassis_number') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='motorcycles' AND column_name='chassis') THEN
        ALTER TABLE public.motorcycles RENAME COLUMN chassis_number TO chassis;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='motorcycles' AND column_name='manufacture_year') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='motorcycles' AND column_name='year') THEN
        ALTER TABLE public.motorcycles RENAME COLUMN manufacture_year TO year;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='motorcycles' AND column_name='engine_cc') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='motorcycles' AND column_name='cc') THEN
        ALTER TABLE public.motorcycles RENAME COLUMN engine_cc TO cc;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='motorcycles' AND column_name='vehicle_status') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='motorcycles' AND column_name='status') THEN
        ALTER TABLE public.motorcycles RENAME COLUMN vehicle_status TO status;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='motorcycles' AND column_name='operational_status') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='motorcycles' AND column_name='operational_situation') THEN
        ALTER TABLE public.motorcycles RENAME COLUMN operational_status TO operational_situation;
    END IF;

    -- Standardize Status Enum (active, inactive, suspended, seized, stolen, blocked)
    ALTER TABLE public.motorcycles ALTER COLUMN status TYPE TEXT USING status::TEXT;
    ALTER TABLE public.motorcycles DROP CONSTRAINT IF EXISTS motorcycles_status_check;
    UPDATE public.motorcycles SET status = 'active' WHERE status IN ('Activa', 'active');
    UPDATE public.motorcycles SET status = 'inactive' WHERE status IN ('Inactiva', 'inactive');
    UPDATE public.motorcycles SET status = 'seized' WHERE status IN ('Apreendida', 'seized');
    UPDATE public.motorcycles SET status = 'stolen' WHERE status IN ('Roubada', 'stolen');
    UPDATE public.motorcycles SET status = 'blocked' WHERE status IN ('Bloqueada', 'blocked');
    ALTER TABLE public.motorcycles ADD CONSTRAINT motorcycles_status_check CHECK (status IN ('active', 'inactive', 'suspended', 'seized', 'stolen', 'blocked'));

    -- Standardize Operational Situation (regular, irregular, pending)
    ALTER TABLE public.motorcycles ALTER COLUMN operational_situation TYPE TEXT USING operational_situation::TEXT;
    ALTER TABLE public.motorcycles DROP CONSTRAINT IF EXISTS motorcycles_operational_situation_check;
    UPDATE public.motorcycles SET operational_situation = 'regular' WHERE operational_situation IN ('Regular', 'regular');
    UPDATE public.motorcycles SET operational_situation = 'irregular' WHERE operational_situation IN ('Irregular', 'irregular');
    UPDATE public.motorcycles SET operational_situation = 'pending' WHERE operational_situation IN ('Pendente', 'pending');
    ALTER TABLE public.motorcycles ADD CONSTRAINT motorcycles_operational_situation_check CHECK (operational_situation IN ('regular', 'irregular', 'pending'));

    ---------------------------------------------------------------------------
    -- 5. FINES/SEIZURES/LICENSES (Brief Alignment)
    ---------------------------------------------------------------------------
    -- Standardize status enums to lowercase English across all
    ALTER TABLE public.fines ALTER COLUMN status TYPE TEXT USING status::TEXT;
    ALTER TABLE public.fines DROP CONSTRAINT IF EXISTS fines_status_check;
    ALTER TABLE public.fines ADD CONSTRAINT fines_status_check CHECK (status IN ('pending', 'paid', 'cancelled'));

    ALTER TABLE public.seizures ALTER COLUMN status TYPE TEXT USING status::TEXT;
    ALTER TABLE public.seizures DROP CONSTRAINT IF EXISTS seizures_status_check;
    ALTER TABLE public.seizures ADD CONSTRAINT seizures_status_check CHECK (status IN ('active', 'released', 'cancelled'));

    ALTER TABLE public.licenses ALTER COLUMN status TYPE TEXT USING status::TEXT;
    ALTER TABLE public.licenses DROP CONSTRAINT IF EXISTS licenses_status_check;
    ALTER TABLE public.licenses ADD CONSTRAINT licenses_status_check CHECK (status IN ('active', 'expired', 'cancelled', 'renewed'));

END $$;

---------------------------------------------------------------------------
-- 6. TRIGGERS & AUTOMATION
---------------------------------------------------------------------------
-- User Creation Trigger
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

-- Municipality Creation Automation
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



-- Refresh PostgREST
NOTIFY pgrst, 'reload schema';
