import React, { useState, useEffect } from 'react';
import { 
    ArrowLeft, Save, MapPin, User, Loader2, 
    ChevronRight, Building2, Paintbrush, Shield,
    UserCircle, Mail, Lock
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { createClient } from '@supabase/supabase-js';

const MunicipalityForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const [munData, setMunData] = useState({
        name: '', province: '', district: '',
        contact_email: '', contact_phone: '',
        primary_color: '#0f172a', secondary_color: '#ffffff',
        status: 'active', is_production: false
    });

    const [adminData, setAdminData] = useState({
        name: '', email: '', password: ''
    });

    useEffect(() => {
        if (id) {
            fetchMunicipality();
        }
    }, [id]);

    const fetchMunicipality = async () => {
        setFetching(true);
        try {
            const { data, error } = await supabase
                .from('municipalities')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            setMunData(data);
        } catch (err) {
            setError('Erro ao carregar dados: ' + err.message);
        } finally {
            setFetching(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (id) {
                const { error: updateError } = await supabase
                    .from('municipalities')
                    .update(munData)
                    .eq('id', id);
                if (updateError) throw updateError;
            } else {
                const { data: newMun, error: munError } = await supabase
                    .from('municipalities')
                    .insert([munData])
                    .select()
                    .single();

                if (munError) throw new Error('Falha ao criar município: ' + munError.message);

                const ephemeralClient = createClient(
                    import.meta.env.VITE_SUPABASE_URL,
                    import.meta.env.VITE_SUPABASE_ANON_KEY,
                    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
                );

                const { error: authError } = await ephemeralClient.auth.signUp({
                    email: adminData.email,
                    password: adminData.password,
                    options: {
                        data: { full_name: adminData.name, role: 'admin_municipal', municipality_id: newMun.id }
                    }
                });

                if (authError) throw authError;
            }

            setSuccess(true);
            setTimeout(() => navigate('/super-admin/municipalities'), 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return (
        <div style={{ padding: '8rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <Loader2 className="spin" size={48} color="#0f172a" />
            <p style={{ color: '#64748b', fontWeight: '500' }}>Carregando formulário...</p>
        </div>
    );

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '4rem' }}>
            {/* Header Area */}
            <div style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.85rem', fontWeight: '600' }}>
                    <Link to="/super-admin/municipalities" style={{ color: '#64748b' }}>Municípios</Link>
                    <ChevronRight size={14} color="#94a3b8" />
                    <span style={{ color: '#0f172a' }}>{id ? 'Editar' : 'Novo'}</span>
                </div>
                <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
                    {id ? 'Editar Município' : 'Registo Institucional'}
                </h1>
                <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: '500', marginTop: '4px' }}>
                    {id ? 'Aceda e altere os dados fundamentais da entidade.' : 'Configure uma nova entidade municipal e o seu gestor principal.'}
                </p>
            </div>

            {error && (
                <div style={{ padding: '1.25rem', backgroundColor: '#fef2f2', border: '1.5px solid #fee2e2', color: '#dc2626', borderRadius: '12px', marginBottom: '2rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Shield size={20} /> {error}
                </div>
            )}

            {success && (
                <div style={{ padding: '1.25rem', backgroundColor: '#ecfdf5', border: '1.5px solid #bbf7d0', color: '#059669', borderRadius: '12px', marginBottom: '2rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Building2 size={20} /> Operação realizada com sucesso! Redirecionando...
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Section A: Municipality */}
                <div className="card" style={{ padding: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem', pb: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Building2 size={20} color="#3b82f6" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Identificação do Município</h2>
                            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, fontWeight: '500' }}>Dados geográficos e de contacto oficial.</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>NOME DA ENTIDADE *</label>
                            <input 
                                type="text" required placeholder="Ex: Conselho Municipal de..."
                                style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #f1f5f9', borderRadius: '12px', outline: 'none', fontSize: '0.95rem', fontWeight: '600', backgroundColor: '#f8fafc', transition: 'all 0.2s' }}
                                value={munData.name} onChange={e => setMunData({ ...munData, name: e.target.value })} 
                                onFocus={e => { e.target.style.borderColor = '#0f172a'; e.target.style.backgroundColor = 'white' }}
                                onBlur={e => { e.target.style.borderColor = '#f1f5f9'; e.target.style.backgroundColor = '#f8fafc' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>PROVÍNCIA *</label>
                            <input 
                                type="text" required placeholder="Ex: Maputo Cidade"
                                style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #f1f5f9', borderRadius: '12px', outline: 'none', fontSize: '0.95rem', fontWeight: '600', backgroundColor: '#f8fafc', transition: 'all 0.2s' }}
                                value={munData.province} onChange={e => setMunData({ ...munData, province: e.target.value })} 
                                onFocus={e => { e.target.style.borderColor = '#0f172a'; e.target.style.backgroundColor = 'white' }}
                                onBlur={e => { e.target.style.borderColor = '#f1f5f9'; e.target.style.backgroundColor = '#f8fafc' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>DISTRITO / LOCALIDADE *</label>
                            <input 
                                type="text" required placeholder="Ex: KaMpfumo"
                                style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #f1f5f9', borderRadius: '12px', outline: 'none', fontSize: '0.95rem', fontWeight: '600', backgroundColor: '#f8fafc', transition: 'all 0.2s' }}
                                value={munData.district} onChange={e => setMunData({ ...munData, district: e.target.value })} 
                                onFocus={e => { e.target.style.borderColor = '#0f172a'; e.target.style.backgroundColor = 'white' }}
                                onBlur={e => { e.target.style.borderColor = '#f1f5f9'; e.target.style.backgroundColor = '#f8fafc' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>EMAIL INSTITUCIONAL *</label>
                            <input 
                                type="email" required placeholder="geral@municipio.gov.mz"
                                style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #f1f5f9', borderRadius: '12px', outline: 'none', fontSize: '0.95rem', fontWeight: '600', backgroundColor: '#f8fafc', transition: 'all 0.2s' }}
                                value={munData.contact_email} onChange={e => setMunData({ ...munData, contact_email: e.target.value })} 
                                onFocus={e => { e.target.style.borderColor = '#0f172a'; e.target.style.backgroundColor = 'white' }}
                                onBlur={e => { e.target.style.borderColor = '#f1f5f9'; e.target.style.backgroundColor = '#f8fafc' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>TELEFONE</label>
                            <input type="tel" placeholder="+258..."
                                style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #f1f5f9', borderRadius: '12px', outline: 'none', fontSize: '0.95rem', fontWeight: '600', backgroundColor: '#f8fafc' }}
                                value={munData.contact_phone} onChange={e => setMunData({ ...munData, contact_phone: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>COR PRIMÁRIA / BRANDING</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input type="color" style={{ width: '44px', height: '44px', padding: '4px', border: '1.5px solid #f1f5f9', borderRadius: '10px', cursor: 'pointer', backgroundColor: 'white' }}
                                    value={munData.primary_color} onChange={e => setMunData({ ...munData, primary_color: e.target.value })} />
                                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e293b' }}>{munData.primary_color.toUpperCase()}</span>
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>STATUS DO SISTEMA</label>
                            <select 
                                style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #f1f5f9', borderRadius: '12px', outline: 'none', fontSize: '0.95rem', fontWeight: '700', backgroundColor: '#f8fafc' }}
                                value={munData.status} onChange={e => setMunData({ ...munData, status: e.target.value })}
                            >
                                <option value="active">Activo / Operacional</option>
                                <option value="suspended">Suspenso / Restrito</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem', padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1.5px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ 
                            width: '44px', height: '44px', borderRadius: '10px', backgroundColor: munData.is_production ? '#ecfdf5' : '#fff7ed',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Paintbrush size={20} color={munData.is_production ? '#10b981' : '#f59e0b'} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>Modo de Produção Oficial</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>Remover indicadores de teste e activar funcionalidades plenas de branding.</div>
                        </div>
                        <button 
                            type="button"
                            onClick={() => setMunData({ ...munData, is_production: !munData.is_production })}
                            style={{ 
                                width: '54px', height: '28px', borderRadius: '30px', border: 'none', cursor: 'pointer', position: 'relative',
                                backgroundColor: munData.is_production ? '#0f172a' : '#cbd5e1', transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ 
                                width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'white', position: 'absolute', top: '4px',
                                left: munData.is_production ? '30px' : '4px', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}></div>
                        </button>
                    </div>
                </div>

                {/* Section B: Admin - Only for creation */}
                {!id && (
                    <div className="card" style={{ padding: '2.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem', pb: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <UserCircle size={20} color="#ef4444" />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Administrador Principal</h2>
                                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, fontWeight: '500' }}>Credenciais para o primeiro acesso municipal.</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>NOME COMPLETO *</label>
                                <div style={{ position: 'relative' }}>
                                    <UserCircle size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                    <input type="text" required placeholder="Ex: João Silva"
                                        style={{ width: '100%', padding: '12px 12px 12px 42px', border: '1.5px solid #f1f5f9', borderRadius: '12px', outline: 'none', fontSize: '0.95rem', fontWeight: '600', backgroundColor: '#f8fafc' }}
                                        value={adminData.name} onChange={e => setAdminData({ ...adminData, name: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>EMAIL DE ACESSO *</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                    <input type="email" required placeholder="admin@..."
                                        style={{ width: '100%', padding: '12px 12px 12px 42px', border: '1.5px solid #f1f5f9', borderRadius: '12px', outline: 'none', fontSize: '0.95rem', fontWeight: '600', backgroundColor: '#f8fafc' }}
                                        value={adminData.email} onChange={e => setAdminData({ ...adminData, email: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>PALAVRA-PASSE INICIAL *</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input type="password" required placeholder="Mínimo 6 caracteres"
                                    style={{ width: '100%', padding: '12px 12px 12px 42px', border: '1.5px solid #f1f5f9', borderRadius: '12px', outline: 'none', fontSize: '0.95rem', fontWeight: '600', backgroundColor: '#f8fafc' }}
                                    value={adminData.password} onChange={e => setAdminData({ ...adminData, password: e.target.value })} />
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                    <button 
                        type="button" 
                        onClick={() => navigate('/super-admin/municipalities')} 
                        style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: '800', color: '#64748b', border: 'none', backgroundColor: '#f1f5f9', cursor: 'pointer' }}
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        disabled={loading} 
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 32px', borderRadius: '12px', 
                            backgroundColor: '#0f172a', color: 'white', fontWeight: '800', border: 'none', cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)', transition: 'all 0.2s'
                        }}
                    >
                        {loading ? <Loader2 className="spin" size={20} /> : <Save size={20} />}
                        {loading ? (id ? 'Actualizando...' : 'Criando...') : (id ? 'Guardar Alterações' : 'Finalizar Registo')}
                    </button>
                </div>
            </form>
            <style>{`
                @keyframes spin { from {transform: rotate(0deg)} to {transform: rotate(360deg)}} .spin { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
};

export default MunicipalityForm;
