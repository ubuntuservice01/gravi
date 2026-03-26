import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
    Plus, Eye, Edit2, Search, Bike, AlertTriangle, 
    CheckCircle, X, LayoutGrid, List, Filter, 
    ArrowRight, Hash, Shield, Activity, TrendingUp, 
    Calendar, MoreVertical, Trash2, ShieldCheck, 
    Zap, Globe, History, Map
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import SkeletonLoader from '../../components/SkeletonLoader';
import EmptyState from '../../components/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';

const MotorcyclesList = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [motorcycles, setMotorcycles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

    useEffect(() => {
        if (profile?.municipality_id) {
            fetchMotorcycles();
        }
    }, [profile?.municipality_id]);

    const fetchMotorcycles = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('motorcycles')
                .select(`
                    *,
                    owners (full_name, bi_number, nuit, phone)
                `)
                .eq('municipality_id', profile.municipality_id)
                .eq('type', 'motorcycle')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMotorcycles(data || []);
        } catch (err) {
            console.error('Error fetching motorcycles:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredMotorcycles = motorcycles.filter(m =>
        (m.plate?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (m.owners?.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (m.brand?.toLowerCase() || '').includes(searchTerm.toLowerCase())
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
                title="Frota de Motorizadas"
                subtitle="Consola de gestão táctica para veículos e licenciamento operacional."
                breadcrumbs={[
                    { label: 'Painel', path: '/admin/dashboard' },
                    { label: 'Inventário', path: '/admin/motorcycles' },
                    { label: 'Motorizadas' }
                ]}
                actions={
                    (profile?.role === 'admin_municipal' || profile?.role === 'tecnico') && (
                        <button 
                            onClick={() => navigate('/admin/motorcycles/new')} 
                            className="tac-action-btn primary"
                        >
                            <Plus size={22} /> NOVO REGISTO
                        </button>
                    )
                }
            />

            {/* Tactical Intelligence Bar */}
            <div className="tactical-status-bar">
                <StatusItem icon={<Activity size={18} />} label="FROTA ACTIVA" value={motorcycles.filter(m => m.status === 'Activa').length} color="#10b981" />
                <div className="v-divider"></div>
                <StatusItem icon={<Shield size={18} />} label="BLOQUEADOS" value={motorcycles.filter(m => m.status === 'Bloqueada' || m.status === 'Suspensa' || m.status === 'Apreendida').length} color="#ef4444" />
                <div className="v-divider"></div>
                <StatusItem icon={<Zap size={18} />} label="CAPACIDADE" value={`${((motorcycles.filter(m => m.status === 'Activa').length / (motorcycles.length || 1)) * 100).toFixed(0)}%`} color="#3b82f6" />
                <div className="b-search">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Pesquisar por Matrícula ou Titular..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="kpi-row">
                <KPICard icon={<Bike size={26} />} label="TOTAL REGISTADO" value={motorcycles.length} color="#3b82f6" subText="Unidades Mapeadas" />
                <KPICard icon={<ShieldCheck size={26} />} label="EM CONFORMIDADE" value={motorcycles.filter(m => m.status === 'Activa').length} color="#10b981" subText="Prontos para circulação" />
                <KPICard icon={<AlertTriangle size={26} />} label="IRREGULARES" value={motorcycles.filter(m => m.status !== 'Activa').length} color="#f59e0b" subText="Pendente Acção" />
                <KPICard icon={<History size={26} />} label="ÚLTIMA ACTUALIZAÇÃO" value="Hoje" color="#0f172a" subText={new Date().toLocaleTimeString()} />
            </div>

            <div className="inventory-card">
                <div className="inventory-header">
                    <div className="view-toggle">
                        <button onClick={() => setViewMode('table')} className={viewMode === 'table' ? 'active' : ''}><List size={18} /> LISTA</button>
                        <button onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'active' : ''}><LayoutGrid size={18} /> GRELHA</button>
                    </div>
                    <div className="filter-badge">
                        <Filter size={14} /> FILTRO: TODOS OS ACTIVOS
                    </div>
                </div>

                <div className="inventory-content">
                    {loading ? (
                        <div className="p-12"><SkeletonLoader type={viewMode === 'table' ? 'table' : 'grid'} rows={6} /></div>
                    ) : filteredMotorcycles.length === 0 ? (
                        <EmptyState 
                            icon={<Bike size={64} color="#f1f5f9" />}
                            title="Nada Localizado"
                            description="Nenhum veículo corresponde aos termos da pesquisa táctica."
                            onAction={() => setSearchTerm('')}
                            actionText="Reiniciar Filtros"
                        />
                    ) : viewMode === 'table' ? (
                        <div className="table-wrapper">
                            <table className="tac-table">
                                <thead>
                                    <tr>
                                        <th>IDENTIFICAÇÃO</th>
                                        <th>TITULAR DO ACTIVO</th>
                                        <th>FINALIDADE / USO</th>
                                        <th>ESTADO OPERACIONAL</th>
                                        <th className="text-right">GERIR</th>
                                    </tr>
                                </thead>
                                <motion.tbody variants={containerVariants} initial="hidden" animate="show">
                                    {filteredMotorcycles.map((m) => (
                                        <motion.tr key={m.id} variants={itemVariants} className="tac-row" onClick={() => navigate(`/admin/motorcycles/${m.id}`)}>
                                            <td>
                                                <div className="plate-box-premium">
                                                    <span className="p-label">MZ</span>
                                                    <span className="p-num">{m.plate}</span>
                                                </div>
                                                <div className="brand-label">{m.brand} • {m.model}</div>
                                            </td>
                                            <td>
                                                <div className="owner-cell">
                                                    <div className="o-name">{m.owners?.full_name}</div>
                                                    <div className="o-nuit">NUIT: {m.owners?.nuit || '---'}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className={`purpose-tag ${m.purpose === 'Moto-Táxi' ? 'taxi' : 'private'}`}>
                                                    <div className="t-dot"></div>
                                                    {m.purpose.toUpperCase()}
                                                </div>
                                                {m.purpose === 'Moto-Táxi' && <div className="taxi-vest">COLETE: #{m.taxi_vest_number || '---'}</div>}
                                            </td>
                                            <td>
                                                <div className={`status-pill-tactical ${m.status.toLowerCase()}`}>
                                                    <div className="s-dot"></div>
                                                    {m.status.toUpperCase()}
                                                </div>
                                            </td>
                                            <td className="text-right">
                                                <div className="action-cluster" onClick={e => e.stopPropagation()}>
                                                    <button onClick={() => navigate(`/admin/motorcycles/${m.id}`)} className="tac-btn-sm"><Eye size={18} /></button>
                                                    {(profile?.role === 'admin_municipal' || profile?.role === 'tecnico') && (
                                                        <button onClick={() => navigate(`/admin/motorcycles/edit/${m.id}`)} className="tac-btn-sm success"><Edit2 size={18} /></button>
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </motion.tbody>
                            </table>
                        </div>
                    ) : (
                        <motion.div 
                            variants={containerVariants} initial="hidden" animate="show"
                            className="inventory-grid"
                        >
                            {filteredMotorcycles.map((m) => (
                                <motion.div 
                                    key={m.id} variants={itemVariants}
                                    className="tac-grid-card"
                                    onClick={() => navigate(`/admin/motorcycles/${m.id}`)}
                                >
                                    <div className="g-status"><div className={`p-dot ${m.status.toLowerCase()}`}></div> {m.status.toUpperCase()}</div>
                                    <div className="g-plate-section">
                                        <div className="plate-sm">
                                            <span className="l">MZ</span>
                                            <span className="n">{m.plate}</span>
                                        </div>
                                        <h3>{m.brand} {m.model}</h3>
                                        <p>{m.year} • {m.color?.toUpperCase()}</p>
                                    </div>
                                    <div className="g-owner-section">
                                        <label>PROPRIETÁRIO</label>
                                        <p>{m.owners?.full_name}</p>
                                    </div>
                                    <div className="g-footer">
                                        <div className={`p-badge ${m.purpose === 'Moto-Táxi' ? 'taxi' : 'private'}`}>{m.purpose}</div>
                                        <ArrowRight size={18} className="arrow" />
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </div>
            </div>

            <style>{`
                .tac-action-btn { height: 50px; padding: 0 25px; border-radius: 14px; font-weight: 950; font-size: 0.8rem; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: 0.3s; border: none; }
                .tac-action-btn.primary { background: #0f172a; color: white; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.4); }
                .tac-action-btn:hover { transform: translateY(-3px); box-shadow: 0 15px 30px -8px rgba(0,0,0,0.2); }

                .tactical-status-bar { display: flex; align-items: center; gap: 2.5rem; background: #0f172a; padding: 1.25rem 2.5rem; border-radius: 20px; color: white; margin-bottom: 3rem; }
                .b-item { display: flex; align-items: center; gap: 10px; font-size: 0.75rem; font-weight: 800; color: #94a3b8; }
                .b-item span { letter-spacing: 0.5px; }
                .b-item strong { color: white; font-weight: 950; }
                .v-divider { width: 1.5px; height: 15px; background: rgba(255,255,255,0.1); }
                .b-search { margin-left: auto; display: flex; align-items: center; gap: 15px; background: rgba(255,255,255,0.05); padding: 10px 20px; border-radius: 14px; border: 1.5px solid rgba(255,255,255,0.05); width: 350px; }
                .b-search input { background: transparent; border: none; color: white; font-size: 0.85rem; font-weight: 800; outline: none; width: 100%; }
                .b-search input::placeholder { color: rgba(255,255,255,0.3); }

                .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem; margin-bottom: 3rem; }
                .k-card { background: white; padding: 2.25rem; border-radius: 32px; box-shadow: 0 15px 35px -5px rgba(0,0,0,0.03); display: flex; align-items: center; gap: 20px; border: 1.5px solid #f8fafc; }
                .k-icon { width: 56px; height: 56px; border-radius: 18px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 15px -5px rgba(0,0,0,0.05); }
                .k-info label { font-size: 0.65rem; font-weight: 950; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px; display: block; }
                .k-val { font-size: 1.75rem; font-weight: 950; color: #0f172a; letter-spacing: -1px; }
                .k-sub { font-size: 0.75rem; font-weight: 700; color: #cbd5e1; margin-top: 2px; }

                .inventory-card { background: white; border-radius: 40px; overflow: hidden; box-shadow: 0 30px 60px -15px rgba(0,0,0,0.05); }
                .inventory-header { padding: 2rem 2.5rem; border-bottom: 2px solid #f8fafc; display: flex; justify-content: space-between; align-items: center; }
                .view-toggle { display: flex; background: #f1f5f9; padding: 6px; border-radius: 14px; gap: 6px; }
                .view-toggle button { padding: 8px 16px; border-radius: 10px; border: none; background: transparent; color: #94a3b8; font-weight: 950; font-size: 0.75rem; cursor: pointer; transition: 0.3s; display: flex; align-items: center; gap: 8px; }
                .view-toggle button.active { background: white; color: #0f172a; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
                .filter-badge { padding: 8px 16px; border-radius: 10px; background: #f8fafc; border: 1.5px solid #f1f5f9; color: #94a3b8; font-size: 0.7rem; font-weight: 950; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; }

                .table-wrapper { overflow-x: auto; }
                .tac-table { width: 100%; border-collapse: collapse; }
                .tac-table th { padding: 1.5rem 2rem; text-align: left; font-size: 0.7rem; font-weight: 950; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 2px solid #f8fafc; }
                .tac-row { border-bottom: 1.5px solid #f8fafc; transition: 0.3s; cursor: pointer; }
                .tac-row:hover { background: #f8fafc; }
                .tac-row td { padding: 1.75rem 2rem; }

                .plate-box-premium { display: inline-flex; align-items: stretch; background: #0f172a; padding: 2px; border-radius: 8px; border: 2.5px solid #334155; box-shadow: 0 4px 10px rgba(0,0,0,0.1); margin-bottom: 8px; }
                .plate-box-premium .p-label { background: #ef4444; color: white; padding: 2px 8px; border-radius: 5px 2px 2px 5px; font-weight: 950; font-size: 0.7rem; display: flex; align-items: center; }
                .plate-box-premium .p-num { padding: 2px 12px; color: white; font-family: 'Monaco', monospace; font-size: 1.25rem; font-weight: 950; letter-spacing: 1px; }
                .brand-label { font-size: 0.9rem; font-weight: 850; color: #1e293b; }

                .owner-cell .o-name { font-size: 1rem; font-weight: 950; color: #0f172a; }
                .owner-cell .o-nuit { font-size: 0.75rem; font-weight: 800; color: #94a3b8; margin-top: 4px; }

                .purpose-tag { display: inline-flex; align-items: center; gap: 8px; padding: 4px 12px; border-radius: 100px; font-size: 0.7rem; font-weight: 950; border: 1.5px solid #f1f5f9; }
                .purpose-tag .t-dot { width: 6px; height: 6px; border-radius: 50%; }
                .purpose-tag.taxi { color: #3b82f6; border-color: #3b82f620; }
                .purpose-tag.taxi .t-dot { background: #3b82f6; }
                .taxi-vest { margin-top: 6px; font-size: 0.7rem; font-weight: 950; color: #3b82f6; letter-spacing: 0.5px; }

                .status-pill-tactical { display: inline-flex; align-items: center; gap: 10px; padding: 10px 18px; border-radius: 100px; font-size: 0.75rem; font-weight: 950; letter-spacing: 0.5px; }
                .status-pill-tactical .s-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
                .status-pill-tactical.activa { background: #ecfdf5; color: #10b981; }
                .status-pill-tactical.bloqueada, .status-pill-tactical.suspensa, .status-pill-tactical.apreendida { background: #fff1f2; color: #ef4444; }

                .action-cluster { display: flex; justify-content: flex-end; gap: 8px; }
                .tac-btn-sm { width: 44px; height: 44px; border-radius: 14px; border: 1.5px solid #f1f5f9; background: white; color: #64748b; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; }
                .tac-btn-sm:hover { border-color: #0f172a; color: #0f172a; transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
                .tac-btn-sm.success:hover { border-color: #10b981; color: #10b981; }

                .inventory-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 2.5rem; padding: 3rem; }
                .tac-grid-card { position: relative; background: white; border-radius: 35px; border: 2.5px solid #f1f5f9; padding: 2.5rem; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; }
                .tac-grid-card:hover { transform: translateY(-10px); border-color: #0f172a; box-shadow: 0 25px 50px -15px rgba(0,0,0,0.1); }
                .tac-grid-card:hover .arrow { transform: translateX(5px); color: #0f172a; }
                .g-status { position: absolute; top: 1.5rem; right: 2.5rem; display: flex; align-items: center; gap: 8px; font-size: 0.65rem; font-weight: 950; color: #94a3b8; }
                .p-dot { width: 6px; height: 6px; border-radius: 50%; }
                .p-dot.activa { background: #10b981; }
                .g-plate-section { margin: 1rem 0 2.5rem 0; }
                .plate-sm { display: inline-flex; background: #0f172a; color: white; border-radius: 8px; overflow: hidden; font-family: 'Monaco', monospace; margin-bottom: 1.5rem; border: 2px solid #334155; }
                .plate-sm .l { background: #ef4444; padding: 2px 8px; font-size: 0.7rem; font-weight: 950; }
                .plate-sm .n { padding: 2px 12px; font-size: 1.1rem; font-weight: 950; }
                .g-plate-section h3 { margin: 0; font-size: 1.25rem; font-weight: 950; color: #1e293b; }
                .g-plate-section p { margin: 4px 0 0 0; font-size: 0.85rem; font-weight: 700; color: #cbd5e1; }
                .g-owner-section { background: #f8fafc; padding: 1.5rem; border-radius: 20px; margin-bottom: 1.5rem; }
                .g-owner-section label { display: block; font-size: 0.6rem; font-weight: 950; color: #94a3b8; letter-spacing: 1px; margin-bottom: 6px; }
                .g-owner-section p { margin: 0; font-size: 0.95rem; font-weight: 900; color: #334155; }
                .g-footer { display: flex; justify-content: space-between; align-items: center; }
                .p-badge { font-size: 0.7rem; font-weight: 950; color: #94a3b8; text-transform: uppercase; }
                .arrow { color: #cbd5e1; transition: 0.3s; }

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
        <div>
            <label>{label}</label>
            <div className="k-val">{value}</div>
            <div className="k-sub">{subText}</div>
        </div>
    </div>
);

export default MotorcyclesList;
