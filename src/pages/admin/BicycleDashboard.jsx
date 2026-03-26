import React, { useState, useEffect } from 'react';
import { 
  Bike, Shield, AlertTriangle, CheckCircle, TrendingUp, 
  Users, DollarSign, Calendar, MapPin, Search, 
  Filter, Download, ChevronRight, History, Activity,
  PieChart as PieChartIcon, BarChart3, ArrowUpRight, ShoppingBag
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/PageHeader';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';

const BicycleDashboard = () => {
    const { profile } = useAuth();
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        expired: 0,
        revenue: 0,
        recent: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile?.municipality_id) {
            fetchStats();
        }
    }, [profile?.municipality_id]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const { data: bics, error } = await supabase
                .from('vehicles')
                .select('*')
                .eq('municipality_id', profile.municipality_id)
                .eq('type', 'Bicicleta');

            if (error) throw error;

            const { data: licenses } = await supabase
                .from('licenses')
                .select('*, vehicles!inner(*)')
                .eq('vehicles.type', 'Bicicleta')
                .eq('vehicles.municipality_id', profile.municipality_id);

            const active = licenses?.filter(l => l.status === 'Activa').length || 0;
            const revenue = licenses?.reduce((acc, l) => acc + Number(l.value || 0), 0) || 0;

            setStats({
                total: bics?.length || 0,
                active: active,
                expired: (bics?.length || 0) - active,
                revenue: revenue,
                recent: bics?.slice(0, 5) || []
            });
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const chartData = [
        { name: 'Licenciadas', value: stats.active, color: '#f59e0b' },
        { name: 'Pendentes', value: stats.expired, color: '#cbd5e1' }
    ];

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ maxWidth: '1600px', margin: '0 auto', paddingBottom: '5rem' }}
        >
            <PageHeader 
                title="Gestão de Velocípedes"
                subtitle="Controle de registo municipal para bicicletas e veículos não motorizados."
                breadcrumbs={[
                    { label: 'Painel', path: '/admin/dashboard' },
                    { label: 'Bicicletas' }
                ]}
                actions={
                    <button className="btn" style={{ background: '#f59e0b', color: 'white', fontWeight: '950', padding: '12px 24px', borderRadius: '16px', boxShadow: '0 10px 20px -5px rgba(245, 158, 11, 0.4)', border: 'none' }}>
                         Novo Registo <Bike size={18} style={{ marginLeft: '8px', display: 'inline' }} />
                    </button>
                }
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', marginBottom: '3rem' }}>
                <StatCard 
                    icon={<Bike size={28} />} 
                    label="Bicicletas Registadas" 
                    value={stats.total} 
                    trend="Crescimento estável" 
                    color="#f59e0b" 
                />
                <StatCard 
                    icon={<CheckCircle size={28} />} 
                    label="Taxas Liquidadas" 
                    value={stats.active} 
                    trend="Em conformidade" 
                    color="#10b981" 
                />
                <StatCard 
                    icon={<ShoppingBag size={28} />} 
                    label="Receita Directa" 
                    value={`${stats.revenue.toLocaleString()} MT`} 
                    trend="Contribuição urbana" 
                    color="#0f172a" 
                />
                <StatCard 
                    icon={<Activity size={28} />} 
                    label="Volume de Tráfego" 
                    value="Baixo" 
                    trend="Nível de Impacto" 
                    color="#3b82f6" 
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2.5rem', marginBottom: '3rem' }}>
                <div className="card" style={{ padding: '0', borderRadius: '32px', overflow: 'hidden', border: 'none', boxShadow: '0 15px 35px -5px rgba(0,0,0,0.05)' }}>
                    <div style={{ padding: '2.5rem', borderBottom: '1.5px solid #f1f5f9' }}>
                         <h3 style={{ margin: 0, fontWeight: '950', fontSize: '1.25rem', color: '#0f172a' }}>Ultimas Inscrições Municipais</h3>
                    </div>
                    <div style={{ padding: '1.5rem' }}>
                        {stats.recent.map((bic, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', borderBottom: i === stats.recent.length - 1 ? 'none' : '1.5px solid #f8fafc', transition: 'all 0.2s' }}>
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', border: '1.5px solid #fef3c7' }}>
                                        <Bike size={24} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '950', color: '#0f172a', fontSize: '1.1rem' }}>{bic.plate || 'REF-'+bic.id.substring(0,5)}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '700' }}>{bic.brand} • {bic.color}</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#475569' }}>{new Date(bic.created_at).toLocaleDateString()}</div>
                                    <span style={{ fontSize: '0.7rem', fontWeight: '950', color: '#f59e0b', textTransform: 'uppercase' }}>Taxa Urbana Paga</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card" style={{ padding: '2.5rem', borderRadius: '32px', border: 'none', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <h3 style={{ margin: '0 0 2rem', fontWeight: '950', fontSize: '1.1rem', color: '#0f172a', alignSelf: 'flex-start' }}>Estado de Conformidade</h3>
                    <div style={{ height: '240px', width: '100%', position: 'relative' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={10} dataKey="value">
                                    {chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: '950', color: '#0f172a' }}>{Math.round((stats.active/stats.total)*100 || 0)}%</div>
                            <div style={{ fontSize: '0.65rem', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase' }}>Operação</div>
                        </div>
                    </div>
                    <div style={{ width: '100%', marginTop: '2rem' }}>
                        {chartData.map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }}></div>
                                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b' }}>{item.name}</span>
                                </div>
                                <span style={{ fontWeight: '900', color: '#0f172a' }}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const StatCard = ({ icon, label, value, trend, color }) => (
    <div className="card" style={{ padding: '2rem', borderRadius: '28px', border: 'none', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)' }}>
        <div style={{ width: '50px', height: '50px', borderRadius: '16px', background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color, marginBottom: '1.5rem' }}>{icon}</div>
        <div style={{ fontSize: '0.75rem', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '1.75rem', fontWeight: '950', color: '#0f172a' }}>{value}</div>
        <div style={{ marginTop: '1rem', padding: '6px 10px', background: '#f8fafc', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', display: 'inline-block' }}>{trend}</div>
    </div>
);

export default BicycleDashboard;
