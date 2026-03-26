import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
    Plus, Search, User, Phone, FileText, Loader2, X, Edit2, 
    MapPin, Users, Mail, CreditCard, ChevronRight, Hash, ShieldCheck,
    Globe, History, Zap, Activity, MessageSquare, MoreVertical, Trash2
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import SkeletonLoader from '../../components/SkeletonLoader';
import EmptyState from '../../components/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

const OwnersList = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [owners, setOwners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingOwner, setEditingOwner] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        full_name: '',
        identity_document: '',
        nuit: '',
        phone: '',
        address: ''
    });

    useEffect(() => {
        if (profile?.municipality_id) {
            fetchOwners();
        }
    }, [profile?.municipality_id]);

    const fetchOwners = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('owners')
                .select('*')
                .eq('municipality_id', profile.municipality_id)
                .order('full_name', { ascending: true });

            if (error) throw error;
            setOwners(data || []);
        } catch (err) {
            console.error('Error fetching owners:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                municipality_id: profile.municipality_id
            };

            let result;
            if (editingOwner) {
                result = await supabase
                    .from('owners')
                    .update(payload)
                    .eq('id', editingOwner.id);
            } else {
                result = await supabase
                    .from('owners')
                    .insert([payload]);
            }

            if (result.error) throw result.error;

            fetchOwners();
            setShowModal(false);
            setEditingOwner(null);
            setFormData({ full_name: '', identity_document: '', nuit: '', phone: '', address: '' });
        } catch (err) {
            alert('Erro ao guardar: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (owner) => {
        setEditingOwner(owner);
        setFormData({
            full_name: owner.full_name,
            identity_document: owner.identity_document,
            nuit: owner.nuit || '',
            phone: owner.phone || '',
            address: owner.address || ''
        });
        setShowModal(true);
    };

    const filteredOwners = owners.filter(o =>
        o.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.identity_document?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.phone?.toLowerCase().includes(searchTerm.toLowerCase())
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
                title="Registo de Cidadãos"
                subtitle="Consola de gestão de identificação e relação municipal com proprietários."
                breadcrumbs={[
                    { label: 'Painel', path: '/admin/dashboard' },
                    { label: 'Cidadãos', path: '/admin/owners' }
                ]}
                actions={
                    <button 
                        onClick={() => { setEditingOwner(null); setFormData({ full_name: '', identity_document: '', nuit: '', phone: '', address: '' }); setShowModal(true); }} 
                        className="tac-action-btn primary"
                    >
                        <Plus size={22} /> NOVO CADASTRO
                    </button>
                }
            />

            {/* Tactical Briefing Bar */}
            <div className="tactical-status-bar">
                <StatusItem icon={<Users size={18} />} label="CIDADÃOS TOTAL" value={owners.length} color="#3b82f6" />
                <div className="v-divider"></div>
                <StatusItem icon={<ShieldCheck size={18} />} label="IDENTIDADES VALIDADAS" value={owners.length} color="#10b981" />
                <div className="v-divider"></div>
                <StatusItem icon={<Globe size={18} />} label="BASE MUNICIPAL" value="ACTIVA" color="#8b5cf6" />
                <div className="b-search">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Pesquisar por Nome, BI ou Contacto..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="kpi-row">
                <KPICard icon={<Users size={26} />} label="TOTAL CADASTROS" value={owners.length} color="#3b82f6" subText="Base de Dados Local" />
                <KPICard icon={<MessageSquare size={26} />} label="CONTACTO REACH" value={`${((owners.filter(o => o.phone).length / (owners.length || 1)) * 100).toFixed(0)}%`} color="#10b981" subText="Cidadãos com Telemóvel" />
                <KPICard icon={<CreditCard size={26} />} label="FINANCEIRO NUIT" value={owners.filter(o => o.nuit).length} color="#f59e0b" subText="Identificação Fiscal" />
                <KPICard icon={<History size={26} />} label="ACTUALIZAÇÃO" value="Hoje" color="#0f172a" subText={new Date().toLocaleTimeString()} />
            </div>

            <div className="inventory-card">
                <div className="inventory-header">
                    <div className="view-mode-label">MODO TABELA: FICHEIRO GERAL</div>
                    <div className="filter-badge">
                        <Activity size={14} /> STATUS: SINCRONIZADO
                    </div>
                </div>

                <div className="inventory-content">
                    {loading ? (
                        <div className="p-12"><SkeletonLoader type="table" rows={8} /></div>
                    ) : filteredOwners.length === 0 ? (
                        <EmptyState 
                            icon={<Users size={64} color="#f1f5f9" />}
                            title="Cadastro Inexistente"
                            description="Nenhum cidadão foi localizado com os critérios de busca actuais."
                            onAction={() => setSearchTerm('')}
                            actionText="Limpar Pesquisa"
                        />
                    ) : (
                        <div className="table-wrapper">
                            <table className="tac-table">
                                <thead>
                                    <tr>
                                        <th>IDENTIFICAÇÃO DO CIDADÃO</th>
                                        <th>ESTRUTURA DE CONTACTO</th>
                                        <th>LOCALIZAÇÃO / RESIDÊNCIA</th>
                                        <th>CADASTRO FISCAL/DOCUMENTAL</th>
                                        <th className="text-right">GERIR</th>
                                    </tr>
                                </thead>
                                <motion.tbody variants={containerVariants} initial="hidden" animate="show">
                                    {filteredOwners.map((o) => (
                                        <motion.tr key={o.id} variants={itemVariants} className="tac-row" onClick={() => navigate(`/admin/owners/${o.id}`)}>
                                            <td>
                                                <div className="citizen-cell">
                                                    <div className="c-avatar">{o.full_name.charAt(0)}</div>
                                                    <div>
                                                        <div className="c-name">{o.full_name}</div>
                                                        <div className="c-id">ID: {o.id.substring(0,8).toUpperCase()}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="contact-item">
                                                    <Phone size={14} />
                                                    {o.phone || 'SEM TELEMÓVEL'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="loc-cell">
                                                    <MapPin size={14} />
                                                    <span className="l-text">{o.address || 'MORADA NÃO ESPECIFICADA'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="doc-cluster">
                                                    <span className="doc-tag">BI: {o.identity_document}</span>
                                                    {o.nuit && <span className="doc-tag nuit">NUIT: {o.nuit}</span>}
                                                </div>
                                            </td>
                                            <td className="text-right">
                                                <div className="action-cluster" onClick={e => e.stopPropagation()}>
                                                    <button onClick={() => navigate(`/admin/owners/${o.id}`)} className="tac-btn-sm"><ChevronRight size={20} /></button>
                                                    <button onClick={() => handleEdit(o)} className="tac-btn-sm highlight"><Edit2 size={18} /></button>
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
                                <div className="m-icon"><User size={28} /></div>
                                <h3>{editingOwner ? 'ACTUALIZAR FICHA' : 'NOVO REGISTO CIVIL'}</h3>
                                <p>Preencha os dados oficiais de identificação do proprietário.</p>
                            </div>

                            <div className="modal-grid">
                                <div className="f-group full">
                                    <label>NOME COMPLETO</label>
                                    <input type="text" required placeholder="Nuno Miguel..." value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                                </div>
                                <div className="f-group">
                                    <label>BILHETE DE IDENTIDADE</label>
                                    <input type="text" required value={formData.identity_document} onChange={e => setFormData({...formData, identity_document: e.target.value})} />
                                </div>
                                <div className="f-group">
                                    <label>NUIT (OPCIONAL)</label>
                                    <input type="text" value={formData.nuit} onChange={e => setFormData({...formData, nuit: e.target.value})} />
                                </div>
                                <div className="f-group full">
                                    <label>TELEFONE (+258)</label>
                                    <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                                </div>
                                <div className="f-group full">
                                    <label>MORADA COMPLETA</label>
                                    <textarea placeholder="Bairro, Rua..." value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}></textarea>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="m-btn secondary" onClick={() => setShowModal(false)}>DESCARTAR</button>
                                <button type="submit" className="m-btn primary" disabled={isSaving}>
                                    {isSaving ? <Loader2 className="spin" size={24} /> : 'GUARDAR CADASTRO'}
                                </button>
                            </div>
                        </motion.form>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .tac-action-btn { height: 50px; padding: 0 25px; border-radius: 14px; font-weight: 950; font-size: 0.8rem; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: 0.3s; border: none; }
                .tac-action-btn.primary { background: #0f172a; color: white; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.4); }
                .tac-action-btn:hover { transform: translateY(-3px); box-shadow: 0 15px 30px -8px rgba(0,0,0,0.2); }

                .tactical-status-bar { display: flex; align-items: center; gap: 2.5rem; background: #0f172a; padding: 1.25rem 2.5rem; border-radius: 20px; color: white; margin-bottom: 3rem; }
                .b-item { display: flex; align-items: center; gap: 10px; font-size: 0.75rem; font-weight: 800; color: #94a3b8; }
                .b-item span { letter-spacing: 0.5px; }
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
                .tac-row { border-bottom: 1.5px solid #f8fafc; transition: 0.3s; cursor: pointer; }
                .tac-row:hover { background: #f8fafc; }
                .tac-row td { padding: 1.75rem 2rem; }

                .citizen-cell { display: flex; align-items: center; gap: 15px; }
                .c-avatar { width: 44px; height: 44px; border-radius: 14px; background: #eff6ff; color: #3b82f6; display: flex; align-items: center; justify-content: center; font-weight: 950; font-size: 1.1rem; }
                .c-name { font-size: 1rem; font-weight: 950; color: #0f172a; }
                .c-id { font-size: 0.7rem; font-weight: 800; color: #94a3b8; margin-top: 2px; }

                .contact-item { display: flex; align-items: center; gap: 8px; color: #1e293b; font-weight: 850; font-size: 0.9rem; }
                .loc-cell { display: flex; align-items: center; gap: 8px; color: #64748b; font-size: 0.85rem; font-weight: 700; }
                .l-text { max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

                .doc-cluster { display: flex; gap: 8px; }
                .doc-tag { padding: 4px 10px; border-radius: 8px; background: #f1f5f9; color: #475569; font-size: 0.7rem; font-weight: 950; font-family: 'Monaco', monospace; }
                .doc-tag.nuit { background: #0f172a; color: white; }

                .action-cluster { display: flex; justify-content: flex-end; gap: 8px; }
                .tac-btn-sm { width: 44px; height: 44px; border-radius: 14px; border: 1.5px solid #f1f5f9; background: white; color: #64748b; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; }
                .tac-btn-sm:hover { border-color: #0f172a; color: #0f172a; transform: translateY(-2px); }
                .tac-btn-sm.highlight { color: #3b82f6; border-color: #3b82f640; background: #eff6ff; }

                .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 2rem; }
                .premium-modal { background: white; width: 100%; maxWidth: 600px; padding: 3.5rem; border-radius: 40px; position: relative; box-shadow: 0 40px 100px -20px rgba(0,0,0,0.3); }
                .close-btn { position: absolute; top: 2rem; right: 2rem; width: 44px; height: 44px; border-radius: 50%; border: none; background: #f8fafc; color: #94a3b8; cursor: pointer; display: flex; align-items: center; justify-content: center; }
                
                .modal-header { text-align: center; margin-bottom: 3rem; }
                .m-icon { width: 64px; height: 64px; background: #0f172a; color: white; border-radius: 22px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto; }
                .modal-header h3 { margin: 0; font-size: 1.5rem; font-weight: 950; color: #0f172a; letter-spacing: -1px; }
                .modal-header p { margin: 4px 0 0 0; color: #94a3b8; font-weight: 600; font-size: 0.9rem; }

                .modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
                .f-group { display: flex; flex-direction: column; gap: 8px; }
                .f-group.full { grid-column: span 2; }
                .f-group label { font-size: 0.65rem; font-weight: 950; color: #94a3b8; letter-spacing: 1px; }
                .f-group input, .f-group textarea { padding: 16px; border-radius: 16px; border: 2.5px solid #f1f5f9; background: #f8fafc; font-weight: 800; outline: none; transition: 0.3s; }
                .f-group input:focus, .f-group textarea:focus { border-color: #3b82f6; background: white; }

                .modal-actions { display: grid; grid-template-columns: 1fr 1.5fr; gap: 1.5rem; margin-top: 3rem; }
                .m-btn { height: 60px; border-radius: 18px; border: none; font-weight: 950; cursor: pointer; transition: 0.3s; }
                .m-btn.secondary { background: #f1f5f9; color: #94a3b8; }
                .m-btn.primary { background: #0f172a; color: white; box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
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

export default OwnersList;
