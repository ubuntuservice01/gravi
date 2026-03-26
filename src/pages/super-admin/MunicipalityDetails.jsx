import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
    ArrowLeft, Building2, MapPin, Calendar, 
    Users, Bike, Shield, ShieldOff, Edit, 
    Mail, Phone, Loader2, TrendingUp, AlertTriangle,
    Wallet, AlertCircle, Clock, ChevronRight, UserPlus
} from 'lucide-react';

const MunicipalityDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [municipality, setMunicipality] = useState(null);
    const [stats, setStats] = useState({ users: 0, vehicles: 0, fines: 0, revenue: 0 });
    const [recentUsers, setRecentUsers] = useState([]);
    const [recentLogs, setRecentLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Get municipality info
            const { data: mun, error: munErr } = await supabase
                .from('municipalities')
                .select('*')
                .eq('id', id)
                .single();

            if (munErr) throw munErr;
            setMunicipality(mun);

            // Get stats
            const [usersRes, vehiclesRes, finesRes, revenueRes] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('municipality_id', id),
                supabase.from('motorcycles').select('*', { count: 'exact', head: true }).eq('municipality_id', id),
                supabase.from('fines').select('*', { count: 'exact', head: true }).eq('municipality_id', id),
                supabase.from('fines').select('amount').eq('municipality_id', id).eq('payment_status', 'paid')
            ]);

            const totalRevenue = revenueRes.data?.reduce((sum, f) => sum + (f.amount || 0), 0) || 0;

            setStats({
                users: usersRes.count || 0,
                vehicles: vehiclesRes.count || 0,
                fines: finesRes.count || 0,
                revenue: totalRevenue
            });

            // Get recent users
            const { data: usersData } = await supabase
                .from('profiles')
                .select('*')
                .eq('municipality_id', id)
                .order('created_at', { ascending: false })
                .limit(5);
            setRecentUsers(usersData || []);

            // Get recent logs
            const { data: logsData } = await supabase
                .from('super_admin_logs')
                .select('*')
                .eq('target_id', id)
                .order('created_at', { ascending: false })
                .limit(5);
            setRecentLogs(logsData || []);

        } catch (err) {
            console.error('Error fetching municipality details:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async () => {
        const newStatus = municipality.status === 'active' ? 'suspended' : 'active';
        const actionText = newStatus === 'active' ? 'activar' : 'suspender';
        if (!window.confirm(`Tem certeza que deseja ${actionText} este município?`)) return;

        setIsUpdating(true);
        try {
            const { error } = await supabase
                .from('municipalities')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            await supabase.from('super_admin_logs').insert([{
                action: newStatus === 'active' ? 'ACTIVATE_MUNICIPALITY' : 'SUSPEND_MUNICIPALITY',
                target_type: 'municipality',
                target_id: id,
                admin_name: 'Super Admin',
                details: { name: municipality.name }
            }]);

            setMunicipality({ ...municipality, status: newStatus });
            fetchData(); // Refresh logs
        } catch (err) {
            alert('Erro: ' + err.message);
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
                <Loader2 className="spin" size={40} color="#0f172a" />
                <p style={{ color: '#64748b', fontWeight: '500', fontSize: '0.9rem' }}>Carregando dados do município...</p>
                <style>{`@keyframes spin { from {transform: rotate(0deg)} to {transform: rotate(360deg)}} .spin { animation: spin 1s linear infinite; }`}</style>
            </div>
        );
    }

    if (!municipality) {
        return <div className="card text-center p-12">Município não encontrado.</div>;
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
            {/* Breadcrumb */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2rem', fontSize: '0.85rem', fontWeight: '600' }}>
                <Link to="/super-admin/dashboard" style={{ color: '#64748b' }}>Dashboard</Link>
                <ChevronRight size={14} color="#94a3b8" />
                <Link to="/super-admin/municipalities" style={{ color: '#64748b' }}>Municípios</Link>
                <ChevronRight size={14} color="#94a3b8" />
                <span style={{ color: '#0f172a' }}>{municipality.name}</span>
            </nav>

            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '0.5rem' }}>
                        <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
                            {municipality.name}
                        </h1>
                        <span style={{
                            padding: '6px 14px', borderRadius: '30px', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px',
                            backgroundColor: municipality.status === 'active' ? '#ecfdf5' : '#fef2f2',
                            color: municipality.status === 'active' ? '#059669' : '#dc2626',
                            border: `1px solid ${municipality.status === 'active' ? '#bbf7d0' : '#fee2e2'}`
                        }}>
                            {municipality.status === 'active' ? 'Ativo' : municipality.status === 'suspended' ? 'Suspenso' : 'Inativo'}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#64748b', fontWeight: '500' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={16} /> <span>{municipality.province}</span>
                        </div>
                        <span style={{ color: '#e2e8f0' }}>|</span>
                        <span>{municipality.district || 'Distrito/Cidade'}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                        onClick={() => navigate(`/super-admin/municipalities/edit/${id}`)} 
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px',
                            backgroundColor: '#0f172a', color: 'white', fontWeight: '700', fontSize: '0.9rem', border: 'none', cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)'
                        }}
                    >
                        <Edit size={18} /> Editar Dados
                    </button>
                    <button 
                        onClick={toggleStatus} 
                        disabled={isUpdating}
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px',
                            backgroundColor: 'white', color: '#dc2626', fontWeight: '700', fontSize: '0.9rem', 
                            border: '1.5px solid #fee2e2', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white' }}
                    >
                        {municipality.status === 'active' ? <ShieldOff size={18} /> : <Shield size={18} />}
                        {municipality.status === 'active' ? 'Suspender' : 'Ativar'}
                    </button>
                </div>
            </div>

            {/* Stats Grid - 4 Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <div className="card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ backgroundColor: '#eff6ff', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                        <Users size={20} color="#3b82f6" />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{stats.users}</div>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>UTILIZADORES</div>
                </div>
                <div className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ backgroundColor: '#f5f3ff', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                        <Bike size={20} color="#8b5cf6" />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{stats.vehicles}</div>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>VEÍCULOS</div>
                </div>
                <div className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ backgroundColor: '#fff7ed', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                        <AlertCircle size={20} color="#f97316" />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{stats.fines}</div>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>MULTAS</div>
                </div>
                <div className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ backgroundColor: '#ecfdf5', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                        <Wallet size={20} color="#10b981" />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{stats.revenue.toLocaleString()} MT</div>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>RECEITA ESTIMADA</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.4fr', gap: '2rem' }}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Activity Section */}
                    <div className="card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Clock size={20} color="#64748b" /> Atividade Recente
                            </h3>
                        </div>
                        {recentLogs.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                <Clock size={40} color="#f1f5f9" />
                                <p style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500' }}>Ainda não existe actividade registada para este município.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {recentLogs.map((log, idx) => (
                                    <div key={idx} style={{ 
                                        display: 'flex', gap: '16px', padding: '12px', borderRadius: '10px', backgroundColor: '#f8fafc',
                                        border: '1px solid #f1f5f9'
                                    }}>
                                        <div style={{ 
                                            width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#cbd5e1', marginTop: '6px'
                                        }}></div>
                                        <div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e293b' }}>{log.action.replace(/_/g, ' ')}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                                                Por {log.admin_name} • {new Date(log.created_at).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Users Section */}
                    <div className="card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Users size={20} color="#64748b" /> Utilizadores Recentes
                            </h3>
                            <button 
                                onClick={() => navigate('/super-admin/users')}
                                style={{ fontSize: '0.8rem', fontWeight: '700', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                Ver Todos
                            </button>
                        </div>
                        {recentUsers.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                <UserPlus size={40} color="#f1f5f9" />
                                <p style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500' }}>Ainda não existem utilizadores registados.</p>
                                <button className="btn btn-primary" style={{ fontSize: '0.8rem' }} onClick={() => navigate('/super-admin/users')}>
                                    Ver Utilizadores
                                </button>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: 'left', padding: '12px', fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Nome</th>
                                            <th style={{ textAlign: 'left', padding: '12px', fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Papel</th>
                                            <th style={{ textAlign: 'right', padding: '12px', fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentUsers.map((u, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '12px' }}>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e293b' }}>{u.full_name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.email || '—'}</div>
                                                </td>
                                                <td style={{ padding: '12px' }}>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                                                        {u.role.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'right' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Contact Info */}
                    <div className="card" style={{ padding: '2rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                            Informações de Contacto
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>EMAIL INSTITUCIONAL</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b', fontWeight: '700', fontSize: '0.95rem' }}>
                                    <div style={{ backgroundColor: '#f8fafc', padding: '8px', borderRadius: '8px' }}>
                                        <Mail size={16} color="#3b82f6" />
                                    </div>
                                    {municipality.contact_email || 'Não definido'}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>TELEFONE</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b', fontWeight: '700', fontSize: '0.95rem' }}>
                                    <div style={{ backgroundColor: '#f8fafc', padding: '8px', borderRadius: '8px' }}>
                                        <Phone size={16} color="#3b82f6" />
                                    </div>
                                    {municipality.contact_phone || 'Não definido'}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>DATA DE REGISTO</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b', fontWeight: '700', fontSize: '0.95rem' }}>
                                    <div style={{ backgroundColor: '#f8fafc', padding: '8px', borderRadius: '8px' }}>
                                        <Calendar size={16} color="#3b82f6" />
                                    </div>
                                    {new Date(municipality.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Config Section */}
                    <div className="card" style={{ padding: '2rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                            Configurações Actuais
                        </h3>
                        <div style={{ 
                            backgroundColor: municipality.is_production ? '#f0fdf4' : '#fff7ed', 
                            padding: '1.5rem', borderRadius: '14px', border: `1.5px solid ${municipality.is_production ? '#bbf7d0' : '#ffedd5'}`,
                            display: 'flex', gap: '16px'
                        }}>
                            <div style={{ 
                                width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                            }}>
                                {municipality.is_production ? <TrendingUp size={20} color="#16a34a" /> : <AlertTriangle size={20} color="#ea580c" />}
                            </div>
                            <div>
                                <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                                    {municipality.is_production ? 'Modo de Operação Real' : 'Configuração Inicial'}
                                </div>
                                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>
                                    {municipality.is_production 
                                        ? 'O município está em produção. Todas as multas e licenças emitidas têm valor legal e contabilidade ativa.' 
                                        : 'Modo de Configuração Inicial. As taxas, branding e parâmetros operacionais podem ser ajustados pelo administrador municipal.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MunicipalityDetails;
