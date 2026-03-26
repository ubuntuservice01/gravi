-- Expand Municipalities and Settings for Phase 4 Administrative Hub

-- 1. Add missing identity fields to municipalities
ALTER TABLE public.municipalities 
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS slogan TEXT,
ADD COLUMN IF NOT EXISTS nuit TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account TEXT,
ADD COLUMN IF NOT EXISTS nib_iban TEXT,
ADD COLUMN IF NOT EXISTS fiscal_code TEXT,
ADD COLUMN IF NOT EXISTS account_holder TEXT;

-- 2. Add dynamic config column to municipal_settings
ALTER TABLE public.municipal_settings 
ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{
    "licenses": {
        "validity": "1y",
        "allow_early_renewal": true,
        "early_renewal_days": 30,
        "enable_expiry_alerts": true,
        "enable_near_expiry_alerts": true
    },
    "moto_taxi": {
        "vest_color": "Amarelo",
        "max_vehicles": 1000,
        "operation_zones": []
    },
    "infractions": [
        {"type": "Sem licença", "value": 2500, "action": "Multa + Apreensão", "status": "Ativo"},
        {"type": "Sem capacete", "value": 500, "action": "Apenas multa", "status": "Ativo"},
        {"type": "Excesso de passageiros", "value": 1000, "action": "Multa + Advertência", "status": "Ativo"}
    ],
    "seizure_rules": {
        "daily_parking_fee": 50,
        "release_fee": 200,
        "max_days": 90,
        "auto_calculate": true,
        "lock_vehicle": false
    },
    "documents": {
        "receipt_prefix": "REC",
        "receipt_series": "2026",
        "number_format": "{prefix}-{series}-{number}",
        "footer_text": "Obrigado por contribuir para o desenvolvimento do nosso município.",
        "legal_text": "Este documento serve como prova de pagamento nos termos da lei.",
        "show_logo": true
    },
    "notifications": {
        "sms_on_fine": true,
        "sms_on_payment": true,
        "sms_on_expiry": true,
        "email_on_fine": true,
        "email_on_payment": true,
        "email_on_expiry": true,
        "default_text": "MotoGest: Nova notificação relativa ao seu veículo."
    },
    "payments": {
        "allowed_methods": ["M-Pesa", "e-Mola", "Numerário", "POS", "Banco"],
        "auto_split": false,
        "platform_percentage": 5,
        "transaction_fee": 0,
        "default_method": "Numerário"
    },
    "operations": {
        "business_hours": "08:00 - 15:30",
        "business_days": ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"],
        "max_daily_tech_registrations": 20,
        "max_vehicles_per_owner": 5,
        "maintenance_mode": false,
        "demo_mode": false
    }
}'::JSONB;
