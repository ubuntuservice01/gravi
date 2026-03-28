import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    AlertTriangle, Save, X, Search, Bike, User, MapPin, 
    DollarSign, Info, ShieldAlert, Target, Gavel, 
    FileWarning, Zap, ChevronRight, CheckCircle2, 
    Activity, Clock, Map, ClipboardList, Briefcase,
    Building2, Filter, Loader2, Fingerprint
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/PageHeader';

const FineForm = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        vehicle_id: '',
        owner_id: '',
        infraction_type: '',
        description: '',
        value: '',
        location: '',
        severity: 'Moderada'
    });

    const [vehicleQuery, setVehicleQuery] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState(null);

    useEffect(() => {
        const fetchBaseValue = async () => {
            if (!profile?.municipality_id) return;
            const { data } = await supabase
                .from('municipal_settings')
                .select('fine_base_value')
                .eq('municipality_id', profile.municipality_id)
                .single();
            
            if (data) {
                setFormData(prev => ({ ...prev, value: data.fine_base_value }));
            }
        };
        fetchBaseValue();
    }, [profile]);

    const searchVehicle = async () => {
        if (!vehicleQuery.trim()) return;
        try {
            setSearching(true);
            setError(null);
            const { data, error } = await supabase
                .from('motorcycles')
                .select('*, owners(*)')
                .eq('plate', vehicleQuery.toUpperCase().trim())
                .eq('municipality_id', profile.municipality_id)
                .single();

            if (error) throw new Error('ALVO NÃO IDENTIFICADO: Veículo não localizado na base municipal.');
            
            setSelectedVehicle(data);
            setFormData(prev => ({
                ...prev,
                vehicle_id: data.id,
                owner_id: data.owner_id
            }));
        } catch (err) {
            setError(err.message);
            setSelectedVehicle(null);
        } finally {
            setSearching(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.vehicle_id) return setError('ERRO CRÍTICO: Nenhum veículo vinculado à infracção.');

        try {
            setLoading(true);
            const { error } = await supabase.from('fines').insert([{
                ...formData,
                value: parseFloat(formData.value),
                municipality_id: profile.municipality_id,
                fiscal_id: profile.id,
                status: 'pending'
            }]);

            if (error) throw error;
            navigate('/admin/fines');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const infractionTypes = [
        { id: 'Excesso de Velocidade', label: 'Velocidade', icon: <Zap size={20} />, severity: 'Alta' },
        { id: 'Falta de Capacete', label: 'Segurança BI', icon: <ShieldAlert size={20} />, severity: 'Moderada' },
        { id: 'Condução sem Licença', label: 'Ilegalidade', icon: <Gavel size={20} />, severity: 'Crítica' },
        { id: 'Estacionamento Proibido', label: 'Zonamento', icon: <MapPin size={20} />, severity: 'Baixa' },
        { id: 'Falta de Documentação', label: 'Administrativo', icon: <ClipboardList size={20} />, severity: 'Moderada' },
        { id: 'Embriaguez', label: 'Substâncias', icon: <Activity size={20} />, severity: 'Crítica' }
    ];

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '6rem' }}
        >
            <PageHeader
                title="Registo de Infracção Táctica"
                subtitle="Interface de processamento punitivo e conformidade de trânsito."
                breadcrumbs={[
                    { label: 'Painel', path: '/admin/dashboard' },
                    { label: 'Multas', path: '/admin/fines' },
                    { label: 'Nova Emissão' }
                ]}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '3rem' }}>
                
                {/* Left Side: Target Identification */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="card" style={{ padding: '3rem', borderRadius: '40px', background: 'white', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.03)' }}>
                        <h3 className="section-title-ultra">
                            <Target size={22} /> IDENTIFICAÇÃO DO ALVO
                        </h3>

                        {!selectedVehicle ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ position: 'relative' }}>
                                    <div className="plate-prefix-small">MZ</div>
                                    <input 
                                        type="text" 
                                        className="tac-input-ultra wide plate-font-small"
                                        placeholder="ABC-000-XX"
                                        value={vehicleQuery}
                                        onChange={(e) => setVehicleQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && searchVehicle()}
                                        style={{ paddingLeft: '70px' }}
                                    />
                                </div>
                                <button 
                                    onClick={searchVehicle}
                                    className="tac-btn-primary full-width"
                                    disabled={searching}
                                >
                                    {searching ? <Loader2 size={18} className="spin" /> : 'LOCALIZAR VEÍCULO'}
                                </button>
                                
                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="error-tactical"
                                    >
                                        <AlertTriangle size={18} /> {error}
                                    </motion.div>
                                )}
                            </div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="target-profile-card"
                            >
                                <div className="target-header">
                                    <div className="target-id-badge">{selectedVehicle.plate}</div>
                                    <button onClick={() => {setSelectedVehicle(null); setVehicleQuery(''); setError(null);}} className="btn-release">LIBERAR ALVO</button>
                                </div>
                                <div className="target-body">
                                    <div className="target-stat">
                                        <label>PROPRIETÁRIO</label>
                                        <p>{selectedVehicle.owners?.full_name}</p>
                                    </div>
                                    <div className="target-stat">
                                        <label>DOCUMENTO BI</label>
                                        <p>{selectedVehicle.owners?.bi_number}</p>
                                    </div>
                                    <div className="target-stat">
                                        <label>MARCA / MODELO</label>
                                        <p>{selectedVehicle.brand} {selectedVehicle.model}</p>
                                    </div>
                                    <div className="target-stat">
                                        <label>COR PREDOMINANTE</label>
                                        <p>{selectedVehicle.color || '---'}</p>
                                    </div>
                                </div>
                                <div className="target-footer">
                                    <CheckCircle2 size={18} color="#10b981" />
                                    <span>VÍNCULO SISTÉMICO CONFIRMADO</span>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    <div className="card tac-alert-warning">
                        <ShieldAlert size={28} style={{ flexShrink: 0 }} />
                        <div>
                            <h5 style={{ margin: 0, fontWeight: '950', color: '#991b1b' }}>Protocolo de Autuação</h5>
                            <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', fontWeight: '700', color: '#b91c1c', lineHeight: '1.5' }}>
                                A emissão deste auto de notícia é fidedigna e gera obrigatoriedade tributária ao titular do veículo. Toda informação deve ser verificada fisicamente.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Side: Infraction Details */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem', opacity: !selectedVehicle ? 0.35 : 1, pointerEvents: !selectedVehicle ? 'none' : 'auto', transition: 'all 0.5s' }}>
                    
                    <div className="card" style={{ padding: '3.5rem', borderRadius: '45px', background: 'white', boxShadow: '0 30px 70px -15px rgba(0,0,0,0.06)' }}>
                        <h3 className="section-title-ultra">
                            <FileWarning size={22} /> DETALHES DA OCORRÊNCIA
                        </h3>

                        <div style={{ display: 'grid', gap: '2.5rem' }}>
                            
                            <div>
                                <label className="tac-label-ultra">Natureza da Infracção</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                                    {infractionTypes.map(type => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => setFormData({...formData, infraction_type: type.id, severity: type.severity})}
                                            className={`infraction-type-btn ${formData.infraction_type === type.id ? 'active' : ''}`}
                                        >
                                            <div className="icon-wrap" style={{ 
                                                background: formData.infraction_type === type.id ? '#0f172a' : '#f8fafc',
                                                color: formData.infraction_type === type.id ? 'white' : '#64748b'
                                            }}>
                                                {type.icon}
                                            </div>
                                            <div className="text-wrap">
                                                <div className="l-label">{type.label}</div>
                                                <div className="l-sev" style={{ color: type.severity === 'Crítica' ? '#ef4444' : type.severity === 'Alta' ? '#f59e0b' : '#64748b' }}>{type.severity}</div>
                                            </div>
                                            {formData.infraction_type === type.id && <CheckCircle2 size={18} className="active-mark" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                                <FormField label="Localização / Logradouro">
                                    <div style={{ position: 'relative' }}>
                                        <MapPin style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={22} />
                                        <input 
                                            type="text" 
                                            className="tac-input-ultra"
                                            placeholder="Bairro, Rua ou Avenida..."
                                            value={formData.location}
                                            onChange={(e) => setFormData({...formData, location: e.target.value})}
                                            required
                                            style={{ paddingLeft: '55px' }}
                                        />
                                    </div>
                                </FormField>
                                <FormField label="Valor Pecuniário (MT)">
                                    <div style={{ position: 'relative' }}>
                                        <DollarSign style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#b45309' }} size={24} />
                                        <input 
                                            type="number" 
                                            className="tac-input-ultra val-input"
                                            value={formData.value}
                                            onChange={(e) => setFormData({...formData, value: e.target.value})}
                                            required
                                            style={{ paddingLeft: '55px' }}
                                        />
                                    </div>
                                </FormField>
                            </div>

                            <FormField label="Descrição Técnica da Infracção">
                                <textarea 
                                    className="tac-input-ultra" 
                                    style={{ minHeight: '160px', padding: '25px', resize: 'none' }}
                                    placeholder="Descreva as circunstâncias fácticas da infracção observada..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    required
                                />
                            </FormField>
                        </div>
                    </div>

                    <div style={{ 
                        display: 'flex', justifyContent: 'flex-end', gap: '1.5rem',
                        padding: '2.5rem', background: 'white', borderRadius: '35px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.03)'
                    }}>
                        <button 
                            type="button" 
                            className="tac-nav-btn secondary"
                            onClick={() => navigate('/admin/fines')}
                        >
                            CANCELAR
                        </button>
                        <button 
                            type="submit" 
                            className="tac-nav-btn primary danger"
                            disabled={loading || !selectedVehicle}
                        >
                            {loading ? <Loader2 size={24} className="spin" /> : <Save size={24} />}
                            {loading ? 'PROCESSANDO...' : 'EMITIR AUTO DE INFRACÇÃO'}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                .section-title-ultra { display: flex; align-items: center; gap: 12px; font-size: 0.75rem; font-weight: 950; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 2.5rem; }
                
                .tac-input-ultra { width: 100%; height: 60px; border-radius: 18px; border: 2.5px solid #f1f5f9; background: #f8fafc; padding: 0 25px; font-size: 1rem; font-weight: 700; color: #0f172a; outline: none; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
                .tac-input-ultra:focus { border-color: #3b82f6; background: white; box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.1); }
                
                .plate-prefix-small { position: absolute; left: 15px; top: 10px; bottom: 10px; width: 45px; background: #2563eb; border-radius: 10px; color: white; display: flex; align-items: center; justify-content: center; font-weight: 950; font-size: 0.75rem; }
                .plate-font-small { font-family: 'Monaco', monospace; font-size: 1.1rem; font-weight: 950; letter-spacing: 1px; }

                .tac-btn-primary { height: 60px; background: #0f172a; color: white; border: none; border-radius: 18px; font-weight: 950; font-size: 0.85rem; cursor: pointer; transition: all 0.3s; box-shadow: 0 15px 30px -5px rgba(15, 23, 42, 0.2); }
                .tac-btn-primary:hover { transform: translateY(-3px); box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.35); }
                .full-width { width: 100%; }

                .error-tactical { padding: 1.25rem; background: #fff1f2; border-radius: 18px; border: 1.5px solid #fecaca; color: #e11d48; font-size: 0.8rem; font-weight: 800; display: flex; gap: 10px; align-items: center; line-height: 1.4; }

                .target-profile-card { background: #0f172a; border-radius: 35px; padding: 2.5rem; color: white; }
                .target-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
                .target-id-badge { font-family: 'Monaco', monospace; font-size: 1.5rem; font-weight: 950; background: #f59e0b; color: #0f172a; padding: 10px 20px; border-radius: 12px; }
                .btn-release { background: rgba(255,255,255,0.05); border: none; padding: 8px 18px; border-radius: 100px; color: #94a3b8; font-size: 0.65rem; font-weight: 950; cursor: pointer; }
                .btn-release:hover { background: #ef4444; color: white; }
                
                .target-body { display: grid; gap: 1.5rem; margin-bottom: 2.5rem; }
                .target-stat label { display: block; font-size: 0.65rem; font-weight: 950; color: #64748b; letter-spacing: 1px; margin-bottom: 4px; }
                .target-stat p { margin: 0; font-size: 0.95rem; font-weight: 800; color: white; }
                
                .target-footer { display: flex; align-items: center; gap: 10px; padding: 15px; background: rgba(16, 185, 129, 0.05); border-radius: 15px; border: 1px solid rgba(16, 185, 129, 0.1); }
                .target-footer span { font-size: 0.7rem; font-weight: 950; color: #10b981; }

                .tac-alert-warning { padding: 2.5rem; background: #fef2f2; border-radius: 35px; border: 1.5px solid #fee2e2; display: flex; gap: 2rem; align-items: center; }

                .infraction-type-btn { padding: 1.25rem; border: 2.5px solid #f1f5f9; background: white; border-radius: 24px; display: flex; gap: 15px; align-items: center; cursor: pointer; transition: all 0.3s; position: relative; }
                .infraction-type-btn:hover { border-color: #cbd5e1; transform: translateY(-3px); }
                .infraction-type-btn.active { border-color: #0f172a; background: #f8fafc; }
                .icon-wrap { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
                .text-wrap { text-align: left; }
                .l-label { font-size: 0.9rem; font-weight: 950; color: #0f172a; }
                .l-sev { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; margin-top: 2px; }
                .active-mark { position: absolute; right: 20px; color: #0f172a; }

                .val-input { color: #b45309 !important; font-weight: 950 !important; font-size: 1.25rem !important; background: #fffbeb !important; border-color: #fef3c7 !important; }

                .tac-nav-btn { height: 64px; padding: 0 40px; border-radius: 22px; border: none; font-weight: 950; font-size: 0.95rem; cursor: pointer; display: flex; align-items: center; gap: 15px; transition: all 0.3s; }
                .tac-nav-btn.secondary { background: #f1f5f9; color: #64748b; }
                .tac-nav-btn.primary { background: #0f172a; color: white; box-shadow: 0 15px 30px -5px rgba(15, 23, 42, 0.25); }
                .tac-nav-btn.primary.danger { background: #ef4444; box-shadow: 0 15px 30px -5px rgba(239, 68, 68, 0.25); }

                .spin { animation: spin 1.5s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </motion.div>
    );
};

const FormField = ({ label, children }) => (
    <div>
        <label className="tac-label-ultra">{label}</label>
        {children}
    </div>
);

// Removed redeclaration of Building2 since it is already imported from lucide-react.


export default FineForm;
