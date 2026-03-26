-- MotoGest v2: Schema Correction
-- This script ensures the municipalities table has all required columns.

DO $$ 
BEGIN
    -- Add contact_email if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='municipalities' AND column_name='contact_email') THEN
        ALTER TABLE public.municipalities ADD COLUMN contact_email TEXT;
    END IF;

    -- Add contact_phone if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='municipalities' AND column_name='contact_phone') THEN
        ALTER TABLE public.municipalities ADD COLUMN contact_phone TEXT;
    END IF;

    -- Add address if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='municipalities' AND column_name='address') THEN
        ALTER TABLE public.municipalities ADD COLUMN address TEXT;
    END IF;

    -- Add document_footer if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='municipalities' AND column_name='document_footer') THEN
        ALTER TABLE public.municipalities ADD COLUMN document_footer TEXT;
    END IF;

     -- Add logo_url if missing (older versions might have it as logo)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='municipalities' AND column_name='logo_url') THEN
        ALTER TABLE public.municipalities ADD COLUMN logo_url TEXT;
    END IF;

    -- Add primary_color and secondary_color
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='municipalities' AND column_name='primary_color') THEN
        ALTER TABLE public.municipalities ADD COLUMN primary_color TEXT DEFAULT '#003366';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='municipalities' AND column_name='secondary_color') THEN
        ALTER TABLE public.municipalities ADD COLUMN secondary_color TEXT DEFAULT '#ffffff';
    END IF;

END $$;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
