import React, { useState, useEffect } from 'react';
import { 
  Car, Shield, AlertTriangle, CheckCircle, TrendingUp, 
  Users, DollarSign, Calendar, MapPin, Search, 
  Filter, Download, ChevronRight, History, Activity,
  PieChart as PieChartIcon, BarChart3, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';

const CarDashboard = () => {
    const { profile } = useAuth();
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        expired: 0,
        pending: 0,
        revenue: 0,
        recentRegistrations: []
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
            const { data: cars, error } = await supabase
                .from('vehicles')
                .select('*')
                .eq('municipality_id', profile.municipality_id)
                .eq('type', 'Carro');

            if (error) throw error;

            const { data: licenses } = await supabase
                .from('licenses')
                .select('*, vehicles!inner(*)')
                .eq('vehicles.type', 'Carro')
                .eq('vehicles.municipality_id', profile.municipality_id);

            const active = licenses?.filter(l => l.status === 'active').length || 0;
            const revenue = licenses?.reduce((acc, l) => acc + Number(l.value || 0), 0) || 0;

            setStats({
                total: cars?.length || 0,
                active: active,
                expired: (cars?.length || 0) - active,
                pending: 0, // Placeholder
                revenue: revenue,
                recentRegistrations: cars?.slice(0, 5) || []
            });
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const chartData = [
        { name: 'Activos', value: stats.active, color: '#10b981' },
        { name: 'Expirados', value: stats.expired, color: '#ef4444' }
    ];

    const revenueData = [
        { month: 'Jan', value: 45000 },
        { month: 'Fev', value: 52000 },
        { month: 'Mar', value: stats.revenue },
    ];

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ maxWidth: '1600px', margin: '0 auto', paddingBottom: '5rem' }}
        >
            <PageHeader 
                title="Dashboard de Viaturas"
                subtitle="Monitoria em tempo real da frota automóvel e arrecadação municipal."
                breadcrumbs={[
                    { label: 'Painel', path: '/admin/dashboard' },
                    { label: 'Carros' }
                ]}
                actions={
                    <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '16px', fontWeight: '900' }}>
                        <Download size={20} /> Exportar Relatório Geral
                    </button>
                }
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', marginBottom: '3rem' }}>
                <StatCard 
                    icon={<Car size={28} />} 
                    label="Frota Total" 
                    value={stats.total} 
                    trend="+12% este mês" 
                    color="#3b82f6" 
                />
                <StatCard 
                    icon={<CheckCircle size={28} />} 
                    label="Licenças Activas" 
                    value={stats.active} 
                    trend="Em conformidade" 
                    color="#10b981" 
                />
                <StatCard 
                    icon={<AlertTriangle size={28} />} 
                    label="Em Irregularidade" 
                    value={stats.expired} 
                    trend="Atenção necessária" 
                    color="#ef4444" 
                />
                <StatCard 
                    icon={<DollarSign size={28} />} 
                    label="Receita Acumulada" 
                    value={`${stats.revenue.toLocaleString()} MT`} 
                    trend="Meta: 85%" 
                    color="#0f172a" 
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) 1fr', gap: '2.5rem', marginBottom: '3rem' }}>
                <div className="card" style={{ padding: '2.5rem', borderRadius: '32px', border: 'none', boxShadow: '0 15px 35px -5px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                        <h3 style={{ margin: 0, fontWeight: '950', fontSize: '1.25rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Activity size={24} color="#3b82f6" /> Performance de Arrecadação
                        </h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                             <span style={{ padding: '6px 14px', borderRadius: '10px', background: '#f8fafc', fontSize: '0.75rem', fontWeight: '900', color: '#64748b', border: '1px solid #e2e8f0' }}>Trimestral</span>
                        </div>
                    </div>
                    
                    <div style={{ height: '350px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} />
                                <Tooltip 
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '15px' }}
                                />
                                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card" style={{ padding: '2.5rem', borderRadius: '32px', border: 'none', boxShadow: '0 15px 35px -5px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ margin: '0 0 2rem', fontWeight: '950', fontSize: '1.25rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <PieChartIcon size={24} color="#3b82f6" /> Composição de Frota
                    </h3>
                    <div style={{ height: '250px', position: 'relative' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: '950', color: '#0f172a' }}>{stats.total}</div>
                            <div style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Carros</div>
                        </div>
                    </div>
                    <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {chartData.map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', background: '#f8fafc', borderRadius: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: item.color }}></div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#475569' }}>{item.name}</span>
                                </div>
                                <span style={{ fontWeight: '950', color: '#0f172a' }}>{Math.round((item.value / stats.total) * 100 || 0)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: '0', borderRadius: '32px', overflow: 'hidden', border: 'none', boxShadow: '0 15px 35px -5px rgba(0,0,0,0.05)' }}>
                <div style={{ padding: '2.5rem', borderBottom: '1.5px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontWeight: '950', fontSize: '1.25rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <History size={24} color="#3b82f6" /> Recém Cadastrados
                    </h3>
                    <button style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: '900', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>Ver Lista Completa <ChevronRight size={18} /></button>
                </div>
                <div style={{ padding: '1rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left' }}>
                                <th style={{ padding: '1.5rem', color: '#94a3b8', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase' }}>Viatura</th>
                                <th style={{ padding: '1.5rem', color: '#94a3b8', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase' }}>Proprietário</th>
                                <th style={{ padding: '1.5rem', color: '#94a3b8', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase' }}>Data</th>
                                <th style={{ padding: '1.5rem', color: '#94a3b8', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase' }}>Localização</th>
                                <th style={{ padding: '1.5rem', textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.recentRegistrations.map((car, i) => (
                                <tr key={car.id} style={{ borderTop: '1.5px solid #f8fafc', transition: 'all 0.2s' }}>
                                    <td style={{ padding: '1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                                                <Car size={24} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '950', color: '#0f172a', fontSize: '1.1rem' }}>{car.plate}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '700' }}>{car.brand} {car.model}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.5rem', fontWeight: '800', color: '#475569' }}>---</td>
                                    <td style={{ padding: '1.5rem', color: '#64748b', fontWeight: '700' }}>{new Date(car.created_at).toLocaleDateString()}</td>
                                    <td style={{ padding: '1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3b82f6', fontWeight: '800', fontSize: '0.9rem' }}>
                                            <MapPin size={16} /> Central
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.5rem', textAlign: 'right' }}>
                                        <button className="btn" style={{ padding: '8px 16px', borderRadius: '10px', background: '#f1f5f9', border: 'none', color: '#64748b', fontWeight: '900', fontSize: '0.8rem' }}>Ficha Técnica</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};

const StatCard = ({ icon, label, value, trend, color }) => (
    <motion.div 
        whileHover={{ y: -8 }}
        className="card" 
        style={{ padding: '2.5rem', borderRadius: '32px', border: 'none', boxShadow: '0 15px 35px -5px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}
    >
        <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.05, transform: 'scale(2.5)' }}>{icon}</div>
        <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '18px', backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color, marginBottom: '2rem' }}>
                {icon}
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{label}</div>
            <div style={{ fontSize: '2.25rem', fontWeight: '950', color: '#0f172a', letterSpacing: '-1px' }}>{value}</div>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '800', color: trend.includes('+') ? '#10b981' : '#64748b' }}>
                {trend.includes('+') ? <ArrowUpRight size={16} /> : <TrendingUp size={16} />}
                {trend}
            </div>
        </div>
    </motion.div>
);

export default CarDashboard;
