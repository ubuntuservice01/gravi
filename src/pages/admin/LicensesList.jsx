import React, { useState, useEffect } from 'react';
import { 
    Plus, Search, Printer, Eye, RefreshCw, AlertTriangle, 
    FileText, CheckCircle, X, Filter, Download, ChevronRight, 
    LayoutGrid, List as ListIcon, Hash, ShieldCheck, Zap, 
    Globe, History, Clock, TrendingUp, Calendar, MoreVertical
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import PageHeader from '../../components/PageHeader';
import SkeletonLoader from '../../components/SkeletonLoader';
import EmptyState from '../../components/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const LicensesList = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [licenses, setLicenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
    const [filters, setFilters] = useState({
        type: '',
        status: ''
    });

    useEffect(() => {
        fetchLicenses();
    }, [filters, profile?.municipality_id]);

    const fetchLicenses = async () => {
        if (!profile?.municipality_id) return;
        try {
            setLoading(true);
            let query = supabase
                .from('licenses')
                .select(`
                    *,
                    vehicles:vehicle_id (plate, brand, model, purpose),
                    owners:owner_id (full_name)
                `)
                .eq('municipality_id', profile.municipality_id)
                .order('created_at', { ascending: false });

            if (filters.type) query = query.eq('license_type', filters.type);
            if (filters.status) query = query.eq('status', filters.status);

            const { data, error } = await query;

            if (error) throw error;
            setLicenses(data || []);
        } catch (error) {
            console.error('Erro ao buscar licenças:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = (license) => {
        const doc = new jsPDF();
        const mName = profile.municipality_name || 'ADMINISTRAÇÃO MUNICIPAL';

        doc.setFontSize(10);
        doc.text('REPÚBLICA DE MOÇAMBIQUE', 105, 15, { align: 'center' });
        doc.text(`CONSELHO MUNICIPAL DE ${mName.toUpperCase()}`, 105, 20, { align: 'center' });
        
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('CERTIFICADO DE MATRÍCULA E LICENÇA', 105, 45, { align: 'center' });
        
        doc.autoTable({
            startY: 65,
            head: [['CATEGORIA', 'DETALHES']],
            body: [
                ['Proprietário', license.owners?.full_name],
                ['Matrícula', license.vehicles?.plate],
                ['Marca / Modelo', `${license.vehicles?.brand} ${license.vehicles?.model}`],
                ['Tipo de Licença', license.license_type],
                ['Data de Emissão', format(new Date(license.issue_date), "dd/MM/yyyy")],
                ['Data de Validade', format(new Date(license.expiry_date), "dd/MM/yyyy")]
            ],
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42] }
        });

        doc.save(`Licenca_${license.license_number}.pdf`);
    };

    const filteredLicenses = licenses.filter(license => 
        license.license_number?.toString().includes(searchTerm) ||
        license.vehicles?.plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        license.owners?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
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
                title="Títulos & Licenças"
                subtitle="Gestão táctica de alvarás de circulação e conformidade administrativa."
                breadcrumbs={[
                    { label: 'Painel', path: '/admin/dashboard' },
                    { label: 'Licenciamento', path: '/admin/licenses' },
                    { label: 'Títulos' }
                ]}
                actions={
                    (profile?.role === 'admin_municipal' || profile?.role === 'tecnico') && (
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="tac-action-btn secondary">
                                <Download size={18} /> EXPORTAR
                            </button>
                            <button 
                                onClick={() => navigate('/admin/licenses/new')} 
                                className="tac-action-btn primary"
                            >
                                <Plus size={22} /> NOVO TÍTULO
                            </button>
                        </div>
                    )
                }
            />

            {/* Tactical Briefing Bar */}
            <div className="tactical-status-bar">
                <StatusItem icon={<ShieldCheck size={18} />} label="CERTIFICADOS ACTIVOS" value={licenses.filter(l => l.status === 'Activa').length} color="#10b981" />
                <div className="v-divider"></div>
                <StatusItem icon={<AlertTriangle size={18} />} label="FORA DE PRAZO" value={licenses.filter(l => l.status === 'Expirada' || new Date(l.expiry_date) < new Date()).length} color="#ef4444" />
                <div className="v-divider"></div>
                <StatusItem icon={<TrendingUp size={18} />} label="RENOVAÇÕES (30d)" value="+42" color="#3b82f6" />
                <div className="b-search">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Pesquisar por Título, Placa ou Nome..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="kpi-row">
                <KPICard icon={<FileText size={26} />} label="TOTAL EMITIDO" value={licenses.length} color="#3b82f6" subText="Histórico Completo" />
                <KPICard icon={<CheckCircle size={26} />} label="VIGENTES" value={licenses.filter(l => l.status === 'Activa').length} color="#10b981" subText="Situação Regular" />
                <KPICard icon={<RefreshCw size={26} />} label="PENDENTES" value={licenses.filter(l => l.status === 'Pendente').length} color="#f59e0b" subText="Aguardando Validação" />
                <KPICard icon={<History size={26} />} label="ÚLTIMA EMISSÃO" value="Há 2h" color="#0f172a" subText="Controlo Contínuo" />
            </div>

            <div className="inventory-card">
                <div className="inventory-header">
                    <div className="view-toggle">
                        <button onClick={() => setViewMode('table')} className={viewMode === 'table' ? 'active' : ''}><ListIcon size={18} /> LISTA</button>
                        <button onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'active' : ''}><LayoutGrid size={18} /> GRELHA</button>
                    </div>
                    
                    <div className="filter-cluster">
                        <select value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value})}>
                            <option value="">TODAS AS CATEGORIAS</option>
                            <option value="Licença de circulação">ALVARÁ CIRCULAÇÃO</option>
                            <option value="Licença de moto-táxi">SERVIÇO TÁXI</option>
                        </select>
                        <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
                            <option value="">TODOS OS ESTADOS</option>
                            <option value="Activa">ACTIVAS</option>
                            <option value="Expirada">FORA DE PRAZO</option>
                        </select>
                    </div>
                </div>

                <div className="inventory-content">
                    {loading ? (
                        <div className="p-12"><SkeletonLoader type={viewMode === 'table' ? 'table' : 'grid'} rows={6} /></div>
                    ) : filteredLicenses.length === 0 ? (
                        <EmptyState 
                            icon={<FileText size={64} color="#f1f5f9" />}
                            title="Nenhum Título Localizado"
                            description="A consulta táctica não retornou registros com estes parâmetros."
                            onAction={() => {setSearchTerm(''); setFilters({type:'', status:''});}}
                            actionText="Limpar Filtros"
                        />
                    ) : viewMode === 'table' ? (
                        <div className="table-wrapper">
                            <table className="tac-table">
                                <thead>
                                    <tr>
                                        <th>IDENTIFICAÇÃO TÍTULO</th>
                                        <th>ALVO & PROPRIETÁRIO</th>
                                        <th>CATEGORIA</th>
                                        <th>CICLO DE VALIDADE</th>
                                        <th className="text-right">ACÇÕES</th>
                                    </tr>
                                </thead>
                                <motion.tbody variants={containerVariants} initial="hidden" animate="show">
                                    {filteredLicenses.map((l) => {
                                        const isExpired = new Date(l.expiry_date) < new Date();
                                        const status = (l.status === 'Activa' && isExpired) ? 'Expirada' : l.status;
                                        
                                        return (
                                            <motion.tr key={l.id} variants={itemVariants} className="tac-row" onClick={() => navigate(`/admin/licenses/${l.id}`)}>
                                                <td>
                                                    <div className="guide-box">
                                                        <span className="g-label">TÍTULO</span>
                                                        <span className="g-num">#{l.license_number}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="target-cell">
                                                        <div className="t-plate">{l.vehicles?.plate}</div>
                                                        <div className="t-owner">{l.owners?.full_name}</div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="occ-cell">
                                                        <div className="o-reason">{l.license_type}</div>
                                                        <div className="o-loc">MUNICÍPIO DE {profile.municipality_name?.toUpperCase()}</div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className={`status-pill-tactical ${status.toLowerCase()}`}>
                                                        <div className="s-dot"></div>
                                                        {status.toUpperCase()}
                                                    </div>
                                                    <div className="expiry-hint"><Clock size={12} /> EXP: {format(new Date(l.expiry_date), "dd/MM/yyyy")}</div>
                                                </td>
                                                <td className="text-right">
                                                    <div className="action-cluster" onClick={e => e.stopPropagation()}>
                                                        <button onClick={() => navigate(`/admin/licenses/${l.id}`)} className="tac-btn-sm"><Eye size={18} /></button>
                                                        <button onClick={() => handlePrint(l)} className="tac-btn-sm"><Printer size={18} /></button>
                                                        {l.status === 'Activa' && (
                                                            <button onClick={() => navigate(`/admin/licenses/renew/${l.id}`)} className="tac-btn-sm highlight" title="Renovar"><RefreshCw size={18} /></button>
                                                        )}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </motion.tbody>
                            </table>
                        </div>
                    ) : (
                        <motion.div 
                            variants={containerVariants} initial="hidden" animate="show"
                            className="inventory-grid"
                        >
                            {filteredLicenses.map((l) => (
                                <motion.div 
                                    key={l.id} variants={itemVariants}
                                    className="tac-grid-card"
                                    onClick={() => navigate(`/admin/licenses/${l.id}`)}
                                >
                                    <div className="g-status"><div className={`p-dot ${l.status.toLowerCase()}`}></div> {l.status.toUpperCase()}</div>
                                    <div className="g-plate-section">
                                        <div className="plate-sm">
                                            <span className="l">Nº</span>
                                            <span className="n">{l.license_number}</span>
                                        </div>
                                        <h3 style={{ fontFamily: 'Monaco, monospace', fontSize: '1.4rem', color: '#ef4444' }}>{l.vehicles?.plate}</h3>
                                        <p>{l.owners?.full_name}</p>
                                    </div>
                                    <div className="g-owner-section">
                                        <label>VALIDADE</label>
                                        <p>{format(new Date(l.expiry_date), "dd/MM/yyyy")}</p>
                                    </div>
                                    <div className="g-footer">
                                        <div className="p-badge">{l.license_type}</div>
                                        <ChevronRight size={18} className="arrow" />
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
                .tac-action-btn.secondary { background: white; border: 2px solid #f1f5f9; color: #64748b; }
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
                
                .filter-cluster { display: flex; gap: 12px; }
                .filter-cluster select { padding: 8px 16px; border-radius: 12px; border: 2px solid #f1f5f9; background: #f8fafc; font-weight: 900; font-size: 0.75rem; color: #475569; outline: none; cursor: pointer; }

                .table-wrapper { overflow-x: auto; }
                .tac-table { width: 100%; border-collapse: collapse; }
                .tac-table th { padding: 1.5rem 2rem; text-align: left; font-size: 0.7rem; font-weight: 950; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 2px solid #f8fafc; }
                .tac-row { border-bottom: 1.5px solid #f8fafc; transition: 0.3s; cursor: pointer; }
                .tac-row:hover { background: #f8fafc; }
                .tac-row td { padding: 1.75rem 2rem; }

                .guide-box { display: flex; flex-direction: column; background: #f8fafc; padding: 8px 12px; border-radius: 10px; border: 1px solid #f1f5f9; width: fit-content; }
                .g-label { font-size: 0.6rem; font-weight: 950; color: #94a3b8; }
                .g-num { font-family: 'Monaco', monospace; font-size: 0.85rem; font-weight: 950; color: #1e293b; }

                .target-cell .t-plate { font-family: 'Monaco', monospace; font-size: 1.25rem; font-weight: 950; color: #ef4444; letter-spacing: 1px; }
                .target-cell .t-owner { font-size: 0.85rem; font-weight: 800; color: #64748b; margin-top: 2px; }

                .occ-cell .o-reason { font-size: 0.9rem; font-weight: 900; color: #0f172a; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .occ-cell .o-loc { font-size: 0.7rem; font-weight: 700; color: #cbd5e1; margin-top: 4px; letter-spacing: 0.5px; }

                .status-pill-tactical { display: inline-flex; align-items: center; gap: 10px; padding: 10px 18px; border-radius: 100px; font-size: 0.75rem; font-weight: 950; letter-spacing: 0.5px; }
                .status-pill-tactical .s-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
                .status-pill-tactical.activa { background: #ecfdf5; color: #10b981; }
                .status-pill-tactical.expirada { background: #fff1f2; color: #ef4444; }
                .status-pill-tactical.pendente { background: #fefbeb; color: #f59e0b; }
                .expiry-hint { margin-top: 8px; font-size: 0.75rem; color: #94a3b8; font-weight: 700; display: flex; align-items: center; gap: 4px; }

                .action-cluster { display: flex; justify-content: flex-end; gap: 8px; }
                .tac-btn-sm { width: 44px; height: 44px; border-radius: 14px; border: 1.5px solid #f1f5f9; background: white; color: #64748b; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; }
                .tac-btn-sm:hover { border-color: #0f172a; color: #0f172a; transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
                .tac-btn-sm.highlight { color: #3b82f6; border-color: #3b82f640; background: #eff6ff; }

                .inventory-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 2.5rem; padding: 3rem; }
                .tac-grid-card { position: relative; background: white; border-radius: 35px; border: 2.5px solid #f1f5f9; padding: 2.5rem; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; }
                .tac-grid-card:hover { transform: translateY(-10px); border-color: #0f172a; box-shadow: 0 25px 50px -15px rgba(0,0,0,0.1); }
                .tac-grid-card:hover .arrow { transform: translateX(5px); color: #0f172a; }
                .g-status { position: absolute; top: 1.5rem; right: 2.5rem; display: flex; align-items: center; gap: 8px; font-size: 0.65rem; font-weight: 950; color: #94a3b8; }
                .p-dot { width: 6px; height: 6px; border-radius: 50%; }
                .p-dot.activa { background: #10b981; }
                .p-dot.expirada { background: #ef4444; }
                .g-plate-section { margin: 1rem 0 2.5rem 0; }
                .plate-sm { display: inline-flex; background: #0f172a; color: white; border-radius: 8px; overflow: hidden; font-family: 'Monaco', monospace; margin-bottom: 1.5rem; border: 2px solid #334155; }
                .plate-sm .l { background: #3b82f6; padding: 2px 8px; font-size: 0.6rem; font-weight: 950; }
                .plate-sm .n { padding: 2px 12px; font-size: 1.1rem; font-weight: 950; }
                .g-plate-section h3 { margin: 0; font-size: 1.25rem; font-weight: 950; color: #1e293b; }
                .g-plate-section p { margin: 4px 0 0 0; font-size: 0.85rem; font-weight: 700; color: #64748b; }
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

export default LicensesList;
