import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { 
    QrCode, Search, Bike, User, Shield, AlertTriangle, 
    CheckCircle, X, Info, Zap, Smartphone, ShieldCheck,
    Lock, Unlock, Activity, Target, Cpu, RefreshCw,
    AlertOctagon, Globe, MoreVertical, Camera, Scan,
    Satellite, Layers, ChevronRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../../components/PageHeader';

const Scanner = () => {
    const { profile } = useAuth();
    const [scanResult, setScanResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [scannerActive, setScannerActive] = useState(false);

    useEffect(() => {
        let scanner = null;
        if (scannerActive) {
            scanner = new Html5QrcodeScanner("reader", { 
                fps: 20, 
                qrbox: { width: 280, height: 280 },
                aspectRatio: 1.0
            });

            scanner.render(onScanSuccess, onScanError);
        }

        return () => {
            if (scanner) {
                scanner.clear().catch(err => console.error("Failed to clear scanner", err));
            }
        };
    }, [scannerActive]);

    async function onScanSuccess(decodedText) {
        setScannerActive(false);
        try {
            setLoading(true);
            setError(null);
            
            const { data, error } = await supabase
                .from('motorcycles')
                .select(`
                    *,
                    owners (*),
                    licenses (*)
                `)
                .or(`id.eq.${decodedText},plate.eq.${decodedText.toUpperCase()}`)
                .eq('municipality_id', profile.municipality_id)
                .single();

            if (error) throw new Error('ALVO NÃO LOCALIZADO NA REDE MUNICIPAL.');
            setScanResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function onScanError(err) {
        // Suppress noise
    }

    const isRegular = scanResult?.operational_status === 'Regular' && 
                      scanResult?.licenses?.some(l => l.status === 'Activa');

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '6rem' }}
        >
            <PageHeader 
                title="Validador de Campo"
                subtitle="Terminal de fiscalização instantânea com reconhecimento de vectores e auditoria central."
                breadcrumbs={[
                    { label: 'Painel', path: '/admin/dashboard' },
                    { label: 'Scanner' }
                ]}
                actions={
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div className="status-indicator-premium">
                            <Satellite size={14} /> LINK ENCRIPTADO
                        </div>
                    </div>
                }
            />

            {/* Tactical Briefing Bar */}
            <div className="tactical-status-bar scanner-spec">
                <StatusItem icon={<Smartphone size={18} />} label="TERMINAL" value="MOBILE-V4" color="#3b82f6" />
                <div className="v-divider"></div>
                <StatusItem icon={<Activity size={18} />} label="SINAL" value="OTIMIZADO" color="#10b981" />
                <div className="b-search-placeholder">
                    <Target size={18} /> PRONTO PARA VARREDURA
                </div>
            </div>

            <AnimatePresence mode="wait">
                {!scannerActive && !scanResult && !loading && !error && (
                    <motion.div 
                        key="idle"
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="scanner-init-card"
                    >
                        <div className="scan-hub-visual">
                            <div className="hub-ring pulse-slow"></div>
                            <div className="hub-core">
                                <Scan size={48} strokeWidth={1.5} />
                            </div>
                        </div>
                        <h3>INICIAR FISCALIZAÇÃO</h3>
                        <p>Aposição táctica da câmara sobre o QR Code municipal ou identificador de placa.</p>
                        <button 
                            onClick={() => setScannerActive(true)}
                            className="tac-btn-primary large"
                        >
                            <Camera size={22} /> ACTIVAR CÂMARA
                        </button>
                    </motion.div>
                )}

                {scannerActive && (
                    <motion.div 
                        key="scanner"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="scanner-active-frame"
                    >
                        <div id="reader"></div>
                        <div className="scanner-hud">
                            <div className="hud-corner tl"></div>
                            <div className="hud-corner tr"></div>
                            <div className="hud-corner bl"></div>
                            <div className="hud-corner br"></div>
                            <div className="scan-beam"></div>
                        </div>
                        <button onClick={() => setScannerActive(false)} className="abort-scan-btn">
                            <X size={24} />
                        </button>
                        <div className="hud-label">SISTEMA AGUARDANDO FOCO NO ALVO</div>
                    </motion.div>
                )}

                {loading && (
                    <motion.div 
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="scanner-loading-card"
                    >
                        <div className="cyber-loader">
                            <RefreshCw size={40} className="spin" />
                        </div>
                        <h4>CONFIGURANDO VECTORES</h4>
                        <p>Descriptografando base de dados central...</p>
                        <div className="progress-track">
                            <motion.div 
                                className="progress-bar"
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                        </div>
                    </motion.div>
                )}

                {error && (
                    <motion.div 
                        key="error"
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="scanner-error-card"
                    >
                        <AlertOctagon size={64} className="err-icon" />
                        <h3>ALVO NÃO LOCALIZADO</h3>
                        <p>{error}</p>
                        <button onClick={() => {setError(null); setScannerActive(true);}} className="tac-btn-outline">
                            <RefreshCw size={18} /> TENTAR NOVAMENTE
                        </button>
                    </motion.div>
                )}

                {scanResult && !loading && (
                    <motion.div 
                        key="result"
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="scanner-result-dossier"
                    >
                        <div className={`status-briefing ${isRegular ? 'success' : 'danger'}`}>
                            <div className="s-icon">
                                {isRegular ? <ShieldCheck size={32} /> : <AlertTriangle size={32} />}
                            </div>
                            <div className="s-info">
                                <h4>{isRegular ? 'CONFORMIDADE EXECUTADA' : 'INFRACÇÃO DETECTADA'}</h4>
                                <p>{isRegular ? 'O veículo e proprietário encontram-se regulares na base.' : 'Pendências críticas localizadas. Proceder com apreensão.'}</p>
                            </div>
                        </div>

                        <div className="dossier-card-premium">
                            <div className="d-header">
                                <div className="d-plate">
                                    <label>{scanResult.brand} {scanResult.model}</label>
                                    <div className="p-val">{scanResult.plate}</div>
                                </div>
                                <div className="d-type-icon">
                                    <Bike size={28} />
                                </div>
                            </div>

                            <div className="d-body">
                                <DossierRow icon={<User size={18} />} label="RESPONSÁVEL LEGAL" value={scanResult.owners?.full_name} />
                                <DossierRow 
                                    icon={<Activity size={18} />} 
                                    label="ESTADO DO ACTIVO" 
                                    value={scanResult.operational_status?.toUpperCase()} 
                                    color={scanResult.operational_status === 'Regular' ? '#10b981' : '#ef4444'}
                                />
                                <DossierRow 
                                    icon={<Shield size={18} />} 
                                    label="LICENCIAMENTO" 
                                    value={scanResult.licenses?.[0]?.status === 'Activa' ? 'VIGENTE' : 'CADUCADO'} 
                                    color={scanResult.licenses?.[0]?.status === 'Activa' ? '#10b981' : '#ef4444'}
                                />
                            </div>

                            <div className="d-footer-actions">
                                <button onClick={() => {setScanResult(null); setScannerActive(true);}} className="tac-btn primary">
                                    NOVA VARREDURA <RefreshCw size={18} />
                                </button>
                                <button className="tac-btn secondary">
                                    VER DOSSIER <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="audit-tag">
                            <Globe size={14} />
                            OPERAÇÃO AUDITADA PELO CENTRO DE COMANDO MUNICIPAL
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .status-indicator-premium { padding: 6px 12px; background: #ecfdf5; border: 1.5px solid #10b98130; color: #10b981; border-radius: 8px; font-size: 0.65rem; font-weight: 950; display: flex; align-items: center; gap: 8px; letter-spacing: 1px; }

                .tactical-status-bar { display: flex; align-items: center; gap: 2rem; background: #0f172a; padding: 1.25rem 2rem; border-radius: 20px; color: white; margin-bottom: 2.5rem; }
                .tactical-status-bar.scanner-spec { border-right: 8px solid #3b82f6; }
                .b-item { display: flex; align-items: center; gap: 10px; font-size: 0.7rem; font-weight: 800; color: rgba(255,255,255,0.6); }
                .b-item strong { color: white; font-weight: 950; }
                .v-divider { width: 1.5px; height: 12px; background: rgba(255,255,255,0.1); }
                .b-search-placeholder { margin-left: auto; display: flex; align-items: center; gap: 10px; font-size: 0.7rem; font-weight: 950; color: #3b82f6; letter-spacing: 1px; }

                .scanner-init-card { background: white; padding: 4rem 2rem; border-radius: 40px; text-align: center; box-shadow: 0 30px 60px -15px rgba(0,0,0,0.06); }
                .scan-hub-visual { position: relative; width: 120px; height: 120px; margin: 0 auto 2.5rem auto; display: flex; align-items: center; justify-content: center; }
                .hub-ring { position: absolute; inset: 0; border: 4px solid #3b82f615; border-radius: 40px; }
                .hub-core { width: 90px; height: 90px; background: #eff6ff; color: #3b82f6; border-radius: 30px; display: flex; align-items: center; justify-content: center; }
                .scanner-init-card h3 { font-size: 1.5rem; font-weight: 950; color: #0f172a; margin-bottom: 12px; }
                .scanner-init-card p { font-size: 1rem; color: #64748b; font-weight: 600; line-height: 1.6; margin-bottom: 3rem; }

                .tac-btn-primary.large { height: 72px; width: 100%; background: #0f172a; color: white; border: none; border-radius: 22px; font-weight: 950; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; gap: 12px; cursor: pointer; transition: 0.3s; box-shadow: 0 15px 30px -5px rgba(15, 23, 42, 0.3); }
                .tac-btn-primary.large:hover { transform: translateY(-3px); background: #1e293b; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.4); }

                .scanner-active-frame { position: relative; height: 500px; background: black; border-radius: 45px; border: 8px solid #0f172a; overflow: hidden; box-shadow: 0 40px 80px -20px rgba(0,0,0,0.3); }
                #reader { width: 100%; height: 100%; }
                #reader video { object-fit: cover !important; }
                .scanner-hud { position: absolute; inset: 60px; pointer-events: none; }
                .hud-corner { position: absolute; width: 35px; height: 35px; border: 4px solid #3b82f6; }
                .tl { top: 0; left: 0; border-right: none; border-bottom: none; }
                .tr { top: 0; right: 0; border-left: none; border-bottom: none; }
                .bl { bottom: 0; left: 0; border-right: none; border-top: none; }
                .br { bottom: 0; right: 0; border-left: none; border-top: none; }
                .scan-beam { position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, transparent, #3b82f6, transparent); animation: beam 2s infinite linear; }
                @keyframes beam { from { top: 0; } to { top: 100%; } }
                
                .abort-scan-btn { position: absolute; top: 25px; right: 25px; width: 50px; height: 50px; border-radius: 50%; background: rgba(239, 68, 68, 0.9); color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); }
                .hud-label { position: absolute; bottom: 35px; left: 0; right: 0; text-align: center; color: white; font-size: 0.75rem; font-weight: 950; letter-spacing: 1px; text-shadow: 0 2px 5px rgba(0,0,0,0.5); }

                .scanner-loading-card { background: white; padding: 5rem 3rem; border-radius: 40px; text-align: center; }
                .cyber-loader { color: #3b82f6; margin-bottom: 2rem; }
                .scanner-loading-card h4 { font-size: 1.1rem; font-weight: 950; color: #0f172a; letter-spacing: 1px; margin-bottom: 8px; }
                .scanner-loading-card p { font-size: 0.9rem; color: #94a3b8; font-weight: 700; }
                .progress-track { width: 100%; height: 8px; background: #f1f5f9; border-radius: 10px; margin-top: 3rem; overflow: hidden; }
                .progress-bar { height: 100%; background: #3b82f6; border-radius: 10px; }

                .scanner-error-card { background: #fff1f2; padding: 4rem 3rem; border-radius: 40px; text-align: center; color: #991b1b; }
                .err-icon { margin-bottom: 1.5rem; }
                .scanner-error-card h3 { font-size: 1.5rem; font-weight: 950; margin-bottom: 12px; }
                .scanner-error-card p { font-size: 1rem; font-weight: 700; opacity: 0.8; margin-bottom: 3rem; }
                .tac-btn-outline { width: 100%; height: 64px; border: 2.5px solid #ef4444; background: transparent; color: #ef4444; border-radius: 20px; font-weight: 950; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; }

                .scanner-result-dossier { display: flex; flex-direction: column; gap: 1.5rem; }
                .status-briefing { padding: 2rem; border-radius: 32px; display: flex; align-items: center; gap: 20px; box-shadow: 0 10px 30px -5px rgba(0,0,0,0.05); }
                .status-briefing.success { background: #ecfdf5; color: #065f46; border: 2.5px solid #10b981; }
                .status-briefing.danger { background: #fff1f2; color: #991b1b; border: 2.5px solid #ef4444; }
                .s-info h4 { margin: 0; font-size: 1.15rem; font-weight: 950; letter-spacing: -0.5px; }
                .s-info p { margin: 4px 0 0; font-size: 0.85rem; font-weight: 700; opacity: 0.8; line-height: 1.5; }

                .dossier-card-premium { background: white; border-radius: 40px; padding: 3.5rem; box-shadow: 0 30px 60px -15px rgba(0,0,0,0.05); }
                .d-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3rem; border-bottom: 2.5px solid #f8fafc; padding-bottom: 2rem; }
                .d-plate label { display: block; font-size: 0.8rem; font-weight: 950; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; }
                .p-val { font-family: 'Monaco', monospace; font-size: 3.5rem; font-weight: 950; color: #0f172a; line-height: 1; letter-spacing: -2px; margin-top: 8px; }
                .d-type-icon { background: #f8fafc; padding: 20px; border-radius: 20px; color: #cbd5e1; }

                .d-body { display: flex; flex-direction: column; gap: 2rem; }
                .d-row { display: flex; align-items: center; gap: 15px; }
                .d-icon { width: 44px; height: 44px; background: #f8fafc; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #94a3b8; }
                .d-content label { display: block; font-size: 0.65rem; font-weight: 950; color: #cbd5e1; letter-spacing: 1px; }
                .d-content p { margin: 2px 0 0; font-size: 1.1rem; font-weight: 900; color: #1e293b; }

                .d-footer-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 4rem; }
                .tac-btn { height: 64px; border-radius: 20px; border: none; font-weight: 950; font-size: 0.9rem; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 10px; }
                .tac-btn.primary { background: #0f172a; color: white; }
                .tac-btn.secondary { background: #f1f5f9; color: #64748b; }
                .tac-btn:hover { transform: translateY(-3px); box-shadow: 0 10px 20px -5px rgba(0,0,0,0.1); }

                .audit-tag { text-align: center; font-size: 0.65rem; font-weight: 900; color: #cbd5e1; padding: 1.5rem; display: flex; align-items: center; justify-content: center; gap: 10px; letter-spacing: 0.5px; }

                @keyframes spin { to { transform: rotate(360deg); } }
                .spin { animation: spin 1.5s linear infinite; }
                .pulse-slow { animation: pulse 3s infinite ease-in-out; }
                @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }
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

const DossierRow = ({ icon, label, value, color }) => (
    <div className="d-row">
        <div className="d-icon">{icon}</div>
        <div className="d-content">
            <label>{label}</label>
            <p style={{ color: color || '#1e293b' }}>{value}</p>
        </div>
    </div>
);

export default Scanner;
