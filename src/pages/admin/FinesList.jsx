import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { logAudit } from '../../services/auditService';
import { 
    Plus, Search, AlertCircle, CheckCircle, 
    X, MapPin, Bike, Car, 
    DollarSign, Filter, FileText, Clock, AlertTriangle, ChevronRight, Hash,
    Globe, History, Zap, Activity, MessageSquare, MoreVertical, Trash2,
    TrendingUp, ShieldAlert, Target, CreditCard
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import SkeletonLoader from '../../components/SkeletonLoader';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const FinesList = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [fines, setFines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // For vehicle lookup
    const [vehicleSearch, setVehicleSearch] = useState('');
    const [searchingVehicle, setSearchingVehicle] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState(null);

    const [formData, setFormData] = useState({
        type: 'Estacionamento Proibido',
        value: '',
        location: '',
        description: ''
    });

    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        paid: 0,
        totalValue: 0
    });

    useEffect(() => {
        if (profile?.municipality_id) {
            fetchFines();
        }
    }, [profile?.municipality_id]);

    const fetchFines = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('fines')
                .select(`
                    *,
                    motorcycles (plate, brand, model, type),
                    owners (full_name)
                `)
                .eq('municipality_id', profile.municipality_id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setFines(data || []);
            calculateStats(data || []);
        } catch (err) {
            console.error('Error fetching fines:', err);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        const total = data.length;
        const pending = data.filter(f => f.status === 'pending').length;
        const paid = data.filter(f => f.status === 'paid').length;
        const totalValue = data.reduce((acc, current) => acc + Number(current.value), 0);
        setStats({ total, pending, paid, totalValue });
    };

    const handleSearchVehicle = async () => {
        if (!vehicleSearch.trim()) return;
        setSearchingVehicle(true);
        try {
            const { data, error } = await supabase
                .from('motorcycles')
                .select('*, owners(*)')
                .eq('plate', vehicleSearch.toUpperCase())
                .eq('municipality_id', profile.municipality_id)
                .single();

            if (error) throw new Error('Veículo não encontrado.');
            setSelectedVehicle(data);
        } catch (err) {
            alert(err.message);
            setSelectedVehicle(null);
        } finally {
            setSearchingVehicle(false);
        }
    };

    const handleAddFine = async (e) => {
        e.preventDefault();
        if (!selectedVehicle) {
            alert('Por favor, identifique o veículo primeiro.');
            return;
        }
        if (!formData.value || Number(formData.value) <= 0) {
            alert('Por favor, insira um valor válido.');
            return;
        }

        setIsSaving(true);
        try {
            const fineData = {
                vehicle_id: selectedVehicle.id,
                owner_id: selectedVehicle.owner_id,
                infraction_type: formData.type,
                description: formData.description,
                value: Number(formData.value),
                location: formData.location,
                fiscal_id: profile.id,
                municipality_id: profile.municipality_id,
                status: 'pending'
            };

            const { data, error } = await supabase
                .from('fines')
                .insert([fineData])
                .select()
                .single();

            if (error) throw error;

            await logAudit(profile.id, profile.full_name, 'CREATE', 'fines', data.id, fineData);

            fetchFines();
            setShowAddModal(false);
            // Reset
            setSelectedVehicle(null);
            setVehicleSearch('');
            setFormData({ type: 'Estacionamento Proibido', value: '', location: '', description: '' });
        } catch (err) {
            console.error('Error adding fine:', err);
            alert('Erro ao registar: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const markAsPaid = async (fine) => {
        if (!window.confirm('Confirmar liquidação desta multa?')) return;
        
        try {
            const { error } = await supabase
                .from('fines')
                .update({ status: 'paid' })
                .eq('id', fine.id);

            if (error) throw error;

            // Log de Auditoria
            await logAudit(profile.id, profile.full_name, 'UPDATE', 'fines', fine.id, { status: 'paid' }, fine);

            // Create payment record automatically
            await supabase.from('payments').insert([{
                reference: `PAY-FINE-${fine.fine_number || Date.now().toString().slice(-6)}`,
                payment_type: 'Multa',
                fine_id: fine.id,
                vehicle_id: fine.vehicle_id,
                owner_id: fine.owner_id,
                value: fine.value,
                method: 'Numerário',
                municipality_id: profile.municipality_id,
                collector_id: profile.id,
                status: 'confirmed'
            }]);

            fetchFines();
        } catch (err) {
            console.error('Error marking paid:', err);
        }
    };

    const filteredFines = fines.filter(f =>
        f.motorcycles?.plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.owners?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.infraction_type?.toLowerCase().includes(searchTerm.toLowerCase())
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
                title="Consola de Fiscalização"
                subtitle="Gestão de contra-ordenações, controlo de multas e monitorização de receita pecuniária."
                breadcrumbs={[
                    { label: 'Painel', path: '/admin/dashboard' },
                    { label: 'Financeiro', path: '/admin/payments' },
                    { label: 'Fiscalização' }
                ]}
                actions={
                    <button 
                        onClick={() => setShowAddModal(true)} 
                        className="tac-action-btn primary"
                    >
                        <Plus size={22} /> NOVA INFRAÇÃO
                    </button>
                }
            />

            {/* Tactical Briefing Bar */}
            <div className="tactical-status-bar">
                <StatusItem icon={<FileText size={18} />} label="MULTAS TOTAL" value={stats.total} color="#3b82f6" />
                <div className="v-divider"></div>
                <StatusItem icon={<Clock size={18} />} label="EM COBRANÇA" value={stats.pending} color="#f59e0b" />
                <div className="v-divider"></div>
                <StatusItem icon={<DollarSign size={18} />} label="RECEITA ESTIMADA" value={`${stats.totalValue.toLocaleString()} MT`} color="#10b981" />
                <div className="b-search">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Pesquisar por Matrícula, Infrator ou Tipo..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="kpi-row">
                <KPICard icon={<TrendingUp size={26} />} label="EFICÁCIA COBRANÇA" value={`${((stats.paid / (stats.total || 1)) * 100).toFixed(0)}%`} color="#10b981" subText="Percentagem de Liquidação" />
                <KPICard icon={<ShieldAlert size={26} />} label="PENDENTES" value={stats.pending} color="#ef4444" subText="Dívida Municipal Activa" />
                <KPICard icon={<CreditCard size={26} />} label="TICKET MÉDIO" value={`${(stats.totalValue / (stats.total || 1)).toFixed(0)} MT`} color="#8b5cf6" subText="Valor Médio por Coima" />
                <KPICard icon={<Activity size={26} />} label="FLUXO" value="Sincronizado" color="#0f172a" subText={new Date().toLocaleTimeString()} />
            </div>

            <div className="inventory-card">
                <div className="inventory-header">
                    <div className="view-mode-label">FICHEIRO GERAL DE INFRAÇÕES</div>
                    <div className="filter-badge">
                        <History size={14} /> FILTRO: ÚLTIMOS REGISTOS
                    </div>
                </div>

                <div className="inventory-content">
                    {loading ? (
                        <div className="p-12"><SkeletonLoader type="table" rows={8} /></div>
                    ) : filteredFines.length === 0 ? (
                        <EmptyState 
                            icon={<AlertCircle size={64} color="#f1f5f9" />}
                            title="Arquivo Limpo"
                            description="Nenhuma contra-ordenação condiz com os critérios de busca."
                            onAction={() => setSearchTerm('')}
                            actionText="Limpar Pesquisa"
                        />
                    ) : (
                        <div className="table-wrapper">
                            <table className="tac-table">
                                <thead>
                                    <tr>
                                        <th>VEÍCULO & REFERÊNCIA</th>
                                        <th>INFRAÇÃO DETECTADA</th>
                                        <th>AGENTE / LOCALIZAÇÃO</th>
                                        <th className="text-right">VALOR COIMA</th>
                                        <th>ESTADO</th>
                                        <th className="text-right">GESTÃO</th>
                                    </tr>
                                </thead>
                                <motion.tbody variants={containerVariants} initial="hidden" animate="show">
                                    {filteredFines.map((f) => (
                                        <motion.tr key={f.id} variants={itemVariants} className="tac-row">
                                            <td>
                                                <div className="plate-stack">
                                                    <div className="p-box">
                                                        <span className="p-l">MZ</span>
                                                        <span className="p-n">{f.motorcycles?.plate}</span>
                                                    </div>
                                                    <div className="p-ref">REF: {f.fine_number || f.id.substring(0,8).toUpperCase()}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="infraction-cell">
                                                    <div className="i-type">{f.infraction_type}</div>
                                                    <div className="i-owner">{f.owners?.full_name}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="loc-cell-tactical">
                                                    <div className="l-item"><MapPin size={12} /> {f.location || 'N/A'}</div>
                                                    <div className="l-date"><Clock size={12} /> {new Date(f.created_at).toLocaleDateString()}</div>
                                                </div>
                                            </td>
                                            <td className="text-right">
                                                <div className="val-cell">{Number(f.value).toLocaleString()} MT</div>
                                            </td>
                                            <td>
                                                <div className={`status-pill-tactical ${f.status === 'paid' ? 'success' : 'warning'}`}>
                                                    <div className="s-dot"></div>
                                                    {f.status.toUpperCase()}
                                                </div>
                                            </td>
                                            <td className="text-right">
                                                <div className="action-cluster" onClick={e => e.stopPropagation()}>
                                                    {f.status === 'pending' && (
                                                        <button onClick={() => markAsPaid(f)} className="tac-btn-sm highlight" title="Liquidar"><DollarSign size={18} /></button>
                                                    )}
                                                    <button onClick={() => navigate(`/admin/motorcycles/${f.vehicle_id}`)} className="tac-btn-sm"><ChevronRight size={20} /></button>
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
                {showAddModal && (
                    <div className="modal-overlay">
                        <motion.form 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onSubmit={handleAddFine} 
                            className="premium-modal large"
                        >
                            <button type="button" onClick={() => setShowAddModal(false)} className="close-btn"><X size={20} /></button>
                            
                            <div className="modal-header">
                                <div className="m-icon alert"><AlertTriangle size={28} /></div>
                                <h3>NOTIFICAR CONTRA-ORDENAÇÃO</h3>
                                <p>Registo oficial de infração para processamento municipal.</p>
                            </div>

                            <div className="modal-sections">
                                <div className="lookup-section">
                                    <label>IDENTIFICAÇÃO DO ALVO</label>
                                    <div className="lookup-box">
                                        <Search size={20} className="l-icon" />
                                        <input 
                                            type="text" 
                                            placeholder="DIGITE A MATRÍCULA..." 
                                            value={vehicleSearch}
                                            onChange={(e) => setVehicleSearch(e.target.value.toUpperCase())}
                                        />
                                        <button type="button" onClick={handleSearchVehicle} disabled={searchingVehicle}>
                                            {searchingVehicle ? '...' : 'VALIDAR'}
                                        </button>
                                    </div>
                                    {selectedVehicle && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="target-card">
                                            <div className="t-avatar"><Bike size={24} /></div>
                                            <div className="t-info">
                                                <div className="t-plate">{selectedVehicle.plate}</div>
                                                <div className="t-owner">{selectedVehicle.owners?.full_name}</div>
                                            </div>
                                            <CheckCircle className="t-check" size={24} />
                                        </motion.div>
                                    )}
                                </div>

                                <div className="form-grid-tactical">
                                    <div className="f-item full">
                                        <label>NATUREZA DA INFRAÇÃO</label>
                                        <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                                            <option value="Estacionamento Proibido">Estacionamento Proibido</option>
                                            <option value="Excesso de Velocidade">Excesso de Velocidade</option>
                                            <option value="Falta de Capacete">Falta de Capacete</option>
                                            <option value="Livrete Expirado">Livrete Expirado</option>
                                            <option value="Falta de Seguro">Falta de Seguro</option>
                                        </select>
                                    </div>
                                    <div className="f-item">
                                        <label>COIMA (MT)</label>
                                        <input type="number" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} required />
                                    </div>
                                    <div className="f-item">
                                        <label>GEOLOCALIZAÇÃO</label>
                                        <input type="text" placeholder="Av / Bairro..." value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                                    </div>
                                    <div className="f-item full">
                                        <label>NOTAS OPERACIONAIS</label>
                                        <textarea placeholder="Detalhes da ocorrência..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}></textarea>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-actions full">
                                <button type="button" className="m-btn secondary" onClick={() => setShowAddModal(false)}>DESCARTAR</button>
                                <button type="submit" className="m-btn primary alert" disabled={isSaving || !selectedVehicle}>
                                    {isSaving ? <Loader2 className="spin" size={24} /> : 'CONFIRMAR REGISTO'}
                                </button>
                            </div>
                        </motion.form>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .tac-action-btn { height: 50px; padding: 0 25px; border-radius: 14px; font-weight: 950; font-size: 0.8rem; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: 0.3s; border: none; }
                .tac-action-btn.primary { background: #0f172a; color: white; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.4); }
                .tac-action-btn.secondary { background: white; border: 2.5px solid #f1f5f9; color: #475569; }
                .tac-action-btn:hover { transform: translateY(-3px); }

                .tactical-status-bar { display: flex; align-items: center; gap: 2.5rem; background: #0f172a; padding: 1.25rem 2.5rem; border-radius: 20px; color: white; margin-bottom: 3rem; }
                .b-item { display: flex; align-items: center; gap: 10px; font-size: 0.75rem; font-weight: 800; color: #94a3b8; }
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

                .plate-stack { display: flex; flex-direction: column; gap: 6px; }
                .p-box { display: inline-flex; align-items: stretch; background: #0f172a; padding: 1.5px; border-radius: 6px; border: 1.5px solid #334155; width: fit-content; }
                .p-l { background: #3b82f6; color: white; padding: 0 6px; border-radius: 4px 1px 1px 4px; font-weight: 950; font-size: 0.6rem; display: flex; align-items: center; }
                .p-n { padding: 0 8px; color: white; font-family: 'Monaco', monospace; font-size: 1rem; font-weight: 950; }
                .p-ref { font-size: 0.65rem; font-weight: 950; color: #94a3b8; letter-spacing: 1px; }

                .infraction-cell .i-type { font-size: 0.95rem; font-weight: 950; color: #0f172a; }
                .infraction-cell .i-owner { font-size: 0.75rem; font-weight: 700; color: #64748b; margin-top: 2px; }

                .loc-cell-tactical { display: flex; flex-direction: column; gap: 4px; }
                .l-item { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; font-weight: 800; color: #1e293b; }
                .l-date { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; font-weight: 700; color: #94a3b8; }

                .val-cell { font-size: 1.1rem; font-weight: 950; color: #0f172a; }

                .status-pill-tactical { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 100px; font-size: 0.7rem; font-weight: 950; border: 1.5px solid transparent; }
                .status-pill-tactical .s-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
                .status-pill-tactical.success { background: #ecfdf5; color: #10b981; border-color: #10b98120; }
                .status-pill-tactical.warning { background: #fff7ed; color: #f59e0b; border-color: #f59e0b20; }

                .action-cluster { display: flex; justify-content: flex-end; gap: 10px; }
                .tac-btn-sm { width: 44px; height: 44px; border-radius: 14px; border: 1.5px solid #f1f5f9; background: white; color: #64748b; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; }
                .tac-btn-sm:hover { transform: translateY(-3px); border-color: #0f172a; color: #0f172a; }
                .tac-btn-sm.highlight { background: #ecfdf5; color: #10b981; border-color: #10b98140; }

                .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 2rem; }
                .premium-modal { background: white; width: 100%; maxWidth: 700px; padding: 3.5rem; border-radius: 40px; position: relative; box-shadow: 0 40px 100px -20px rgba(0,0,0,0.3); }
                .close-btn { position: absolute; top: 2rem; right: 2rem; width: 44px; height: 44px; border-radius: 50%; background: #f8fafc; border: none; color: #94a3b8; cursor: pointer; display: flex; align-items: center; justify-content: center; }
                
                .m-icon { width: 64px; height: 64px; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto; color: white; background: #0f172a; }
                .m-icon.alert { background: #f59e0b; }
                .modal-header { text-align: center; margin-bottom: 3rem; }
                .modal-header h3 { font-size: 1.75rem; font-weight: 950; color: #0f172a; letter-spacing: -1px; margin: 0; }

                .lookup-section { background: #f8fafc; padding: 2.25rem; border-radius: 30px; border: 2.5px dashed #e2e8f0; margin-bottom: 2.5rem; }
                .lookup-section label { font-size: 0.65rem; font-weight: 950; color: #94a3b8; letter-spacing: 1.5px; display: block; margin-bottom: 12px; }
                .lookup-box { display: flex; gap: 12px; position: relative; }
                .lookup-box input { flex: 1; padding: 18px 20px 18px 54px; border-radius: 18px; border: 2.5px solid #e2e8f0; font-family: 'Monaco', monospace; font-size: 1.25rem; font-weight: 950; outline: none; }
                .lookup-box .l-icon { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
                .lookup-box button { padding: 0 30px; border-radius: 18px; background: #0f172a; color: white; font-weight: 950; border: none; cursor: pointer; }

                .target-card { margin-top: 1.5rem; background: white; padding: 1.5rem; border-radius: 20px; border: 2px solid #10b981; display: flex; align-items: center; gap: 15px; }
                .t-avatar { width: 48px; height: 48px; border-radius: 14px; background: #ecfdf5; color: #10b981; display: flex; align-items: center; justify-content: center; }
                .t-plate { font-size: 1.25rem; font-weight: 950; color: #0f172a; }
                .t-owner { font-size: 0.85rem; font-weight: 700; color: #64748b; }
                .t-check { margin-left: auto; color: #10b981; }

                .form-grid-tactical { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
                .f-item.full { grid-column: span 2; }
                .f-item label { font-size: 0.65rem; font-weight: 950; color: #94a3b8; letter-spacing: 1px; display: block; margin-bottom: 8px; }
                .f-item input, .f-item select, .f-item textarea { width: 100%; padding: 16px; border-radius: 16px; border: 2.5px solid #f1f5f9; background: #f8fafc; font-weight: 850; outline: none; transition: 0.3s; }
                .f-item input:focus, .f-item select:focus, .f-item textarea:focus { border-color: #3b82f6; background: white; }

                .modal-actions { display: grid; grid-template-columns: 1fr 1.5fr; gap: 1.5rem; margin-top: 3.5rem; }
                .m-btn { height: 64px; border-radius: 20px; border: none; font-weight: 950; cursor: pointer; transition: 0.3s; }
                .m-btn.secondary { background: #f1f5f9; color: #94a3b8; }
                .m-btn.primary.alert { background: #0f172a; color: white; box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
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
        <span>{label.toUpperCase()}: <strong>{value}</strong></span>
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

export default FinesList;
