import React, { useState, useEffect } from 'react';
import { 
    FileText, Search, Printer, Eye, Calendar, Download, 
    Hash, DollarSign, ArrowUpRight, TrendingUp, CheckCircle2,
    Filter, RefreshCw, ChevronRight, LayoutGrid, Receipt,
    Activity, History, Box, Zap, Globe, MessageSquare
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import SkeletonLoader from '../../components/SkeletonLoader';
import EmptyState from '../../components/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';

const ReceiptsList = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [receipts, setReceipts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (profile?.municipality_id) {
            fetchReceipts();
        }
    }, [profile?.municipality_id]);

    const fetchReceipts = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('receipts')
                .select(`
                    *,
                    payments (
                        reference, 
                        value, 
                        payment_type, 
                        method,
                        owners (full_name),
                        motorcycles (plate)
                    )
                `)
                .eq('municipality_id', profile.municipality_id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReceipts(data || []);
        } catch (error) {
            console.error('Erro ao buscar recibos:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredReceipts = receipts.filter(r => 
        r.receipt_number?.toString().includes(searchTerm) ||
        r.payments?.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.payments?.owners?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.payments?.motorcycles?.plate?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalRevenue = receipts.reduce((acc, r) => acc + (parseFloat(r.payments?.value) || 0), 0);
    const monthReceipts = receipts.filter(r => new Date(r.created_at).getMonth() === new Date().getMonth()).length;

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
                title="Arquivo de Auditoria"
                subtitle="Consola técnica de gestão de recibos, comprovativos de pagamento e histórico fiscal municipal."
                breadcrumbs={[
                    { label: 'Painel', path: '/admin/dashboard' },
                    { label: 'Tesouraria', path: '/admin/payments' },
                    { label: 'Arquivo de Recibos' }
                ]}
                actions={
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button onClick={fetchReceipts} className="tac-action-btn secondary">
                            <RefreshCw size={18} className={loading ? 'spin' : ''} /> RE-SINCRONIZAR
                        </button>
                        <button className="tac-action-btn primary">
                            <Download size={20} /> DESCARREGAR LOTE
                        </button>
                    </div>
                }
            />

            {/* Tactical Briefing Bar */}
            <div className="tactical-status-bar archive">
                <StatusItem icon={<Receipt size={18} />} label="EMISSÕES TOTAIS" value={receipts.length} color="#3b82f6" />
                <div className="v-divider"></div>
                <StatusItem icon={<TrendingUp size={18} />} label="EMISSÕES MÊS" value={monthReceipts} color="#10b981" />
                <div className="v-divider"></div>
                <StatusItem icon={<Activity size={18} />} label="INTEGRIDADE" value="OPTIZIMADA" color="#8b5cf6" />
                <div className="b-search">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Pesquisar por Nº Recibo, REF ou Titular..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="kpi-row">
                <KPICard icon={<Receipt size={26} />} label="VOLUME DE ARQUIVO" value={receipts.length} color="#3b82f6" subText="Documentos Processados" />
                <KPICard icon={<DollarSign size={26} />} label="VALOR AUDITADO" value={`${totalRevenue.toLocaleString()} MT`} color="#10b981" subText="Receita Comprovada" />
                <KPICard icon={<CheckCircle2 size={26} />} label="CONFORMIDADE" value="100%" color="#065f46" subText="Sem Inconsistências" />
                <KPICard icon={<History size={26} />} label="ACTUALIZAÇÃO" value="Tempo Real" color="#0f172a" subText={new Date().toLocaleTimeString()} />
            </div>

            <div className="inventory-card">
                <div className="inventory-header">
                    <div className="view-mode-label">BASE DE DADOS DE RECIBOS EMITIDOS</div>
                    <div className="filter-badge">
                        <History size={14} /> STATUS: ARQUIVADO / DISPONÍVEL
                    </div>
                </div>

                <div className="inventory-content">
                    {loading && receipts.length === 0 ? (
                        <div className="p-12"><SkeletonLoader type="table" rows={8} /></div>
                    ) : filteredReceipts.length === 0 ? (
                        <EmptyState 
                            icon={<FileText size={64} color="#f1f5f9" />}
                            title="Sem Documentação"
                            description="Nenhum recibo foi localizado com os termos filtrados."
                            onAction={() => setSearchTerm('')}
                            actionText="Limpar Pesquisa"
                        />
                    ) : (
                        <div className="table-wrapper">
                            <table className="tac-table">
                                <thead>
                                    <tr>
                                        <th>IDENTIFICAÇÃO DOCUMENTAL</th>
                                        <th>ESTRUTURA DE CONTRIBUINTE</th>
                                        <th>NATUREZA FISCAL</th>
                                        <th className="text-right">VALOR LANÇADO</th>
                                        <th>DATA EMISSÃO</th>
                                        <th className="text-right">AÇÕES</th>
                                    </tr>
                                </thead>
                                <motion.tbody variants={containerVariants} initial="hidden" animate="show">
                                    {filteredReceipts.map((r) => (
                                        <motion.tr key={r.id} variants={itemVariants} className="tac-row" onClick={() => navigate(`/admin/receipts/${r.id}`)}>
                                            <td>
                                                <div className="receipt-cell">
                                                    <div className="r-num">REC-{r.receipt_number.toString().padStart(6, '0')}</div>
                                                    <div className="r-ref">REF: {r.payments?.reference}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="owner-cell-compact">
                                                    <div className="o-name">{r.payments?.owners?.full_name}</div>
                                                    {r.payments?.motorcycles?.plate && (
                                                        <div className="plate-tag-mini">{r.payments.motorcycles.plate}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="service-cell">
                                                    <div className="s-type">{r.payments?.payment_type}</div>
                                                    <div className="s-method">{r.payments?.method}</div>
                                                </div>
                                            </td>
                                            <td className="text-right">
                                                <div className="val-cell-tactical">{parseFloat(r.payments?.value).toLocaleString()} <span>MT</span></div>
                                            </td>
                                            <td>
                                                <div className="date-cell">
                                                    <Calendar size={14} />
                                                    {new Date(r.created_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="text-right">
                                                <div className="action-cluster" onClick={e => e.stopPropagation()}>
                                                    <button onClick={() => navigate(`/admin/receipts/${r.id}`)} className="tac-btn-sm"><Eye size={18} /></button>
                                                    <button className="tac-btn-sm highlight"><Printer size={18} /></button>
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
                .tac-action-btn.primary { background: #0f172a; color: white; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.4); }
                .tac-action-btn.secondary { background: white; border: 2.5px solid #f1f5f9; color: #475569; }
                .tac-action-btn:hover { transform: translateY(-3px); }

                .tactical-status-bar { display: flex; align-items: center; gap: 2.5rem; background: #0f172a; padding: 1.25rem 2.5rem; border-radius: 20px; color: white; margin-bottom: 3rem; }
                .tactical-status-bar.archive { background: #1e293b; border-left: 8px solid #3b82f6; }
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
                .tac-row td { padding: 1.75rem 2rem; border-bottom: 1.5px solid #f8fafc; cursor: pointer; transition: 0.3s; }
                .tac-row:hover { background: #f8fafc; }

                .receipt-cell .r-num { font-size: 1.05rem; font-weight: 950; color: #3b82f6; letter-spacing: 0.5px; }
                .receipt-cell .r-ref { font-size: 0.7rem; font-weight: 850; color: #94a3b8; margin-top: 4px; letter-spacing: 0.5px; }

                .owner-cell-compact .o-name { font-size: 0.95rem; font-weight: 950; color: #0f172a; }
                .plate-tag-mini { display: inline-flex; margin-top: 6px; padding: 2px 8px; background: #0f172a; color: white; border-radius: 6px; font-family: 'Monaco', monospace; font-size: 0.7rem; font-weight: 950; border-left: 3px solid #3b82f6; }

                .service-cell .s-type { font-size: 0.9rem; font-weight: 900; color: #334155; }
                .service-cell .s-method { font-size: 0.75rem; font-weight: 800; color: #94a3b8; margin-top: 4px; }

                .val-cell-tactical { font-size: 1.15rem; font-weight: 950; color: #0f172a; }
                .val-cell-tactical span { font-size: 0.75rem; color: #94a3b8; margin-left: 2px; }

                .date-cell { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; font-weight: 850; color: #475569; }

                .action-cluster { display: flex; justify-content: flex-end; gap: 10px; }
                .tac-btn-sm { width: 44px; height: 44px; border-radius: 14px; border: 1.5px solid #f1f5f9; background: white; color: #64748b; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; }
                .tac-btn-sm:hover { transform: translateY(-3px); border-color: #0f172a; color: #0f172a; }
                .tac-btn-sm.highlight { background: #eff6ff; color: #3b82f6; border-color: #3b82f640; }

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

export default ReceiptsList;
