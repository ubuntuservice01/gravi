import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar
} from 'recharts';
import {
    Bike,
    AlertCircle,
    TrendingUp,
    Activity,
    DollarSign,
    Users,
    ChevronRight,
    MapPin,
    Calendar,
    ArrowUpRight
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';

const MotorbikeDashboard = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [isRealTime, setIsRealTime] = useState(false);
    const [filterDate, setFilterDate] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    });

    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        seized: 0,
        stolen: 0,
        revenue: 0,
        revenueData: [],
        statusData: [],
        recentEvents: []
    });

    const fetchDashboardData = async () => {
        if (!profile?.municipality_id) return;
        try {
            const mid = profile.municipality_id;

            // 1. Vehicle Counts
            const { data: motorcycles } = await supabase
                .from('motorcycles')
                .select('status, id')
                .eq('municipality_id', mid)
                .eq('type', 'motorcycle');

            const total = motorcycles?.length || 0;
            const active = motorcycles?.filter(m => m.status === 'Activa' || m.status === 'active').length || 0;
            const seized = motorcycles?.filter(m => m.status === 'Apreendida' || m.status === 'seized').length || 0;
            const stolen = motorcycles?.filter(m => m.status === 'Roubada' || m.status === 'stolen').length || 0;

            // 2. Revenue (Payments for motorcycles)
            const startOfMonth = new Date(filterDate.year, filterDate.month - 1, 1).toISOString();
            const endOfMonth = new Date(filterDate.year, filterDate.month, 0, 23, 59, 59).toISOString();

            const { data: payments } = await supabase
                .from('payments')
                .select('value, created_at, motorcycles!inner(type)')
                .eq('municipality_id', mid)
                .eq('motorcycles.type', 'motorcycle')
                .eq('status', 'Confirmado')
                .gte('created_at', startOfMonth)
                .lte('created_at', endOfMonth);

            const totalRevenue = payments?.reduce((acc, p) => acc + Number(p.value), 0) || 0;

            // 3. Chart Data (Daily)
            const daysInMonth = new Date(filterDate.year, filterDate.month, 0).getDate();
            const dailyData = Array.from({ length: daysInMonth }, (_, i) => ({
                name: (i + 1).toString(),
                valor: 0
            }));

            payments?.forEach(p => {
                const day = new Date(p.created_at).getDate();
                if (dailyData[day - 1]) {
                    dailyData[day - 1].valor += Number(p.value);
                }
            });

            // 4. Recent Events
            const { data: recent } = await supabase
                .from('motorcycles')
                .select('*, owners(full_name)')
                .eq('municipality_id', mid)
                .eq('type', 'motorcycle')
                .order('created_at', { ascending: false })
                .limit(5);

            setStats({
                total,
                active,
                seized,
                stolen,
                revenue: totalRevenue,
                revenueData: dailyData,
                statusData: [
                    { name: 'Activas', value: active, color: '#10b981' },
                    { name: 'Apreendidas', value: seized, color: '#6366f1' },
                    { name: 'Outros', value: total - active - seized, color: '#94a3b8' }
                ],
                recentEvents: recent || []
            });
        } catch (err) {
            console.error('Erro fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        let interval;
        if (isRealTime) {
            interval = setInterval(fetchDashboardData, 10000);
        }
        return () => clearInterval(interval);
    }, [filterDate, isRealTime, profile?.municipality_id]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            style={{ maxWidth: '1400px', margin: '0 auto' }}
        >
            <PageHeader 
                title="Dashboard Motorizadas"
                subtitle="Painel analítico da frota municipal de duas rodas."
                breadcrumbs={[
                    { label: 'Painel', path: '/admin/dashboard' },
                    { label: 'Análise de Motos' }
                ]}
                actions={
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                         <div style={{ 
                            display: 'flex', gap: '0.5rem', backgroundColor: 'white', 
                            padding: '6px 12px', borderRadius: '14px', 
                            boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1.5px solid #e2e8f0' 
                        }}>
                             <Calendar size={16} color="#64748b" />
                            <select
                                value={filterDate.month}
                                onChange={(e) => setFilterDate({ ...filterDate, month: Number(e.target.value) })}
                                style={{ border: 'none', background: 'none', fontWeight: '800', color: '#1e293b', padding: '2px', fontSize: '0.85rem' }}
                            >
                                <option value={1}>Janeiro</option>
                                <option value={2}>Fevereiro</option>
                                <option value={3}>Março</option>
                                <option value={4}>Abril</option>
                                <option value={5}>Maio</option>
                                <option value={6}>Junho</option>
                                <option value={7}>Julho</option>
                                <option value={8}>Agosto</option>
                                <option value={9}>Setembro</option>
                                <option value={10}>Outubro</option>
                                <option value={11}>Novembro</option>
                                <option value={12}>Dezembro</option>
                            </select>
                            <input
                                type="number"
                                value={filterDate.year}
                                onChange={(e) => setFilterDate({ ...filterDate, year: Number(e.target.value) })}
                                style={{ width: '60px', border: 'none', borderLeft: '1px solid #e2e8f0', background: 'none', fontWeight: '800', color: '#1e293b', padding: '2px', marginLeft: '5px', fontSize: '0.85rem' }}
                            />
                        </div>

                        <button
                            onClick={() => setIsRealTime(!isRealTime)}
                            style={{
                                padding: '10px 18px', borderRadius: '14px',
                                backgroundColor: isRealTime ? '#fef2f2' : '#f1f5f9',
                                color: isRealTime ? '#ef4444' : '#64748b',
                                fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '8px',
                                transition: 'all 0.2s', border: `1.5px solid ${isRealTime ? '#ef444420' : '#e2e8f0'}`
                            }}
                        >
                            <Activity size={18} className={isRealTime ? 'pulse' : ''} /> 
                            {isRealTime ? 'Real-time On' : 'Real-time Off'}
                        </button>
                    </div>
                }
            />

            {/* KPI Section */}
            <div style={{ 
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                gap: '1.5rem', marginBottom: '2.5rem' 
            }}>
                <StatCard 
                    label="Frota Total" 
                    value={stats.total} 
                    icon={<Bike size={24} />} 
                    color="#f59e0b" 
                    trend="Veículos Registados"
                />
                <StatCard 
                    label="Em Circulação" 
                    value={stats.active} 
                    icon={<TrendingUp size={24} />} 
                    color="#10b981" 
                    trend="Títulos Activos"
                />
                <StatCard 
                    label="Receita Mensal" 
                    value={`${stats.revenue.toLocaleString()} MT`} 
                    icon={<DollarSign size={24} />} 
                    color="#6366f1" 
                    trend="Licenciamento & Multas"
                />
                <StatCard 
                    label="Fora de Serviço" 
                    value={stats.seized + stats.stolen} 
                    icon={<AlertCircle size={24} />} 
                    color="#ef4444" 
                    trend="Apreendidas / Roubadas"
                />
            </div>

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'minmax(0, 2fr) minmax(300px, 1fr)', 
                gap: '1.5rem', marginBottom: '1.5rem' 
            }}>
                {/* Revenue Chart */}
                <motion.div variants={itemVariants} className="card" style={{ padding: '2rem', borderRadius: '24px' }}>
                    <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h3 style={{ margin: 0, fontWeight: '900', fontSize: '1.25rem', color: '#0f172a' }}>Evolução de Arrecadação</h3>
                            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>Relatório diário de pagamentos confirmados.</p>
                        </div>
                        <div style={{ padding: '8px 16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1.5px solid #f1f5f9' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Total Mês</span>
                            <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#0f172a' }}>{stats.revenue.toLocaleString()} MT</div>
                        </div>
                    </div>
                    
                    <div style={{ width: '100%', height: '350px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.revenueData}>
                                <defs>
                                    <linearGradient id="colorRevM" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: '700' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: '700' }} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px' }}
                                    itemStyle={{ fontWeight: '800', color: '#6366f1' }}
                                />
                                <Area type="monotone" dataKey="valor" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorRevM)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Distribution Chart */}
                <motion.div variants={itemVariants} className="card" style={{ padding: '2rem', borderRadius: '24px', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ margin: '0 0 2rem', fontWeight: '900', fontSize: '1.25rem', color: '#0f172a' }}>Estado da Frota</h3>
                    
                    <div style={{ flex: 1, minHeight: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {stats.statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div style={{ marginTop: '2rem', display: 'grid', gap: '0.75rem' }}>
                        {stats.statusData.map((item, i) => (
                            <div key={i} style={{ 
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '14px',
                                border: '1.5px solid #f1f5f9'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }} />
                                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#475569' }}>{item.name}</span>
                                </div>
                                <span style={{ fontSize: '0.9rem', fontWeight: '900', color: '#0f172a' }}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                {/* Recent Activity */}
                <motion.div variants={itemVariants} className="card" style={{ padding: '2rem', borderRadius: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3 style={{ margin: 0, fontWeight: '900', fontSize: '1.2rem', color: '#0f172a' }}>Registos Recentes</h3>
                        <button onClick={() => navigate('/admin/motorcycles')} style={{ color: '#3b82f6', background: 'none', border: 'none', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Ver Todos <ChevronRight size={16} />
                        </button>
                    </div>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {stats.recentEvents.map((event, i) => (
                            <div key={i} style={{ 
                                display: 'flex', alignItems: 'center', gap: '1rem', 
                                padding: '12px', borderRadius: '16px', border: '1.5px solid #f1f5f9',
                                transition: 'all 0.2s'
                            }}>
                                <div style={{ 
                                    width: '44px', height: '44px', borderRadius: '12px', 
                                    backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', 
                                    justifyContent: 'center', color: 'white', fontWeight: '900', fontSize: '0.8rem'
                                }}>
                                    {event.plate?.slice(-3)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '900', color: '#1e293b', fontSize: '0.95rem' }}>{event.plate}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' }}>{event.owners?.full_name}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a' }}>{new Date(event.created_at).toLocaleDateString()}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: '900' }}>REGISTADO</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Quick Actions / Integration */}
                <motion.div variants={itemVariants} className="card" style={{ padding: '2rem', borderRadius: '24px', backgroundColor: '#0f172a', color: 'white', border: 'none' }}>
                    <h3 style={{ margin: '0 0 1.5rem', fontWeight: '900', fontSize: '1.2rem' }}>Acções Rápidas</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <QuickAction 
                            label="Nova Multa" 
                            icon={<AlertCircle size={20} />} 
                            onClick={() => navigate('/admin/fines')}
                            color="#f59e0b"
                        />
                        <QuickAction 
                            label="Nova Licença" 
                            icon={<DollarSign size={20} />} 
                            onClick={() => navigate('/admin/licenses/new')}
                            color="#10b981"
                        />
                        <QuickAction 
                            label="Mapa Fiscal" 
                            icon={<MapPin size={20} />} 
                            onClick={() => navigate('/admin/map')}
                            color="#3b82f6"
                        />
                        <QuickAction 
                            label="Fiscalização" 
                            icon={<Activity size={20} />} 
                            onClick={() => navigate('/admin/search')}
                            color="#8b5cf6"
                        />
                    </div>

                    <div style={{ 
                        marginTop: '2rem', padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.05)', 
                        borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' 
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Users size={20} color="white" />
                            </div>
                            <div>
                                <h4 style={{ margin: 0, fontWeight: '800', fontSize: '1rem' }}>Fila de Aprovação</h4>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Processos de proprietários pendentes.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => navigate('/admin/approvals')}
                            style={{ 
                                width: '100%', padding: '12px', borderRadius: '12px', border: 'none', 
                                backgroundColor: 'white', color: '#0f172a', fontWeight: '900', 
                                cursor: 'pointer', display: 'flex', alignItems: 'center', 
                                justifyContent: 'center', gap: '8px' 
                            }}
                        >
                            Gerir Aprovações <ArrowUpRight size={18} />
                        </button>
                    </div>
                </motion.div>
            </div>

            <style>{`
                .pulse {
                    animation: pulse-anim 2s infinite;
                }
                @keyframes pulse-anim {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
            `}</style>
        </motion.div>
    );
};

const StatCard = ({ label, value, icon, color, trend }) => (
    <motion.div 
        variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}
        whileHover={{ y: -5 }}
        className="card" 
        style={{ padding: '1.5rem', display: 'flex', gap: '1.25rem', alignItems: 'center', borderRadius: '24px' }}
    >
        <div style={{ 
            width: '56px', height: '56px', borderRadius: '16px', 
            backgroundColor: `${color}15`, color: color,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            {icon}
        </div>
        <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f172a' }}>{value}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>{trend}</div>
        </div>
    </motion.div>
);

const QuickAction = ({ label, icon, onClick, color }) => (
    <button 
        onClick={onClick}
        style={{ 
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
            padding: '20px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '20px',
            border: '1.5px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.2s',
            color: 'white'
        }}
        onMouseOver={e => {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.borderColor = color;
        }}
        onMouseOut={e => {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
        }}
    >
        <div style={{ color: color }}>{icon}</div>
        <span style={{ fontSize: '0.85rem', fontWeight: '800' }}>{label}</span>
    </button>
);

export default MotorbikeDashboard;
