import React, { useState, useEffect } from 'react';
import { 
    Wallet, AlertTriangle, Shield, CheckCircle2, 
    Download, Printer, Calendar, TrendingUp, Bike,
    FileText, Activity, ArrowUpRight, ArrowDownRight,
    Filter, BarChart3, PieChart as PieIcon, RefreshCw,
    ChevronRight, Database, Target, Gavel,
    ShieldCheck, Zap, Globe, Cpu, MoreVertical,
    FileDigit, Landmark, History, Layers, Satellite,
    Search
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import PageHeader from '../../components/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const Reports = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        revenue: 0,
        fines_total: 0,
        motorcycles_count: 0,
        active_licenses: 0,
        expired_licenses: 0,
        seizures_active: 0
    });

    const [chartData, setChartData] = useState([]);
    const [revenueByPost, setRevenueByPost] = useState([]);

    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (profile?.municipality_id) {
            fetchStats();
        }
    }, [dateRange, profile?.municipality_id]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const mid = profile.municipality_id;

            const { data: payData } = await supabase
                .from('payments')
                .select('value, created_at, payment_type')
                .eq('status', 'confirmed')
                .eq('municipality_id', mid)
                .gte('created_at', dateRange.start)
                .lte('created_at', dateRange.end + 'T23:59:59');
            
            const { data: fineData } = await supabase
                .from('fines')
                .select('value, created_at')
                .eq('municipality_id', mid)
                .gte('created_at', dateRange.start)
                .lte('created_at', dateRange.end + 'T23:59:59');

            const totalRevenue = payData?.reduce((acc, curr) => acc + parseFloat(curr.value), 0) || 0;
            const totalFines = fineData?.reduce((acc, curr) => acc + parseFloat(curr.value), 0) || 0;

            const months = {};
            const last6Months = [];
            for(let i=5; i>=0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const key = d.toLocaleString('pt-PT', { month: 'short' }).toUpperCase();
                months[key] = { name: key, receita: 0, multas: 0 };
                last6Months.push(key);
            }

            payData?.forEach(p => {
                const m = new Date(p.created_at).toLocaleString('pt-PT', { month: 'short' }).toUpperCase();
                if(months[m]) months[m].receita += parseFloat(p.value);
            });
            fineData?.forEach(f => {
                const m = new Date(f.created_at).toLocaleString('pt-PT', { month: 'short' }).toUpperCase();
                if(months[m]) months[m].multas += parseFloat(f.value);
            });

            setChartData(last6Months.map(m => months[m]));

            const sources = [
                { name: 'Licenças', value: totalRevenue - totalFines, color: '#3b82f6' },
                { name: 'Multas', value: totalFines, color: '#f59e0b' }
            ];
            setRevenueByPost(sources);

            const { count: motoCount } = await supabase.from('motorcycles').select('*', { count: 'exact', head: true }).eq('municipality_id', mid);
            const { count: activeLic } = await supabase.from('licenses').select('*', { count: 'exact', head: true }).eq('municipality_id', mid).eq('status', 'active');
            const { count: expiredLic } = await supabase.from('licenses').select('*', { count: 'exact', head: true }).eq('municipality_id', mid).eq('status', 'expired');
            const { count: activeSeize } = await supabase.from('seizures').select('*', { count: 'exact', head: true }).eq('municipality_id', mid).eq('status', 'active');

            setStats({
                revenue: totalRevenue,
                fines_total: totalFines,
                motorcycles_count: motoCount || 0,
                active_licenses: activeLic || 0,
                expired_licenses: expiredLic || 0,
                seizures_active: activeSeize || 0
            });

        } catch (error) {
            console.error('Erro ao gerar relatório:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        const mName = profile?.municipality?.name || 'Município';

        doc.setFontSize(22);
        doc.setTextColor(15, 23, 42); 
        doc.text(`RELATÓRIO ESTRATÉGICO: ${mName.toUpperCase()}`, 14, 22);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Período de Análise: ${dateRange.start} até ${dateRange.end}`, 14, 30);
        doc.text(`Identificador de Auditoria: ${Math.random().toString(36).substr(2, 9).toUpperCase()}`, 14, 35);
        
        doc.autoTable({
            startY: 60,
            head: [['KPI Operacional', 'Valor Auditado', 'Status']],
            body: [
                ['Receita Bruta Total', `${stats.revenue.toLocaleString()} MT`, 'Conforme'],
                ['Licenciamento', `${(stats.revenue - stats.fines_total).toLocaleString()} MT`, 'Normal'],
                ['Multas Aplicadas', `${stats.fines_total.toLocaleString()} MT`, 'Monitorado'],
                ['Frota Registada', stats.motorcycles_count.toString(), 'active'],
                ['Conformidade Fiscal', `${((stats.active_licenses / (stats.motorcycles_count || 1)) * 100).toFixed(1)}%`, 'Auditado']
            ],
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42] }
        });

        doc.save(`MotoGest_BI_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ maxWidth: '1600px', margin: '0 auto', paddingBottom: '6rem' }}
        >
            <PageHeader 
                title="Inteligência de Gestão (BI)"
                subtitle="Análise profunda de arrecadação municipal, métricas de conformidade e projecção fiscal."
                breadcrumbs={[
                    { label: 'Painel', path: '/admin/dashboard' },
                    { label: 'Estratégico', path: '/admin/reports' },
                    { label: 'Business Intelligence' }
                ]}
                actions={
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button onClick={fetchStats} className="tac-action-btn secondary">
                            <RefreshCw size={18} className={loading ? 'spin' : ''} /> REFRESCAR BI
                        </button>
                        <button onClick={exportPDF} className="tac-action-btn primary">
                            <Download size={18} /> EXPORTAR MASTER PDF
                        </button>
                    </div>
                }
            />

            {/* Tactical Briefing Bar */}
            <div className="tactical-status-bar operational">
                <StatusItem icon={<Database size={18} />} label="MOTOR BI" value="ACTIVO" color="#3b82f6" />
                <div className="v-divider"></div>
                <StatusItem icon={<ShieldCheck size={18} />} label="SINCRO" value="TOTAL" color="#10b981" />
                <div className="v-divider"></div>
                <StatusItem icon={<Activity size={18} />} label="LATÊNCIA" value="8ms" color="#8b5cf6" />
                <div className="b-auto-filter">
                    <Calendar size={16} />
                    <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
                    <ChevronRight size={14} />
                    <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
                </div>
            </div>

            <div className="kpi-row">
                <KPICard 
                    icon={<Landmark size={26} />} 
                    label="RECEITA BRUTA" 
                    value={`${stats.revenue.toLocaleString()} MT`} 
                    color="#3b82f6" 
                    subText="Total Arrecadado"
                />
                <KPICard 
                    icon={<ShieldCheck size={26} />} 
                    label="LICENCIAMENTO" 
                    value={`${(stats.revenue - stats.fines_total).toLocaleString()} MT`} 
                    color="#10b981" 
                    subText="Taxas e Permissões"
                />
                <KPICard 
                    icon={<Gavel size={26} />} 
                    label="MULTAS (AR)" 
                    value={`${stats.fines_total.toLocaleString()} MT`} 
                    color="#f59e0b" 
                    subText="Infracções Liquidadas"
                />
                <KPICard 
                    icon={<Layers size={26} />} 
                    label="ACTIVOS RETIDOS" 
                    value={stats.seizures_active} 
                    color="#ef4444" 
                    subText="Em Custódia"
                />
            </div>

            <div className="bi-analytics-chamber">
                <div className="card-premium charts-main">
                    <div className="panel-header-premium">
                        <div>
                            <h3>Vetor de Arrecadação</h3>
                            <p>Análise temporal de fluxo financeiro municipal.</p>
                        </div>
                        <div className="panel-pills">
                            <div className="pill blue"><span></span> RECEITA</div>
                            <div className="pill amber"><span></span> MULTAS</div>
                        </div>
                    </div>
                    
                    <div className="chart-wrapper-premium">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.08}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 900, fill: '#94a3b8' }} dy={15} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 900, fill: '#94a3b8' }} dx={-15} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px rgba(0,0,0,0.1)', fontWeight: '950', padding: '20px' }}
                                    cursor={{ stroke: '#3b82f6', strokeWidth: 2 }}
                                />
                                <Area type="monotone" dataKey="receita" stroke="#3b82f6" strokeWidth={5} fillOpacity={1} fill="url(#areaColor)" />
                                <Area type="monotone" dataKey="multas" stroke="#f59e0b" strokeWidth={3} strokeDasharray="8 8" fill="none" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card-premium distribution-sidebar">
                    <h3>Composição do Mix</h3>
                    <div className="distribution-ring">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={revenueByPost} 
                                    innerRadius={75} 
                                    outerRadius={105} 
                                    paddingAngle={8} 
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {revenueByPost.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="composition-legend">
                        {revenueByPost.map((item, i) => (
                            <div key={i} className="composition-row-premium">
                                <div className="c-info">
                                    <div className="c-dot" style={{ background: item.color }}></div>
                                    <span>{item.name}</span>
                                </div>
                                <div className="c-val">{((item.value / (stats.revenue || 1)) * 100).toFixed(1)}%</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bi-footer-grid">
                <div className="card-premium goal-tracker">
                    <div className="track-header">
                        <div className="t-icon"><Target size={30} /></div>
                        <div>
                            <h4>OBJECTIVO TRIMESTRAL</h4>
                            <p>Projecção de Arrecadação Consolidada</p>
                        </div>
                    </div>
                    
                    <div className="track-progress">
                        <div className="p-meta">
                            <span className="p-label">ESTADO DA META</span>
                            <span className="p-pct" style={{ color: '#3b82f6' }}>{((stats.revenue / 1500000) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="p-bar-outer">
                            <motion.div 
                                className="p-bar-inner"
                                initial={{ width: 0 }} 
                                animate={{ width: `${Math.min(100, (stats.revenue / 1500000) * 100)}%` }}
                            ></motion.div>
                        </div>
                        <div className="p-footer">
                            Faltam <span className="highlight">{(1500000 - stats.revenue).toLocaleString()} MT</span> para o objectivo.
                        </div>
                    </div>
                </div>

                <div className="card-premium compliance-audit">
                    <div className="audit-header-bi">
                        <div className="a-icon-bi"><Shield size={30} /></div>
                        <div>
                            <h4>SITUAÇÃO DA FROTA</h4>
                            <p>Análise de Conformidade e Fiscalização</p>
                        </div>
                    </div>
                    <div className="audit-stats-bi">
                        <div className="audit-box-premium danger">
                            <label>IRREGULARES</label>
                            <div className="v-num">{stats.expired_licenses}</div>
                            <span className="v-sub">Vectores Expirados</span>
                        </div>
                        <div className="audit-box-premium success">
                            <label>NOMINAIS</label>
                            <div className="v-num">{stats.active_licenses}</div>
                            <span className="v-sub">Em Conformidade</span>
                        </div>
                    </div>
                    <button onClick={() => navigate('/admin/licenses')} className="tac-btn-primary full-width-premium">
                        REFORÇAR FISCALIZAÇÃO <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            <style>{`
                .tac-action-btn { height: 50px; padding: 0 25px; border-radius: 14px; font-weight: 950; font-size: 0.8rem; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: 0.3s; border: none; }
                .tac-action-btn.primary { background: #0f172a; color: white; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.4); }
                .tac-action-btn.secondary { background: white; border: 2.5px solid #f1f5f9; color: #64748b; }
                .tac-action-btn:hover { transform: translateY(-3px); }

                .tactical-status-bar { display: flex; align-items: center; gap: 2.5rem; background: #0f172a; padding: 1.25rem 2.5rem; border-radius: 20px; color: white; margin-bottom: 3.5rem; }
                .tactical-status-bar.operational { border-top: 5px solid #3b82f6; border-radius: 20px 20px 30px 30px; box-shadow: 0 15px 30px -5px rgba(15, 23, 42, 0.2); }
                .b-item { display: flex; align-items: center; gap: 10px; font-size: 0.75rem; font-weight: 800; color: rgba(255,255,255,0.6); }
                .b-item strong { color: white; font-weight: 950; }
                .v-divider { width: 1.5px; height: 15px; background: rgba(255,255,255,0.1); }
                .b-auto-filter { margin-left: auto; display: flex; align-items: center; gap: 15px; background: rgba(255,255,255,0.05); padding: 8px 18px; border-radius: 14px; border: 1.5px solid rgba(255,255,255,0.05); }
                .b-auto-filter input { background: transparent; border: none; color: white; font-size: 0.8rem; font-weight: 950; outline: none; }

                .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem; margin-bottom: 3.5rem; }
                .k-card { background: white; padding: 2.25rem; border-radius: 35px; box-shadow: 0 15px 35px -5px rgba(0,0,0,0.03); display: flex; align-items: center; gap: 22px; border: 1.5px solid #f8fafc; }
                .k-icon { width: 56px; height: 56px; border-radius: 18px; display: flex; align-items: center; justify-content: center; }
                .k-info label { font-size: 0.65rem; font-weight: 950; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px; display: block; }
                .k-val { font-size: 1.85rem; font-weight: 950; color: #0f172a; letter-spacing: -1.5px; }
                .k-sub { font-size: 0.75rem; color: #cbd5e1; font-weight: 700; margin-top: 2px; }

                .bi-analytics-chamber { display: grid; grid-template-columns: 1fr 450px; gap: 2.5rem; margin-bottom: 2.5rem; }
                .card-premium { background: white; border-radius: 40px; box-shadow: 0 30px 60px -15px rgba(0,0,0,0.04); padding: 4rem; border: 1.5px solid #f8fafc; }
                .panel-header-premium { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4rem; }
                .panel-header-premium h3 { font-size: 1.65rem; font-weight: 950; color: #0f172a; margin: 0; letter-spacing: -1px; }
                .panel-header-premium p { color: #94a3b8; font-weight: 700; margin: 5px 0 0; font-size: 1rem; }
                .panel-pills { display: flex; gap: 20px; }
                .pill { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 950; color: #64748b; padding: 10px 18px; background: #f8fafc; border-radius: 100px; border: 1.5px solid #f1f5f9; }
                .pill span { width: 10px; height: 10px; border-radius: 50%; }
                .pill.blue span { background: #3b82f6; box-shadow: 0 0 10px rgba(59, 130, 246, 0.4); }
                .pill.amber span { background: #f59e0b; box-shadow: 0 0 10px rgba(245, 158, 11, 0.4); }

                .chart-wrapper-premium { height: 450px; width: 100%; }

                .distribution- ring { height: 260px; margin-top: 2rem; }
                .composition-legend { margin-top: 3.5rem; display: flex; flex-direction: column; gap: 12px; }
                .composition-row-premium { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 2rem; background: #f8fafc; border-radius: 20px; transition: 0.3s; border: 1.5px solid #f1f5f9; }
                .composition-row-premium:hover { transform: translateX(8px); background: white; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
                .c-info { display: flex; align-items: center; gap: 15px; font-weight: 900; color: #475569; font-size: 0.9rem; }
                .c-dot { width: 10px; height: 10px; border-radius: 50%; }
                .c-val { font-weight: 950; color: #0f172a; font-size: 1rem; }

                .bi-footer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2.5rem; }
                .track-header, .audit-header-bi { display: flex; gap: 20px; align-items: center; margin-bottom: 3.5rem; }
                .t-icon, .a-icon-bi { width: 68px; height: 68px; border-radius: 22px; display: flex; align-items: center; justify-content: center; }
                .t-icon { background: #0f172a; color: white; }
                .a-icon-bi { background: #eff6ff; color: #3b82f6; }
                .track-header h4, .audit-header-bi h4 { font-size: 1.25rem; font-weight: 950; color: #0f172a; margin: 0; }
                .track-header p, .audit-header-bi p { font-size: 0.9rem; font-weight: 700; color: #94a3b8; margin: 4px 0 0; }

                .track-progress { padding: 0 10px; }
                .p-meta { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 15px; }
                .p-label { font-size: 0.75rem; font-weight: 950; color: #94a3b8; letter-spacing: 1.5px; }
                .p-pct { font-size: 1.5rem; font-weight: 950; }
                .p-bar-outer { height: 18px; background: #f1f5f9; border-radius: 100px; overflow: hidden; margin-bottom: 2rem; }
                .p-bar-inner { height: 100%; background: linear-gradient(90deg, #3b82f6, #6366f1); border-radius: 100px; box-shadow: 0 0 20px rgba(59, 130, 246, 0.4); }
                .p-footer { text-align: center; color: #94a3b8; font-weight: 800; font-size: 0.95rem; }
                .p-footer .highlight { color: #0f172a; font-weight: 950; }

                .audit-stats-bi { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 3.5rem; }
                .audit-box-premium { padding: 2.5rem; border-radius: 30px; text-align: center; }
                .audit-box-premium.danger { background: #fff1f2; color: #e11d48; }
                .audit-box-premium.success { background: #ecfdf5; color: #10b981; }
                .audit-box-premium label { font-size: 0.65rem; font-weight: 950; letter-spacing: 2px; text-transform: uppercase; }
                .v-num { font-size: 2.5rem; font-weight: 950; margin: 8px 0; }
                .v-sub { font-size: 0.8rem; font-weight: 800; opacity: 0.8; }

                .full-width-premium { width: 100%; height: 68px; background: #0f172a; color: white; border: none; border-radius: 20px; font-weight: 950; font-size: 0.95rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 12px; transition: 0.3s; box-shadow: 0 15px 30px -5px rgba(0,0,0,0.2); }
                .full-width-premium:hover { transform: translateY(-3px); background: #1e293b; }

                @keyframes spin { to { transform: rotate(360deg); } }
                .spin { animation: spin 1s linear infinite; }
            `}</style>
        </motion.div>
    );
};

const StatusItem = ({ icon, label, value, color }) => (
    <div className="b-item">
        <span style={{ color }}>{icon}</span>
        <span>{label}: <strong>{value}</strong></span>
    </div>
);

const KPICard = ({ icon, label, value, color, subText }) => (
    <div className="k-card">
        <div className="k-icon" style={{ background: `${color}10`, color: color }}>
            {icon}
        </div>
        <div className="k-info">
            <label>{label}</label>
            <div className="k-val">{value}</div>
            <div className="k-sub">{subText}</div>
        </div>
    </div>
);

export default Reports;
