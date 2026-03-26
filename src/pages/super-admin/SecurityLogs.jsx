import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
    Shield, Search, Calendar, User, Clock, Loader2, 
    ChevronRight, Activity, Terminal, AlertTriangle,
    Eye, Info
} from 'lucide-react';
import { Link } from 'react-router-dom';

const SecurityLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('super_admin_logs')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLogs(data || []);
        } catch (err) {
            console.error('Error fetching security logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const getActionBadge = (action) => {
        const styles = {
            'CREATE_MUNICIPALITY': { bg: '#ecfdf5', border: '#bbf7d0', color: '#059669', icon: <Plus size={12} /> },
            'DEACTIVATE_MUNICIPALITY': { bg: '#fef2f2', border: '#fee2e2', color: '#dc2626', icon: <ShieldOff size={12} /> },
            'SUSPEND_MUNICIPALITY': { bg: '#fef2f2', border: '#fee2e2', color: '#dc2626', icon: <ShieldOff size={12} /> },
            'ACTIVATE_MUNICIPALITY': { bg: '#ecfdf5', border: '#bbf7d0', color: '#059669', icon: <ShieldCheck size={12} /> },
            'UPDATE_USER': { bg: '#eff6ff', border: '#bfdbfe', color: '#2563eb', icon: <User size={12} /> },
            'RESET_PASSWORD': { bg: '#fff7ed', border: '#fed7aa', color: '#ea580c', icon: <Key size={12} /> },
            'SYSTEM_CONFIG': { bg: '#f8fafc', border: '#e2e8f0', color: '#64748b', icon: <Settings size={12} /> }
        };
        const style = styles[action] || { bg: '#f1f5f9', border: '#e2e8f0', color: '#475569', icon: <Activity size={12} /> };
        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '4px 10px', borderRadius: '30px', fontSize: '0.65rem', fontWeight: '800', border: `1px solid ${style.border}`,
                backgroundColor: style.bg, color: style.color, textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>
                {action.replace(/_/g, ' ')}
            </span>
        );
    };

    const filteredLogs = logs.filter(log =>
        log.admin_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.target_type?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.85rem', fontWeight: '600' }}>
                        <Link to="/super-admin/dashboard" style={{ color: '#64748b' }}>Dashboard</Link>
                        <ChevronRight size={14} color="#94a3b8" />
                        <span style={{ color: '#0f172a' }}>Segurança</span>
                    </div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
                        Segurança & Auditoria
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: '500', marginTop: '4px' }}>
                        Rastreio completo de todas as acções críticas realizadas no sistema.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Estado de Auditoria</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: '800', fontSize: '0.9rem' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                            ACTIVO E PROTEGIDO
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            style={{ 
                                width: '100%', padding: '12px 14px 12px 42px', border: '1.5px solid #f1f5f9', 
                                borderRadius: '12px', outline: 'none', fontSize: '0.9rem', fontWeight: '500',
                                backgroundColor: '#f8fafc', transition: 'all 0.2s'
                            }}
                            placeholder="Pesquisar por admin, acção ou alvo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={e => { e.target.style.borderColor = '#0f172a'; e.target.style.backgroundColor = 'white' }}
                            onBlur={e => { e.target.style.borderColor = '#f1f5f9'; e.target.style.backgroundColor = '#f8fafc' }}
                        />
                    </div>
                    <button style={{ 
                        padding: '10px 18px', borderRadius: '10px', backgroundColor: 'white', border: '1.5px solid #f1f5f9',
                        color: '#64748b', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                        <Calendar size={16} /> Últimos 30 dias
                    </button>
                </div>

                {loading ? (
                    <div style={{ padding: '5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <Loader2 className="spin" size={32} color="#0f172a" />
                        <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>Carregando logs de segurança...</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                            <thead>
                                <tr style={{ textAlign: 'left' }}>
                                    <th style={{ padding: '1.25rem 1.5rem', color: '#64748b', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f1f5f9' }}>Registo Temporal</th>
                                    <th style={{ padding: '1.25rem 1.5rem', color: '#64748b', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f1f5f9' }}>Administrador</th>
                                    <th style={{ padding: '1.25rem 1.5rem', color: '#64748b', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f1f5f9' }}>Acção Realizada</th>
                                    <th style={{ padding: '1.25rem 1.5rem', color: '#64748b', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f1f5f9' }}>Entidade Alvo</th>
                                    <th style={{ padding: '1.25rem 1.5rem', color: '#64748b', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f1f5f9' }}>Metadados / Detalhes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500' }}>
                                            Nenhum registo de segurança encontrado.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map((log) => (
                                        <tr key={log.id} className="table-row-hover">
                                            <td style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f8fafc' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: '700', fontSize: '0.85rem' }}>
                                                    <Clock size={14} color="#94a3b8" />
                                                    {new Date(log.created_at).toLocaleString('pt-PT')}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f8fafc' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <User size={12} color="#3b82f6" />
                                                    </div>
                                                    <span style={{ fontWeight: '800', color: '#1e293b', fontSize: '0.9rem' }}>{log.admin_name}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f8fafc' }}>
                                                {getActionBadge(log.action)}
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f8fafc' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Terminal size={14} color="#94a3b8" />
                                                    <span style={{ color: '#64748b', fontWeight: '700', fontSize: '0.8rem', textTransform: 'capitalize' }}>
                                                        {log.target_type}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f8fafc' }}>
                                                <div style={{ 
                                                    fontSize: '0.75rem', color: '#64748b', maxWidth: '300px', overflow: 'hidden', 
                                                    textEllipsis: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace',
                                                    backgroundColor: '#f8fafc', padding: '6px 10px', borderRadius: '6px', border: '1px solid #f1f5f9'
                                                }} title={JSON.stringify(log.details)}>
                                                    {JSON.stringify(log.details)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <style>{`
                .table-row-hover:hover { background-color: #f8fafc; }
                @keyframes spin { from {transform: rotate(0deg)} to {transform: rotate(360deg)}} .spin { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
};

export default SecurityLogs;
