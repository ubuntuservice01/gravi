-- MÓDULO DE INFRAESTRUTURA E AUDITORIA
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    user_name TEXT,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- MÓDULO DE APROVAÇÕES E FLUXO DE TRABALHO
CREATE TABLE IF NOT EXISTS public.edit_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipality_id UUID REFERENCES public.municipalities(id),
    requester_id UUID REFERENCES auth.users(id),
    requester_name TEXT,
    target_table TEXT NOT NULL,
    target_id UUID NOT NULL,
    original_data JSONB,
    requested_data JSONB,
    reason TEXT,
    status TEXT DEFAULT 'Pendente', -- Pendente, Aprovado, Rejeitado
    approver_id UUID REFERENCES auth.users(id),
    approver_name TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- MÓDULO DE COMUNICAÇÃO
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    municipality_id UUID REFERENCES public.municipalities(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- info, success, warning, danger
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- MÓDULO DE CONTROLO DE ACESSO (LISTA NEGRA)
CREATE TABLE IF NOT EXISTS public.blacklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipality_id UUID REFERENCES public.municipalities(id),
    entity_type TEXT NOT NULL, -- Matrícula, BI, Nome
    entity_value TEXT NOT NULL,
    reason TEXT NOT NULL,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    severity TEXT DEFAULT 'Média', -- Baixa, Média, Alta, Crítica
    status TEXT DEFAULT 'Ativo',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- MÓDULO GEOGRÁFICO (PARA MAPAS E FISCALIZAÇÃO)
CREATE TABLE IF NOT EXISTS public.administrative_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipality_id UUID REFERENCES public.municipalities(id),
    name TEXT NOT NULL,
    coordinates JSONB, -- {x, y} ou {lat, lng}
    manager_name TEXT,
    contact_phone TEXT,
    status TEXT DEFAULT 'Ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- MELHORIA NO SCHEMA DE VEÍCULOS
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='motorcycles' AND column_name='type') THEN
        ALTER TABLE public.motorcycles ADD COLUMN type TEXT DEFAULT 'motorcycle';
    END IF;
END $$;

-- Adicionar coluna is_production à tabela municipalities
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='municipalities' AND column_name='is_production') THEN
        ALTER TABLE public.municipalities ADD COLUMN is_production BOOLEAN DEFAULT false;
    END IF;
END $$;
