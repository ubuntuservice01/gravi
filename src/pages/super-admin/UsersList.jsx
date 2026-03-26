import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
    Plus, Search, User, Shield, Mail, Building2, 
    ShieldOff, ShieldCheck, Key, Loader2, Edit2, X,
    ChevronRight, Filter, MoreVertical, UserPlus
} from 'lucide-react';
import { Link } from 'react-router-dom';

const GlobalUsersList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    const [municipalities, setMunicipalities] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        role: 'tecnico',
        municipality_id: '',
        status: 'active'
    });

    useEffect(() => {
        fetchUsers();
        fetchMunicipalities();
    }, []);

    const fetchMunicipalities = async () => {
        const { data } = await supabase.from('municipalities').select('id, name').eq('status', 'active');
        setMunicipalities(data || []);
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    *,
                    municipalities (name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (err) {
            console.error('Error fetching global users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (user = null) => {
        if (user) {
            setSelectedUser(user);
            setFormData({
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                municipality_id: user.municipality_id || '',
                status: user.status
            });
        } else {
            setSelectedUser(null);
            setFormData({
                full_name: '',
                email: '',
                role: 'tecnico',
                municipality_id: '',
                status: 'active'
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (selectedUser) {
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        full_name: formData.full_name,
                        role: formData.role,
                        municipality_id: formData.role === 'super_admin' ? null : formData.municipality_id,
                        status: formData.status
                    })
                    .eq('id', selectedUser.id);
                if (error) throw error;
            } else {
                alert('Para novos utilizadores, use o convite de email no Supabase Dash ou implemente a função Edge.');
                return;
            }
            setIsModalOpen(false);
            fetchUsers();
            // Silent success or a subtle toast would be better than alert
        } catch (err) {
            alert('Erro: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (user) => {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        if (!window.confirm(`Deseja alterar o estado de ${user.full_name} para ${newStatus.toUpperCase()}?`)) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ status: newStatus })
                .eq('id', user.id);
            if (error) throw error;
            fetchUsers();
        } catch (err) {
            alert('Erro ao alterar estado: ' + err.message);
        }
    };

    const getRoleBadge = (role) => {
        const styles = {
            'super_admin': { bg: '#f5f3ff', border: '#ddd6fe', color: '#7c3aed', label: 'SUPER ADMIN' },
            'admin_municipal': { bg: '#ecfdf5', border: '#bbf7d0', color: '#059669', label: 'ADMIN MUNICIPAL' },
            'tecnico': { bg: '#eff6ff', border: '#bfdbfe', color: '#2563eb', label: 'TÉCNICO' },
            'fiscal': { bg: '#fff7ed', border: '#fed7aa', color: '#ea580c', label: 'FISCAL' },
            'financeiro': { bg: '#fdf4ff', border: '#f5d0fe', color: '#c026d3', label: 'FINANCEIRO' }
        };
        const style = styles[role] || { bg: '#f8fafc', border: '#e2e8f0', color: '#64748b', label: role?.toUpperCase() };
        return (
            <span style={{
                padding: '4px 10px', borderRadius: '30px', fontSize: '0.65rem', fontWeight: '800', border: `1px solid ${style.border}`,
                backgroundColor: style.bg, color: style.color, textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>
                {style.label}
            </span>
        );
    };

    const handleResetPassword = async (user) => {
        if (!window.confirm(`Deseja enviar um link de redefinição de senha para ${user.full_name}?`)) return;
        
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(user.email);
            if (error) throw error;
            alert('Email de redefinição enviado com sucesso!');
        } catch (err) {
            alert('Erro: ' + err.message);
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             u.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.85rem', fontWeight: '600' }}>
                        <Link to="/super-admin/dashboard" style={{ color: '#64748b' }}>Dashboard</Link>
                        <ChevronRight size={14} color="#94a3b8" />
                        <span style={{ color: '#0f172a' }}>Utilizadores</span>
                    </div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
                        Utilizadores Globais
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: '500', marginTop: '4px' }}>
                        Administração de todos os perfis e acessos na plataforma.
                    </p>
                </div>
            </div>

            <div className="card">
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            style={{ 
                                width: '100%', padding: '12px 14px 12px 42px', border: '1.5px solid #f1f5f9', 
                                borderRadius: '12px', outline: 'none', fontSize: '0.9rem', fontWeight: '500',
                                backgroundColor: '#f8fafc', transition: 'all 0.2s'
                            }}
                            placeholder="Pesquisar por nome ou email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={e => { e.target.style.borderColor = '#0f172a'; e.target.style.backgroundColor = 'white' }}
                            onBlur={e => { e.target.style.borderColor = '#f1f5f9'; e.target.style.backgroundColor = '#f8fafc' }}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f8fafc', padding: '6px 12px', borderRadius: '12px', border: '1.5px solid #f1f5f9' }}>
                        <Filter size={16} color="#94a3b8" />
                        <select 
                            style={{ border: 'none', background: 'none', outline: 'none', fontWeight: '700', color: '#475569', fontSize: '0.85rem', cursor: 'pointer' }}
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            <option value="all">Todos os Perfis</option>
                            <option value="super_admin">Super Admin</option>
                            <option value="admin_municipal">Admin Municipal</option>
                            <option value="tecnico">Técnico</option>
                            <option value="fiscal">Fiscal</option>
                            <option value="financeiro">Financeiro</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <Loader2 className="spin" size={32} color="#0f172a" />
                        <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>Carregando utilizadores...</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                            <thead>
                                <tr style={{ textAlign: 'left' }}>
                                    <th style={{ padding: '1.25rem 1.5rem', color: '#64748b', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f1f5f9' }}>Utilizador / Email</th>
                                    <th style={{ padding: '1.25rem 1.5rem', color: '#64748b', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f1f5f9' }}>Perfil atribuído</th>
                                    <th style={{ padding: '1.25rem 1.5rem', color: '#64748b', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f1f5f9' }}>Município</th>
                                    <th style={{ padding: '1.25rem 1.5rem', color: '#64748b', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f1f5f9' }}>Estado</th>
                                    <th style={{ padding: '1.25rem 1.5rem', color: '#64748b', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>Acções</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500' }}>
                                            Nenhum utilizador encontrado.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((u) => (
                                        <tr key={u.id} className="table-row-hover">
                                            <td style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f8fafc' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ 
                                                        width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f1f5f9', 
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', fontWeight: '800', fontSize: '0.8rem'
                                                    }}>
                                                        {u.full_name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.95rem' }}>{u.full_name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>{u.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f8fafc' }}>
                                                {getRoleBadge(u.role)}
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f8fafc' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}>
                                                    {u.role === 'super_admin' ? (
                                                        <span style={{ color: '#7c3aed', fontSize: '0.7rem', fontWeight: '900', letterSpacing: '1px' }}>INSTITUCIONAL</span>
                                                    ) : (
                                                        <>
                                                            <Building2 size={14} color="#94a3b8" />
                                                            {u.municipalities?.name || '---'}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f8fafc' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: u.status === 'active' ? '#10b981' : '#cbd5e1' }}></div>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: u.status === 'active' ? '#059669' : '#64748b' }}>
                                                        {u.status === 'active' ? 'ACTIVO' : 'INACTIVO'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f8fafc', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                                    <button onClick={() => handleResetPassword(u)} className="btn-icon-premium" title="Reset Senha"><Key size={18} /></button>
                                                    <button onClick={() => handleOpenModal(u)} className="btn-icon-premium" title="Editar"><Edit2 size={18} /></button>
                                                    <button onClick={() => handleToggleStatus(u)} className="btn-icon-premium action-danger" title={u.status === 'active' ? 'Desactivar' : 'Activar'}>
                                                        {u.status === 'active' ? <ShieldOff size={18} /> : <ShieldCheck size={18} />}
                                                    </button>
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

            {/* Premium Modal */}
            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', animation: 'slideUp 0.3s ease-out' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
                                    {selectedUser ? 'Editar Perfil' : 'Novo Utilizador'}
                                </h2>
                                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0 0', fontWeight: '500' }}>
                                    Ajuste as permissões e dados do utilizador.
                                </p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} style={{ border: 'none', background: '#f8fafc', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>NOME COMPLETO</label>
                                <input
                                    type="text"
                                    style={{ 
                                        width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #f1f5f9', outline: 'none',
                                        fontSize: '0.9rem', fontWeight: '600', color: '#0f172a', backgroundColor: '#f8fafc'
                                    }}
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>PERFIL / ROLE</label>
                                    <select
                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #f1f5f9', backgroundColor: '#f8fafc', outline: 'none', fontWeight: '600' }}
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="super_admin">Super Admin</option>
                                        <option value="admin_municipal">Admin Municipal</option>
                                        <option value="tecnico">Técnico</option>
                                        <option value="fiscal">Fiscal</option>
                                        <option value="financeiro">Financeiro</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>ESTADO</label>
                                    <select
                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #f1f5f9', backgroundColor: '#f8fafc', outline: 'none', fontWeight: '600' }}
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="active">Activo</option>
                                        <option value="inactive">Inactivo</option>
                                    </select>
                                </div>
                            </div>

                            {formData.role !== 'super_admin' && (
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>MUNICÍPIO ASSOCIADO</label>
                                    <select
                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #f1f5f9', backgroundColor: '#f8fafc', outline: 'none', fontWeight: '600' }}
                                        value={formData.municipality_id}
                                        onChange={(e) => setFormData({ ...formData, municipality_id: e.target.value })}
                                        required={formData.role !== 'super_admin'}
                                    >
                                        <option value="">Seleccione um Município</option>
                                        {municipalities.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '12px', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', fontWeight: '800', fontSize: '0.9rem', color: '#64748b', backgroundColor: '#f1f5f9' }}>
                                    Cancelar
                                </button>
                                <button type="submit" disabled={saving} style={{ 
                                    flex: 1, padding: '14px', borderRadius: '12px', fontWeight: '800', fontSize: '0.9rem', 
                                    color: 'white', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)'
                                }}>
                                    {saving ? <Loader2 className="spin" size={20} /> : 'Guardar Alterações'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <style>{`
                .table-row-hover:hover { background-color: #f8fafc; }
                .btn-icon-premium {
                    width: 38px; height: 38px; border-radius: 10px; display: flex; alignItems: center; justifyContent: center;
                    border: 1.5px solid #f1f5f9; background-color: white; color: #64748b; cursor: pointer; transition: all 0.2s;
                }
                .btn-icon-premium:hover { border-color: #0f172a; color: #0f172a; background-color: #f8fafc; }
                .btn-icon-premium.action-danger:hover { border-color: #fee2e2; color: #dc2626; background-color: #fef2f2; }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { from {transform: rotate(0deg)} to {transform: rotate(360deg)}} .spin { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
};

export default GlobalUsersList;
