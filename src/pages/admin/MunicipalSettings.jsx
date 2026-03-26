import React, { useState, useEffect } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { 
    Save, Upload, AlertCircle, Car, Bike, Receipt, Building2, 
    Loader2, MapPin, ShieldCheck, CreditCard, Bell, Gauge, 
    Settings, FileText, Smartphone, Lock, Clock, Plus, Trash2,
    Calendar, HardDrive, Map, BadgeAlert, Layers, Globe,
    Activity, ChevronRight, Layout, Palette, Database, Shield
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../../components/PageHeader';

const FormField = ({ label, children, description }) => (
    <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: '950', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.2px' }}>{label}</label>
        </div>
        {children}
        {description && <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '10px', fontWeight: '600', lineHeight: '1.5' }}>{description}</p>}
    </div>
);

const Input = ({ type = 'text', ...props }) => (
    <input
        type={type}
        className="tac-input-settings"
        {...props}
    />
);

const Select = ({ options, ...props }) => (
    <div style={{ position: 'relative' }}>
        <select className="tac-input-settings" style={{ appearance: 'none', paddingRight: '45px' }} {...props}>
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <div style={{ position: 'absolute', right: '18px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }}>
            <ChevronRight size={18} style={{ transform: 'rotate(90deg)' }} />
        </div>
    </div>
);

const Switch = ({ checked, onChange, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 20px', background: '#f8fafc', borderRadius: '16px', border: '1.5px solid #f1f5f9', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#1e293b' }}>{label}</span>
        <button
            onClick={() => onChange(!checked)}
            style={{
                width: '52px', height: '28px', borderRadius: '100px', padding: '4px', border: 'none',
                backgroundColor: checked ? '#3b82f6' : '#e2e8f0', cursor: 'pointer',
                display: 'flex', alignItems: 'center', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
        >
            <motion.div 
                animate={{ x: checked ? 24 : 0 }}
                style={{
                    width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
            />
        </button>
    </div>
);

const SectionCard = ({ icon, title, children, description, color = '#0f172a' }) => (
    <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card" 
        style={{ 
            padding: '3rem', 
            borderRadius: '35px', 
            border: 'none',
            background: 'white',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.03)',
            position: 'relative',
            overflow: 'hidden'
        }}
    >
        <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', background: `${color}05`, borderRadius: '0 0 0 100%' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '2.5rem', position: 'relative', zIndex: 1 }}>
            <div style={{ 
                width: '56px', height: '56px', borderRadius: '18px', 
                backgroundColor: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color
            }}>
                {React.cloneElement(icon, { size: 26 })}
            </div>
            <div>
                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '950', color: '#0f172a', letterSpacing: '-0.5px' }}>{title}</h3>
                {description && <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#64748b', fontWeight: '600' }}>{description}</p>}
            </div>
        </div>
        <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
            {children}
        </div>
    </motion.div>
);

const MunicipalSettings = () => {
    const { settings, updateSettings } = useSettings();
    const [localSettings, setLocalSettings] = useState(settings);
    const [isDirty, setIsDirty] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [activeTab, setActiveTab] = useState('institucional');

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    useEffect(() => {
        const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(settings);
        setIsDirty(hasChanges);
    }, [localSettings, settings]);

    const handleSave = async () => {
        await updateSettings(localSettings);
        setIsDirty(false);
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `logo_${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('system')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('system')
                .getPublicUrl(fileName);

            updateField('logoUrl', publicUrl);
        } catch (err) {
            console.error('Erro no upload:', err);
            alert('Erro ao carregar imagem. Verifique o bucket "system".');
        } finally {
            setIsUploading(false);
        }
    };

    const updateField = (field, value) => {
        setLocalSettings(prev => ({ ...prev, [field]: value }));
    };

    const updateConfig = (key, value) => {
        setLocalSettings(prev => ({
            ...prev,
            config: {
                ...prev.config,
                [key]: { ...prev.config[key], ...value }
            }
        }));
    };

    const handleInfractionChange = (index, field, value) => {
        const newInfractions = [...localSettings.config.infractions];
        newInfractions[index] = { ...newInfractions[index], [field]: value };
        updateField('config', { ...localSettings.config, infractions: newInfractions });
    };

    const addInfraction = () => {
        const newInfractions = [...localSettings.config.infractions, { type: '', value: 0, action: 'Multa', status: 'Ativo' }];
        updateField('config', { ...localSettings.config, infractions: newInfractions });
    };

    const removeInfraction = (index) => {
        const newInfractions = localSettings.config.infractions.filter((_, i) => i !== index);
        updateField('config', { ...localSettings.config, infractions: newInfractions });
    };

    const tabs = [
        { id: 'institucional', label: 'Identidade', icon: <Building2 size={18} /> },
        { id: 'fiscal', label: 'Finanças', icon: <Receipt size={18} /> },
        { id: 'operativo', label: 'Operacional', icon: <Gauge size={18} /> },
        { id: 'multas', label: 'Infracções', icon: <BadgeAlert size={18} /> },
        { id: 'seguranca', label: 'Segurança', icon: <ShieldCheck size={18} /> },
        { id: 'infra', label: 'Infraestrutura', icon: <Database size={18} /> }
    ];

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ maxWidth: '1600px', margin: '0 auto', paddingBottom: '6rem' }}
        >
            <PageHeader 
                title="Command & Control: Definições"
                subtitle="Gestão táctica e estratégica dos parâmetros operativos do município."
                breadcrumbs={[
                    { label: 'Painel', path: '/admin/dashboard' },
                    { label: 'Configurações' }
                ]}
                actions={
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <AnimatePresence>
                            {isDirty && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.9, x: 20 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, x: 20 }}
                                    onClick={handleSave}
                                    className="tac-btn-save"
                                >
                                    <Save size={20} /> GUARDAR ALTERAÇÕES
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>
                }
            />

            {/* Navigation Tabs */}
            <div className="card" style={{ marginBottom: '3rem', padding: '0.75rem', borderRadius: '24px', border: 'none', background: 'white', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.03)', display: 'flex', gap: '10px', overflowX: 'auto' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '12px 24px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '10px',
                            border: 'none', fontWeight: '900', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.3s',
                            background: activeTab === tab.id ? '#0f172a' : 'transparent',
                            color: activeTab === tab.id ? 'white' : '#64748b'
                        }}
                    >
                        {tab.icon} {tab.label.toUpperCase()}
                    </button>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2.5rem' }}>
                
                {activeTab === 'institucional' && (
                    <>
                        <SectionCard 
                            icon={<Building2 />} 
                            title="Identidade Institucional" 
                            color="#3b82f6"
                            description="Configurações de marca e visibilidade pública."
                        >
                            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '3rem', background: '#f8fafc', padding: '2.5rem', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
                                <div style={{ 
                                    width: '100px', height: '100px', borderRadius: '25px', background: 'white', border: '2.5px solid #f1f5f9',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 10px 20px rgba(0,0,0,0.05)'
                                }}>
                                    {localSettings.logoUrl ? (
                                        <img src={localSettings.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    ) : (
                                        <Upload size={32} color="#cbd5e1" />
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label className="tac-btn-upload">
                                        {isUploading ? <Loader2 size={18} className="spin" /> : <Upload size={18} />}
                                        {isUploading ? 'CARREGANDO...' : 'ACTUALIZAR BRASÃO'}
                                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} disabled={isUploading} />
                                    </label>
                                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '12px', fontWeight: '800', letterSpacing: '0.5px' }}>Ficheiro vectorial (SVG) ou PNG recomendado.</p>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
                                <FormField label="Nome do Município Institucional">
                                    <Input value={localSettings.municipalityName} onChange={e => updateField('municipalityName', e.target.value)} />
                                </FormField>
                                <FormField label="Província / Região">
                                    <Input value={localSettings.province} onChange={e => updateField('province', e.target.value)} />
                                </FormField>
                            </div>
                            <FormField label="Slogan de Gestão">
                                <Input value={localSettings.slogan} onChange={e => updateField('slogan', e.target.value)} placeholder="Ex: Eficiência e Transparência" />
                            </FormField>
                        </SectionCard>

                        <SectionCard icon={<Palette />} title="Design & Visibilidade" color="#6366f1" description="Temas e cores oficiais da plataforma.">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <FormField label="Cor Identitária">
                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', background: '#f8fafc', padding: '12px', borderRadius: '14px', border: '2px solid #f1f5f9' }}>
                                        <input type="color" value={localSettings.primaryColor} onChange={e => updateField('primaryColor', e.target.value)} style={{ width: '45px', height: '45px', border: 'none', borderRadius: '10px', cursor: 'pointer', background: 'none' }} />
                                        <span style={{ fontFamily: 'Monaco, monospace', fontWeight: '950', color: '#1e293b' }}>{localSettings.primaryColor.toUpperCase()}</span>
                                    </div>
                                </FormField>
                                <FormField label="Cor Secundária">
                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', background: '#f8fafc', padding: '12px', borderRadius: '14px', border: '2px solid #f1f5f9' }}>
                                        <input type="color" value={localSettings.secondaryColor} onChange={e => updateField('secondaryColor', e.target.value)} style={{ width: '45px', height: '45px', border: 'none', borderRadius: '10px', cursor: 'pointer', background: 'none' }} />
                                        <span style={{ fontFamily: 'Monaco, monospace', fontWeight: '950', color: '#1e293b' }}>{localSettings.secondaryColor.toUpperCase()}</span>
                                    </div>
                                </FormField>
                            </div>
                            <FormField label="URL do Website Institucional">
                                <Input value={localSettings.website} onChange={e => updateField('website', e.target.value)} placeholder="https://municipio.gov.mz" />
                            </FormField>
                            <FormField label="Canal de Email Central">
                                <Input value={localSettings.contactEmail} onChange={e => updateField('contactEmail', e.target.value)} />
                            </FormField>
                        </SectionCard>
                    </>
                )}

                {activeTab === 'fiscal' && (
                    <>
                        <SectionCard icon={<Receipt />} title="Parâmetros Fiscais" color="#f59e0b" description="Informações para auditoria e transparência bancária.">
                            <FormField label="NUIT Institucional (Identificador Fiscal)">
                                <Input value={localSettings.nuit} onChange={e => updateField('nuit', e.target.value)} />
                            </FormField>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <FormField label="Entidade Bancária">
                                    <Input value={localSettings.bankName} onChange={e => updateField('bankName', e.target.value)} />
                                </FormField>
                                <FormField label="Código de Tesouraria">
                                    <Input value={localSettings.fiscalCode} onChange={e => updateField('fiscalCode', e.target.value)} />
                                </FormField>
                            </div>
                            <FormField label="Número de Conta Bancária">
                                <Input value={localSettings.bankAccount} onChange={e => updateField('bankAccount', e.target.value)} />
                            </FormField>
                            <FormField label="Identificador IBAN / NIB">
                                <Input value={localSettings.nibIban} onChange={e => updateField('nibIban', e.target.value)} />
                            </FormField>
                        </SectionCard>

                        <SectionCard icon={<CreditCard />} title="Fluxos de Receita" color="#10b981" description="Métodos de pagamento e taxas de intermediação.">
                            <FormField label="Redes de Pagamento Activas">
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                    {['M-Pesa', 'e-Mola', 'mKesh', 'Banco', 'POS', 'Numerário'].map(method => {
                                        const isActive = localSettings.config.payments.allowed_methods.includes(method);
                                        return (
                                            <button
                                                key={method}
                                                onClick={() => {
                                                    const current = localSettings.config.payments.allowed_methods;
                                                    const next = isActive ? current.filter(m => m !== method) : [...current, method];
                                                    updateConfig('payments', { allowed_methods: next });
                                                }}
                                                className={`tac-check-btn ${isActive ? 'active' : ''}`}
                                            >
                                                {method}
                                            </button>
                                        );
                                    })}
                                </div>
                            </FormField>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
                                <FormField label="Fee de Intermediação (%)" description="Ajuste para cobrir taxas de operador.">
                                    <Input type="number" value={localSettings.config.payments.platform_percentage} onChange={e => updateConfig('payments', { platform_percentage: parseInt(e.target.value) })} />
                                </FormField>
                                <FormField label="Vector de Liquidação Padrão">
                                    <Select 
                                        value={localSettings.config.payments.default_method} 
                                        onChange={e => updateConfig('payments', { default_method: e.target.value })}
                                        options={[
                                            { value: 'Numerário', label: 'Dinheiro Físico' },
                                            { value: 'M-Pesa', label: 'M-Pesa' },
                                            { value: 'Banco', label: 'Transferência / EFT' }
                                        ]}
                                    />
                                </FormField>
                            </div>
                        </SectionCard>
                    </>
                )}

                {activeTab === 'operativo' && (
                    <>
                        <SectionCard icon={<FileText />} title="Configuração de Licenciamento" color="#3b82f6" description="Padrões de conformidade técnica e renovação.">
                            <FormField label="Período de Validade Táctica">
                                <Select 
                                    value={localSettings.config.licenses.validity} 
                                    onChange={e => updateConfig('licenses', { validity: e.target.value })}
                                    options={[
                                        { value: '6m', label: 'Exploração Semestral (6 Meses)' },
                                        { value: '1y', label: 'Exploração Anual (1 Ano)' },
                                        { value: '2y', label: 'Exploração Bienal (2 Anos)' }
                                    ]}
                                />
                            </FormField>
                            <Switch 
                                label="Habilitar renovação antecipada" 
                                checked={localSettings.config.licenses.allow_early_renewal}
                                onChange={v => updateConfig('licenses', { allow_early_renewal: v })}
                            />
                            <FormField label="Janela de Antecipação (Dias)" description="Dias antes da expiração para início de trâmite.">
                                <Input 
                                    type="number" 
                                    disabled={!localSettings.config.licenses.allow_early_renewal}
                                    value={localSettings.config.licenses.early_renewal_days} 
                                    onChange={e => updateConfig('licenses', { early_renewal_days: parseInt(e.target.value) })} 
                                />
                            </FormField>
                            <Switch 
                                label="Alertas proactivos de conformidade" 
                                checked={localSettings.config.licenses.enable_expiry_alerts}
                                onChange={v => updateConfig('licenses', { enable_expiry_alerts: v })}
                            />
                        </SectionCard>

                        <SectionCard icon={<Bike />} title="Operação Moto-Táxi" color="#8b5cf6" description="Métricas específicas para o sector de passageiros.">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <FormField label="Emissão de Licença (MT)">
                                    <Input type="number" value={localSettings.motoTaxiFee} onChange={e => updateField('motoTaxiFee', parseInt(e.target.value))} />
                                </FormField>
                                <FormField label="Capacidade da Frota" description="Limite municipal de veículos.">
                                    <Input type="number" value={localSettings.config.moto_taxi.max_vehicles} onChange={e => updateConfig('moto_taxi', { max_vehicles: parseInt(e.target.value) })} />
                                </FormField>
                            </div>
                            <FormField label="Padrão Identitário (Uniforme)">
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: localSettings.config.moto_taxi.vest_color || '#fbbf24', border: '2px solid white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}></div>
                                    <Input value={localSettings.config.moto_taxi.vest_color} onChange={e => updateConfig('moto_taxi', { vest_color: e.target.value })} placeholder="Ex: Amarelo Fluorescente" />
                                </div>
                            </FormField>
                        </SectionCard>
                    </>
                )}

                {activeTab === 'multas' && (
                    <>
                        <SectionCard icon={<BadgeAlert />} title="Catálogo de Infracções" color="#ef4444" description="Gestão de penalizações e medidas punitivas.">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <AnimatePresence>
                                    {localSettings.config.infractions.map((inf, idx) => (
                                        <motion.div 
                                            key={idx} 
                                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                                            style={{ 
                                                display: 'grid', gridTemplateColumns: '2fr 150px 150px 44px', gap: '12px', 
                                                padding: '1rem', background: '#f8fafc', borderRadius: '18px', border: '1.5px solid #f1f5f9'
                                            }}
                                        >
                                            <input 
                                                value={inf.type} 
                                                onChange={e => handleInfractionChange(idx, 'type', e.target.value)}
                                                placeholder="Descrição da Infracção" 
                                                className="tac-table-input"
                                            />
                                            <div style={{ position: 'relative' }}>
                                                <input 
                                                    type="number" 
                                                    value={inf.value} 
                                                    onChange={e => handleInfractionChange(idx, 'value', parseInt(e.target.value))}
                                                    placeholder="Valor" 
                                                    className="tac-table-input"
                                                    style={{ paddingRight: '35px' }}
                                                />
                                                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.7rem', fontWeight: '950', color: '#94a3b8' }}>MT</span>
                                            </div>
                                            <select 
                                                value={inf.action} 
                                                onChange={e => handleInfractionChange(idx, 'action', e.target.value)}
                                                className="tac-table-input"
                                                style={{ fontSize: '0.8rem', fontWeight: '800' }}
                                            >
                                                <option>Multa</option>
                                                <option>Apreensão</option>
                                                <option>Ambos</option>
                                            </select>
                                            <button onClick={() => removeInfraction(idx)} style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'white', border: '1.5px solid #fee2e2', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                                                <Trash2 size={18} />
                                            </button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                <button 
                                    onClick={addInfraction}
                                    style={{ 
                                        padding: '20px', borderRadius: '18px', border: '2.5px dashed #cbd5e1', 
                                        background: 'transparent', color: '#64748b', fontWeight: '950', fontSize: '0.85rem',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '10px'
                                    }}
                                >
                                    <Plus size={20} /> ADICIONAR NOVA INFRACÇÃO OPERACIONAL
                                </button>
                            </div>
                        </SectionCard>

                        <SectionCard icon={<Lock />} title="Gestão de Apreensões" color="#475569" description="Condições de retenção e parqueamento.">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <FormField label="Diária de Parqueamento (MT)">
                                    <Input type="number" value={localSettings.config.seizure_rules.daily_parking_fee} onChange={e => updateConfig('seizure_rules', { daily_parking_fee: parseInt(e.target.value) })} />
                                </FormField>
                                <FormField label="Taxa Administrativa (Release)">
                                    <Input type="number" value={localSettings.config.seizure_rules.release_fee} onChange={e => updateConfig('seizure_rules', { release_fee: parseInt(e.target.value) })} />
                                </FormField>
                            </div>
                            <Switch label="Automatizar contagem de custos diários" checked={localSettings.config.seizure_rules.auto_calculate} onChange={v => updateConfig('seizure_rules', { auto_calculate: v })} />
                            <Switch label="Bloqueio sistémico em caso de retenção" checked={localSettings.config.seizure_rules.lock_vehicle} onChange={v => updateConfig('seizure_rules', { lock_vehicle: v })} />
                        </SectionCard>
                    </>
                )}

                {/* Additional tabs can be implemented similarly with same styling pattern */}
                
            </div>

            <style>{`
                .tac-input-settings { width: 100%; height: 56px; border-radius: 16px; border: 2.5px solid #f1f5f9; background: #f8fafc; padding: 0 20px; font-size: 0.95rem; fontWeight: 700; color: #0f172a; outline: none; transition: all 0.2s; }
                .tac-input-settings:focus { border-color: #3b82f6; background: white; box-shadow: 0 10px 20px -5px rgba(59, 130, 246, 0.1); }
                
                .tac-btn-save { padding: 0 35px; height: 52px; border-radius: 16px; border: none; background: #0f172a; color: white; fontWeight: 950; display: flex; align-items: center; gap: 12px; cursor: pointer; box-shadow: 0 15px 30px -5px rgba(15, 23, 42, 0.3); }
                
                .tac-btn-upload { display: inline-flex; align-items: center; gap: 10px; height: 48px; padding: 0 25px; border-radius: 14px; border: 2.5px solid #f1f5f9; background: white; color: #0f172a; font-size: 0.8rem; fontWeight: 950; cursor: pointer; transition: all 0.2s; }
                .tac-btn-upload:hover { border-color: #0f172a; background: #f8fafc; }

                .tac-check-btn { padding: 12px 24px; border-radius: 100px; border: 2.5px solid #f1f5f9; background: white; color: #64748b; font-size: 0.8rem; fontWeight: 950; cursor: pointer; transition: all 0.2s; }
                .tac-check-btn.active { background: #0f172a; border-color: #0f172a; color: white; box-shadow: 0 8px 15px rgba(0,0,0,0.1); }

                .tac-table-input { width: 100%; height: 44px; border: none; background: white; border-radius: 10px; padding: 0 15px; font-size: 0.9rem; fontWeight: 700; color: #1e293b; outline: none; }
                .tac-table-input:focus { box-shadow: 0 4px 10px rgba(0,0,0,0.05); }

                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .spin { animation: spin 1.5s linear infinite; }
            `}</style>
        </motion.div>
    );
};

export default MunicipalSettings;
