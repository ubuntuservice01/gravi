import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { logAudit } from '../../services/auditService';
import { 
    Check, X, Eye, User, Bike, CheckCircle2, 
    AlertTriangle, Shield, Clock, ArrowRight,
    MessageSquare, History, CheckCircle, ShieldCheck,
    ChevronRight, Hash, Database, Zap, Activity,
    TrendingUp, Globe, Box, MoreVertical, Trash2, Archive
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import SkeletonLoader from '../../components/SkeletonLoader';
import EmptyState from '../../components/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';

const Approvals = () => {
    const { profile } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);

    useEffect(() => {
        if (profile?.municipality_id) {
            fetchRequests();
        }
    }, [profile?.municipality_id]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('edit_requests')
                .select('*')
                .eq('municipality_id', profile?.municipality_id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRequests(data || []);
        } catch (err) {
            console.error('Error fetching requests:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApproval = async (request, approved) => {
        const rejectionReason = approved ? null : prompt('Motivo da rejeição:');
        if (!approved && rejectionReason === null) return;

        setLoading(true);
        try {
            if (approved) {
                const { error: applyError } = await supabase
                    .from(request.target_table)
                    .update(request.requested_data)
                    .eq('id', request.target_id);

                if (applyError) throw applyError;

                await logAudit(
                    profile?.id,
                    profile?.full_name,
                    'APPROVAL',
                    request.target_table,
                    request.target_id,
                    request.requested_data,
                    request.original_data
                );
            }

            const { error: updateError } = await supabase
                .from('edit_requests')
                .update({
                    status: approved ? 'Aprovado' : 'Rejeitado',
                    approver_id: profile?.id,
                    approver_name: profile?.full_name,
                    rejection_reason: rejectionReason,
                    updated_at: new Date().toISOString()
                })
                .eq('id', request.id);

            if (updateError) throw updateError;

            await supabase.from('notifications').insert([{
                user_id: request.requester_id,
                title: approved ? 'Pedido Aprovado' : 'Pedido Rejeitado',
                message: `O seu pedido de alteração para o veículo foi ${approved ? 'aprovado e aplicado' : 'rejeitado: ' + rejectionReason}.`,
                type: approved ? 'success' : 'danger',
                municipality_id: profile?.municipality_id
            }]);

            await fetchRequests();
            setSelectedRequest(null);
        } catch (err) {
            console.error('Error processing approval:', err);
            alert('Erro: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const getDiffFields = (original, requested) => {
        const diffs = [];
        for (const key in requested) {
            if (requested[key] !== original[key]) {
                diffs.push({
                    field: key,
                    old: original[key],
                    new: requested[key]
                });
            }
        }
        return diffs;
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
                title="Centro de Integridade de Dados"
                subtitle="Revisão técnica, auditoria e validação de alterações críticas na base de dados municipal."
                breadcrumbs={[
                    { label: 'Painel', path: '/admin/dashboard' },
                    { label: 'Segurança', path: '/admin/users' },
                    { label: 'Aprovações Pendentes' }
                ]}
                actions={
                    <button onClick={fetchRequests} className="tac-action-btn secondary">
                        <Zap size={18} className={loading ? 'spin' : ''} /> ACTUALIZAR FILA
                    </button>
                }
            />

            {/* Tactical Briefing Bar */}
            <div className="tactical-status-bar security">
                <StatusItem icon={<Shield size={18} />} label="VETOR DE AUDITORIA" value="ACTIVO" color="#3b82f6" />
                <div className="v-divider"></div>
                <StatusItem icon={<Clock size={18} />} label="EM REVISÃO" value={requests.filter(r => r.status === 'Pendente').length} color="#f59e0b" />
                <div className="v-divider"></div>
                <StatusItem icon={<Database size={18} />} label="SINCRO" value="OTIMIZADA" color="#10b981" />
                <div className="b-search-placeholder">
                    <Activity size={18} /> GESTÃO DE CONFORMIDADE OPERACIONAL
                </div>
            </div>

            <div className="kpi-row">
                <KPICard icon={<Clock size={26} />} label="FILA CRÍTICA" value={requests.filter(r => r.status === 'Pendente').length} color="#f59e0b" subText="Requerendo Validação" />
                <KPICard icon={<ShieldCheck size={26} />} label="VALOR AUDITADO" value={requests.length} color="#3b82f6" subText="Histórico de Revisões" />
                <KPICard icon={<CheckCircle size={26} />} label="APROVADOS" value={requests.filter(r => r.status === 'Aprovado').length} color="#10b981" subText="Modificações Efectivadas" />
                <KPICard icon={<AlertTriangle size={26} />} label="BLOQUEADOS" value={requests.filter(r => r.status === 'Rejeitado').length} color="#ef4444" subText="Tentativas Descartadas" />
            </div>

            <div className="inventory-card">
                <div className="inventory-header">
                    <div className="view-mode-label">LOG DE SOLICITAÇÕES DE ALTERAÇÃO DE DADOS</div>
                    <div className="filter-badge">
                        <History size={14} /> STATUS: FILTRADO POR RECENTES
                    </div>
                </div>

                <div className="inventory-content">
                    {loading && requests.length === 0 ? (
                        <div className="p-12"><SkeletonLoader type="table" rows={8} /></div>
                    ) : requests.length === 0 ? (
                        <EmptyState 
                            icon={<ShieldCheck size={64} color="#f1f5f9" />}
                            title="Integridade Garantida"
                            description="Nenhuma solicitação de alteração pendente de revisão técnica no momento."
                            onAction={() => fetchRequests()}
                            actionText="Actualizar Status"
                        />
                    ) : (
                        <div className="table-wrapper">
                            <table className="tac-table">
                                <thead>
                                    <tr>
                                        <th>ORIGEM DO PEDIDO</th>
                                        <th>ENTIDADE ALVO</th>
                                        <th>DETALHE OPERACIONAL</th>
                                        <th>ESTADO ACTUAL</th>
                                        <th className="text-right">ANÁLISE</th>
                                    </tr>
                                </thead>
                                <motion.tbody variants={containerVariants} initial="hidden" animate="show">
                                    {requests.map((req) => (
                                        <motion.tr key={req.id} variants={itemVariants} className="tac-row" onClick={() => setSelectedRequest(req)}>
                                            <td>
                                                <div className="requester-cell">
                                                    <div className="req-name">{req.requester_name}</div>
                                                    <div className="req-date"><Clock size={12} /> {new Date(req.created_at).toLocaleDateString()}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="target-cell-premium">
                                                    <div className="t-badge">{req.target_table}</div>
                                                    <div className="t-ref">REF: {req.target_id.split('-')[0].toUpperCase()}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="reason-cell">
                                                    <div className="r-text">{req.reason || 'Pedido de Sincronização de Dados'}</div>
                                                    <div className="r-count"><Database size={12} /> {Object.keys(req.requested_data).length} Campos</div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className={`status-pill-tactical ${req.status === 'Aprovado' ? 'success' : req.status === 'Rejeitado' ? 'danger' : 'warning'}`}>
                                                    <div className="s-dot"></div>
                                                    {req.status.toUpperCase()}
                                                </div>
                                            </td>
                                            <td className="text-right">
                                                <div className="action-cluster" onClick={e => e.stopPropagation()}>
                                                    <button onClick={() => setSelectedRequest(req)} className="tac-btn-sm highlight" title="Analisar"><Eye size={18} /></button>
                                                    <button onClick={() => setSelectedRequest(req)} className="tac-btn-sm"><ChevronRight size={20} /></button>
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

            <AnimatePresence>
                {selectedRequest && (
                    <div className="modal-overlay">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="premium-modal wide"
                        >
                            <button onClick={() => setSelectedRequest(null)} className="close-btn"><X size={20} /></button>
                            
                            <div className="modal-header">
                                <div className="m-icon security"><ShieldCheck size={28} /></div>
                                <h3>PROTOCOLO DE AUDITORIA</h3>
                                <p>Análise de divergências e validação de integridade para <strong>{selectedRequest.target_table}</strong>.</p>
                            </div>

                            <div className="modal-sections">
                                <div className="audit-brief-premium">
                                    <div className="b-item">
                                        <label>SOLICITANTE</label>
                                        <div className="b-val-box">
                                            <div className="b-avatar">{selectedRequest.requester_name.charAt(0)}</div>
                                            <span>{selectedRequest.requester_name}</span>
                                        </div>
                                    </div>
                                    <div className="b-item">
                                        <label>CARIMBO TEMPORAL</label>
                                        <div className="b-val-box digital">
                                            {new Date(selectedRequest.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="b-item full">
                                        <label>JUSTIFICAÇÃO OPERACIONAL</label>
                                        <div className="b-reason-box">
                                            <MessageSquare size={18} />
                                            <p>{selectedRequest.reason || 'Alteração técnica para fins de conformidade cadastral e atualização de integridade no sistema central.'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="diff-engine">
                                    <div className="diff-header">
                                        <div className="h-col">PARÂMETRO</div>
                                        <div className="h-col">ESTADO ANTERIOR</div>
                                        <div className="h-col highlight">PROPOSTA DE ACTUALIZAÇÃO</div>
                                    </div>
                                    <div className="diff-body">
                                        {getDiffFields(selectedRequest.original_data, selectedRequest.requested_data).map((diff, i) => (
                                            <div key={i} className="diff-row">
                                                <div className="d-field">{diff.field.replace(/_/g, ' ')}</div>
                                                <div className="d-old">{String(diff.old)}</div>
                                                <div className="d-new">
                                                    <ArrowRight size={16} />
                                                    <span>{String(diff.new)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="modal-actions full">
                                {selectedRequest.status === 'Pendente' ? (
                                    <>
                                        <button onClick={() => handleApproval(selectedRequest, false)} className="m-btn secondary danger">REJEITAR SOLICITAÇÃO</button>
                                        <button onClick={() => handleApproval(selectedRequest, true)} className="m-btn primary">EFECTIVAR ALTERAÇÕES</button>
                                    </>
                                ) : (
                                    <div className={`audit-resolution ${selectedRequest.status === 'Aprovado' ? 'success' : 'danger'}`}>
                                        <div className="res-icon">
                                            {selectedRequest.status === 'Aprovado' ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                                        </div>
                                        <div className="res-info">
                                            <div className="res-title">PROTOCOLADO COMO: {selectedRequest.status.toUpperCase()}</div>
                                            <div className="res-sub">Auditado por {selectedRequest.approver_name} em {new Date(selectedRequest.updated_at).toLocaleString()}</div>
                                            {selectedRequest.rejection_reason && <div className="res-reason">Nota: {selectedRequest.rejection_reason}</div>}
                                        </div>
                                    </div>
                                )}
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
                .tactical-status-bar.security { border-left: 8px solid #3b82f6; }
                .b-item { display: flex; align-items: center; gap: 10px; font-size: 0.75rem; font-weight: 800; color: rgba(255,255,255,0.6); }
                .b-item strong { color: white; font-weight: 950; }
                .v-divider { width: 1.5px; height: 15px; background: rgba(255,255,255,0.1); }
                .b-search-placeholder { margin-left: auto; display: flex; align-items: center; gap: 12px; font-size: 0.75rem; font-weight: 950; color: #3b82f6; letter-spacing: 1px; }

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
                .tac-row:hover { background: #f8fafc; cursor: pointer; }

                .requester-cell .req-name { font-size: 1rem; font-weight: 950; color: #0f172a; }
                .requester-cell .req-date { font-size: 0.75rem; color: #94a3b8; font-weight: 800; display: flex; align-items: center; gap: 6px; margin-top: 2px; }

                .target-cell-premium .t-badge { display: inline-flex; padding: 2px 10px; background: #0f172a10; color: #0f172a; border-radius: 100px; font-weight: 950; font-size: 0.65rem; text-transform: uppercase; margin-bottom: 6px; }
                .target-cell-premium .t-ref { font-family: 'Monaco', monospace; font-size: 0.85rem; font-weight: 900; color: #3b82f6; }

                .reason-cell .r-text { font-size: 0.9rem; font-weight: 850; color: #475569; maxWidth: 350px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .reason-cell .r-count { font-size: 0.7rem; font-weight: 950; color: #3b82f6; display: flex; align-items: center; gap: 6px; margin-top: 6px; text-transform: uppercase; }

                .status-pill-tactical { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 100px; font-size: 0.7rem; font-weight: 950; border: 1.5px solid transparent; }
                .status-pill-tactical .s-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
                .status-pill-tactical.success { background: #ecfdf5; color: #10b981; border-color: #10b98120; }
                .status-pill-tactical.warning { background: #fffbeb; color: #f59e0b; border-color: #f59e0b20; }
                .status-pill-tactical.danger { background: #fef2f2; color: #ef4444; border-color: #ef444420; }

                .action-cluster { display: flex; justify-content: flex-end; gap: 10px; }
                .tac-btn-sm { width: 44px; height: 44px; border-radius: 14px; border: 1.5px solid #f1f5f9; background: white; color: #64748b; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; }
                .tac-btn-sm:hover { transform: translateY(-3px); border-color: #0f172a; color: #0f172a; }
                .tac-btn-sm.highlight { background: #eff6ff; color: #3b82f6; border-color: #3b82f640; }

                .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 2rem; }
                .premium-modal { background: white; width: 100%; maxWidth: 850px; padding: 4rem; border-radius: 40px; position: relative; box-shadow: 0 40px 100px -20px rgba(0,0,0,0.3); max-height: 90vh; overflow-y: auto; }
                .close-btn { position: absolute; top: 2rem; right: 2rem; width: 44px; height: 44px; border-radius: 50%; background: #f8fafc; border: none; color: #94a3b8; cursor: pointer; display: flex; align-items: center; justify-content: center; }
                
                .m-icon { width: 64px; height: 64px; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto; color: white; background: #0f172a; }
                .m-icon.security { background: #3b82f6; }
                .modal-header { text-align: center; margin-bottom: 3.5rem; }
                .modal-header h3 { font-size: 1.75rem; font-weight: 950; color: #0f172a; letter-spacing: -1px; margin: 0; }

                .audit-brief-premium { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; background: #f8fafc; padding: 2.5rem; border-radius: 32px; border: 2.5px solid #f1f5f9; margin-bottom: 3rem; }
                .b-item label { font-size: 0.65rem; font-weight: 950; color: #94a3b8; letter-spacing: 1.5px; display: block; margin-bottom: 12px; }
                .b-val-box { display: flex; align-items: center; gap: 12px; font-weight: 950; color: #0f172a; font-size: 1.1rem; }
                .b-val-box.digital { font-family: 'Monaco', monospace; font-size: 1rem; color: #475569; }
                .b-avatar { width: 36px; height: 36px; border-radius: 10px; background: #3b82f6; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; }
                .b-item.full { grid-column: span 2; }
                .b-reason-box { display: flex; gap: 15px; color: #64748b; }
                .b-reason-box p { margin: 0; font-size: 1rem; font-weight: 700; line-height: 1.6; font-style: italic; }

                .diff-engine { border: 2.5px solid #f1f5f9; border-radius: 24px; overflow: hidden; margin-bottom: 3.5rem; }
                .diff-header { display: grid; grid-template-columns: 160px 1fr 1fr; gap: 2rem; padding: 1.25rem 2rem; background: #0f172a; color: #94a3b8; font-size: 0.7rem; font-weight: 950; letter-spacing: 1.5px; }
                .h-col.highlight { color: #3b82f6; }
                .diff-row { display: grid; grid-template-columns: 160px 1fr 1fr; gap: 2rem; padding: 1.5rem 2rem; border-bottom: 2px solid #f8fafc; align-items: center; }
                .diff-row:last-child { border-bottom: none; }
                .d-field { font-size: 0.75rem; font-weight: 950; color: #64748b; text-transform: uppercase; }
                .d-old { color: #ef4444; background: #fef2f2; padding: 8px 12px; border-radius: 10px; font-size: 0.85rem; font-weight: 800; text-decoration: line-through; }
                .d-new { display: flex; align-items: center; gap: 12px; color: #10b981; }
                .d-new span { background: #ecfdf5; padding: 8px 12px; border-radius: 10px; font-size: 0.95rem; font-weight: 950; }

                .modal-actions { display: grid; grid-template-columns: 1fr 1.5fr; gap: 1.5rem; }
                .m-btn { height: 64px; border-radius: 20px; border: none; font-weight: 950; cursor: pointer; transition: 0.3s; font-size: 1.1rem; }
                .m-btn.secondary { background: #f1f5f9; color: #94a3b8; }
                .m-btn.primary { background: #0f172a; color: white; box-shadow: 0 10px 20px rgba(15, 23, 42, 0.2); }
                .m-btn.danger:hover { background: #fef2f2; color: #ef4444; }
                .m-btn:hover { transform: translateY(-3px); }

                .audit-resolution { display: flex; align-items: center; gap: 20px; padding: 2.5rem; border-radius: 32px; width: 100%; border: 3px solid transparent; }
                .audit-resolution.success { background: #ecfdf5; border-color: #10b98120; color: #065f46; }
                .audit-resolution.danger { background: #fef2f2; border-color: #ef444420; color: #991b1b; }
                .res-icon { width: 56px; height: 56px; border-radius: 18px; display: flex; align-items: center; justify-content: center; background: currentColor; color: white; }
                .res-title { font-size: 1.25rem; font-weight: 950; letter-spacing: -0.5px; }
                .res-sub { font-size: 0.9rem; font-weight: 700; opacity: 0.8; margin-top: 4px; }
                .res-reason { margin-top: 15px; padding: 12px; background: white; border-radius: 12px; font-size: 0.9rem; border: 1.5px solid currentColor; }

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

export default Approvals;
