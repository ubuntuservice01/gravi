import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
    Shield, Save, X, Search, Bike, User, MapPin, 
    AlertCircle, Info, ShieldAlert, Target, Gavel,
    AlertOctagon, CheckCircle2, RefreshCw, Smartphone,
    Hash, FileDigit, Landmark, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/PageHeader';

const SeizureForm = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        vehicle_id: '',
        owner_id: '',
        reason: '',
        location: '',
        daily_fee: '',
        observations: ''
    });

    const [vehicleQuery, setVehicleQuery] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState(null);

    // Fetch daily fee from municipal settings
    useEffect(() => {
        const fetchFees = async () => {
            if (!profile?.municipality_id) return;
            const { data } = await supabase
                .from('municipal_settings')
                .select('parking_daily_fee')
                .eq('municipality_id', profile.municipality_id)
                .single();
            
            if (data) {
                setFormData(prev => ({ ...prev, daily_fee: data.parking_daily_fee }));
            }
        };
        fetchFees();
    }, [profile]);

    const searchVehicle = async () => {
        if (!vehicleQuery.trim()) return;
        try {
            setSearching(true);
            setError(null);
            const { data, error } = await supabase
                .from('motorcycles')
                .select('*, owners(*)')
                .eq('plate', vehicleQuery.toUpperCase())
                .eq('municipality_id', profile.municipality_id)
                .single();

            if (error) throw new Error('Alvo não localizado no perímetro municipal.');
            
            setSelectedVehicle(data);
            setFormData(prev => ({
                ...prev,
                vehicle_id: data.id,
                owner_id: data.owner_id
            }));
        } catch (err) {
            setError(err.message);
            setSelectedVehicle(null);
        } finally {
            setSearching(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.vehicle_id) return setError('Selecione um alvo válido para custódia.');

        try {
            setLoading(true);
            const { error } = await supabase.from('seizures').insert([{
                ...formData,
                daily_fee: parseFloat(formData.daily_fee),
                municipality_id: profile.municipality_id,
                fiscal_id: profile.id,
                status: 'Activa'
            }]);

            if (error) throw error;
            navigate('/admin/seizures');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '6rem' }}
        >
            <PageHeader 
                title="Protocolo de Retenção"
                subtitle="Iniciação de processo de custódia e parqueamento compulsório."
                breadcrumbs={[
                    { label: 'Painel', path: '/admin/dashboard' },
                    { label: 'Apreensões', path: '/admin/seizures' },
                    { label: 'Novo Registo' }
                ]}
                actions={
                    <button onClick={() => navigate('/admin/seizures')} className="tac-action-btn secondary">
                        <X size={18} /> ABORTAR OPERAÇÃO
                    </button>
                }
            />

            <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '2.5rem' }}>
                
                {/* Tactical Identification Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="card tactical-search-card">
                        <div className="card-header">
                            <Target size={20} /> IDENTIFICAÇÃO DO ALVO
                        </div>
                        <div className="search-box-premium">
                            <input 
                                type="text" 
                                placeholder="PLACA DO VEÍCULO" 
                                value={vehicleQuery} 
                                onChange={e => setVehicleQuery(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && searchVehicle()}
                            />
                            <button onClick={searchVehicle} disabled={searching}>
                                {searching ? <RefreshCw size={20} className="spin" /> : <Search size={20} />}
                            </button>
                        </div>
                        <p className="search-hint">Introduza a matrícula para extrair o dossier do activo.</p>
                    </div>

                    <AnimatePresence>
                        {selectedVehicle && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="card vehicle-target-card"
                            >
                                <div className="v-header">
                                    <div className="v-id">MZ</div>
                                    <div className="v-plate">{selectedVehicle.plate}</div>
                                </div>
                                <div className="v-details">
                                    <div className="v-row">
                                        <label>MODELO</label>
                                        <p>{selectedVehicle.brand} {selectedVehicle.model}</p>
                                    </div>
                                    <div className="v-row">
                                        <label>TITULAR</label>
                                        <p>{selectedVehicle.owners?.full_name}</p>
                                    </div>
                                    <div className="v-row">
                                        <label>DOC. IDENTIDADE</label>
                                        <p>{selectedVehicle.owners?.bi_number}</p>
                                    </div>
                                </div>
                                <div className="v-footer">
                                    <ShieldCheck size={16} /> ENTIDADE SINCRONIZADA
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="card enforcement-alert">
                        <AlertOctagon size={24} />
                        <div>
                            <h4>ALERTA DE CUSTÓDIA</h4>
                            <p>A apreensão altera o estado do veículo para 'Apreendido' e activa a tarifação diária automática.</p>
                        </div>
                    </div>
                </div>

                {/* Seizure Protocol Form */}
                <div className="card protocol-form-card">
                    <form onSubmit={handleSubmit}>
                        <div className="form-section">
                            <h3 className="s-title"><Gavel size={20} /> DETERMINAÇÃO LEGAL</h3>
                            <div className="f-grid">
                                <div className="f-group" style={{ gridColumn: 'span 2' }}>
                                    <label>MOTIVO DA RETENÇÃO COMPULSÓRIA</label>
                                    <select 
                                        required
                                        value={formData.reason}
                                        onChange={e => setFormData({...formData, reason: e.target.value})}
                                    >
                                        <option value="">Selecione a fundamentação legal...</option>
                                        <option value="Condução perigosa / Embriaguez">Condução perigosa / Embriaguez</option>
                                        <option value="Veículo sem matrícula / Falsa">Veículo sem matrícula / Falsa</option>
                                        <option value="Reincidência em multas graves">Reincidência em multas graves</option>
                                        <option value="Falta de documentos obrigatórios">Falta de documentos obrigatórios</option>
                                        <option value="Abandono na via pública">Abandono na via pública</option>
                                        <option value="Ordem Judicial / Policial">Ordem Judicial / Policial</option>
                                    </select>
                                </div>

                                <div className="f-group">
                                    <label>LOCAL DA OCORRÊNCIA</label>
                                    <div className="input-with-icon">
                                        <MapPin size={18} />
                                        <input 
                                            type="text" 
                                            required 
                                            placeholder="Ex: Av. Eduardo Mondlane" 
                                            value={formData.location}
                                            onChange={e => setFormData({...formData, location: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="f-group">
                                    <label>TAXA DIÁRIA (MT)</label>
                                    <div className="input-with-icon">
                                        <Landmark size={18} />
                                        <input 
                                            type="number" 
                                            required 
                                            value={formData.daily_fee}
                                            onChange={e => setFormData({...formData, daily_fee: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="form-section mt-12">
                            <h3 className="s-title"><FileText size={20} /> NOTAS TÉCNICAS E ESTADO FÍSICO</h3>
                            <div className="f-group">
                                <label>OBSERVAÇÕES DO AGENTE (AVARIAS, PEÇAS EM FALTA, ETC.)</label>
                                <textarea 
                                    placeholder="Descreva minuciosamente o estado do veículo no momento da entrada em parque..."
                                    value={formData.observations}
                                    onChange={e => setFormData({...formData, observations: e.target.value})}
                                ></textarea>
                            </div>
                        </div>

                        {error && (
                            <div className="error-banner">
                                <AlertCircle size={20} /> {error}
                            </div>
                        )}

                        <div className="form-actions">
                            <button type="submit" className="confirm-btn" disabled={loading || !formData.vehicle_id}>
                                {loading ? <RefreshCw size={24} className="spin" /> : <><Shield size={20} /> EFECTIVAR RETENÇÃO</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <style>{`
                .tac-action-btn { height: 50px; padding: 0 25px; border-radius: 14px; font-weight: 950; font-size: 0.8rem; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: 0.3s; border: none; }
                .tac-action-btn.secondary { background: white; border: 2px solid #f1f5f9; color: #64748b; }
                .tac-action-btn:hover { transform: translateY(-3px); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); }

                .tactical-search-card { padding: 2.5rem; border-radius: 32px; background: white; box-shadow: 0 15px 35px -5px rgba(0,0,0,0.03); }
                .card-header { font-size: 0.75rem; font-weight: 950; color: #94a3b8; display: flex; align-items: center; gap: 10px; margin-bottom: 2rem; letter-spacing: 1px; }
                .search-box-premium { display: flex; gap: 10px; background: #f8fafc; padding: 8px; border-radius: 18px; border: 1.5px solid #f1f5f9; }
                .search-box-premium input { flex: 1; padding: 12px 15px; background: transparent; border: none; outline: none; font-weight: 950; font-size: 1.1rem; color: #0f172a; text-transform: uppercase; }
                .search-box-premium button { width: 50px; height: 50px; border-radius: 14px; border: none; background: #0f172a; color: white; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; }
                .search-box-premium button:hover { transform: scale(1.05); background: #3b82f6; }
                .search-hint { font-size: 0.75rem; color: #94a3b8; font-weight: 600; margin-top: 15px; }

                .vehicle-target-card { background: #450a0a; color: white; padding: 2.5rem; border-radius: 32px; border: none; box-shadow: 0 20px 40px -10px rgba(69, 10, 10, 0.4); }
                .v-header { display: flex; gap: 20px; align-items: center; margin-bottom: 2.5rem; }
                .v-id { width: 44px; height: 56px; background: #ef4444; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 950; font-size: 1.1rem; }
                .v-plate { font-family: 'Monaco', monospace; font-size: 2.25rem; font-weight: 950; letter-spacing: 2px; color: #ef4444; }
                .v-details { display: flex; flex-direction: column; gap: 1.5rem; }
                .v-row label { font-size: 0.65rem; font-weight: 950; color: rgba(255,255,255,0.4); letter-spacing: 1px; }
                .v-row p { margin: 4px 0 0; font-size: 1rem; font-weight: 800; }
                .v-footer { margin-top: 2.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.1); font-size: 0.75rem; font-weight: 950; color: #10b981; display: flex; align-items: center; gap: 8px; }

                .enforcement-alert { padding: 1.5rem 2rem; background: #fff1f2; border: 1.5px solid #fecaca; border-radius: 24px; display: flex; gap: 15px; color: #991b1b; }
                .enforcement-alert h4 { font-size: 0.85rem; font-weight: 950; margin: 0; }
                .enforcement-alert p { font-size: 0.75rem; font-weight: 700; margin: 4px 0 0; line-height: 1.5; }

                .protocol-form-card { padding: 4rem; border-radius: 40px; }
                .s-title { display: flex; align-items: center; gap: 12px; font-size: 0.85rem; font-weight: 950; color: #64748b; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 3rem; border-bottom: 2px solid #f8fafc; padding-bottom: 1rem; }
                .f-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2.5rem; }
                .f-group label { display: block; font-size: 0.75rem; font-weight: 950; color: #94a3b8; margin-bottom: 10px; letter-spacing: 0.5px; }
                .f-group select, .f-group input, .f-group textarea { width: 100%; padding: 16px; border-radius: 16px; border: 2.5px solid #f1f5f9; background: #f8fafc; font-size: 1rem; font-weight: 800; outline: none; transition: 0.3s; }
                .f-group select:focus, .f-group input:focus, .f-group textarea:focus { border-color: #ef4444; background: white; box-shadow: 0 10px 20px -5px rgba(239, 68, 68, 0.05); }
                .f-group textarea { min-height: 150px; resize: none; }
                
                .input-with-icon { position: relative; }
                .input-with-icon svg { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #cbd5e1; }
                .input-with-icon input { padding-left: 48px; }

                .error-banner { margin: 2rem 0; padding: 1.5rem; background: #fff1f2; border-radius: 18px; color: #ef4444; font-weight: 850; font-size: 0.9rem; display: flex; align-items: center; gap: 12px; }
                .form-actions { margin-top: 4rem; padding-top: 3rem; border-top: 2.5px solid #f8fafc; display: flex; justify-content: flex-end; }
                .confirm-btn { height: 64px; padding: 0 50px; border-radius: 20px; border: none; background: #0f172a; color: white; font-weight: 950; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; gap: 15px; transition: 0.3s; box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.4); }
                .confirm-btn:not(:disabled):hover { transform: translateY(-5px); background: #ef4444; box-shadow: 0 20px 40px -10px rgba(239, 68, 68, 0.4); }
                .confirm-btn:disabled { opacity: 0.5; cursor: not-allowed; }

                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .spin { animation: spin 1.5s linear infinite; }
            `}</style>
        </motion.div>
    );
};

export default SeizureForm;
