import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { RefreshCw, Save, X, Calendar, User, Bike, FileCheck, CheckCircle2, Shield, Info, ArrowRight, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { logAudit } from '../../services/auditService';
import PageHeader from '../../components/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';

const LicenseRenewal = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [license, setLicense] = useState(null);
    const [newExpiryDate, setNewExpiryDate] = useState('');
    const [fee, setFee] = useState('');

    useEffect(() => {
        if (id) fetchLicense();
    }, [id]);

    const fetchLicense = async () => {
        try {
            const { data, error } = await supabase
                .from('licenses')
                .select('*, vehicles(*), owners(*)')
                .eq('id', id)
                .single();

            if (error) throw error;
            setLicense(data);
            
            // Default renewal: 1 year from current expiry or today
            const currentExpiry = data.expiry_date ? new Date(data.expiry_date) : new Date();
            const futureDate = new Date(currentExpiry);
            futureDate.setFullYear(futureDate.getFullYear() + 1);
            setNewExpiryDate(futureDate.toISOString().split('T')[0]);
            setFee(data.value || '1500');

        } catch (err) {
            console.error('Error fetching license:', err);
            alert('Erro ao carregar dados da licença.');
        } finally {
            setLoading(false);
        }
    };

    const handleRenew = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Update license
            const { error: updateError } = await supabase
                .from('licenses')
                .update({
                    expiry_date: newExpiryDate,
                    value: fee,
                    status: 'active',
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (updateError) throw updateError;

            // Log activity
            await logAudit(
                profile?.id,
                profile?.full_name,
                'RENEWAL',
                'licenses',
                id,
                { expiry_date: newExpiryDate, value: fee },
                { expiry_date: license.expiry_date, value: license.value }
            );

            // Record payment automatically
            await supabase.from('payments').insert([{
                municipality_id: profile?.municipality_id,
                owner_id: license.owner_id,
                vehicle_id: license.vehicle_id,
                license_id: id,
                amount: fee,
                payment_method: 'Manual/Balcão',
                status: 'pago',
                reference: `REN-${license.license_number}-${Date.now().toString().slice(-4)}`
            }]);

            navigate(`/admin/licenses/${id}`);
        } catch (err) {
            console.error('Error renewing license:', err);
            alert('Erro: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '20px' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><RefreshCw size={40} color="#3b82f6" /></motion.div>
            <p style={{ fontWeight: '800', color: '#64748b' }}>Preparando processo de renovação...</p>
        </div>
    );

    return (
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '5rem' }}
        >
            <PageHeader 
                title="Renovação de Licença"
                subtitle="Extensão de validade para alvará de transporte municipal."
                breadcrumbs={[
                    { label: 'Painel', path: '/admin/dashboard' },
                    { label: 'Licenças', path: '/admin/licenses' },
                    { label: `Detalhes`, path: `/admin/licenses/${id}` },
                    { label: 'Renovar' }
                ]}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2.5rem' }}>
                <div className="card" style={{ padding: '0', borderRadius: '32px', overflow: 'hidden', border: 'none', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.1)' }}>
                    <div style={{ background: '#0f172a', padding: '2.5rem 3rem', color: 'white' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: '900', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Titular Actual</div>
                                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '950' }}>{license.owners?.full_name}</h3>
                                <p style={{ margin: '4px 0 0', opacity: 0.6, fontWeight: '600' }}>Licença Nº {license.license_number} • {license.vehicles?.plate}</p>
                            </div>
                            <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FileCheck size={32} color="#10b981" />
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleRenew} style={{ padding: '3.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginBottom: '3rem' }}>
                            <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '24px', border: '1.5px solid #f1f5f9' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
                                    <Calendar size={18} color="#3b82f6" /> Nova Expiração
                                </label>
                                <input 
                                    type="date" 
                                    value={newExpiryDate}
                                    onChange={(e) => setNewExpiryDate(e.target.value)}
                                    className="input"
                                    required
                                    style={{ background: 'white', fontSize: '1.1rem', fontWeight: '900', border: '2px solid #e2e8f0', borderRadius: '16px', padding: '15px' }}
                                />
                                <p style={{ marginTop: '12px', fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' }}>Válido por 12 meses após a data seleccionada.</p>
                            </div>

                            <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '24px', border: '1.5px solid #f1f5f9' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
                                    <Shield size={18} color="#3b82f6" /> Taxa de Renovação
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        type="number" 
                                        value={fee}
                                        onChange={(e) => setFee(e.target.value)}
                                        className="input"
                                        required
                                        placeholder="0.00"
                                        style={{ background: 'white', fontSize: '1.5rem', fontWeight: '950', border: '2px solid #e2e8f0', borderRadius: '16px', padding: '15px 45px 15px 15px', color: '#10b981' }}
                                    />
                                    <span style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', fontWeight: '900', color: '#94a3b8' }}>MT</span>
                                </div>
                                <p style={{ marginTop: '12px', fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' }}>Valor oficial da tabela de taxas municipais.</p>
                            </div>
                        </div>

                        <div style={{ background: '#fff7ed', padding: '2rem', borderRadius: '24px', border: '1.5px solid #ffedd5', marginBottom: '3rem', display: 'flex', gap: '20px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Info size={24} color="#f97316" />
                            </div>
                            <div>
                                <h4 style={{ margin: '0 0 6px', fontSize: '0.95rem', fontWeight: '950', color: '#9a3412' }}>Confirmação Financeira</h4>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#c2410c', fontWeight: '600', lineHeight: '1.6' }}>
                                    Ao confirmar a renovação, o sistema emitirá automaticamente um comprovativo de pagamento e actualizará o histórico de licenciamento do veículo. Esta acção requer privilégios de administrador.
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                            <button 
                                type="button" 
                                onClick={() => navigate(-1)} 
                                className="btn"
                                style={{ flex: 1, padding: '20px', borderRadius: '20px', backgroundColor: '#f1f5f9', color: '#64748b', fontWeight: '900', border: 'none' }}
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                disabled={saving}
                                className="btn btn-primary"
                                style={{ flex: 2, padding: '20px', borderRadius: '20px', fontWeight: '950', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: '0 15px 30px -5px rgba(59,130,246,0.3)' }}
                            >
                                {saving ? <RefreshCw className="animate-spin" /> : <Save size={22} />}
                                Confirmar Renovação
                            </button>
                        </div>
                    </form>
                </div>
                
                <div style={{ padding: '1.5rem 2rem', background: '#f8fafc', borderRadius: '24px', border: '2.5px dashed #e2e8f0', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <Shield size={20} color="#94a3b8" />
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', fontWeight: '700' }}>
                        Responsabilidade: O agente <b>{profile?.full_name}</b> assume a veracidade dos dados técnicos e financeiros inseridos nesta renovação para fins de auditoria municipal.
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default LicenseRenewal;
