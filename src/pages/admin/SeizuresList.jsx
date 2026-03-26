import React, { useState, useEffect } from 'react';
import { 
    Plus, Eye, Search, Shield, Filter, MapPin, Calendar, 
    Clock, CheckCircle, AlertTriangle, Download, ChevronRight, Hash, 
    ShieldAlert, AlertOctagon, Archive, ShieldCheck, Target, Gavel,
    History, Map, Zap, RefreshCw, MoreVertical, Trash2, Activity,
    Box, Truck, Lock
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import SkeletonLoader from '../../components/SkeletonLoader';
import EmptyState from '../../components/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';

const SeizuresList = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [seizures, setSeizures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (profile?.municipality_id) {
            fetchSeizures();
        }
    }, [profile?.municipality_id]);

    const fetchSeizures = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('seizures')
                .select(`
                    *,
                    motorcycles (plate, brand, model),
                    owners (full_name)
                `)
                .eq('municipality_id', profile.municipality_id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSeizures(data || []);
        } catch (error) {
            console.error('Erro ao buscar apreensões:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredSeizures = seizures.filter(s => 
        s.motorcycles?.plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.owners?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.seizure_number?.toString().includes(searchTerm)
    );

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
                title="Custódia e Gestão de Parque"
                subtitle="Administração estratégica de activos retidos, controlo de lotes e conformidade de custódia."
                breadcrumbs={[
                    { label: 'Painel', path: '/admin/dashboard' },
                    { label: 'Fiscalização', path: '/admin/settings' },
                    { label: 'Inventário de Parque' }
                ]}
                actions={
                    <button 
                        onClick={() => navigate('/admin/seizures/new')} 
                        className="tac-action-btn danger"
                    >
                        <ShieldAlert size={20} /> NOVA APREENSÃO
                    </button>
                }
            />

            {/* Tactical Intelligence Bar */}
            <div className="tactical-status-bar operational">
                <StatusItem icon={<Lock size={18} />} label="VETOR DE CUSTÓDIA" value="ACTIVO" color="#ef4444" />
                <div className="v-divider"></div>
                <StatusItem icon={<Truck size={18} />} label="ENTRADAS (24H)" value={`+${seizures.filter(s => new Date(s.created_at) > new Date(Date.now() - 86400000)).length}`} color="#3b82f6" />
                <div className="v-divider"></div>
                <StatusItem icon={<Box size={18} />} label="OCUPAÇÃO" value="ALTA" color="#f59e0b" />
                <div className="b-search">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Pesquisar por Matrícula, Proprietário ou Guia..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="kpi-row">
                <KPICard 
                    icon={<Archive size={26} />} 
                    label="ACTIVOS RETIDOS" 
                    value={seizures.filter(s => s.status === 'Activa').length} 
                    color="#ef4444" 
                    subText="Custódia em aberto"
                />
                <KPICard 
                    icon={<CheckCircle size={26} />} 
                    label="LIBERAÇÕES" 
                    value={seizures.filter(s => s.status === 'Liberada').length} 
                    color="#10b981" 
                    subText="Concluídas no mês"
                />
                <KPICard 
                    icon={<History size={26} />} 
                    label="TEMPO MÉDIO" 
                    value="5.4d" 
                    color="#f59e0b" 
                    subText="Permanência em parque"
                />
                <KPICard 
                    icon={<ShieldCheck size={26} />} 
                    label="INTEGRIDADE" 
                    value="100%" 
                    color="#0f172a" 
                    subText="Auditado & Seguro"
                />
            </div>

            <div className="inventory-card">
                <div className="inventory-header">
                    <div className="view-mode-label">REGISTO CENTRAL DE APREENSÕES E CUSTÓDIA</div>
                    <div className="filter-badge">
                        <MapPin size={14} /> FILTRADO POR MUNICÍPIO: {profile?.municipality?.name?.toUpperCase() || 'GERAL'}
                    </div>
                </div>

                <div className="inventory-content">
                    {loading ? (
                        <div className="p-12"><SkeletonLoader type="table" rows={8} /></div>
                    ) : filteredSeizures.length === 0 ? (
                        <EmptyState 
                            icon={<Archive size={64} color="#f1f5f9" />}
                            title="Inventário não Localizado"
                            description="Nenhuma apreensão activa ou histórico encontrado nos registos actuais."
                            onAction={() => setSearchTerm('')}
                            actionText="Limpar Filtros"
                        />
                    ) : (
                        <div className="table-wrapper">
                            <table className="tac-table">
                                <thead>
                                    <tr>
                                        <th>IDENTIFICADOR</th>
                                        <th>VEÍCULO / PROPRIETÁRIO</th>
                                        <th>DETALHE DA OCORRÊNCIA</th>
                                        <th>REGISTO DE ENTRADA</th>
                                        <th>ESTADO ACTUAL</th>
                                        <th className="text-right">GESTÃO</th>
                                    </tr>
                                </thead>
                                <motion.tbody variants={containerVariants} initial="hidden" animate="show">
                                    {filteredSeizures.map((s) => (
                                        <motion.tr key={s.id} variants={itemVariants} className="tac-row">
                                            <td>
                                                <div className="guide-cell-premium">
                                                    <div className="g-label">GUIA AC-</div>
                                                    <div className="g-num">{s.seizure_number}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="vehicle-cell">
                                                    <div className="v-plate">{s.motorcycles?.plate}</div>
                                                    <div className="v-owner"><User size={12} /> {s.owners?.full_name}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="info-cell">
                                                    <div className="i-reason">{s.reason}</div>
                                                    <div className="i-meta"><MapPin size={12} /> {s.location}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="date-cell-premium">
                                                    <div className="d-val">{new Date(s.created_at).toLocaleDateString()}</div>
                                                    <div className="d-time"><Clock size={12} /> {new Date(s.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className={`status-pill-tactical ${s.status === 'Activa' ? 'danger' : 'success'}`}>
                                                    <div className="s-dot"></div>
                                                    {s.status.toUpperCase()}
                                                </div>
                                            </td>
                                            <td className="text-right">
                                                <div className="action-cluster">
                                                    <button onClick={() => navigate(`/admin/seizures/${s.id}`)} className="tac-btn-sm highlight" title="Dossier Completo"><Eye size={18} /></button>
                                                    {s.status === 'Activa' && (
                                                        <button className="tac-btn-sm success" title="Confirmar Liberação"><CheckCircle size={18} /></button>
                                                    )}
                                                    <button className="tac-btn-sm"><ChevronRight size={20} /></button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </motion.tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .tac-action-btn { height: 50px; padding: 0 25px; border-radius: 14px; font-weight: 950; font-size: 0.8rem; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: 0.3s; border: none; }
                .tac-action-btn.danger { background: #ef4444; color: white; box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.4); }
                .tac-action-btn:hover { transform: translateY(-3px); }

                .tactical-status-bar { display: flex; align-items: center; gap: 2.5rem; background: #0f172a; padding: 1.25rem 2.5rem; border-radius: 20px; color: white; margin-bottom: 3rem; }
                .tactical-status-bar.operational { border-left: 8px solid #ef4444; box-shadow: 0 10px 30px -5px rgba(239, 68, 68, 0.2); }
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
                .filter-badge { padding: 8px 16px; border-radius: 10px; background: #f8fafc; border: 1.5px solid #f1f5f9; color: #94a3b8; font-size: 0.7rem; font-weight: 950; display: flex; align-items: center; gap: 8px; }

                .tac-table { width: 100%; border-collapse: collapse; }
                .tac-table th { padding: 1.5rem 2rem; text-align: left; font-size: 0.7rem; font-weight: 950; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 2px solid #f8fafc; }
                .tac-row td { padding: 1.75rem 2rem; border-bottom: 1.5px solid #f8fafc; }
                .tac-row:hover { background: #fffcfc; cursor: pointer; }

                .guide-cell-premium { background: #f8fafc; padding: 10px 14px; border-radius: 12px; border: 1.5px solid #f1f5f9; width: fit-content; }
                .g-label { font-size: 0.6rem; font-weight: 950; color: #94a3b8; letter-spacing: 1px; }
                .g-num { font-family: 'Monaco', monospace; font-size: 0.95rem; font-weight: 950; color: #0f172a; margin-top: 2px; }

                .vehicle-cell .v-plate { font-family: 'Monaco', monospace; font-size: 1.2rem; font-weight: 950; color: #ef4444; letter-spacing: 1px; }
                .vehicle-cell .v-owner { font-size: 0.85rem; color: #64748b; font-weight: 700; display: flex; align-items: center; gap: 6px; margin-top: 4px; }

                .info-cell .i-reason { font-size: 0.95rem; font-weight: 850; color: #1e293b; max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .info-cell .i-meta { font-size: 0.75rem; color: #94a3b8; font-weight: 700; display: flex; align-items: center; gap: 6px; margin-top: 5px; }

                .date-cell-premium .d-val { font-size: 1rem; font-weight: 900; color: #334155; }
                .date-cell-premium .d-time { font-size: 0.75rem; font-weight: 800; color: #cbd5e1; margin-top: 2px; display: flex; align-items: center; gap: 5px; }

                .status-pill-tactical { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 100px; font-size: 0.7rem; font-weight: 950; border: 1.5px solid transparent; }
                .status-pill-tactical .s-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
                .status-pill-tactical.danger { background: #fef2f2; color: #ef4444; border-color: #ef444420; }
                .status-pill-tactical.success { background: #ecfdf5; color: #10b981; border-color: #10b98120; }

                .action-cluster { display: flex; justify-content: flex-end; gap: 10px; }
                .tac-btn-sm { width: 44px; height: 44px; border-radius: 14px; border: 1.5px solid #f1f5f9; background: white; color: #64748b; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; }
                .tac-btn-sm:hover { transform: translateY(-3px); border-color: #0f172a; color: #0f172a; }
                .tac-btn-sm.highlight { background: #eff6ff; color: #3b82f6; border-color: #3b82f640; }
                .tac-btn-sm.success:hover { border-color: #10b981; color: #10b981; background: #ecfdf5; }

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

export default SeizuresList;
