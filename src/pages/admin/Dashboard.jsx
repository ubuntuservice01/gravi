import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Bike, Car, ChevronRight, CreditCard, 
    LayoutDashboard, TrendingUp, Users, AlertTriangle, 
    Shield, Activity, Zap, Globe, Clock, 
    Search, Bell, Settings, ArrowUpRight, 
    ArrowDownRight, Wallet, Target, Gavel,
    ShieldCheck, Smartphone, Satellite, Layers,
    Briefcase, FileText, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import PageHeader from '../../components/PageHeader';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const MunicipalDashboard = () => {
    const navigate = useNavigate();
    const { profile, user } = useAuth();
    const { settings } = useSettings();
    const [stats, setStats] = useState({
        motorcycles: 0,
        cars: 0,
        bicycles: 0,
        revenue: 0,
        pendingApprovals: 0,
        activeLicenses: 0,
        recentFines: 0
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
            const mid = profile.municipality_id;

            const [vehiclesRes, approvalsRes, paymentsRes, licensesRes, finesRes] = await Promise.all([
                supabase.from('motorcycles').select('type').eq('municipality_id', mid),
                supabase.from('approvals').select('*', { count: 'exact', head: true }).eq('municipality_id', mid).eq('status', 'Pendente'),
                supabase.from('payments').select('value').eq('municipality_id', mid).eq('status', 'Confirmado'),
                supabase.from('licenses').select('*', { count: 'exact', head: true }).eq('municipality_id', mid).eq('status', 'Activa'),
                supabase.from('fines').select('*', { count: 'exact', head: true }).eq('municipality_id', mid).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            ]);

            setStats({
                motorcycles: vehiclesRes.data?.filter(v => v.type === 'moto' || !v.type).length || 0,
                cars: vehiclesRes.data?.filter(v => v.type === 'car').length || 0,
                bicycles: vehiclesRes.data?.filter(v => v.type === 'bicycle').length || 0,
                revenue: paymentsRes.data?.reduce((acc, p) => acc + parseFloat(p.value), 0) || 0,
                pendingApprovals: approvalsRes.count || 0,
                activeLicenses: licensesRes.count || 0,
                recentFines: finesRes.count || 0
            });
        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const userName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Utilizador';

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ maxWidth: '1600px', margin: '0 auto', paddingBottom: '6rem' }}
        >
            <PageHeader 
                title={`Centro de Comando: ${userName}`}
                subtitle={`Monitorização estratégica e gestão de activos para o Município de ${profile?.municipality?.name || '---'}.`}
                breadcrumbs={[
                    { label: 'Sistema', path: '/admin/dashboard' },
                    { label: 'Painel Executivo' }
                ]}
                actions={
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div className="tac-status-badge success">
                            <div className="s-dot pulse"></div>
                            LINK SEGURO
                        </div>
                        <button onClick={() => navigate('/admin/settings')} className="tac-action-btn secondary">
                            <Settings size={18} /> CONFIGURAÇÕES
                        </button>
                    </div>
                }
            />

            {/* Tactical Briefing Bar */}
            <div className="tactical-status-bar operational-dashboard">
                <StatusItem icon={<Satellite size={18} />} label="REDE" value="ESTÁVEL" color="#3b82f6" />
                <div className="v-divider"></div>
                <StatusItem icon={<ShieldCheck size={18} />} label="VETOR" value="PROTEGIDO" color="#10b981" />
                <div className="v-divider"></div>
                <StatusItem icon={<Activity size={18} />} label="SINCRO" value="REAL-TIME" color="#8b5cf6" />
                <div className="b-search-placeholder">
                    <Zap size={18} /> SISTEMA EM PRONTIDÃO OPERACIONAL
                </div>
            </div>

            {/* KPI Executive Floor */}
            <div className="kpi-row">
                <DashboardKPICard 
                    icon={<Wallet size={26} />} 
                    label="RECEITA CONSOLIDADA" 
                    value={`${stats.revenue.toLocaleString()} MT`} 
                    color="#10b981" 
                    subText="Liquidação Total"
                    trend="+12.4%"
                />
                <DashboardKPICard 
                    icon={<Activity size={26} />} 
                    label="FROTA REGISTADA" 
                    value={stats.motorcycles + stats.cars + stats.bicycles} 
                    color="#3b82f6" 
                    subText="Veículos em Base"
                    trend="Normal"
                />
                <DashboardKPICard 
                    icon={<AlertTriangle size={26} />} 
                    label="APROVAÇÕES PENDENTES" 
                    value={stats.pendingApprovals} 
                    color={stats.pendingApprovals > 0 ? "#ef4444" : "#94a3b8"} 
                    subText="Acções Requeridas"
                    trend={stats.pendingApprovals > 0 ? "ATENÇÃO" : "MODO OK"}
                />
                <DashboardKPICard 
                    icon={<ShieldCheck size={26} />} 
                    label="LICENÇAS VIGENTES" 
                    value={stats.activeLicenses} 
                    color="#8b5cf6" 
                    subText="Status Regular"
                    trend="Estável"
                />
            </div>

            <div className="main-operational-floor">
                {/* Tactical Modules Grid */}
                <div className="modules-grid-premium">
                    <ModuleCard 
                        title="Motorizadas" 
                        desc="Gestão táctica de duas rodas, livretos e conformidade bi-rodar municipal."
                        icon={<Bike size={32} />}
                        color="#f59e0b"
                        count={stats.motorcycles}
                        onClick={() => navigate('/admin/motorcycles')}
                    />
                    <ModuleCard 
                        title="Dossier de Condutores" 
                        desc="Controlo de proprietários, histórico de infracções e registo de posse."
                        icon={<Users size={32} />}
                        color="#6366f1"
                        onClick={() => navigate('/admin/owners')}
                    />
                    <ModuleCard 
                        title="Tesouraria Fiscal" 
                        desc="Liquidação de taxas, multas e monitoria de arrecadação integrada."
                        icon={<CreditCard size={32} />}
                        color="#10b981"
                        onClick={() => navigate('/admin/payments')}
                    />
                    <ModuleCard 
                        title="Infracções & Multas" 
                        desc="Registo de infracções detetadas em campo e processamento punitivo."
                        icon={<Gavel size={32} />}
                        color="#ef4444"
                        onClick={() => navigate('/admin/fines')}
                    />
                </div>

                {/* Intelligence Side Panel */}
                <div className="intel-panel-premium">
                    <div className="intel-header">
                        <div className="i-id">
                            <Zap size={20} className="pulse-amber" />
                            <span>INTELIGÊNCIA RECENTE</span>
                        </div>
                        <h3>Monitor de Eventos</h3>
                    </div>
                    
                    <div className="intel-stream">
                        <IntelRow icon={<Target size={18} color="#ef4444" />} title="Infracção Detectada" sub="Matrícula Scan: MZ-901-T" time="HÁ 5 MIN" />
                        <IntelRow icon={<CheckCircle2 size={18} color="#10b981" />} title="Pagamento Confirmado" sub="Guia #8829 Liquitada" time="HÁ 12 MIN" />
                        <IntelRow icon={<Users size={18} color="#3b82f6" />} title="Novo Registo" sub="Proprietário: António M." time="HÁ 45 MIN" />
                        <IntelRow icon={<Layers size={18} color="#8b5cf6" />} title="Dossier Actualizado" sub="Licença Renovada [MAP]" time="HÁ 2H" />
                    </div>

                    <button onClick={() => navigate('/admin/reports')} className="tac-btn-ghost-full">
                        ACESSAR BI COMPLETO <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            <style>{`
                .tac-status-badge { padding: 8px 16px; border-radius: 12px; font-size: 0.7rem; font-weight: 950; display: flex; align-items: center; gap: 10px; border: 1.5px solid transparent; }
                .tac-status-badge.success { background: #ecfdf5; color: #10b981; border-color: #10b98130; }
                .s-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
                .pulse { animation: pulse-sm 2s infinite; }
                @keyframes pulse-sm { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }

                .tac-action-btn { height: 50px; padding: 0 25px; border-radius: 14px; font-weight: 950; font-size: 0.8rem; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: 0.3s; border: none; }
                .tac-action-btn.secondary { background: white; border: 2.5px solid #f1f5f9; color: #64748b; }
                .tac-action-btn:hover { transform: translateY(-3px); }

                .tactical-status-bar { display: flex; align-items: center; gap: 2.5rem; background: #0f172a; padding: 1.25rem 2.5rem; border-radius: 20px; color: white; margin-bottom: 3.5rem; }
                .tactical-status-bar.operational-dashboard { border-left: 8px solid #3b82f6; box-shadow: 0 15px 30px -5px rgba(15, 23, 42, 0.2); }
                .b-item { display: flex; align-items: center; gap: 10px; font-size: 0.75rem; font-weight: 800; color: rgba(255,255,255,0.6); }
                .b-item strong { color: white; font-weight: 950; }
                .v-divider { width: 1.5px; height: 15px; background: rgba(255,255,255,0.1); }
                .b-search-placeholder { margin-left: auto; display: flex; align-items: center; gap: 12px; font-size: 0.75rem; font-weight: 950; color: #3b82f6; letter-spacing: 1px; }

                .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem; margin-bottom: 3.5rem; }
                .dk-card { background: white; padding: 2.5rem; border-radius: 35px; box-shadow: 0 15px 35px -5px rgba(0,0,0,0.03); display: flex; flex-direction: column; gap: 1.5rem; border: 1.5px solid #f8fafc; position: relative; overflow: hidden; }
                .dk-trend { position: absolute; top: 1.5rem; right: 1.5rem; padding: 6px 12px; background: #f8fafc; border-radius: 100px; font-size: 0.65rem; font-weight: 950; color: #3b82f6; }
                .dk-icon { width: 56px; height: 56px; border-radius: 18px; display: flex; align-items: center; justify-content: center; }
                .dk-info label { font-size: 0.7rem; font-weight: 950; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px; display: block; }
                .dk-val { font-size: 1.85rem; font-weight: 950; color: #0f172a; letter-spacing: -1px; }
                .dk-sub { font-size: 0.8rem; color: #cbd5e1; font-weight: 700; }

                .main-operational-floor { display: grid; grid-template-columns: 1fr 450px; gap: 2.5rem; }
                .modules-grid-premium { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
                .mod-card-premium { background: white; padding: 3.5rem; border-radius: 40px; border: 1.5px solid #f8fafc; cursor: pointer; transition: 0.4s; display: flex; flex-direction: column; gap: 2rem; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.02); }
                .mod-card-premium:hover { transform: translateY(-8px); border-color: rgba(59, 130, 246, 0.2); box-shadow: 0 30px 60px -15px rgba(0,0,0,0.08); }
                .m-icon-box { width: 72px; height: 72px; border-radius: 22px; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 10px 20px -5px rgba(0,0,0,0.1); }
                .m-info h2 { font-size: 1.55rem; font-weight: 950; color: #0f172a; margin: 0; letter-spacing: -0.5px; }
                .m-info p { font-size: 1rem; color: #64748b; font-weight: 600; line-height: 1.6; margin-top: 10px; }
                .m-action { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 950; letter-spacing: 1px; margin-top: auto; }

                .intel-panel-premium { background: white; border-radius: 40px; padding: 3.5rem; box-shadow: 0 30px 60px -15px rgba(0,0,0,0.05); border: 1.5px solid #f8fafc; height: fit-content; }
                .intel-header { margin-bottom: 3.5rem; }
                .i-id { display: flex; align-items: center; gap: 10px; color: #f59e0b; font-weight: 950; font-size: 0.7rem; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 1rem; }
                .intel-header h3 { font-size: 1.75rem; font-weight: 950; color: #0f172a; margin: 0; letter-spacing: -1px; }
                
                .intel-stream { display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 3.5rem; }
                .intel-row-premium { display: flex; gap: 1.5rem; align-items: center; padding: 1.5rem; background: #f8fafc; border-radius: 22px; transition: 0.3s; border: 1.5px solid #f1f5f9; }
                .intel-row-premium:hover { transform: translateX(8px); background: white; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
                .ir-icon { width: 48px; height: 48px; min-width: 48px; background: white; border-radius: 14px; display: flex; align-items: center; justify-content: center; box-shadow: 0 5px 15px rgba(0,0,0,0.03); }
                .ir-info h4 { margin: 0; font-size: 0.95rem; font-weight: 900; color: #1e293b; }
                .ir-info p { margin: 2px 0 0; font-size: 0.8rem; font-weight: 600; color: #94a3b8; }
                .ir-time { margin-top: 4px; font-size: 0.6rem; font-weight: 950; color: #cbd5e1; }

                .tac-btn-ghost-full { width: 100%; height: 64px; border-radius: 20px; border: 2.5px solid #f1f5f9; background: white; color: #0f172a; font-weight: 950; font-size: 0.85rem; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 10px; }
                .tac-btn-ghost-full:hover { background: #0f172a; color: white; border-color: #0f172a; box-shadow: 0 15px 30px -10px rgba(0,0,0,0.2); }

                .pulse-amber { animation: pulse-amber 2s infinite ease-in-out; }
                @keyframes pulse-amber { 0% { opacity: 1; filter: drop-shadow(0 0 0 rgba(245, 158, 11, 0)); } 50% { opacity: 0.5; filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.6)); } 100% { opacity: 1; filter: drop-shadow(0 0 0 rgba(245, 158, 11, 0)); } }
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

const DashboardKPICard = ({ icon, label, value, color, subText, trend }) => (
    <div className="dk-card">
        <div className="dk-trend">{trend}</div>
        <div className="dk-icon" style={{ background: `${color}10`, color: color }}>
            {icon}
        </div>
        <div className="dk-info">
            <label>{label}</label>
            <div className="dk-val">{value}</div>
            <div className="dk-sub">{subText}</div>
        </div>
    </div>
);

const ModuleCard = ({ title, desc, icon, color, count, onClick }) => (
    <div className="mod-card-premium" onClick={onClick}>
        <div className="m-icon-box" style={{ backgroundColor: color }}>
            {icon}
        </div>
        <div className="m-info">
            <h2>{title}</h2>
            <p>{desc}</p>
        </div>
        <div className="m-action" style={{ color: color }}>
            {count !== undefined && <span style={{ marginRight: '10px', color: '#cbd5e1' }}>{count} ITEMS</span>}
            EXECUTAR COMANDO <ChevronRight size={16} />
        </div>
    </div>
);

const IntelRow = ({ icon, title, sub, time }) => (
    <div className="intel-row-premium">
        <div className="ir-icon">{icon}</div>
        <div className="ir-info">
            <h4>{title}</h4>
            <p>{sub}</p>
            <div className="ir-time">{time}</div>
        </div>
    </div>
);

export default MunicipalDashboard;
