import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const defaultSettings = {
  // Identity
  municipalityName: 'MotoGest',
  province: '',
  district: '',
  address: '',
  contactEmail: '',
  contactPhone: '',
  website: '',
  slogan: '',
  logoUrl: null,
  primaryColor: '#0F4C81',
  secondaryColor: '#ffffff',
  
  // Fiscal Data
  nuit: '',
  bankName: '',
  bankAccount: '',
  nibIban: '',
  fiscalCode: '',
  accountHolder: '',

  // Standard Taxes (Legacy mappings)
  iavFee: 1200,
  iavSedan: 1200,
  iavSuv: 1500,
  iavCamiao: 2500,
  iavAutocarro: 3000,
  iavPesados: 4000,
  motoAte125: 500,
  moto126a250: 800,
  motoAcima250: 1200,
  regFee: 850,
  motoTaxiFee: 2500,
  penaltyFee: 5000,

  // Complex Config (JSONB)
  config: {
    licenses: {
      validity: '1y',
      allow_early_renewal: true,
      early_renewal_days: 30,
      enable_expiry_alerts: true,
      enable_near_expiry_alerts: true
    },
    moto_taxi: {
      vest_color: 'Amarelo',
      max_vehicles: 1000,
      operation_zones: []
    },
    infractions: [
      { type: 'Sem licença', value: 2500, action: 'Multa + Apreensão', status: 'Ativo' },
      { type: 'Sem capacete', value: 500, action: 'Apenas multa', status: 'Ativo' },
      { type: 'Excesso de passageiros', value: 1000, action: 'Multa + Advertência', status: 'Ativo' }
    ],
    seizure_rules: {
      daily_parking_fee: 50,
      release_fee: 200,
      max_days: 90,
      auto_calculate: true,
      lock_vehicle: false
    },
    documents: {
        receipt_prefix: 'REC',
        receipt_series: '2026',
        number_format: '{prefix}-{series}-{number}',
        footer_text: '',
        legal_text: '',
        show_logo: true
    },
    notifications: {
        sms_on_fine: true,
        sms_on_payment: true,
        sms_on_expiry: true,
        email_on_fine: true,
        email_on_payment: true,
        email_on_expiry: true,
        default_text: ''
    },
    payments: {
        allowed_methods: ['M-Pesa', 'e-Mola', 'Numerário', 'POS', 'Banco'],
        auto_split: false,
        platform_percentage: 5,
        transaction_fee: 0,
        default_method: 'Numerário'
    },
    operations: {
        business_hours: '08:00 - 15:30',
        business_days: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
        max_daily_tech_registrations: 20,
        max_vehicles_per_owner: 5,
        maintenance_mode: false,
        demo_mode: false
    }
  }
};

const SettingsContext = createContext(undefined);

export const SettingsProvider = ({ children }) => {
  const { profile } = useAuth();
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('motogest_settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  useEffect(() => {
    if (profile?.municipality_id) {
      fetchSettings(profile.municipality_id);
    }
  }, [profile?.municipality_id]);

  const fetchSettings = async (municipalityId) => {
    try {
      const { data, error } = await supabase
        .from('municipal_settings')
        .select(`
          *,
          municipalities (*)
        `)
        .eq('municipality_id', municipalityId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const m = data.municipalities || {};
        const fetched = {
          ...defaultSettings,
          // Identity from municipalities table
          municipalityName: m.name || defaultSettings.municipalityName,
          province: m.province || '',
          district: m.district || '',
          address: m.address || '',
          contactEmail: m.contact_email || '',
          contactPhone: m.contact_phone || '',
          website: m.website || '',
          slogan: m.slogan || '',
          logoUrl: m.logo_url,
          primaryColor: m.primary_color || defaultSettings.primaryColor,
          secondaryColor: m.secondary_color || defaultSettings.secondaryColor,
          
          // Fiscal from municipalities table
          nuit: m.nuit || '',
          bankName: m.bank_name || '',
          bankAccount: m.bank_account || '',
          nibIban: m.nib_iban || '',
          fiscalCode: m.fiscal_code || '',
          accountHolder: m.account_holder || '',

          // Fees from municipal_settings table
          iavFee: data.iav_fee ?? defaultSettings.iavFee,
          iavSedan: data.iav_sedan ?? defaultSettings.iavSedan,
          iavSuv: data.iav_suv ?? defaultSettings.iavSuv,
          iavCamiao: data.iav_camiao ?? defaultSettings.iavCamiao,
          iavAutocarro: data.iav_autocarro ?? defaultSettings.iavAutocarro,
          iavPesados: data.iav_pesados ?? defaultSettings.iavPesados,
          motoAte125: data.moto_ate_125 ?? defaultSettings.motoAte125,
          moto126a250: data.moto_126_a_250 ?? defaultSettings.moto126a250,
          motoAcima250: data.moto_acima_250 ?? defaultSettings.motoAcima250,
          regFee: data.reg_fee ?? defaultSettings.regFee,
          motoTaxiFee: data.moto_taxi_tax ?? defaultSettings.motoTaxiFee,
          penaltyFee: data.penalty_fee ?? defaultSettings.penaltyFee,
          
          // Complex config from JSONB
          config: data.config ? { ...defaultSettings.config, ...data.config } : defaultSettings.config
        };
        setSettings(fetched);
        applyBranding(fetched.primaryColor);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const applyBranding = (color) => {
    document.documentElement.style.setProperty('--primary-color', color);
    document.documentElement.style.setProperty('--primary', color);
  };

  useEffect(() => {
    localStorage.setItem('motogest_settings', JSON.stringify(settings));
    applyBranding(settings.primaryColor);
  }, [settings]);

  const updateSettings = async (newSettings) => {
    if (!profile?.municipality_id) return;
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    try {
      // 1. Update municipal_settings (Fees + Config)
      const { error: settingsError } = await supabase
        .from('municipal_settings')
        .upsert({
          municipality_id: profile.municipality_id,
          iav_fee: updated.iavFee,
          iav_sedan: updated.iavSedan,
          iav_suv: updated.iavSuv,
          iav_camiao: updated.iavCamiao,
          iav_autocarro: updated.iavAutocarro,
          iav_pesados: updated.iavPesados,
          moto_ate_125: updated.motoAte125,
          moto_126_a_250: updated.moto126a250,
          moto_acima_250: updated.motoAcima250,
          reg_fee: updated.regFee,
          moto_taxi_tax: updated.motoTaxiFee,
          penalty_fee: updated.penaltyFee,
          config: updated.config, // Save the JSONB config
          updated_at: new Date().toISOString()
        });

      if (settingsError) throw settingsError;
      
      // 2. Update municipality identity/fiscal data
      const { error: muniError } = await supabase
        .from('municipalities')
        .update({
          name: updated.municipalityName,
          province: updated.province,
          district: updated.district,
          address: updated.address,
          contact_email: updated.contactEmail,
          contact_phone: updated.contactPhone,
          website: updated.website,
          slogan: updated.slogan,
          primary_color: updated.primaryColor,
          secondary_color: updated.secondaryColor,
          logo_url: updated.logoUrl,
          nuit: updated.nuit,
          bank_name: updated.bankName,
          bank_account: updated.bankAccount,
          nib_iban: updated.nibIban,
          fiscal_code: updated.fiscalCode,
          account_holder: updated.accountHolder
        })
        .eq('id', profile.municipality_id);

      if (muniError) throw muniError;

    } catch (err) {
      console.error('Error saving settings:', err);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
