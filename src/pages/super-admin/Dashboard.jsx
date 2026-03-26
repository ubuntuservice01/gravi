import React, { useState, useEffect } from 'react';
import { 
    Building2, Users, Bike, DollarSign, TrendingUp, 
    AlertCircle, Loader2, Shield, ChevronRight, 
    Calendar, ArrowUpRight, Activity
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

const SuperAdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        total_municipalities: 0,
        active_municipalities: 0,
        total_users: 0,
        total_vehicles: 0,
        total_revenue: 0,
        pending_requests: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_global_stats');
            
            if (error) throw error;

            const { count: pendingCount } = await supabase
                .from('edit_requests')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'Pending');

            if (data) {
                setStats({
                    ...data,
                    pending_requests: pendingCount || 0
                });
            }
        } catch (err) {
            console.error('Error fetching global stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const cards = [
        { 
            title: 'Municípios', 
            value: stats.total_municipalities, 
            icon: <Building2 size={20} />, 
            color: '#3b82f6', 
            bgColor: '#eff6ff',
            path: '/super-admin/municipalities',
            subtitle: `${stats.active_municipalities} entidades activas`
        },
        { 
            title: 'Utilizadores', 
            value: stats.total_users, 
            icon: <Users size={20} />, 
            color: '#8b5cf6', 
            bgColor: '#f5f3ff',
            path: '/super-admin/users',
            subtitle: 'Rede global MotoGest'
        },
        { 
            title: 'Veículos', 
            value: stats.total_vehicles, 
            icon: <Bike size={20} />, 
            color: '#10b981', 
            bgColor: '#ecfdf5',
            path: '/super-admin/dashboard',
            subtitle: 'Registados no sistema'
        },
        { 
            title: 'Receita Global', 
            value: `${stats.total_revenue.toLocaleString()} MT`, 
            icon: <DollarSign size={20} />, 
            color: '#0f172a', 
            bgColor: '#f1f5f9',
            path: '/super-admin/reports',
            subtitle: 'Arrecadação consolidada'
        }
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
                <Loader2 className="spin" size={40} color="#0f172a" />
                <p style={{ color: '#64748b', fontWeight: '500' }}>Carregando visão global...</p>
                <style>{`@keyframes spin { from {transform: rotate(0deg)} to {transform: rotate(360deg)}} .spin { animation: spin 1s linear infinite; }`}</style>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
            {/* Header Area */}
            <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                        Dashboard Global
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: '500', margin: 0 }}>
                        Visão consolidada e gestão de toda a rede MotoGest.
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '0.85rem', fontWeight: '600', backgroundColor: 'white', padding: '8px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <Calendar size={16} />
                    <span>{new Date().toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                {cards.map((card, idx) => (
                    <div 
                        key={idx} 
                        className="card" 
                        style={{ 
                            cursor: 'pointer', transition: 'all 0.2s', padding: '1.5rem',
                            display: 'flex', flexDirection: 'column', gap: '12px'
                        }}
                        onClick={() => navigate(card.path)}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.05)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ 
                                width: '42px', height: '42px', borderRadius: '12px', 
                                backgroundColor: card.bgColor, color: card.color, 
                                display: 'flex', alignItems: 'center', justifyContent: 'center' 
                            }}>
                                {card.icon}
                            </div>
                            <ArrowUpRight size={18} color="#cbd5e1" />
                        </div>
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-1px' }}>{card.value}</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>{card.title}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '500' }}>{card.subtitle}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.4fr', gap: '2rem' }}>
                {/* Left: Pending Requests or Recent Activity Placeholder */}
                <div className="card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Activity size={20} color="#64748b" /> Solicitações Pendentes
                        </h3>
                        <span style={{ 
                            backgroundColor: stats.pending_requests > 0 ? '#fef2f2' : '#f0fdf4',
                            color: stats.pending_requests > 0 ? '#dc2626' : '#16a34a',
                            padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '800'
                        }}>
                            {stats.pending_requests} PENDENTES
                        </span>
                    </div>

                    {stats.pending_requests === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Shield size={32} color="#cbd5e1" />
                            </div>
                            <p style={{ color: '#94a3b8', fontSize: '0.95rem', fontWeight: '500', maxWidth: '300px' }}>
                                Não existem solicitações de edição aguardando aprovação no momento.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Existem alterações de dados enviadas pelos municípios que aguardam revisão.</p>
                            <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Ver Solicitações</button>
                        </div>
                    )}
                </div>

                {/* Right: Quick Links / Security Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card" style={{ padding: '2rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                            Segurança do Sistema
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Shield size={16} color="#10b981" /> Auditoria Geral Activa
                                </div>
                                <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '4px 0 0 0' }}>Todas as acções administrativas são registadas e rastreáveis.</p>
                            </div>
                            <button 
                                onClick={() => navigate('/super-admin/security')}
                                style={{ 
                                    width: '100%', padding: '12px', backgroundColor: '#0f172a', color: 'white', 
                                    border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                }}
                            >
                                <Activity size={18} /> Ver Logs de Auditoria
                            </button>
                        </div>
                    </div>

                    <div className="card" style={{ padding: '2rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                            Estado da Plataforma
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.1)' }}></div>
                            <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.9rem' }}>Todos os sistemas operacionais</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
