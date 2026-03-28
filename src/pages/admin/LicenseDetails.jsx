import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Edit, User, Bike, Printer, 
    FileText, CheckCircle, AlertTriangle, Info, 
    Calendar, Shield, Wallet, RefreshCw, Eye, 
    History, Clock, CheckCircle2, MapPin, Hash,
    FileCheck, Download, ExternalLink, AlertCircle,
    BadgeCheck, ShieldCheck, Target, Gavel,
    FileDigit, Landmark, Stamp, MoreVertical, Archive
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../../components/PageHeader';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

const LicenseDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [license, setLicense] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLicenseData();
    }, [id]);

    const fetchLicenseData = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('licenses')
                .select(`
                    *,
                    vehicles:vehicle_id (*),
                    owners (*)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            setLicense(data);
        } catch (error) {
            console.error('Erro ao buscar licença:', error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '30px' }}>
            <motion.div 
                animate={{ rotate: 360, scale: [1, 1.1, 1] }} 
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                style={{ width: '64px', height: '64px', borderRadius: '18px', background: '#f8fafc', border: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                <RefreshCw size={32} color="#3b82f6" />
            </motion.div>
            <p style={{ fontWeight: '950', color: '#0f172a', letterSpacing: '1px' }}>VERIFICANDO ALVARÁ MUNICIPAL</p>
        </div>
    );

    if (!license) return <div className="p-12 text-center text-red-500 font-black">ERRO: ALVARÁ NÃO LOCALIZADO NO REPOSITÓRIO.</div>;

    const isExpired = new Date(license.expiry_date) < new Date();
    const statusColor = license.status === 'active' ? '#10b981' : '#ef4444';

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ maxWidth: '1300px', margin: '0 auto', paddingBottom: '6rem' }}
        >
            <PageHeader 
                title={`Alvará #${license.license_number}`}
                subtitle="Certificação Oficial de Circulação e Exploração de Atividade de Transporte"
                breadcrumbs={[
                    { label: 'Painel', path: '/admin/dashboard' },
                    { label: 'Licenças', path: '/admin/licenses' },
                    { label: 'Certificado' }
                ]}
                actions={
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => window.print()} className="tac-action-btn secondary">
                            <Printer size={18} /> IMPRIMIR CERTIFICADO
                        </button>
                        <Link to={`/admin/licenses/edit/${id}`} className="tac-action-btn primary">
                            <Edit size={18} /> RECTIFICAR ALVARÁ
                        </Link>
                    </div>
                }
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2.5rem' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* The Premium Certificate Card */}
                    <div className="card certificate-plate">
                        <div className="cert-border-accent" style={{ background: statusColor }}></div>
                        <div className="cert-pattern"></div>
                        
                        <div className="cert-content">
                            <div className="cert-header">
                                <div className="cert-identity">
                                    <div className="cert-seal" style={{ border: `4px solid ${statusColor}30`, color: statusColor }}>
                                        <FileDigit size={40} />
                                    </div>
                                    <div>
                                        <h2 className="cert-title">ALVARÁ MUNICIPAL</h2>
                                        <div className="cert-badges">
                                            <span className={`pill-badge ${isExpired ? 'expired' : 'active'}`}>
                                                {isExpired ? 'EXPIRADA' : 'VÁLIDA'}
                                            </span>
                                            <div className="p-dot"></div>
                                            <span className="cert-serial">Ref: {license.license_type || 'Transporte'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="cert-auth-box">
                                    <div className="auth-label">VERIFICAÇÃO DIGITAL</div>
                                    <div className="auth-code">{license.id.slice(0, 12).toUpperCase()}</div>
                                </div>
                            </div>

                            <div className="cert-body">
                                <div className="cert-section">
                                    <h3 className="s-title"><User size={18} /> TITULAR DO ALVARÁ</h3>
                                    <div className="s-content">
                                        <div className="data-item">
                                            <label>NOME COMPLETO</label>
                                            <p className="val-xl">{license.owners?.full_name}</p>
                                        </div>
                                        <div className="data-row">
                                            <div className="data-item">
                                                <label>IDENTIDADE</label>
                                                <p>{license.owners?.bi_number}</p>
                                            </div>
                                            <div className="data-item">
                                                <label>NUIT</label>
                                                <p>{license.owners?.nuit || 'PENDENTE'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="cert-section">
                                    <h3 className="s-title"><Bike size={18} /> UNIDADE MÓVEL VINCULADA</h3>
                                    <div className="s-content">
                                        <div className="vehicle-plate-box">
                                            <div className="v-plate">{license.vehicles?.plate}</div>
                                            <div className="v-divider"></div>
                                            <div className="v-info">
                                                <p className="v-name">{license.vehicles?.brand} {license.vehicles?.model}</p>
                                                <p className="v-specs">{license.vehicles?.color} • {license.vehicles?.year}</p>
                                            </div>
                                            <Link to={`/admin/motorcycles/${license.vehicle_id}`} className="v-link">
                                                <ExternalLink size={18} />
                                            </Link>
                                        </div>
                                        <div className="data-item mt-6">
                                            <label>NÚMERO DE CHASSIS</label>
                                            <p className="mono-val">{license.vehicles?.chassis}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="cert-footer">
                                <div className="f-item">
                                    <Calendar size={20} />
                                    <div>
                                        <label>EMISSÃO</label>
                                        <p>{format(new Date(license.issue_date), "dd 'de' MMM, yyyy", { locale: pt })}</p>
                                    </div>
                                </div>
                                <div className="f-item">
                                    <Clock size={20} color={isExpired ? '#ef4444' : '#10b981'} />
                                    <div>
                                        <label>VALIDADE</label>
                                        <p style={{ color: isExpired ? '#ef4444' : '#10b981' }}>{format(new Date(license.expiry_date), "dd 'de' MMM, yyyy", { locale: pt })}</p>
                                    </div>
                                </div>
                                <div className="f-item">
                                    <Stamp size={20} color="#3b82f6" />
                                    <div>
                                        <label>TAXA PAGA</label>
                                        <p className="val-highlight">{Number(license.value).toLocaleString()} MT</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    <div className="card side-intel">
                        <h3><ShieldCheck size={20} /> STATUS LEGAL</h3>
                        <div className="intel-content">
                            <div className="status-flow">
                                <div className="step done"><CheckCircle2 size={16} /> Emissão Registada</div>
                                <div className="step line"></div>
                                <div className="step done"><CheckCircle2 size={16} /> Taxa Liquidada</div>
                                <div className="step line"></div>
                                <div className={`step ${isExpired ? 'error' : 'done'}`}>
                                    {isExpired ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                                    {isExpired ? 'Vencido' : 'Actualizado'}
                                </div>
                            </div>
                            
                            {isExpired && (
                                <div className="expiry-alert">
                                    <p>Esta licença ultrapassou a validade legal. O veículo deve ser retirado de circulação.</p>
                                    <button onClick={() => navigate(`/admin/licenses/renew/${id}`)} className="renew-btn">SOLICITAR RENOVAÇÃO AGORA</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card doc-archive">
                        <h3><Archive size={20} /> ARQUIVO DIGITAL</h3>
                        <div className="doc-list">
                            <button className="doc-item"><Download size={18} /> Prova de Pagamento</button>
                            <button className="doc-item"><Download size={18} /> Inspecção Física</button>
                            <button className="doc-item"><Download size={18} /> Termos do Alvará</button>
                        </div>
                    </div>

                    <div className="audit-note">
                        <Gavel size={20} color="#94a3b8" />
                        <p>Documento autenticado centralmente. Modificações não autorizadas constituem crime de falsificação de documentos públicos.</p>
                    </div>
                </div>
            </div>

            <style>{`
                .tac-action-btn { height: 50px; padding: 0 25px; border-radius: 14px; font-weight: 950; font-size: 0.8rem; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: 0.3s; border: none; }
                .tac-action-btn.primary { background: #0f172a; color: white; }
                .tac-action-btn.secondary { background: white; border: 2px solid #f1f5f9; color: #64748b; }
                .tac-action-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 20px -5px rgba(0,0,0,0.1); }

                .certificate-plate { position: relative; background: #ffffff; border-radius: 40px; border: none; box-shadow: 0 30px 60px -15px rgba(0,0,0,0.08); overflow: hidden; }
                .cert-border-accent { position: absolute; top: 0; left: 0; right: 0; height: 10px; z-index: 5; }
                .cert-pattern { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('https://www.transparenttextures.com/patterns/cubes.png'); opacity: 0.03; pointer-events: none; }
                
                .cert-content { position: relative; z-index: 1; padding: 4.5rem; }
                
                .cert-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5rem; }
                .cert-identity { display: flex; gap: 2.5rem; align-items: center; }
                .cert-seal { width: 90px; height: 90px; border-radius: 28px; background: #f8fafc; display: flex; align-items: center; justify-content: center; }
                .cert-title { margin: 0; font-size: 2.5rem; font-weight: 950; color: #0f172a; letter-spacing: -1.5px; }
                .cert-badges { display: flex; align-items: center; gap: 12px; margin-top: 10px; }
                .pill-badge { padding: 6px 14px; borderRadius: 8px; font-size: 0.75rem; font-weight: 950; letter-spacing: 1px; }
                .pill-badge.active { background: #f0fdf4; color: #10b981; }
                .pill-badge.expired { background: #fff1f2; color: #ef4444; }
                .p-dot { width: 5px; height: 5px; borderRadius: 50%; background: #e2e8f0; }
                .cert-serial { font-size: 0.85rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }

                .cert-auth-box { text-align: right; }
                .auth-label { font-size: 0.65rem; font-weight: 950; color: #94a3b8; letter-spacing: 1.5px; margin-bottom: 8px; }
                .auth-code { font-family: 'Monaco', monospace; font-size: 1.15rem; font-weight: 950; color: #1e293b; background: #f8fafc; padding: 12px 24px; border-radius: 14px; border: 1.5px dashed #cbd5e1; letter-spacing: 1.5px; }

                .cert-body { display: grid; grid-template-columns: 1fr 1fr; gap: 4.5rem; margin-bottom: 5rem; }
                .s-title { display: flex; align-items: center; gap: 12px; font-size: 0.8rem; font-weight: 950; color: #64748b; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 2.5rem; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; }
                .data-item { margin-bottom: 2.25rem; }
                .data-item label { display: block; font-size: 0.65rem; font-weight: 950; color: #cbd5e1; margin-bottom: 8px; letter-spacing: 0.5px; }
                .data-item p { margin: 0; font-size: 1.15rem; font-weight: 800; color: #0f172a; }
                .val-xl { font-size: 1.75rem !important; fontWeight: 950 !important; letter-spacing: -0.5px; color: #1e293b !important; }
                .data-row { display: grid; grid-template-columns: 1.2fr 1fr; gap: 2rem; }

                .vehicle-plate-box { background: #f8fafc; padding: 1.75rem; border-radius: 28px; border: 1.5px solid #f1f5f9; display: flex; align-items: center; gap: 20px; box-shadow: 0 10px 20px -5px rgba(0,0,0,0.02); }
                .v-plate { font-family: 'Monaco', monospace; font-size: 2.25rem; font-weight: 950; color: #0f172a; letter-spacing: 1.5px; }
                .v-divider { width: 2px; height: 50px; background: #e2e8f0; }
                .v-name { font-size: 0.95rem; font-weight: 950; color: #1e293b; margin: 0; }
                .v-specs { font-size: 0.8rem; font-weight: 700; color: #94a3b8; margin: 4px 0 0; }
                .v-link { marginLeft: auto; width: 44px; height: 44px; borderRadius: 14px; background: white; border: 1.5px solid #e2e8f0; display: flex; items: center; justifyContent: center; color: #3b82f6; transition: 0.3s; }
                .v-link:hover { background: #3b82f6; color: white; border-color: #3b82f6; transform: rotate(-10deg); }

                .mono-val { font-family: 'Monaco', monospace; font-size: 1.1rem; font-weight: 950; color: #2563eb; background: #eff6ff; padding: 8px 16px; border-radius: 10px; display: inline-block; }

                .cert-footer { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3rem; padding: 3rem; background: #f8fafc; border-radius: 28px; border: 1.5px solid #f1f5f9; }
                .f-item { display: flex; gap: 18px; align-items: center; }
                .f-item label { color: #94a3b8; font-size: 0.7rem; font-weight: 950; letter-spacing: 1px; }
                .f-item p { margin: 4px 0 0; font-size: 1.1rem; font-weight: 950; color: #0f172a; }
                .val-highlight { color: #10b981 !important; }

                .side-intel h3, .doc-archive h3 { font-size: 0.85rem; font-weight: 950; color: #0f172a; margin-bottom: 2rem; display: flex; align-items: center; gap: 10px; }
                .status-flow { display: flex; flex-direction: column; gap: 15px; }
                .step { display: flex; align-items: center; gap: 12px; font-size: 0.9rem; font-weight: 800; }
                .step.done { color: #0f172a; }
                .step.error { color: #ef4444; }
                .step.line { width: 2px; height: 15px; background: #e2e8f0; marginLeft: 7px; }
                
                .expiry-alert { margin-top: 2rem; padding: 1.5rem; background: #fff1f2; border-radius: 20px; border: 1.5px solid #fecaca; }
                .expiry-alert p { font-size: 0.85rem; color: #991b1b; fontWeight: 700; line-height: 1.6; margin: 0 0 1.5rem; }
                .renew-btn { width: 100%; padding: 15px; background: #ef4444; color: white; border: none; border-radius: 12px; font-weight: 950; font-size: 0.85rem; cursor: pointer; transition: 0.3s; }
                .renew-btn:hover { background: #dc2626; transform: translateY(-3px); box-shadow: 0 10px 20px -5px rgba(220, 38, 38, 0.3); }

                .doc-list { display: grid; gap: 10px; }
                .doc-item { width: 100%; padding: 18px; border-radius: 18px; border: 1.5px solid #f1f5f9; background: white; color: #0f172a; font-weight: 850; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: 0.3s; }
                .doc-item:hover { background: #f8fafc; border-color: #cbd5e1; transform: translateX(5px); }

                .audit-note { display: flex; gap: 15px; padding: 2rem; background: #f8fafc; border-radius: 24px; border: 1.5px solid #f1f5f9; }
                .audit-note p { font-size: 0.8rem; color: #94a3b8; fontWeight: 600; line-height: 1.6; margin: 0; }

                @media print {
                    .tac-action-btn, .side-intel, .doc-archive, .v-link, .audit-note { display: none !important; }
                    body { background: white !important; }
                    .certificate-plate { box-shadow: none !important; border: 2px solid #000 !important; }
                    .cert-content { padding: 3rem !important; }
                    .cert-auth-box { border: 1px solid black; padding: 10px; }
                }
            `}</style>
        </motion.div>
    );
};

export default LicenseDetails;
