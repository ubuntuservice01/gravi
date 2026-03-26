-- Migration: Multi-vehicle support and expanded municipal settings
-- This script aligns the database with the reference project "teste2 - Cópia"

-- 1. Add type column to motorcycles
ALTER TABLE public.motorcycles 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'moto' CHECK (type IN ('moto', 'car', 'bicycle'));

-- 2. Expand municipal_settings with all required columns
ALTER TABLE public.municipal_settings
ADD COLUMN IF NOT EXISTS iav_fee DECIMAL(10,2) DEFAULT 1200.00,
ADD COLUMN IF NOT EXISTS iav_sedan DECIMAL(10,2) DEFAULT 1200.00,
ADD COLUMN IF NOT EXISTS iav_suv DECIMAL(10,2) DEFAULT 1500.00,
ADD COLUMN IF NOT EXISTS iav_camiao DECIMAL(10,2) DEFAULT 2500.00,
ADD COLUMN IF NOT EXISTS iav_autocarro DECIMAL(10,2) DEFAULT 3000.00,
ADD COLUMN IF NOT EXISTS iav_pesados DECIMAL(10,2) DEFAULT 4000.00,
ADD COLUMN IF NOT EXISTS moto_ate_125 DECIMAL(10,2) DEFAULT 500.00,
ADD COLUMN IF NOT EXISTS moto_126a_250 DECIMAL(10,2) DEFAULT 800.00,
ADD COLUMN IF NOT EXISTS moto_acima_250 DECIMAL(10,2) DEFAULT 1200.00,
ADD COLUMN IF NOT EXISTS moto_taxi_fee DECIMAL(10,2) DEFAULT 2500.00,
ADD COLUMN IF NOT EXISTS reg_fee DECIMAL(10,2) DEFAULT 850.00,
ADD COLUMN IF NOT EXISTS penalty_fee DECIMAL(10,2) DEFAULT 5000.00,
ADD COLUMN IF NOT EXISTS address TEXT;

-- 3. Update existing motorcycles to default type
UPDATE public.motorcycles SET type = 'moto' WHERE type IS NULL;

-- 4. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name TEXT,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    new_data JSONB,
    old_data JSONB,
    municipality_id UUID REFERENCES public.municipalities(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Edit Requests Table
CREATE TABLE IF NOT EXISTS public.edit_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    requester_name TEXT,
    target_table TEXT NOT NULL,
    target_id UUID NOT NULL,
    original_data JSONB,
    requested_data JSONB,
    reason TEXT,
    status TEXT DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Aprovado', 'Rejeitado')),
    approver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approver_name TEXT,
    rejection_reason TEXT,
    municipality_id UUID REFERENCES public.municipalities(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    read BOOLEAN DEFAULT FALSE,
    municipality_id UUID REFERENCES public.municipalities(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Blacklist Table
CREATE TABLE IF NOT EXISTS public.blacklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_type TEXT NOT NULL CHECK (item_type IN ('Veículo', 'Proprietário', 'BI')),
    item_value TEXT NOT NULL,
    reason TEXT NOT NULL,
    severity TEXT DEFAULT 'Média' CHECK (severity IN ('Baixa', 'Média', 'Alta', 'Crítica')),
    added_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'Activo' CHECK (status IN ('Activo', 'Inactivo')),
    municipality_id UUID REFERENCES public.municipalities(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);
