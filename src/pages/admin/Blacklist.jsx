import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
    Search, AlertOctagon, UserX, Bike, Filter, Info, X, 
    Loader2, RefreshCw, Phone, MapPin, Calendar, LayoutGrid, 
    ShieldAlert, ChevronRight, Hash, Eye, Globe, Zap, Activity,
    History, TrendingDown, MoreVertical, Target
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import SkeletonLoader from '../../components/SkeletonLoader';
import EmptyState from '../../components/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Blacklist = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState(null);

    useEffect(() => {
        if (profile?.municipality_id) {
            fetchBlacklist();
        }
    }, [profile?.municipality_id]);

    const fetchBlacklist = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('motorcycles')
                .select('*, owners(full_name, phone)')
                .eq('municipality_id', profile.municipality_id)
                .in('status', ['suspended', 'irregular', 'seized', 'stolen', 'blocked'])
                .order('created_at', { ascending: false });

            if (error) throw error;
            setVehicles(data || []);
        } catch (err) {
            console.error('Erro ao buscar lista negra:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredVehicles = vehicles.filter(v => {
        const matchesSearch =
            (v.owners?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.chassis.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter ? v.status === statusFilter : true;
        return matchesSearch && matchesStatus;
    });

    const getStatusTheme = (status) => {
        const themes = {
            'suspended': { bg: '#fee2e2', color: '#ef4444', icon: <UserX size={14} /> },
            'blocked': { bg: '#fee2e2', color: '#ef4444', icon: <ShieldAlert size={14} /> },
            'irregular': { bg: '#fff7ed', color: '#f59e0b', icon: <AlertOctagon size={14} /> },
            'seized': { bg: '#0f172a10', color: '#0f172a', icon: <Hash size={14} /> },
            'stolen': { bg: '#7f1d1d', color: '#ffffff', icon: <AlertOctagon size={14} /> }
        };
        return themes[status] || { bg: '#f1f5f9', color: '#64748b', icon: <Info size={14} /> };
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.05 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ maxWidth: '1600px', margin: '0 auto', paddingBottom: '6rem' }}
        >
            <PageHeader 
                title="Lista Negra Operacional"
                subtitle="Consola de vigilância crítica para veículos com restrições e bloqueios administrativos."
                breadcrumbs={[
                    { label: 'Painel', path: '/admin/dashboard' },
                    { label: 'Segurança', path: '/admin/blacklist' },
                    { label: 'Lista Negra' }
                ]}
                actions={
                    <button 
                        onClick={fetchBlacklist} 
                        className="tac-action-btn secondary"
                    >
                        <RefreshCw size={20} className={loading ? 'spin' : ''} />
                        SINCRO DE SEGURANÇA
                    </button>
                }
            />

            {/* Tactical Briefing Bar */}
            <div className="tactical-status-bar alert">
                <StatusItem icon={<ShieldAlert size={18} />} label="BLOQUEIOS ACTIVOS" value={vehicles.filter(v => v.status === 'blocked').length} color="#ef4444" />
                <div className="v-divider"></div>
                <StatusItem icon={<AlertOctagon size={18} />} label="VEÍCULOS ROUBADOS" value={vehicles.filter(v => v.status === 'stolen').length} color="#7f1d1d" />
                <div className="v-divider"></div>
                <StatusItem icon={<Activity size={18} />} label="RISCO OPERACIONAL" value="ELEVADO" color="#ef4444" />
                <div className="b-search">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Pesquisar por Matrícula, Chassi ou Titular..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="kpi-row">
                <KPICard icon={<ShieldAlert size={26} />} label="RESTRIÇÕES TOTAIS" value={vehicles.length} color="#ef4444" subText="Veículos Sinalizados" />
                <KPICard icon={<UserX size={26} />} label="SUSPENSÕES" value={vehicles.filter(v => v.status === 'suspended').length} color="#f59e0b" subText="Pendente Regularização" />
                <KPICard icon={<Target size={26} />} label="APREENDIDAS" value={vehicles.filter(v => v.status === 'seized').length} color="#0f172a" subText="Em Custódia Municipal" />
                <KPICard icon={<History size={26} />} label="ACTUALIZAÇÃO" value="Tempo Real" color="#1e293b" subText={new Date().toLocaleTimeString()} />
            </div>

            <div className="inventory-card">
                <div className="inventory-header">
                    <div className="view-mode-label">REDE DE VIGILÂNCIA MUNICIPAL</div>
                    <div className="filter-cluster">
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="">TODAS AS RESTRIÇÕES</option>
                            <option value="suspended">SUSPENSOS</option>
                            <option value="irregular">IRREGULARES</option>
                            <option value="seized">APREENDIDOS</option>
                            <option value="stolen">ROUBADOS</option>
                            <option value="blocked">BLOQUEADOS</option>
                        </select>
                    </div>
                </div>

                <div className="inventory-content">
                    {loading ? (
                        <div className="p-12"><SkeletonLoader type="table" rows={8} /></div>
                    ) : filteredVehicles.length === 0 ? (
                        <EmptyState 
                            icon={<ShieldAlert size={64} color="#f1f5f9" />}
                            title="Nenhuma Ocorrência"
                            description="Nenhum veículo sinalizado na lista negra condiz com a pesquisa."
                            onAction={() => {setSearchTerm(''); setStatusFilter('');}}
                            actionText="Limpar Critérios"
                        />
                    ) : (
                        <div className="table-wrapper">
                            <table className="tac-table">
                                <thead>
                                    <tr>
                                        <th>IDENTIFICAÇÃO ALVO</th>
                                        <th>VÍNCULO / PROPRIETÁRIO</th>
                                        <th>ESTRUTURA TÉCNICA</th>
                                        <th>NATUREZA DA RESTRIÇÃO</th>
                                        <th className="text-right">GERIR</th>
                                    </tr>
                                </thead>
                                <motion.tbody variants={containerVariants} initial="hidden" animate="show">
                                    {filteredVehicles.map((v) => {
                                        const theme = getStatusTheme(v.status);
                                        return (
                                            <motion.tr key={v.id} variants={itemVariants} className="tac-row alert" onClick={() => setSelectedVehicle(v)}>
                                                <td>
                                                    <div className="plate-box-premium alert">
                                                        <span className="p-label">BL</span>
                                                        <span className="p-num">{v.plate}</span>
                                                    </div>
                                                    <div className="brand-label">{v.brand} {v.model}</div>
                                                </td>
                                                <td>
                                                    <div className="owner-cell">
                                                        <div className="o-name">{v.owners?.full_name || 'DESCONHECIDO'}</div>
                                                        <div className="o-nuit">{v.owners?.phone || 'CONTATO NÃO MAPEADO'}</div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="tech-cell">
                                                        <div className="t-label">CHASSI</div>
                                                        <div className="t-val">{v.chassis}</div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className={`status-pill-tactical ${v.status.toLowerCase()}`}>
                                                        <div className="s-dot"></div>
                                                        {v.status.toUpperCase()}
                                                    </div>
                                                </td>
                                                <td className="text-right">
                                                    <div className="action-cluster" onClick={e => e.stopPropagation()}>
                                                        <button onClick={() => navigate(`/admin/motorcycles/${v.id}`)} className="tac-btn-sm"><Eye size={18} /></button>
                                                        <button onClick={() => setSelectedVehicle(v)} className="tac-btn-sm danger"><AlertOctagon size={18} /></button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </motion.tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {selectedVehicle && (
                    <div className="modal-overlay">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="premium-modal alert"
                        >
                            <button onClick={() => setSelectedVehicle(null)} className="close-btn"><X size={20} /></button>
                            
                            <div className="modal-header">
                                <div className="m-icon alert"><AlertOctagon size={28} /></div>
                                <h3>DOSSIÊ DE SEGURANÇA</h3>
                                <p>Detalhamento de restrição para o veículo sinalizado.</p>
                            </div>

                            <div className="dossier-grid">
                                <div className="d-item">
                                    <label>MATRÍCULA ALVO</label>
                                    <div className="d-val plate">{selectedVehicle.plate}</div>
                                </div>
                                <div className="d-item">
                                    <label>ESTADO CRÍTICO</label>
                                    <div className={`d-val status ${selectedVehicle.status.toLowerCase()}`}>{selectedVehicle.status.toUpperCase()}</div>
                                </div>
                                <div className="d-item full">
                                    <label>OBSERVAÇÕES OPERACIONAIS</label>
                                    <div className="d-obs">
                                        {selectedVehicle.observations || 'Nenhuma observação crítica foi registada no momento do bloqueio administrativo.'}
                                    </div>
                                </div>
                            </div>

                            <div className="modal-actions full">
                                <button className="m-btn primary alert" onClick={() => setSelectedVehicle(null)}>CONCLUIR ANÁLISE</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .tac-action-btn { height: 50px; padding: 0 25px; border-radius: 14px; font-weight: 950; font-size: 0.8rem; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: 0.3s; border: none; }
                .tac-action-btn.secondary { background: white; border: 2.5px solid #f1f5f9; color: #475569; }
                .tac-action-btn:hover { transform: translateY(-3px); }

                .tactical-status-bar { display: flex; align-items: center; gap: 2.5rem; background: #0f172a; padding: 1.25rem 2.5rem; border-radius: 20px; color: white; margin-bottom: 3rem; }
                .tactical-status-bar.alert { background: #7f1d1d; }
                .b-item { display: flex; align-items: center; gap: 10px; font-size: 0.75rem; font-weight: 800; color: rgba(255,255,255,0.6); }
                .b-item strong { color: white; font-weight: 950; }
                .v-divider { width: 1.5px; height: 15px; background: rgba(255,255,255,0.1); }
                .b-search { margin-left: auto; display: flex; align-items: center; gap: 15px; background: rgba(255,255,255,0.05); padding: 10px 20px; border-radius: 14px; border: 1.5px solid rgba(255,255,255,0.05); width: 350px; }
                .b-search input { background: transparent; border: none; color: white; font-size: 0.85rem; font-weight: 800; outline: none; width: 100%; }

                .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem; margin-bottom: 3rem; }
                .k-card { background: white; padding: 2.25rem; border-radius: 32px; box-shadow: 0 15px 35px -5px rgba(0,0,0,0.03); display: flex; align-items: center; gap: 20px; border: 1.5px solid #f8fafc; }
                .k-icon { width: 56px; height: 56px; border-radius: 18px; display: flex; align-items: center; justify-content: center; }
                .k-info label { font-size: 0.65rem; font-weight: 950; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px; display: block; }
                .k-val { font-size: 1.75rem; font-weight: 950; color: #0f172a; letter-spacing: -1px; }

                .inventory-card { background: white; border-radius: 40px; overflow: hidden; box-shadow: 0 30px 60px -15px rgba(0,0,0,0.05); }
                .inventory-header { padding: 2rem 2.5rem; border-bottom: 2px solid #f8fafc; display: flex; justify-content: space-between; align-items: center; }
                .view-mode-label { font-size: 0.75rem; font-weight: 950; color: #0f172a; letter-spacing: 1px; }
                .filter-cluster select { padding: 8px 16px; border-radius: 12px; border: 2px solid #f1f5f9; background: #f8fafc; font-weight: 900; font-size: 0.75rem; color: #475569; outline: none; }

                .tac-table { width: 100%; border-collapse: collapse; }
                .tac-table th { padding: 1.5rem 2rem; text-align: left; font-size: 0.7rem; font-weight: 950; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 2px solid #f8fafc; }
                .tac-row { border-bottom: 1.5px solid #f8fafc; transition: 0.3s; cursor: pointer; }
                .tac-row:hover { background: #f8fafc; }
                .tac-row.alert:hover { background: #fff1f2; }
                .tac-row td { padding: 1.75rem 2rem; }

                .plate-box-premium { display: inline-flex; align-items: stretch; background: #0f172a; padding: 2px; border-radius: 8px; border: 2.5px solid #334155; margin-bottom: 8px; }
                .plate-box-premium.alert { border-color: #ef4444; }
                .plate-box-premium .p-label { background: #fee2e2; color: #ef4444; padding: 2px 8px; border-radius: 5px 2px 2px 5px; font-weight: 950; font-size: 0.7rem; display: flex; align-items: center; }
                .plate-box-premium .p-num { padding: 2px 12px; color: white; font-family: 'Monaco', monospace; font-size: 1.25rem; font-weight: 950; letter-spacing: 1px; }
                .brand-label { font-size: 0.9rem; font-weight: 850; color: #1e293b; }

                .owner-cell .o-name { font-size: 1rem; font-weight: 950; color: #0f172a; }
                .owner-cell .o-nuit { font-size: 0.75rem; font-weight: 800; color: #94a3b8; margin-top: 4px; }

                .tech-cell .t-label { font-size: 0.6rem; font-weight: 950; color: #cbd5e1; letter-spacing: 1px; }
                .tech-cell .t-val { font-family: 'Monaco', monospace; font-size: 0.85rem; font-weight: 950; color: #475569; }

                .status-pill-tactical { display: inline-flex; align-items: center; gap: 10px; padding: 10px 18px; border-radius: 100px; font-size: 0.75rem; font-weight: 950; letter-spacing: 0.5px; }
                .status-pill-tactical .s-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
                .status-pill-tactical.suspensa, .status-pill-tactical.bloqueada, .status-pill-tactical.roubada { background: #fee2e2; color: #ef4444; }
                .status-pill-tactical.irregular { background: #fff7ed; color: #f59e0b; }
                .status-pill-tactical.apreendida { background: #f1f5f9; color: #0f172a; }

                .action-cluster { display: flex; justify-content: flex-end; gap: 8px; }
                .tac-btn-sm { width: 44px; height: 44px; border-radius: 14px; border: 1.5px solid #f1f5f9; background: white; color: #64748b; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; }
                .tac-btn-sm:hover { border-color: #0f172a; color: #0f172a; }
                .tac-btn-sm.danger:hover { border-color: #ef4444; color: #ef4444; background: #fee2e2; }

                .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 2rem; }
                .premium-modal { background: white; width: 100%; maxWidth: 550px; padding: 3.5rem; border-radius: 40px; position: relative; box-shadow: 0 40px 100px -20px rgba(0,0,0,0.3); }
                .premium-modal.alert { border-top: 8px solid #ef4444; }
                .close-btn { position: absolute; top: 2rem; right: 2rem; width: 44px; height: 44px; border-radius: 50%; border: none; background: #f8fafc; color: #94a3b8; cursor: pointer; display: flex; align-items: center; justify-content: center; }
                
                .modal-header { text-align: center; margin-bottom: 2.5rem; }
                .m-icon { width: 64px; height: 64px; background: #0f172a; color: white; border-radius: 22px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto; }
                .m-icon.alert { background: #ef4444; }
                .modal-header h3 { margin: 0; font-size: 1.5rem; font-weight: 950; color: #0f172a; letter-spacing: -1px; }

                .dossier-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; background: #f8fafc; padding: 2rem; border-radius: 25px; border: 2px solid #f1f5f9; }
                .d-item label { display: block; font-size: 0.65rem; font-weight: 950; color: #94a3b8; letter-spacing: 1px; margin-bottom: 6px; }
                .d-val { font-size: 1.1rem; font-weight: 950; color: #1e293b; }
                .d-val.plate { font-family: 'Monaco', monospace; font-size: 1.5rem; color: #ef4444; }
                .d-val.status { font-size: 1.1rem; }
                .d-val.status.suspensa, .d-val.status.bloqueada { color: #ef4444; }
                .d-item.full { grid-column: span 2; }
                .d-obs { font-size: 0.9rem; font-weight: 700; color: #64748b; line-height: 1.6; }

                .modal-actions.full button { width: 100%; margin-top: 2.5rem; height: 64px; border-radius: 20px; border: none; font-weight: 950; cursor: pointer; transition: 0.3s; }
                .m-btn.primary.alert { background: #0f172a; color: white; }
                .m-btn:hover { transform: translateY(-3px); }

                @keyframes spin { to { transform: rotate(360deg); } }
                .spin { animation: spin 1s linear infinite; }
                .text-right { text-align: right; }
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
            <div className="k-sub" style={{ fontSize: '0.7rem', color: '#cbd5e1', fontWeight: 700 }}>{subText}</div>
        </div>
    </div>
);

export default Blacklist;
