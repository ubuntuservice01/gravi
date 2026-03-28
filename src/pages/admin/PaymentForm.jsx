import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    CreditCard, Save, X, Search, Bike, User, DollarSign, Info, 
    AlertCircle, Receipt, Wallet, Banknote, ShieldCheck, 
    ChevronRight, CheckCircle2, Building2, Landmark, 
    ArrowLeft, History, Clock, FileText, BadgeCheck,
    Coins, Zap, Hash, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/PageHeader';

const PaymentForm = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        reference: `PAY-${Date.now().toString().slice(-8)}`,
        payment_type: '',
        value: '',
        method: 'Numerário',
        vehicle_id: '',
        owner_id: '',
        fine_id: '',
        seizure_id: '',
        observations: ''
    });

    const [vehicleQuery, setVehicleQuery] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [pendingFines, setPendingFines] = useState([]);

    const searchVehicle = async () => {
        if (!vehicleQuery.trim()) return;
        try {
            setSearching(true);
            setError(null);
            const { data, error } = await supabase
                .from('motorcycles')
                .select('*, owners(*)')
                .eq('plate', vehicleQuery.toUpperCase().trim())
                .eq('municipality_id', profile.municipality_id)
                .single();

            if (error) throw new Error('VEÍCULO NÃO IDENTIFICADO: Não localizado na base fiscal.');
            
            setSelectedVehicle(data);
            setFormData(prev => ({
                ...prev,
                vehicle_id: data.id,
                owner_id: data.owner_id
            }));

            // Fetch pending fines for this vehicle
            const { data: fines } = await supabase
                .from('fines')
                .select('*')
                .eq('vehicle_id', data.id)
                .eq('status', 'pending');
            
            setPendingFines(fines || []);
        } catch (err) {
            setError(err.message);
            setSelectedVehicle(null);
            setPendingFines([]);
        } finally {
            setSearching(false);
        }
    };

    const handleFineSelection = (fineId) => {
        const fine = pendingFines.find(f => f.id === fineId);
        if (fine) {
            setFormData(prev => ({
                ...prev,
                fine_id: fine.id,
                value: fine.value,
                payment_type: 'Multa'
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                fine_id: '',
                value: '',
                payment_type: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.value || !formData.payment_type) return;

        try {
            setLoading(true);
            const { error } = await supabase.from('payments').insert([{
                ...formData,
                value: parseFloat(formData.value),
                municipality_id: profile.municipality_id,
                collector_id: profile.id,
                status: 'confirmed'
            }]);

            if (error) throw error;

            // Update fine status if it was a fine payment
            if (formData.fine_id) {
                await supabase
                    .from('fines')
                    .update({ status: 'paid' })
                    .eq('id', formData.fine_id);
            }

            navigate('/admin/payments');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const paymentMethods = [
        { id: 'Numerário', label: 'Dinheiro Vivo', icon: <Banknote size={20} /> },
        { id: 'Transferência', label: 'TPA / Banco', icon: <Landmark size={20} /> },
        { id: 'POS', label: 'ATM / POS', icon: <CreditCard size={20} /> },
        { id: 'M-Pesa', label: 'M-Pesa / Mobile', icon: <Zap size={20} /> }
    ];

    const paymentTypes = [
        { id: 'Licença', label: 'Taxa Licença' },
        { id: 'Multa', label: 'Liquidação Multa' },
        { id: 'Parqueamento', label: 'Parqueamento' },
        { id: 'Taxa de registo', label: 'Taxa Registo' },
        { id: 'Outro', label: 'Diversos' }
    ];

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '6rem' }}
        >
            <PageHeader
                title="Gestão de Tesouraria Fiscal"
                subtitle="Interface de liquidação de activos e obrigações municipais."
                breadcrumbs={[
                    { label: 'Painel', path: '/admin/dashboard' },
                    { label: 'Pagamentos', path: '/admin/payments' },
                    { label: 'Nova Liquidação' }
                ]}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '3rem' }}>
                
                {/* Left Side: Identification & Obligations */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="card" style={{ padding: '3rem', borderRadius: '40px', background: 'white', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.03)' }}>
                        <h3 className="section-title-ultra">
                            <Search size={22} /> IDENTIFICAÇÃO DE CONTRIBUINTE
                        </h3>

                        {!selectedVehicle ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ position: 'relative' }}>
                                    <div className="plate-prefix-small">MZ</div>
                                    <input 
                                        type="text" 
                                        className="tac-input-ultra wide plate-font-small"
                                        placeholder="ABC-000-XX"
                                        value={vehicleQuery}
                                        onChange={(e) => setVehicleQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && searchVehicle()}
                                        style={{ paddingLeft: '70px' }}
                                    />
                                </div>
                                <button 
                                    onClick={searchVehicle}
                                    className="tac-btn-primary full-width"
                                    disabled={searching}
                                >
                                    {searching ? <Loader2 size={18} className="spin" /> : 'LOCALIZAR VÍNCULO'}
                                </button>
                                
                                {error && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="error-tactical">
                                        <AlertCircle size={18} /> {error}
                                    </motion.div>
                                )}
                            </div>
                        ) : (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="target-profile-card success">
                                <div className="target-header">
                                    <div className="target-id-badge">{selectedVehicle.plate}</div>
                                    <button onClick={() => {setSelectedVehicle(null); setVehicleQuery(''); setPendingFines([]);}} className="btn-release">TROCAR</button>
                                </div>
                                <div className="target-body">
                                    <div className="target-stat">
                                        <label>TUTULAR DA CONTA</label>
                                        <p>{selectedVehicle.owners?.full_name}</p>
                                    </div>
                                    <div className="target-stat">
                                        <label>ESTADO DO VEÍCULO</label>
                                        <p style={{ color: '#10b981', fontWeight: '950' }}>{selectedVehicle.status}</p>
                                    </div>
                                </div>
                                <div className="target-footer">
                                    <BadgeCheck size={18} color="#10b981" />
                                    <span>CONTA FISCAL ACTIVA</span>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    <AnimatePresence>
                        {pendingFines.length > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="card" 
                                style={{ padding: '2.5rem', borderRadius: '35px', background: '#fffbeb', border: '1.5px solid #fef3c7' }}
                            >
                                <h3 style={{ fontSize: '0.75rem', fontWeight: '950', color: '#92400e', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <AlertCircle size={18} /> OBRIGAÇÕES PENDENTES ({pendingFines.length})
                                </h3>
                                <div style={{ display: 'grid', gap: '10px' }}>
                                    {pendingFines.map(fine => (
                                        <button
                                            key={fine.id}
                                            onClick={() => handleFineSelection(fine.id)}
                                            className={`obligation-btn ${formData.fine_id === fine.id ? 'active' : ''}`}
                                        >
                                            <div style={{ flex: 1 }}>
                                                <div className="o-type">{fine.infraction_type}</div>
                                                <div className="o-date">{new Date(fine.created_at).toLocaleDateString()}</div>
                                            </div>
                                            <div className="o-value">{parseFloat(fine.value).toLocaleString()} MT</div>
                                            {formData.fine_id === fine.id && <CheckCircle2 size={16} />}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Side: Financial Processing */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem', opacity: !selectedVehicle ? 0.35 : 1, pointerEvents: !selectedVehicle ? 'none' : 'auto', transition: 'all 0.5s' }}>
                    
                    <div className="card" style={{ padding: '3.5rem', borderRadius: '45px', background: 'white', boxShadow: '0 30px 70px -15px rgba(0,0,0,0.06)' }}>
                        <h3 className="section-title-ultra">
                            <Wallet size={22} /> PROCESSAMENTO FINANCEIRO
                        </h3>

                        <div style={{ display: 'grid', gap: '2.5rem' }}>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <FormField label="Natureza da Liquidação">
                                    <select 
                                        className="tac-input-ultra" 
                                        required 
                                        value={formData.payment_type}
                                        onChange={(e) => setFormData({...formData, payment_type: e.target.value})}
                                        disabled={!!formData.fine_id}
                                    >
                                        <option value="">Selecione...</option>
                                        {paymentTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                    </select>
                                </FormField>
                                <FormField label="Referência Segura">
                                    <div style={{ position: 'relative' }}>
                                        <Hash style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={20} />
                                        <input type="text" className="tac-input-ultra" readOnly value={formData.reference} style={{ paddingLeft: '55px', color: '#64748b', fontSize: '0.9rem' }} />
                                    </div>
                                </FormField>
                            </div>

                            <div>
                                <label className="tac-label-ultra">Canal de Pagamento</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                                    {paymentMethods.map(method => (
                                        <button
                                            key={method.id}
                                            type="button"
                                            onClick={() => setFormData({...formData, method: method.id})}
                                            className={`method-btn ${formData.method === method.id ? 'active' : ''}`}
                                        >
                                            <div className="m-icon" style={{ 
                                                background: formData.method === method.id ? '#0f172a' : '#f8fafc',
                                                color: formData.method === method.id ? 'white' : '#64748b'
                                            }}>
                                                {method.icon}
                                            </div>
                                            <span className="m-label">{method.label}</span>
                                            {formData.method === method.id && <CheckCircle2 size={18} className="m-check" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                                <FormField label="Montante Bruto a Liquidar (MT)">
                                    <div style={{ position: 'relative' }}>
                                        <Coins style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#10b981' }} size={24} />
                                        <input 
                                            type="number" 
                                            className="tac-input-ultra currency-input"
                                            value={formData.value}
                                            onChange={(e) => setFormData({...formData, value: e.target.value})}
                                            required
                                            style={{ paddingLeft: '60px' }}
                                        />
                                    </div>
                                </FormField>
                                <div style={{ padding: '20px', background: '#ecfdf5', borderRadius: '22px', border: '1.5px solid #10b98130', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '0.65rem', fontWeight: '950', color: '#065f46', textTransform: 'uppercase' }}>Estado de Caixa</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#059669', marginTop: '4px' }}>Entrada Verificada</div>
                                    </div>
                                </div>
                            </div>

                            <FormField label="Notas de Transação (Opcional)">
                                <textarea 
                                    className="tac-input-ultra" 
                                    style={{ minHeight: '120px', padding: '25px', resize: 'none' }}
                                    placeholder="Insira detalhes do recibo bancário, código M-Pesa ou observações financeiras..."
                                    value={formData.observations}
                                    onChange={(e) => setFormData({...formData, observations: e.target.value})}
                                />
                            </FormField>
                        </div>
                    </div>

                    <div style={{ 
                        display: 'flex', justifyContent: 'flex-end', gap: '1.5rem',
                        padding: '2.5rem', background: 'white', borderRadius: '35px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.03)'
                    }}>
                        <button 
                            type="button" 
                            className="tac-nav-btn secondary"
                            onClick={() => navigate('/admin/payments')}
                        >
                            CANCELAR
                        </button>
                        <button 
                            type="submit" 
                            className="tac-nav-btn primary success"
                            disabled={loading || !formData.value}
                        >
                            {loading ? <Loader2 size={24} className="spin" /> : <ShieldCheck size={24} />}
                            {loading ? 'CONFIRMANDO...' : 'EXECUTAR LIQUIDAÇÃO'}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                .section-title-ultra { display: flex; align-items: center; gap: 12px; font-size: 0.75rem; font-weight: 950; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 2.5rem; }
                
                .tac-input-ultra { width: 100%; height: 60px; border-radius: 18px; border: 2.5px solid #f1f5f9; background: #f8fafc; padding: 0 25px; font-size: 1rem; font-weight: 700; color: #0f172a; outline: none; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
                .tac-input-ultra:focus { border-color: #3b82f6; background: white; box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.1); }
                
                .plate-prefix-small { position: absolute; left: 15px; top: 10px; bottom: 10px; width: 45px; background: #2563eb; border-radius: 10px; color: white; display: flex; align-items: center; justify-content: center; font-weight: 950; font-size: 0.75rem; }
                .plate-font-small { font-family: 'Monaco', monospace; font-size: 1.1rem; font-weight: 950; letter-spacing: 1px; }

                .tac-btn-primary { height: 60px; background: #0f172a; color: white; border: none; border-radius: 18px; font-weight: 950; font-size: 0.85rem; cursor: pointer; transition: all 0.3s; box-shadow: 0 15px 30px -5px rgba(15, 23, 42, 0.2); }
                .tac-btn-primary:hover { transform: translateY(-3px); box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.35); }
                .full-width { width: 100%; }

                .target-profile-card { background: #0f172a; border-radius: 35px; padding: 2.5rem; color: white; }
                .target-profile-card.success { border-left: 8px solid #10b981; }
                .target-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
                .target-id-badge { font-family: 'Monaco', monospace; font-size: 1.5rem; font-weight: 950; background: #3b82f6; color: white; padding: 10px 20px; border-radius: 12px; }
                .btn-release { background: rgba(255,255,255,0.05); border: none; padding: 8px 18px; border-radius: 100px; color: #94a3b8; font-size: 0.65rem; font-weight: 950; cursor: pointer; }
                .btn-release:hover { background: #ef4444; color: white; }
                
                .target-body { display: grid; gap: 1.5rem; margin-bottom: 2.5rem; }
                .target-stat label { display: block; font-size: 0.65rem; font-weight: 950; color: #64748b; letter-spacing: 1px; margin-bottom: 4px; }
                .target-stat p { margin: 0; font-size: 0.95rem; font-weight: 800; color: white; }
                
                .target-footer { display: flex; align-items: center; gap: 10px; padding: 15px; background: rgba(16, 185, 129, 0.05); border-radius: 15px; border: 1px solid rgba(16, 185, 129, 0.1); }
                .target-footer span { font-size: 0.7rem; font-weight: 950; color: #10b981; }

                .obligation-btn { width: 100%; padding: 1.25rem; border-radius: 20px; border: 2px solid white; background: white; display: flex; align-items: center; gap: 15px; cursor: pointer; transition: all 0.3s; text-align: left; }
                .obligation-btn:hover { border-color: #f59e0b; transform: scale(1.02); }
                .obligation-btn.active { border-color: #f59e0b; background: #fffbeb; box-shadow: 0 10px 20px -5px rgba(245, 158, 11, 0.15); }
                .o-type { font-size: 0.9rem; font-weight: 950; color: #0f172a; }
                .o-date { font-size: 0.7rem; font-weight: 800; color: #94a3b8; margin-top: 2px; }
                .o-value { font-size: 1rem; font-weight: 950; color: #b45309; }

                .method-btn { padding: 1.25rem; border: 2.5px solid #f1f5f9; background: white; border-radius: 24px; display: flex; gap: 15px; align-items: center; cursor: pointer; transition: all 0.3s; position: relative; }
                .method-btn:hover { border-color: #cbd5e1; transform: translateY(-3px); }
                .method-btn.active { border-color: #0f172a; background: #f8fafc; }
                .m-icon { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
                .m-label { font-size: 0.9rem; font-weight: 950; color: #0f172a; }
                .m-check { position: absolute; right: 20px; color: #0f172a; }

                .currency-input { color: #10b981 !important; font-weight: 950 !important; font-size: 1.5rem !important; background: #f0fdf4 !important; border-color: #10b98130 !important; }

                .tac-nav-btn { height: 64px; padding: 0 40px; border-radius: 22px; border: none; font-weight: 950; font-size: 0.95rem; cursor: pointer; display: flex; align-items: center; gap: 15px; transition: all 0.3s; }
                .tac-nav-btn.secondary { background: #f1f5f9; color: #64748b; }
                .tac-nav-btn.primary { background: #0f172a; color: white; box-shadow: 0 15px 30px -5px rgba(15, 23, 42, 0.25); }
                .tac-nav-btn.primary.success { background: #10b981; box-shadow: 0 15px 30px -5px rgba(16, 185, 129, 0.25); }

                .error-tactical { padding: 1rem; background: #fff1f2; border-radius: 12px; border: 1px solid #fecaca; color: #e11d48; font-size: 0.75rem; font-weight: 800; display: flex; gap: 8px; align-items: center; margin-top: 1rem; }

                .spin { animation: spin 1.5s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </motion.div>
    );
};

const FormField = ({ label, children }) => (
    <div>
        <label className="tac-label-ultra">{label}</label>
        {children}
    </div>
);

export default PaymentForm;
