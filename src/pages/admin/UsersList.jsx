import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { logAudit } from '../../services/auditService';
import {
    Users as UsersIcon, UserPlus, Edit2, Shield, CheckCircle, 
    XCircle, Loader2, Search, MoreVertical, Mail, Plus, User,
    ShieldCheck, Activity, UserCog, ChevronRight, Hash, Ban,
    Globe, History, Zap, MessageSquare, Trash2, Key, Fingerprint
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import PageHeader from '../../components/PageHeader';
import SkeletonLoader from '../../components/SkeletonLoader';
import EmptyState from '../../components/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';

const MunicipalUsersList = () => {
    const { profile: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        role: 'tecnico',
        email: '',
        password: '',
        status: 'active'
    });

    if (currentUser?.role !== 'admin_municipal') {
        return (
            <div style={{ padding: '5rem 2rem' }}>
                <EmptyState 
                    icon={<Ban size={64} color="#ef4444" />}
                    title="Acesso Crítico Restrito"
                    description="Apenas Administradores Municipais possuem privilégios para gerir a estrutura da equipa e permissões de segurança."
                    actionText="Retornar ao Comando"
                    onAction={() => window.location.href = '/admin/dashboard'}
                />
            </div>
        );
    }

    useEffect(() => {
        if (currentUser?.municipality_id) {
            fetchUsers();
        }
    }, [currentUser?.municipality_id]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('municipality_id', currentUser.municipality_id)
                .order('full_name');

            if (error) throw error;
            setUsers(data || []);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                full_name: user.full_name || '',
                role: user.role || 'tecnico',
                email: user.email || '',
                password: '',
                status: user.status || 'active'
            });
        } else {
            setEditingUser(null);
            setFormData({
                full_name: '',
                role: 'tecnico',
                email: '',
                password: '',
                status: 'active'
            });
        }
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingUser) {
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        full_name: formData.full_name,
                        role: formData.role,
                        status: formData.status,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', editingUser.id);
                if (error) throw error;
                await logAudit(currentUser.id, currentUser.full_name, 'UPDATE', 'profiles', editingUser.id, formData);
            } else {
                const ephemeralClient = createClient(
                  import.meta.env.VITE_SUPABASE_URL,
                  import.meta.env.VITE_SUPABASE_ANON_KEY,
                  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
                );

                const { data: signUpData, error: authError } = await ephemeralClient.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: { data: { full_name: formData.full_name, role: formData.role, municipality_id: currentUser.municipality_id } }
                });

                if (authError) throw authError;
                const userId = signUpData?.user?.id;
                await supabase.from('profiles').upsert({
                    id: userId,
                    full_name: formData.full_name,
                    email: formData.email,
                    role: formData.role,
                    municipality_id: currentUser.municipality_id,
                    status: 'active'
                });
                await logAudit(currentUser.id, currentUser.full_name, 'CREATE', 'profiles', userId, formData);
            }
            fetchUsers();
            setShowModal(false);
        } catch (err) {
            alert('Erro ao guardar: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleStatus = async (user) => {
        try {
            const newStatus = user.status === 'active' ? 'inactive' : 'active';
            const { error } = await supabase
                .from('profiles')
                .update({ status: newStatus })
                .eq('id', user.id);
            if (error) throw error;
            await logAudit(currentUser.id, currentUser.full_name, 'UPDATE_STATUS', 'profiles', user.id, { status: newStatus });
            fetchUsers();
        } catch (err) {
            console.error('Error toggling status:', err);
        }
    };

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleLabel = (role) => {
        const labels = {
            admin_municipal: 'Administrador Principal',
            tecnico: 'Gestor Operacional',
            fiscal: 'Agente de Fiscalização',
            financeiro: 'Tesoureiro Geral'
        };
        return labels[role] || role;
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
                title="Centro de Comando de Equipa"
                subtitle="Gestão estratégica de quadros, permissões de sistema e monitorização de acessos institucionais."
                breadcrumbs={[
                    { label: 'Painel', path: '/admin/dashboard' },
                    { label: 'Definições', path: '/admin/settings' },
                    { label: 'Equipa e Acessos' }
                ]}
                actions={
                    <button onClick={() => handleOpenModal()} className="tac-action-btn primary">
                        <UserPlus size={22} /> NOVO COLABORADOR
                    </button>
                }
            />

            {/* Tactical Briefing Bar */}
            <div className="tactical-status-bar security">
                <StatusItem icon={<Fingerprint size={18} />} label="VETOR DE SEGURANÇA" value="ACTIVO" color="#3b82f6" />
                <div className="v-divider"></div>
                <StatusItem icon={<ShieldCheck size={18} />} label="ADMINS" value={users.filter(u => u.role === 'admin_municipal').length} color="#10b981" />
                <div className="v-divider"></div>
                <StatusItem icon={<Activity size={18} />} label="CONTAS ATUALIZADAS" value={users.length} color="#8b5cf6" />
                <div className="b-search">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Pesquisar por Nome, E-mail ou Função..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="kpi-row">
                <KPICard icon={<UsersIcon size={26} />} label="EQUIPA TOTAL" value={users.length} color="#3b82f6" subText="Membros Registados" />
                <KPICard icon={<ShieldCheck size={26} />} label="PRIVILÉGIOS ALTOS" value={users.filter(u => u.role === 'admin_municipal').length} color="#0f172a" subText="Direito de Escrita" />
                <KPICard icon={<Activity size={26} />} label="DISPONIBILIDADE" value={`${((users.filter(u => u.status === 'active').length / (users.length || 1)) * 100).toFixed(0)}%`} color="#10b981" subText="Contas em Operação" />
                <KPICard icon={<UserCog size={26} />} label="ESTADO SISTEMA" value="Seguro" color="#0369a1" subText={new Date().toLocaleTimeString()} />
            </div>

            <div className="inventory-card">
                <div className="inventory-header">
                    <div className="view-mode-label">REGISTO CENTRAL DE UTILIZADORES E PERMISSÕES</div>
                    <div className="filter-badge">
                        <Key size={14} /> ENCRIPTADO & AUDITADO
                    </div>
                </div>

                <div className="inventory-content">
                    {loading ? (
                        <div className="p-12"><SkeletonLoader type="table" rows={8} /></div>
                    ) : filteredUsers.length === 0 ? (
                        <EmptyState 
                            icon={<UsersIcon size={64} color="#f1f5f9" />}
                            title="Base de Dados Vazia"
                            description="Nenhum colaborador localizado sob as actuais credenciais de busca."
                            onAction={() => setSearchTerm('')}
                            actionText="Limpar Filtros"
                        />
                    ) : (
                        <div className="table-wrapper">
                            <table className="tac-table">
                                <thead>
                                    <tr>
                                        <th>IDENTIDADE OPERACIONAL</th>
                                        <th>CARGO & RESPONSABILIDADE</th>
                                        <th>ESTADO DE ACESSO</th>
                                        <th className="text-right">ÚLTIMO ACESSO</th>
                                        <th className="text-right">GESTÃO</th>
                                    </tr>
                                </thead>
                                <motion.tbody variants={containerVariants} initial="hidden" animate="show">
                                    {filteredUsers.map((u) => (
                                        <motion.tr key={u.id} variants={itemVariants} className="tac-row">
                                            <td>
                                                <div className="user-profile-cell">
                                                    <div className="u-avatar">
                                                        {u.full_name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="u-info">
                                                        <div className="u-name">{u.full_name}</div>
                                                        <div className="u-email"><Mail size={12} /> {u.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="role-cell-premium">
                                                    <div className={`r-pill ${u.role}`}>
                                                        {u.role === 'admin_municipal' ? <Shield size={12} /> : <User size={12} />}
                                                        {getRoleLabel(u.role)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className={`status-pill-tactical ${u.status === 'active' ? 'success' : 'danger'}`}>
                                                    <div className="s-dot"></div>
                                                    {u.status === 'active' ? 'ACTIVO' : 'BLOQUEADO'}
                                                </div>
                                            </td>
                                            <td className="text-right">
                                                <div className="access-cell">
                                                    <div className="a-date">{u.updated_at ? new Date(u.updated_at).toLocaleDateString() : 'N/A'}</div>
                                                    <div className="a-time">{u.updated_at ? new Date(u.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</div>
                                                </div>
                                            </td>
                                            <td className="text-right">
                                                <div className="action-cluster" onClick={e => e.stopPropagation()}>
                                                    <button onClick={() => handleOpenModal(u)} className="tac-btn-sm" title="Editar"><Edit2 size={18} /></button>
                                                    {u.id !== currentUser.id && (
                                                       <button 
                                                           className={`tac-btn-sm ${u.status === 'active' ? 'danger' : 'success'}`}
                                                           onClick={() => toggleStatus(u)}
                                                           title={u.status === 'active' ? 'Desactivar' : 'Activar'}
                                                       >
                                                           {u.status === 'active' ? <XCircle size={18} /> : <CheckCircle size={18} />}
                                                       </button>
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

            <AnimatePresence>
                {showModal && (
                    <div className="modal-overlay">
                        <motion.form 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onSubmit={handleSave} 
                            className="premium-modal"
                        >
                            <button type="button" onClick={() => setShowModal(false)} className="close-btn"><X size={20} /></button>
                            
                            <div className="modal-header">
                                <div className="m-icon security"><ShieldCheck size={28} /></div>
                                <h3>{editingUser ? 'AJUSTAR PRIVILÉGIOS' : 'INTEGRAR COLABORADOR'}</h3>
                                <p>Configuração de acesso e responsabilidades operacionais.</p>
                            </div>

                            <div className="modal-sections">
                                <div className="form-grid-tactical">
                                    <div className="f-item full">
                                        <label>NOME COMPLETO INSTITUCIONAL</label>
                                        <input type="text" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required />
                                    </div>
                                    {!editingUser && (
                                        <>
                                            <div className="f-item">
                                                <label>E-MAIL CORPORATIVO</label>
                                                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required placeholder="exemplo@motogest.mz" />
                                            </div>
                                            <div className="f-item">
                                                <label>SENHA TEMPORÁRIA</label>
                                                <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required placeholder="••••••••" />
                                            </div>
                                        </>
                                    )}
                                    <div className="f-item full">
                                        <label>NÍVEL DE ACESSO AO SISTEMA</label>
                                        <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                                            <option value="tecnico">GESTÃO OPERACIONAL - CADASTROS E CONTROLO</option>
                                            <option value="fiscal">FISCALIZAÇÃO - CAMPO E ALERTAS OPERACIONAIS</option>
                                            <option value="financeiro">TESOURARIA - ARRECADAÇÃO E CAIXA</option>
                                            <option value="admin_municipal">ADMINISTRAÇÃO MUNICIPAL - CONTROLO E EQUIPA</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-actions full">
                                <button type="button" className="m-btn secondary" onClick={() => setShowModal(false)}>DESCARTAR</button>
                                <button type="submit" className="m-btn primary" disabled={isSaving}>
                                    {isSaving ? <Loader2 className="spin" size={24} /> : (editingUser ? 'CONSOLIDAR PERFIL' : 'AUTORIZAR ACESSO')}
                                </button>
                            </div>
                        </motion.form>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .tac-action-btn { height: 50px; padding: 0 25px; border-radius: 14px; font-weight: 950; font-size: 0.8rem; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: 0.3s; border: none; }
                .tac-action-btn.primary { background: #0f172a; color: white; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.4); }
                .tac-action-btn:hover { transform: translateY(-3px); }

                .tactical-status-bar { display: flex; align-items: center; gap: 2.5rem; background: #0f172a; padding: 1.25rem 2.5rem; border-radius: 20px; color: white; margin-bottom: 3rem; }
                .tactical-status-bar.security { background: #0f172a; border-left: 8px solid #3b82f6; box-shadow: 0 10px 30px -5px rgba(15, 23, 42, 0.3); }
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

                .user-profile-cell { display: flex; align-items: center; gap: 15px; }
                .u-avatar { width: 44px; height: 44px; border-radius: 14px; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; font-weight: 950; font-size: 1.1rem; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
                .u-info .u-name { font-size: 1rem; font-weight: 950; color: #0f172a; }
                .u-info .u-email { font-size: 0.75rem; color: #94a3b8; font-weight: 700; display: flex; align-items: center; gap: 5px; margin-top: 2px; }

                .role-cell-premium .r-pill { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 8px; font-weight: 900; font-size: 0.75rem; background: #f1f5f9; color: #475569; }
                .role-cell-premium .r-pill.admin_municipal { background: #eff6ff; color: #2563eb; }

                .status-pill-tactical { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 100px; font-size: 0.7rem; font-weight: 950; border: 1.5px solid transparent; }
                .status-pill-tactical .s-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
                .status-pill-tactical.success { background: #ecfdf5; color: #10b981; border-color: #10b98120; }
                .status-pill-tactical.danger { background: #fef2f2; color: #ef4444; border-color: #ef444420; }

                .access-cell .a-date { font-size: 0.9rem; font-weight: 900; color: #334155; }
                .access-cell .a-time { font-size: 0.75rem; font-weight: 800; color: #94a3b8; margin-top: 2px; }

                .action-cluster { display: flex; justify-content: flex-end; gap: 10px; }
                .tac-btn-sm { width: 44px; height: 44px; border-radius: 14px; border: 1.5px solid #f1f5f9; background: white; color: #64748b; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; }
                .tac-btn-sm:hover { transform: translateY(-3px); border-color: #0f172a; color: #0f172a; }
                .tac-btn-sm.danger:hover { border-color: #ef4444; color: #ef4444; background: #fef2f2; }
                .tac-btn-sm.success:hover { border-color: #10b981; color: #10b981; background: #ecfdf5; }

                .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 2rem; }
                .premium-modal { background: white; width: 100%; maxWidth: 650px; padding: 3.5rem; border-radius: 40px; position: relative; box-shadow: 0 40px 100px -20px rgba(0,0,0,0.3); }
                .close-btn { position: absolute; top: 2rem; right: 2rem; width: 44px; height: 44px; border-radius: 50%; background: #f8fafc; border: none; color: #94a3b8; cursor: pointer; display: flex; align-items: center; justify-content: center; }
                
                .m-icon { width: 64px; height: 64px; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto; color: white; background: #0f172a; }
                .m-icon.security { background: #3b82f6; }
                .modal-header { text-align: center; margin-bottom: 3rem; }
                .modal-header h3 { font-size: 1.75rem; font-weight: 950; color: #0f172a; letter-spacing: -1px; margin: 0; }

                .form-grid-tactical { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
                .f-item.full { grid-column: span 2; }
                .f-item label { font-size: 0.65rem; font-weight: 950; color: #94a3b8; letter-spacing: 1px; display: block; margin-bottom: 8px; }
                .f-item input, .f-item select, .f-item textarea { width: 100%; padding: 18px; border-radius: 18px; border: 2.5px solid #f1f5f9; background: #f8fafc; font-weight: 850; outline: none; transition: 0.3s; }
                .f-item input:focus, .f-item select:focus, .f-item textarea:focus { border-color: #0f172a; background: white; }

                .modal-actions { display: grid; grid-template-columns: 1fr 1.5fr; gap: 1.5rem; margin-top: 3.5rem; }
                .m-btn { height: 64px; border-radius: 20px; border: none; font-weight: 950; cursor: pointer; transition: 0.3s; }
                .m-btn.secondary { background: #f1f5f9; color: #94a3b8; }
                .m-btn.primary { background: #0f172a; color: white; box-shadow: 0 10px 20px rgba(15, 23, 42, 0.2); }
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

export default MunicipalUsersList;
