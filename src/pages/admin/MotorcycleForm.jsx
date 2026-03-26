import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    Bike, User, FileText, MapPin, 
    Shield, Loader2, ChevronRight, ChevronLeft,
    CheckCircle2, AlertCircle, Info, Hash,
    Palette, Calendar, Phone, Gauge, Type,
    Fingerprint, BadgeCheck, FileCheck, ShieldCheck,
    Search, Plus, Settings, Activity, ClipboardCheck
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import OwnerSearch from '../../components/OwnerSearch';
import { motion, AnimatePresence } from 'framer-motion';

const MotorcycleForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { profile } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [selectedOwner, setSelectedOwner] = useState(null);

    const [formData, setFormData] = useState({
        plate: '',
        chassis: '',
        brand: '',
        model: '',
        color: '',
        year: new Date().getFullYear(),
        cc: '',
        purpose: 'Particular',
        status: 'Activa',
        operational_situation: 'Pendente',
        observations: '',
        taxi_driver_name: '',
        taxi_vest_number: '',
        taxi_phone: '',
        taxi_association: '',
        type: 'moto'
    });

    useEffect(() => {
        if (id) {
            fetchMotorcycle();
        }
    }, [id]);

    const fetchMotorcycle = async () => {
        setFetching(true);
        try {
            const { data, error } = await supabase
                .from('motorcycles')
                .select('*, owners(*)')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                setFormData({
                    ...data,
                    type: data.type || 'moto'
                });
                setSelectedOwner(data.owners);
            }
        } catch (err) {
            console.error('Error fetching motorcycle:', err);
        } finally {
            setFetching(false);
        }
    };

    const nextStep = () => {
        if (step === 1 && !selectedOwner) return;
        if (step === 2 && (!formData.plate || !formData.chassis || !formData.brand)) return;
        setStep(step + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const prevStep = () => {
        setStep(step - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const payload = {
                ...formData,
                owner_id: selectedOwner.id,
                municipality_id: profile.municipality_id,
                technician_id: profile.id,
                plate: formData.plate.toUpperCase().trim(),
                chassis: formData.chassis.toUpperCase().trim()
            };

            delete payload.owners;

            let result;
            if (id) {
                result = await supabase
                    .from('motorcycles')
                    .update(payload)
                    .eq('id', id);
            } else {
                result = await supabase
                    .from('motorcycles')
                    .insert([payload]);
            }

            if (result.error) throw result.error;
            navigate('/admin/motorcycles');
        } catch (err) {
            console.error('Error saving motorcycle:', err);
            alert('Erro ao guardar: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { id: 1, label: 'Identidade', icon: <Fingerprint size={20} />, sub: 'Titular' },
        { id: 2, label: 'Técnico', icon: <Gauge size={20} />, sub: 'Viatura' },
        { id: 3, label: 'Operativo', icon: <Activity size={20} />, sub: 'Uso' },
        { id: 4, label: 'Conformidade', icon: <ShieldCheck size={20} />, sub: 'Estado' },
        { id: 5, label: 'Finalização', icon: <ClipboardCheck size={20} />, sub: 'Revisão' }
    ];

    if (fetching) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1.5rem' }}>
                <div className="loader-ring"></div>
                <p style={{ fontWeight: '950', color: '#0f172a', letterSpacing: '1px', fontSize: '0.8rem' }}>DESCRIPTOGRAFANDO REGISTO...</p>
                <style>{`
                    .loader-ring { width: 64px; height: 64px; border: 4px solid #f1f5f9; border-top: 4px solid #0f172a; border-radius: 50%; animation: spin 1s linear infinite; }
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                `}</style>
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '6rem' }}
        >
            <PageHeader
                title={id ? 'Dossiê Técnico: Edição' : 'Recenseamento Táctico'}
                subtitle="Interface de alta fidelidade para registo e conformidade de veículos municipais."
                breadcrumbs={[
                    { label: 'Painel', path: '/admin/dashboard' },
                    { label: 'Frota', path: '/admin/motorcycles' },
                    { label: id ? 'Actualização' : 'Novo Ingresso' }
                ]}
            />

            {/* Ultra Stepper */}
            <div style={{ 
                display: 'flex', justifyContent: 'space-between', marginBottom: '4rem', 
                padding: '1.5rem', background: 'white', borderRadius: '30px', 
                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.03)', position: 'relative'
            }}>
                <div style={{ position: 'absolute', top: '50%', left: '10%', right: '10%', height: '2.5px', background: '#f1f5f9', zIndex: 0, transform: 'translateY(-50%)' }} />
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((step - 1) / 4) * 80}%` }}
                    style={{ position: 'absolute', top: '50%', left: '10%', height: '2.5px', background: 'linear-gradient(to right, #0f172a, #3b82f6)', zIndex: 1, transform: 'translateY(-50%)' }} 
                />
                
                {steps.map((s) => (
                    <motion.button
                        key={s.id}
                        onClick={() => s.id < step && setStep(s.id)}
                        style={{ 
                            position: 'relative', zIndex: 2, border: 'none', background: 'none', cursor: s.id < step ? 'pointer' : 'default',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100px'
                        }}
                    >
                        <div style={{ 
                            width: '56px', height: '56px', borderRadius: '20px', 
                            background: step === s.id ? '#0f172a' : step > s.id ? '#3b82f6' : 'white',
                            color: step >= s.id ? 'white' : '#94a3b8',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: step >= s.id ? 'none' : '2.5px solid #f1f5f9',
                            boxShadow: step === s.id ? '0 15px 30px -5px rgba(15, 23, 42, 0.2)' : 'none',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}>
                            {step > s.id ? <CheckCircle2 size={24} /> : s.icon}
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: '950', color: step >= s.id ? '#0f172a' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
                            <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginTop: '2px' }}>{s.sub}</div>
                        </div>
                    </motion.button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4, ease: "circOut" }}
                    className="card ultra-form-container"
                    style={{ padding: '4rem', borderRadius: '45px', border: 'none', background: 'white', boxShadow: '0 30px 70px -15px rgba(0,0,0,0.06)' }}
                >
                    {step === 1 && (
                        <div>
                            <SectionTitle icon={<User size={32} />} title="Identidade do Titular" sub="Vincule um proprietário verificado ao registo do veículo." />
                            <div style={{ position: 'relative' }}>
                                <OwnerSearch onSelect={setSelectedOwner} initialOwner={selectedOwner} />
                            </div>
                            
                            <AnimatePresence>
                                {selectedOwner && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="identity-verification-card"
                                    >
                                        <div className="id-avatar">
                                            {selectedOwner.full_name?.charAt(0)}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div className="id-name">{selectedOwner.full_name}</div>
                                            <div className="id-grid">
                                                <div className="id-pill">NUIT: {selectedOwner.nuit}</div>
                                                <div className="id-pill">BI/ID: {selectedOwner.bi_number}</div>
                                                <div className="id-pill">TEL: {selectedOwner.phone}</div>
                                            </div>
                                        </div>
                                        <BadgeCheck size={36} color="#10b981" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <SectionTitle icon={<Gauge size={32} />} title="Especificações Técnicas" sub="Insira os dados de engenharia e identificação fabril." />
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginBottom: '2.5rem' }}>
                                <FormField label="Matrícula Oficial">
                                    <div style={{ position: 'relative' }}>
                                        <div className="plate-prefix">MZ</div>
                                        <input
                                            type="text"
                                            className="tac-input-ultra plate-font"
                                            value={formData.plate}
                                            onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                                            placeholder="ABC-000-XX"
                                            style={{ paddingLeft: '80px' }}
                                        />
                                    </div>
                                </FormField>
                                <FormField label="Número do Chassis (VIN) - Verificação Física Obrigatória">
                                    <input
                                        type="text"
                                        className="tac-input-ultra"
                                        value={formData.chassis}
                                        onChange={(e) => setFormData({ ...formData, chassis: e.target.value })}
                                        placeholder="INSIRA OS 17 CARACTERES DO CHASSIS"
                                        style={{ textTransform: 'uppercase', letterSpacing: '2px' }}
                                    />
                                </FormField>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
                                <FormField label="Fabricante / Marca">
                                    <input type="text" className="tac-input-ultra" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} placeholder="Ex: HONDA, YAMAHA" />
                                </FormField>
                                <FormField label="Modelo de Engenharia">
                                    <input type="text" className="tac-input-ultra" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} placeholder="Ex: CG 125, DT" />
                                </FormField>
                                <FormField label="Ano de Fabrico">
                                    <input type="number" className="tac-input-ultra" value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} />
                                </FormField>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginTop: '2rem' }}>
                                <FormField label="Cor Predominante">
                                    <input type="text" className="tac-input-ultra" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} placeholder="Ex: VERMELHO" />
                                </FormField>
                                <FormField label="Cilindrada (CC)">
                                    <input type="number" className="tac-input-ultra" value={formData.cc} onChange={(e) => setFormData({ ...formData, cc: e.target.value })} placeholder="Ex: 125" />
                                </FormField>
                                <FormField label="Propulsão">
                                    <select className="tac-input-ultra" value={formData.fuel_type || 'Gasolina'} onChange={e => setFormData({...formData, fuel_type: e.target.value})}>
                                        <option>Gasolina</option>
                                        <option>Eléctrico</option>
                                        <option>Híbrido</option>
                                    </select>
                                </FormField>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div>
                            <SectionTitle icon={<Activity size={32} />} title="Perfil Operacional" sub="Defina a natureza de exploração do veículo no município." />
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                                <div>
                                    <label className="tac-label-ultra">Finalidade de Exploração</label>
                                    <div style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
                                        {[
                                            { id: 'Particular', label: 'Uso Particular', desc: 'Deslocação pessoal e privada.', icon: <User size={20} /> },
                                            { id: 'Moto-Táxi', label: 'Serviço Moto-Táxi', desc: 'Público com fins de lucro.', icon: <Bike size={20} /> },
                                            { id: 'Transporte', label: 'Logística / Carga', desc: 'Transporte de mercadorias.', icon: <FileText size={20} /> },
                                            { id: 'Serviço Público', label: 'Frota Institucional', desc: 'Veículos de estado ou município.', icon: <Building2 size={20} /> }
                                        ].map(p => (
                                            <motion.button
                                                key={p.id}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setFormData({ ...formData, purpose: p.id })}
                                                style={{ 
                                                    padding: '1.5rem', borderRadius: '24px', border: '3px solid', transition: 'all 0.3s',
                                                    borderColor: formData.purpose === p.id ? '#0f172a' : '#f1f5f9',
                                                    background: formData.purpose === p.id ? '#f8fafc' : 'white',
                                                    display: 'flex', gap: '20px', alignItems: 'center', textAlign: 'left', cursor: 'pointer'
                                                }}
                                            >
                                                <div style={{ 
                                                    width: '48px', height: '48px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: formData.purpose === p.id ? '#0f172a' : '#f8fafc',
                                                    color: formData.purpose === p.id ? 'white' : '#64748b'
                                                }}>
                                                    {p.icon}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '950', color: '#0f172a', fontSize: '1rem' }}>{p.label}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '700' }}>{p.desc}</div>
                                                </div>
                                                {formData.purpose === p.id && <CheckCircle2 size={24} color="#0f172a" style={{ marginLeft: 'auto' }} />}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                <div className="operational-details-card">
                                    <h4 style={{ margin: '0 0 2rem 0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: '950' }}>
                                        <Settings size={22} color="#3b82f6" />
                                        Parâmetros Adicionais
                                    </h4>
                                    
                                    {formData.purpose === 'Moto-Táxi' ? (
                                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                                            <FormField label="Nome de Guerra (Condutor)">
                                                <input type="text" className="tac-input-ultra dark" value={formData.taxi_driver_name} onChange={e => setFormData({ ...formData, taxi_driver_name: e.target.value })} />
                                            </FormField>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                                <FormField label="Nº do Colete">
                                                    <input type="text" className="tac-input-ultra dark" value={formData.taxi_vest_number} onChange={e => setFormData({ ...formData, taxi_vest_number: e.target.value })} />
                                                </FormField>
                                                <FormField label="Telefone Base">
                                                    <input type="text" className="tac-input-ultra dark" value={formData.taxi_phone} onChange={e => setFormData({ ...formData, taxi_phone: e.target.value })} />
                                                </FormField>
                                            </div>
                                            <FormField label="Associação / Cooperativa">
                                                <input type="text" className="tac-input-ultra dark" value={formData.taxi_association} onChange={e => setFormData({ ...formData, taxi_association: e.target.value })} />
                                            </FormField>
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                                            <div style={{ marginBottom: '1.5rem', color: '#cbd5e1' }}><Shield size={64} /></div>
                                            <p style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: '700', lineHeight: '1.6' }}>
                                                A configuração seleccionada ({formData.purpose}) segue os trâmites administrativos padrão. Nenhuma documentação especial de operador é requerida.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div>
                            <SectionTitle icon={<ShieldCheck size={32} />} title="Conformidade & Bloqueios" sub="Estado sistémico e notas de vistoria oficial." />
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginBottom: '3rem' }}>
                                <FormField label="Status Sistémico do Veículo">
                                    <select className="tac-input-ultra" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="Activa">Activa / Operacional</option>
                                        <option value="Inactiva">Inactiva (Fora de Uso)</option>
                                        <option value="Suspensa">Suspensa / Apreendida</option>
                                        <option value="Bloqueada">Bloqueada (Criminal / Administrativo)</option>
                                    </select>
                                </FormField>
                                <FormField label="Validação de Conformidade">
                                    <select className="tac-input-ultra" value={formData.operational_situation} onChange={e => setFormData({ ...formData, operational_situation: e.target.value })}>
                                        <option value="Regular">Aprovado em Vistoria</option>
                                        <option value="Irregular">Não Conforme / Rejeitado</option>
                                        <option value="Pendente">Em Análise Técnica</option>
                                    </select>
                                </FormField>
                            </div>

                            <FormField label="Dossiê de Observações Técnicas">
                                <textarea 
                                    className="tac-input-ultra" 
                                    style={{ minHeight: '180px', padding: '25px', resize: 'none' }}
                                    value={formData.observations}
                                    onChange={e => setFormData({ ...formData, observations: e.target.value })}
                                    placeholder="Descreva anomalias, avarias ou notas de vistoria..."
                                />
                            </FormField>
                        </div>
                    )}

                    {step === 5 && (
                        <div>
                            <SectionTitle icon={<CheckCircle2 size={32} />} title="Conferência de Registos" sub="Verifique a integridade dos dados antes da selagem digital." />
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                                <div className="forensic-card">
                                    <div className="forensic-header">DETALHES DA VIATURA</div>
                                    <ForensicRow label="PLACA / MATRÍCULA" value={formData.plate} highlight />
                                    <ForensicRow label="CHASSIS (VIN)" value={formData.chassis} />
                                    <ForensicRow label="MARCA / MODELO" value={`${formData.brand} ${formData.model}`} />
                                    <ForensicRow label="COR PREDOMINANTE" value={formData.color} />
                                    <ForensicRow label="TIPO DE USO" value={formData.purpose} badge />
                                </div>
                                
                                <div className="forensic-card">
                                    <div className="forensic-header">DETALHES DO TITULAR</div>
                                    <ForensicRow label="NOME COMPLETO" value={selectedOwner?.full_name} highlight />
                                    <ForensicRow label="NUIT FISCAL" value={selectedOwner?.nuit} />
                                    <ForensicRow label="CIDADÃO BI / ID" value={selectedOwner?.bi_number} />
                                    <ForensicRow label="CONTACTO" value={selectedOwner?.phone} />
                                    <div style={{ marginTop: 'auto', padding: '1.5rem', background: '#ecfdf5', borderRadius: '15px', border: '1.5px solid #10b98130', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <ShieldCheck size={20} color="#059669" />
                                        <span style={{ fontSize: '0.8rem', fontWeight: '950', color: '#065f46' }}>TITULAR VALIDADO NO SISTEMA CENTRAL</span>
                                    </div>
                                </div>
                            </div>

                            <div className="submission-disclaimer">
                                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                                    <AlertCircle size={24} />
                                </div>
                                <div>
                                    <h5 style={{ margin: 0, fontWeight: '950', color: '#ef4444' }}>Declaração de Integridade</h5>
                                    <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#991b1b', fontWeight: '700', lineHeight: '1.5' }}>
                                        Eu, {profile?.full_name}, declaro que realizei a conferência física do veículo e que todos os dados aqui inseridos são fidedignos e de minha inteira responsabilidade técnica.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Tactical Navigation Bar */}
            <div style={{ 
                marginTop: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '2.5rem', background: 'white', borderRadius: '35px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.03)'
            }}>
                <button 
                    onClick={step === 1 ? () => navigate('/admin/motorcycles') : prevStep}
                    className="tac-nav-btn secondary"
                >
                    <ChevronLeft size={22} /> {step === 1 ? 'ABORTAR PROCESSO' : 'VOLTAR ATRÁS'}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'right', display: 'none', md: 'block' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: '950', color: '#94a3b8', textTransform: 'uppercase' }}>Fase de Ingresso</div>
                        <div style={{ fontSize: '1rem', fontWeight: '950', color: '#0f172a' }}>{step} de 5 CONCLUÍDOS</div>
                    </div>
                    
                    <button 
                        onClick={step === 5 ? handleSubmit : nextStep}
                        disabled={loading}
                        className={`tac-nav-btn primary ${step === 5 ? 'success' : ''}`}
                    >
                        {loading ? <Loader2 size={22} className="spin" /> : (
                            <>
                                {step === 5 ? (id ? 'ACTUALIZAR DOSSIÊ' : 'SELAR E SUBMETER') : 'PRÓXIMO PASSO'}
                                <ChevronRight size={22} />
                            </>
                        )}
                    </button>
                </div>
            </div>

            <style>{`
                .ultra-form-container { background-image: radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.03) 0, transparent 50%), radial-gradient(at 50% 0%, rgba(15, 23, 42, 0.03) 0, transparent 50%); }
                
                .tac-label-ultra { display: block; font-size: 0.75rem; font-weight: 950; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px; }
                .tac-input-ultra { width: 100%; height: 60px; border-radius: 18px; border: 2.5px solid #f1f5f9; background: #f8fafc; padding: 0 25px; font-size: 1rem; font-weight: 700; color: #0f172a; outline: none; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
                .tac-input-ultra:focus { border-color: #3b82f6; background: white; box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.1); }
                .tac-input-ultra.dark { background: #f1f5f9; border-color: #e2e8f0; }
                
                .plate-prefix { position: absolute; left: 15px; top: 10px; bottom: 10px; width: 50px; background: #2563eb; border-radius: 10px; color: white; display: flex; align-items: center; justify-content: center; font-weight: 950; font-size: 0.8rem; letter-spacing: 1px; }
                .plate-font { font-family: 'Monaco', 'Courier New', monospace; font-size: 1.4rem; letter-spacing: 2px; }

                .identity-verification-card { margin-top: 3rem; padding: 2.5rem; background: #0f172a; border-radius: 30px; display: flex; align-items: center; gap: 2.5rem; color: white; }
                .id-avatar { width: 80px; height: 80px; border-radius: 25px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); display: flex; align-items: center; justify-content: center; font-size: 2.5rem; font-weight: 950; text-shadow: 0 4px 10px rgba(0,0,0,0.2); }
                .id-name { font-size: 1.5rem; font-weight: 950; letter-spacing: -0.5px; margin-bottom: 10px; }
                .id-grid { display: flex; gap: 12px; }
                .id-pill { padding: 6px 14px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); border-radius: 100px; font-size: 0.75rem; font-weight: 800; color: #94a3b8; }

                .operational-details-card { background: #f8fafc; padding: 3rem; borderRadius: 35px; border: 2px dashed #e2e8f0; }
                
                .forensic-card { padding: 2.5rem; background: #f8fafc; border-radius: 30px; border: 1.5px solid #f1f5f9; display: flex; flexDirection: column; gap: 15px; }
                .forensic-header { font-size: 0.7rem; font-weight: 950; color: #94a3b8; letter-spacing: 2px; margin-bottom: 10px; }
                
                .submission-disclaimer { margin-top: 3rem; padding: 2.5rem; background: #fff1f2; border-radius: 30px; border: 1.5px solid #fecaca; display: flex; gap: 2rem; align-items: center; }

                .tac-nav-btn { height: 64px; padding: 0 40px; border-radius: 22px; border: none; font-weight: 950; font-size: 0.95rem; cursor: pointer; display: flex; align-items: center; gap: 15px; transition: all 0.3s; }
                .tac-nav-btn.secondary { background: #f1f5f9; color: #64748b; }
                .tac-nav-btn.secondary:hover { background: #e2e8f0; color: #0f172a; }
                .tac-nav-btn.primary { background: #0f172a; color: white; box-shadow: 0 15px 30px -5px rgba(15, 23, 42, 0.25); }
                .tac-nav-btn.primary:hover { transform: translateY(-3px); box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.4); }
                .tac-nav-btn.primary.success { background: #10b981; box-shadow: 0 15px 30px -5px rgba(16, 185, 129, 0.25); }
                .tac-nav-btn.primary.success:hover { box-shadow: 0 20px 40px -10px rgba(16, 185, 129, 0.4); }
                .tac-nav-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

                .spin { animation: spin 1.5s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </motion.div>
    );
};

const SectionTitle = ({ icon, title, sub }) => (
    <div style={{ marginBottom: '3.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ color: '#0f172a' }}>{icon}</div>
            <div>
                <h2 style={{ fontSize: '2rem', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-1px' }}>{title}</h2>
                <p style={{ margin: '6px 0 0 0', fontWeight: '800', color: '#94a3b8', fontSize: '1rem' }}>{sub}</p>
            </div>
        </div>
    </div>
);

const FormField = ({ label, children }) => (
    <div>
        <label className="tac-label-ultra">{label}</label>
        {children}
    </div>
);

const ForensicRow = ({ label, value, highlight, badge }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1.5px solid #f1f5f9' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8' }}>{label}</span>
        {badge ? (
            <span style={{ padding: '6px 12px', background: '#0f172a', color: 'white', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '950' }}>{value?.toUpperCase()}</span>
        ) : (
            <span style={{ fontWeight: highlight ? '950' : '800', color: highlight ? '#0f172a' : '#475569', fontSize: highlight ? '1rem' : '0.95rem' }}>{value || '---'}</span>
        )}
    </div>
);

const Building2 = ({ size, color }) => <FileText size={size} color={color} />; // Fallback

export default MotorcycleForm;
