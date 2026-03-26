import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
    DollarSign, Search, FileText, CheckCircle, Clock, Printer, 
    Plus, Calendar, TrendingUp, Filter, Download, ChevronRight, Hash, ArrowUpRight,
    Globe, History, Zap, Activity, MessageSquare, MoreVertical, Trash2,
    TrendingDown, ShieldCheck, Target, CreditCard, Box
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReceiptModal from '../../components/ReceiptModal';
import ConsolidatedReportModal from '../../components/ConsolidatedReportModal';
import PageHeader from '../../components/PageHeader';
import SkeletonLoader from '../../components/SkeletonLoader';
import EmptyState from '../../components/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';

const PaymentsList = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [showReceipt, setShowReceipt] = useState(false);
    const [showConsolidatedReport, setShowConsolidatedReport] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);

    const isFinanceAuthorized = profile?.role === 'admin_municipal' || profile?.role === 'financeiro';

    useEffect(() => {
        if (profile?.municipality_id) {
            fetchPayments();
        }
    }, [profile?.municipality_id]);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('payments')
                .select(`
                    *,
                    motorcycles (plate, brand, model),
                    owners (full_name)
                `)
                .eq('municipality_id', profile.municipality_id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPayments(data || []);
        } catch (err) {
            console.error('Error fetching payments:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleReceipt = (payment) => {
        setSelectedPayment(payment);
        setShowReceipt(true);
    };

    const filteredPayments = payments.filter(p => {
        const matchesSearch = 
            (p.owners?.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (p.motorcycles?.plate?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (p.reference?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        
        const matchesType = typeFilter ? p.payment_type === typeFilter : true;
        const pDate = new Date(p.created_at);
        const matchesDate = (pDate.getMonth() + 1 === selectedMonth) && (pDate.getFullYear() === selectedYear);

        return matchesSearch && matchesType && matchesDate;
    });

    const totalRevenue = filteredPayments
        .filter(p => p.status === 'Confirmado')
        .reduce((acc, curr) => acc + Number(curr.value), 0);

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.05 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0 }
    };

    if (profile?.role === 'fiscal') {
        return <div className="p-20 text-center"><PageHeader title="Acesso Negado" subtitle="Esta secção é restrita ao departamento financeiro." /></div>;
    }

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ maxWidth: '1600px', margin: '0 auto', paddingBottom: '6rem' }}
        >
            <PageHeader 
                title="Consola de Tesouraria"
                subtitle="Gestão centralizada de fluxos financeiros, arrecadação de taxas e auditoria de caixa."
                breadcrumbs={[
                    { label: 'Painel', path: '/admin/dashboard' },
                    { label: 'Finanças', path: '/admin/payments' },
                    { label: 'Tesouraria' }
                ]}
                actions={
                    isFinanceAuthorized && (
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button 
                                onClick={() => setShowConsolidatedReport(true)} 
                                className="tac-action-btn secondary"
                            >
                                <Download size={20} /> MAPA FISCAL
                            </button>
                            <button 
                                onClick={() => navigate('/admin/payments/new')} 
                                className="tac-action-btn primary"
                            >
                                <Plus size={22} /> NOVO LANÇAMENTO
                            </button>
                        </div>
                    )
                }
            />

            {/* Tactical Briefing Bar */}
            <div className="tactical-status-bar finance">
                <StatusItem icon={<TrendingUp size={18} />} label="ARRECADAÇÃO ACTIVADA" value={`${totalRevenue.toLocaleString()} MT`} color="#10b981" />
                <div className="v-divider"></div>
                <StatusItem icon={<Clock size={18} />} label="PENDENTE" value={`${filteredPayments.filter(p => p.status !== 'Confirmado').reduce((a,c) => a+Number(c.value),0).toLocaleString()} MT`} color="#f59e0b" />
                <div className="v-divider"></div>
                <StatusItem icon={<Activity size={18} />} label="FLUXO DE CAIXA" value="SINCRONIZADO" color="#3b82f6" />
                <div className="b-search">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Pesquisar Referência, Nome ou Matrícula..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="kpi-row">
                <KPICard icon={<TrendingUp size={26} />} label="RECEITA MENSAL" value={`${totalRevenue.toLocaleString()} MT`} color="#10b981" subText={`Total em ${["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"][selectedMonth-1]}`} />
                <KPICard icon={<FileText size={26} />} label="TRANSACCÕES" value={filteredPayments.length} color="#3b82f6" subText="Volume de Operações" />
                <KPICard icon={<ArrowUpRight size={26} />} label="MÉDIA DIÁRIA" value={`${(totalRevenue / 30).toFixed(0)} MT`} color="#8b5cf6" subText="Performance Diária" />
                <KPICard icon={<History size={26} />} label="ÚLTIMA SYNC" value="Agora" color="#0f172a" subText={new Date().toLocaleTimeString()} />
            </div>

            <div className="inventory-card">
                <div className="inventory-header">
                    <div className="view-mode-label">FICHEIRO DE LANÇAMENTOS FINANCEIROS</div>
                    <div className="filter-cluster-tactical">
                        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                            <option value="">TODOS OS SERVIÇOS</option>
                            <option value="Licença">LICENÇAS</option>
                            <option value="Multa">MULTAS</option>
                            <option value="Taxa de registo">REGISTO</option>
                            <option value="Parqueamento">PARQUEAMENTO</option>
                        </select>
                        <div className="date-picker-tactical">
                             <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                                {["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"].map((m, i) => (
                                    <option key={i} value={i + 1}>{m}</option>
                                ))}
                            </select>
                            <input type="number" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} />
                        </div>
                    </div>
                </div>

                <div className="inventory-content">
                    {loading ? (
                        <div className="p-12"><SkeletonLoader type="table" rows={8} /></div>
                    ) : filteredPayments.length === 0 ? (
                        <EmptyState 
                            icon={<DollarSign size={64} color="#f1f5f9" />}
                            title="Sem Movimentações"
                            description="Não foram encontrados registos financeiros para o período e filtros actuais."
                            onAction={() => {setSearchTerm(''); setTypeFilter('');}}
                            actionText="Limpar Critérios"
                        />
                    ) : (
                        <div className="table-wrapper">
                            <table className="tac-table">
                                <thead>
                                    <tr>
                                        <th>REFERÊNCIA DE CAIXA</th>
                                        <th>CONTRIBUINTE / TITULAR</th>
                                        <th>VÍNCULO OPERACIONAL</th>
                                        <th className="text-right">MONTANTE FINAL</th>
                                        <th>STATUS</th>
                                        <th className="text-right">DOCUMENTAÇÃO</th>
                                    </tr>
                                </thead>
                                <motion.tbody variants={containerVariants} initial="hidden" animate="show">
                                    {filteredPayments.map((p) => {
                                        const isConfirmed = p.status === 'Confirmado';
                                        return (
                                            <motion.tr key={p.id} variants={itemVariants} className="tac-row">
                                                <td>
                                                    <div className="ref-cell">
                                                        <div className="r-code">{p.reference}</div>
                                                        <div className="r-date">{new Date(p.created_at).toLocaleDateString()} • {new Date(p.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="owner-cell-premium">
                                                        <div className="o-name">{p.owners?.full_name || 'CONTRIBUINTE EXTERNO'}</div>
                                                        <div className="o-sub">{p.payment_type.toUpperCase()}</div>
                                                    </div>
                                                </td>
                                                <td>
                                                    {p.motorcycles?.plate ? (
                                                        <div className="plate-box-premium mini">
                                                            <span className="p-label">MZ</span>
                                                            <span className="p-num">{p.motorcycles.plate}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="na-tag">NÃO APLICÁVEL</div>
                                                    )}
                                                </td>
                                                <td className="text-right">
                                                    <div className={`val-cell-premium ${isConfirmed ? 'success' : 'pending'}`}>
                                                        {Number(p.value).toLocaleString()} <span>MT</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className={`status-pill-tactical ${isConfirmed ? 'success' : 'warning'}`}>
                                                        <div className="s-dot"></div>
                                                        {p.status.toUpperCase()}
                                                    </div>
                                                </td>
                                                <td className="text-right">
                                                    <div className="action-cluster" onClick={e => e.stopPropagation()}>
                                                        <button onClick={() => handleReceipt(p)} className="tac-btn-sm highlight" title="Imprimir Recibo"><Printer size={18} /></button>
                                                        <button onClick={() => navigate(`/admin/payments/${p.id}`)} className="tac-btn-sm"><ChevronRight size={20} /></button>
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

            {showReceipt && selectedPayment && (
                <ReceiptModal data={selectedPayment} onClose={() => setShowReceipt(false)} />
            )}
            {showConsolidatedReport && (
                <ConsolidatedReportModal transactions={filteredPayments} selectedMonth={selectedMonth} selectedYear={selectedYear} onClose={() => setShowConsolidatedReport(false)} />
            )}

            <style>{`
                .tac-action-btn { height: 50px; padding: 0 25px; border-radius: 14px; font-weight: 950; font-size: 0.8rem; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: 0.3s; border: none; }
                .tac-action-btn.primary { background: #0f172a; color: white; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.4); }
                .tac-action-btn.secondary { background: white; border: 2.5px solid #f1f5f9; color: #475569; }
                .tac-action-btn:hover { transform: translateY(-3px); }

                .tactical-status-bar { display: flex; align-items: center; gap: 2.5rem; background: #0f172a; padding: 1.25rem 2.5rem; border-radius: 20px; color: white; margin-bottom: 3rem; }
                .tactical-status-bar.finance { background: #065f46; }
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
                
                .filter-cluster-tactical { display: flex; gap: 15px; align-items: center; }
                .filter-cluster-tactical select { padding: 10px 18px; border-radius: 12px; border: 2px solid #f1f5f9; background: #f8fafc; font-weight: 900; font-size: 0.75rem; color: #475569; outline: none; }
                .date-picker-tactical { display: flex; background: #f1f5f9; padding: 4px; border-radius: 14px; align-items: center; }
                .date-picker-tactical select { border: none; background: transparent; padding: 6px 12px; font-weight: 950; font-size: 0.7rem; }
                .date-picker-tactical input { border: none; background: white; width: 60px; padding: 6px; border-radius: 10px; font-weight: 950; font-size: 0.7rem; text-align: center; }

                .tac-table { width: 100%; border-collapse: collapse; }
                .tac-table th { padding: 1.5rem 2rem; text-align: left; font-size: 0.7rem; font-weight: 950; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 2px solid #f8fafc; }
                .tac-row td { padding: 1.75rem 2rem; border-bottom: 1.5px solid #f8fafc; }

                .ref-cell .r-code { font-family: 'Monaco', monospace; font-size: 1.05rem; font-weight: 950; color: #0f172a; letter-spacing: 0.5px; }
                .ref-cell .r-date { font-size: 0.75rem; font-weight: 700; color: #94a3b8; margin-top: 4px; }

                .owner-cell-premium .o-name { font-size: 1rem; font-weight: 950; color: #1e293b; }
                .owner-cell-premium .o-sub { font-size: 0.65rem; font-weight: 950; color: #3b82f6; letter-spacing: 1px; margin-top: 4px; }

                .plate-box-premium.mini { width: fit-content; padding: 1.5px; border-radius: 6px; border: 1.5px solid #f1f5f9; background: #0f172a; display: flex; }
                .plate-box-premium .p-label { background: #3b82f6; color: white; padding: 0 6px; border-radius: 4px 1px 1px 4px; font-weight: 950; font-size: 0.6rem; display: flex; align-items: center; }
                .plate-box-premium .p-num { padding: 0 8px; color: white; font-family: 'Monaco', monospace; font-size: 0.9rem; font-weight: 950; }
                .na-tag { font-size: 0.65rem; font-weight: 950; color: #cbd5e1; letter-spacing: 1px; }

                .val-cell-premium { font-size: 1.15rem; font-weight: 950; }
                .val-cell-premium.success { color: #10b981; }
                .val-cell-premium.pending { color: #f59e0b; }
                .val-cell-premium span { font-size: 0.75rem; color: #94a3b8; margin-left: 2px; }

                .status-pill-tactical { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 100px; font-size: 0.7rem; font-weight: 950; border: 1.5px solid transparent; }
                .status-pill-tactical .s-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
                .status-pill-tactical.success { background: #ecfdf5; color: #10b981; border-color: #10b98120; }
                .status-pill-tactical.warning { background: #fff7ed; color: #f59e0b; border-color: #f59e0b20; }

                .action-cluster { display: flex; justify-content: flex-end; gap: 10px; }
                .tac-btn-sm { width: 44px; height: 44px; border-radius: 14px; border: 1.5px solid #f1f5f9; background: white; color: #64748b; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; }
                .tac-btn-sm:hover { transform: translateY(-3px); border-color: #0f172a; color: #0f172a; }
                .tac-btn-sm.highlight { background: #eff6ff; color: #3b82f6; border-color: #3b82f640; }

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

export default PaymentsList;
