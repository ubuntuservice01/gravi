import React, { useState, useEffect } from 'react';
import { 
    Plus, Eye, Edit, ShieldOff, ShieldCheck, 
    MapPin, Users, Bike, Loader2, Search,
    ChevronRight, Building2, LayoutGrid, List
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';

const MunicipalitiesList = () => {
    const navigate = useNavigate();
    const [municipalities, setMunicipalities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchMunicipalities();
    }, []);

    const fetchMunicipalities = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('municipalities')
                .select(`
                    *,
                    profiles(count),
                    motorcycles(count)
                `)
                .order('name');

            if (error) throw error;
            setMunicipalities(data || []);
        } catch (err) {
            console.error('Error fetching municipalities:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (municipality) => {
        const newStatus = municipality.status === 'active' ? 'suspended' : 'active';
        const actionText = newStatus === 'active' ? 'activar' : 'suspender';
        if (!window.confirm(`Tem certeza que deseja ${actionText} o município ${municipality.name}?`)) return;

        try {
            const { error } = await supabase
                .from('municipalities')
                .update({ status: newStatus })
                .eq('id', municipality.id);

            if (error) throw error;

            await supabase.from('super_admin_logs').insert([{
                action: newStatus === 'active' ? 'ACTIVATE_MUNICIPALITY' : 'SUSPEND_MUNICIPALITY',
                target_type: 'municipality',
                target_id: municipality.id,
                admin_name: 'Super Admin',
                details: { name: municipality.name }
            }]);

            fetchMunicipalities();
        } catch (err) {
            alert('Erro ao actualizar status: ' + err.message);
        }
    };

    const filtered = municipalities.filter(m => 
        m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.province?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.85rem', fontWeight: '600' }}>
                        <Link to="/super-admin/dashboard" style={{ color: '#64748b' }}>Dashboard</Link>
                        <ChevronRight size={14} color="#94a3b8" />
                        <span style={{ color: '#0f172a' }}>Municípios</span>
                    </div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
                        Gestão de Municípios
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: '500', marginTop: '4px' }}>
                        Controle e monitorização de todas as entidades municipais.
                    </p>
                </div>
                <button 
                    onClick={() => navigate('/super-admin/municipalities/new')}
                    style={{ 
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px',
                        backgroundColor: '#0f172a', color: 'white', fontWeight: '700', fontSize: '0.9rem', border: 'none', cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)'
                    }}
                >
                    <Plus size={18} /> Novo Município
                </button>
            </div>

            <div className="card">
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            style={{ 
                                width: '100%', padding: '12px 14px 12px 42px', border: '1.5px solid #f1f5f9', 
                                borderRadius: '12px', outline: 'none', fontSize: '0.9rem', fontWeight: '500',
                                backgroundColor: '#f8fafc', transition: 'all 0.2s'
                            }}
                            placeholder="Pesquisar por município ou província..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={e => { e.target.style.borderColor = '#0f172a'; e.target.style.backgroundColor = 'white' }}
                            onBlur={e => { e.target.style.borderColor = '#f1f5f9'; e.target.style.backgroundColor = '#f8fafc' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', padding: '4px', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
                        <button style={{ padding: '6px', borderRadius: '6px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', color: '#0f172a' }}>
                            <List size={18} />
                        </button>
                        <button style={{ padding: '6px', borderRadius: '6px', color: '#94a3b8' }}>
                            <LayoutGrid size={18} />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <Loader2 className="spin" size={32} color="#0f172a" />
                        <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>Carregando municípios...</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                            <thead>
                                <tr style={{ textAlign: 'left' }}>
                                    <th style={{ padding: '1.25rem 1.5rem', color: '#64748b', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f1f5f9' }}>Município / Província</th>
                                    <th style={{ padding: '1.25rem 1.5rem', color: '#64748b', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f1f5f9' }}>Data de Registo</th>
                                    <th style={{ padding: '1.25rem 1.5rem', color: '#64748b', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f1f5f9' }}>Recursos Activos</th>
                                    <th style={{ padding: '1.25rem 1.5rem', color: '#64748b', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f1f5f9' }}>Estado</th>
                                    <th style={{ padding: '1.25rem 1.5rem', color: '#64748b', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>Acções</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500' }}>
                                            Nenhum município encontrado com estes critérios.
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((m) => (
                                        <tr key={m.id} className="table-row-hover">
                                            <td style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f8fafc' }}>
                                                <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.95rem' }}>{m.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', fontWeight: '500' }}>
                                                    <MapPin size={12} color="#94a3b8" /> {m.province} {m.district && `• ${m.district}`}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f8fafc' }}>
                                                <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>
                                                    {new Date(m.created_at).toLocaleDateString('pt-PT')}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f8fafc' }}>
                                                <div style={{ display: 'flex', gap: '16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '700', color: '#1e293b' }}>
                                                        <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Users size={12} color="#3b82f6" />
                                                        </div>
                                                        {m.profiles?.[0]?.count || 0}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '700', color: '#1e293b' }}>
                                                        <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Bike size={12} color="#8b5cf6" />
                                                        </div>
                                                        {m.motorcycles?.[0]?.count || 0}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f8fafc' }}>
                                                <span style={{
                                                    padding: '6px 12px', borderRadius: '30px', fontSize: '0.65rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px',
                                                    backgroundColor: m.status === 'active' ? '#ecfdf5' : '#fef2f2',
                                                    color: m.status === 'active' ? '#059669' : '#dc2626',
                                                    border: `1px solid ${m.status === 'active' ? '#bbf7d0' : '#fee2e2'}`
                                                }}>
                                                    {m.status === 'active' ? 'Ativo' : 'Suspenso'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f8fafc', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                                    <button onClick={() => navigate(`/super-admin/municipalities/${m.id}`)} className="btn-icon-premium" title="Ver Detalhes"><Eye size={18} /></button>
                                                    <button onClick={() => navigate(`/super-admin/municipalities/edit/${m.id}`)} className="btn-icon-premium" title="Editar"><Edit size={18} /></button>
                                                    <button onClick={() => toggleStatus(m)} className="btn-icon-premium action-danger" title={m.status === 'active' ? 'Suspender' : 'Activar'}>
                                                        {m.status === 'active' ? <ShieldOff size={18} /> : <ShieldCheck size={18} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <style>{`
                .table-row-hover:hover {
                    background-color: #f8fafc;
                }
                .btn-icon-premium {
                    width: 38px; height: 38px; border-radius: 10px; display: flex; alignItems: center; justifyContent: center;
                    border: 1.5px solid #f1f5f9; background-color: white; color: #64748b; cursor: pointer; transition: all 0.2s;
                }
                .btn-icon-premium:hover {
                    border-color: #0f172a; color: #0f172a; background-color: #f8fafc;
                }
                .btn-icon-premium.action-danger:hover {
                    border-color: #fee2e2; color: #dc2626; background-color: #fef2f2;
                }
                @keyframes spin { from {transform: rotate(0deg)} to {transform: rotate(360deg)}} .spin { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
};

export default MunicipalitiesList;
