import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
    ArrowLeft, Edit, User, Bike, Printer, 
    FileText, CheckCircle, AlertTriangle, Info, 
    Calendar, Shield, Wallet, RefreshCw, Eye, Plus,
    History, Clock, CheckCircle2, MapPin, Search,
    Fingerprint, Gauge, Palette, Hash, MoreVertical,
    Download, Share2, ClipboardList, Target, Gavel,
    ShieldCheck, AlertOctagon, Archive, ShieldAlert
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../../components/PageHeader';

const MotorcycleDetails = () => {
    const { id } = useParams();
    const [motorcycle, setMotorcycle] = useState(null);
    const [licenses, setLicenses] = useState([]);
    const [fines, setFines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dossier');

    useEffect(() => {
        fetchMotorcycleData();
    }, [id]);

    const fetchMotorcycleData = async () => {
        try {
            setLoading(true);
            const { data: moto, error: motoError } = await supabase
                .from('motorcycles')
                .select('*, owners(*), profiles(full_name)')
                .eq('id', id)
                .single();

            if (motoError) throw motoError;
            setMotorcycle(moto);

            const [licRes, fineRes] = await Promise.all([
                supabase.from('licenses').select('*').eq('vehicle_id', id).order('issue_date', { ascending: false }),
                supabase.from('fines').select('*, profiles(full_name)').eq('vehicle_id', id).order('created_at', { ascending: false })
            ]);

            setLicenses(licRes.data || []);
            setFines(fineRes.data || []);

        } catch (error) {
            console.error('Erro ao buscar dados:', error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '30px' }}>
            <motion.div 
                animate={{ rotate: 360, scale: [1, 1.2, 1] }} 
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                style={{ width: '80px', height: '80px', borderRadius: '24px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                <RefreshCw size={40} color="#3b82f6" />
            </motion.div>
            <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: '950', color: '#0f172a', fontSize: '1.1rem', margin: 0 }}>DESCRIPTOGRAFANDO DOSSIER</p>
                <p style={{ fontWeight: '700', color: '#94a3b8', fontSize: '0.85rem', marginTop: '5px' }}>Acedendo à base de dados municipal centralizada...</p>
            </div>
        </div>
    );

    if (!motorcycle) return <div className="p-12 text-center text-red-500 font-black">ALERTA: VEÍCULO INEXISTENTE NO REPOSITÓRIO.</div>;

    const activeLicense = licenses.find(l => l.status === 'active');
    const isExpired = activeLicense && new Date(activeLicense.expiry_date) < new Date();
    const unpaidFines = fines.filter(f => f.status === 'pending').length;

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '6rem' }}
        >
            <PageHeader 
                title={motorcycle.plate}
                subtitle={`${motorcycle.brand} ${motorcycle.model} • Dossier Forense de Activo`}
                breadcrumbs={[
                    { label: 'Painel', path: '/admin/dashboard' },
                    { label: 'Frota', path: '/admin/motorcycles' },
                    { label: 'Dossier' }
                ]}
                actions={
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => window.print()} className="tac-action-btn secondary">
                            <Printer size={18} /> IMPRIMIR FICHA
                        </button>
                        <Link to={`/admin/motorcycles/edit/${id}`} className="tac-action-btn primary">
                            <Edit size={18} /> RECTIFICAR DADOS
                        </Link>
                    </div>
                }
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2.5rem' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* High-Fidelity Identity Plate */}
                    <div className="card identity-plate">
                        <div className="id-overlay"></div>
                        <div className="id-content">
                            <div className="id-main">
                                <div className="id-badge">MZ</div>
                                <div>
                                    <h1 className="plate-text-ultra">{motorcycle.plate}</h1>
                                    <div className="plate-sub">
                                        <div className="p-tag">{motorcycle.brand} {motorcycle.model}</div>
                                        <div className="p-dot"></div>
                                        <div className="p-tag">{motorcycle.color}</div>
                                        <div className="p-dot"></div>
                                        <div className="p-tag">{motorcycle.year}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="id-status-panel">
                                <div className={`status-pill ${isExpired ? 'expired' : 'active'}`}>
                                    {isExpired ? <AlertOctagon size={16} /> : <ShieldCheck size={16} />}
                                    {isExpired ? 'LICENÇA EXPIRADA' : 'SITUAÇÃO REGULAR'}
                                </div>
                                <div className="id-meta">ID: {motorcycle.id.slice(0, 8).toUpperCase()}</div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="tactical-tabs">
                        <TabBtn active={activeTab === 'dossier'} onClick={() => setActiveTab('dossier')} icon={<Fingerprint size={18} />}>Dossier do Proprietário</TabBtn>
                        <TabBtn active={activeTab === 'tecnico'} onClick={() => setActiveTab('tecnico')} icon={<Gauge size={18} />}>Especificações Técnicas</TabBtn>
                        <TabBtn active={activeTab === 'historico'} onClick={() => setActiveTab('historico')} icon={<History size={18} />}>Histórico Legal</TabBtn>
                    </div>

                    {/* Content Area */}
                    <div className="tab-content-box">
                        <AnimatePresence mode="wait">
                            {activeTab === 'dossier' && (
                                <motion.div 
                                    key="dossier" 
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="dossier-grid"
                                >
                                    <div className="dossier-card">
                                        <div className="d-header"><User size={20} /> TITULAR DO REGISTO</div>
                                        <div className="d-body">
                                            <div className="field">
                                                <label>NOME COMPLETO</label>
                                                <p className="val-lg">{motorcycle.owners?.full_name}</p>
                                            </div>
                                            <div className="field-row">
                                                <div className="field">
                                                    <label>BI / DOCUMENTO</label>
                                                    <p>{motorcycle.owners?.bi_number}</p>
                                                </div>
                                                <div className="field">
                                                    <label>NUIT</label>
                                                    <p>{motorcycle.owners?.nuit || 'PENDENTE'}</p>
                                                </div>
                                            </div>
                                            <div className="field">
                                                <label>CANAL DE CONTACTO</label>
                                                <p className="val-link">{motorcycle.owners?.phone}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="dossier-card">
                                        <div className="d-header"><MapPin size={20} /> ALOCAÇÃO OPERACIONAL</div>
                                        <div className="d-body">
                                            <div className="field">
                                                <label>FINALIDADE DO VEÍCULO</label>
                                                <p className="val-badge">{motorcycle.purpose}</p>
                                            </div>
                                            <div className="field">
                                                <label>ASSOCIAÇÃO / PRAÇA</label>
                                                <p>{motorcycle.taxi_association || 'CIRCULAÇÃO INDEPENDENTE'}</p>
                                            </div>
                                            {motorcycle.purpose === 'Moto-Táxi' && (
                                                <div className="tactical-sub-card">
                                                    <div className="s-label">IDENTIFICADOR DE COLETE</div>
                                                    <div className="s-val">{motorcycle.taxi_vest_number}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'tecnico' && (
                                <motion.div 
                                    key="tecnico"
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="specs-grid"
                                >
                                    <div className="spec-item">
                                        <div className="s-icon"><Hash size={24} /></div>
                                        <div>
                                            <label>NÚMERO DE CHASSIS (S/N)</label>
                                            <p className="mono-val">{motorcycle.chassis}</p>
                                        </div>
                                    </div>
                                    <div className="spec-item">
                                        <div className="s-icon"><Gauge size={24} /></div>
                                        <div>
                                            <label>CILINDRADA MOTOR</label>
                                            <p className="val">{motorcycle.cc} CC</p>
                                        </div>
                                    </div>
                                    <div className="spec-item">
                                        <div className="s-icon"><Palette size={24} /></div>
                                        <div>
                                            <label>COR PREDOMINANTE</label>
                                            <p className="val">{motorcycle.color}</p>
                                        </div>
                                    </div>
                                    <div className="spec-item">
                                        <div className="s-icon"><ClipboardList size={24} /></div>
                                        <div>
                                            <label>ESTADO DE CONSERVAÇÃO</label>
                                            <p className="val">{motorcycle.status}</p>
                                        </div>
                                    </div>
                                    <div className="spec-full-item">
                                        <label>OBSERVAÇÕES FORENSES</label>
                                        <p>{motorcycle.observations || 'Nenhuma nota técnica relevante registada.'}</p>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'historico' && (
                                <motion.div 
                                    key="historico"
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="history-list"
                                >
                                    <div className="hist-section">
                                        <h4>LICENCIAMENTO ANUAL</h4>
                                        <div className="table-wrap">
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>REF.</th>
                                                        <th>EMISSÃO</th>
                                                        <th>VALIDADE</th>
                                                        <th>VALOR</th>
                                                        <th>ESTADO</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {licenses.map(lic => (
                                                        <tr key={lic.id}>
                                                            <td className="bold">#{lic.license_number}</td>
                                                            <td>{new Date(lic.issue_date).toLocaleDateString()}</td>
                                                            <td className={new Date(lic.expiry_date) < new Date() ? 'danger' : 'success'}>
                                                                {new Date(lic.expiry_date).toLocaleDateString()}
                                                            </td>
                                                            <td className="bold">{Number(lic.value).toLocaleString()} MT</td>
                                                            <td><span className={`pill-status ${lic.status.toLowerCase()}`}>{lic.status}</span></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="hist-section mt-12">
                                        <h4>HISTÓRICO DE ENFORCEMENT (MULTAS)</h4>
                                        <div className="table-wrap">
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>DATA</th>
                                                        <th>INFRACÇÃO</th>
                                                        <th>VALOR</th>
                                                        <th>ESTADO</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {fines.map(fine => (
                                                        <tr key={fine.id}>
                                                            <td>{new Date(fine.created_at).toLocaleDateString()}</td>
                                                            <td>{fine.infraction_type}</td>
                                                            <td className="bold">{Number(fine.value).toLocaleString()} MT</td>
                                                            <td><span className={`pill-status ${fine.status.toLowerCase()}`}>{fine.status}</span></td>
                                                        </tr>
                                                    ))}
                                                    {fines.length === 0 && <tr><td colSpan="4" className="empty-row">NENHUMA INFRACÇÃO REGISTADA</td></tr>}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right Side: Operational Intelligence */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    <div className="card intel-summary">
                        <h3><Target size={20} /> RESUMO FINANCEIRO</h3>
                        <div className="intel-body">
                            <div className="i-stat">
                                <label>INVESTIMENTO EM TAXAS</label>
                                <p>{licenses.reduce((acc, l) => acc + Number(l.value), 0).toLocaleString()} MT</p>
                            </div>
                            <div className="i-stat alert">
                                <label>MULTAS ACTIVAS</label>
                                <p>{fines.filter(f => f.status === 'pending').reduce((acc, f) => acc + Number(f.value), 0).toLocaleString()} MT</p>
                            </div>
                            <div className="total-box">
                                <label>ACUMULADO MUNICIPAL</label>
                                <div className="t-val">
                                    {(licenses.reduce((acc, l) => acc + Number(l.value), 0) + fines.reduce((acc, f) => acc + Number(f.value), 0)).toLocaleString()} <span>MT</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card tech-audit">
                        <div className="audit-header">
                            <ShieldAlert size={22} color="#f59e0b" />
                            <span>PROTOCOLO DE SEGURANÇA FISCAL</span>
                        </div>
                        <p>O Nº de Chassis e o Nº do Colete são vinculativos. Qualquer discrepância física deve ser reportada ao centro de comando imediatamente.</p>
                        <div className="audit-footer">
                            <div className="auditor">
                                <label>TÉCNICO RESPONSÁVEL</label>
                                <p>{motorcycle.profiles?.full_name || 'GESTÃO CENTRAL'}</p>
                            </div>
                            <div className="audit-time">
                                {new Date(motorcycle.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <button className="utility-btn"><Download size={18} /> EXPORTAR PDF</button>
                        <button className="utility-btn"><Share2 size={18} /> PARTILHAR</button>
                    </div>
                </div>

            </div>

            <style>{`
                .tac-action-btn { height: 50px; padding: 0 25px; border-radius: 14px; font-weight: 950; font-size: 0.8rem; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: 0.3s; border: none; }
                .tac-action-btn.primary { background: #0f172a; color: white; }
                .tac-action-btn.secondary { background: white; border: 2px solid #f1f5f9; color: #64748b; }
                .tac-action-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 20px -5px rgba(0,0,0,0.1); }

                .identity-plate { position: relative; background: #0f172a; border-radius: 40px; padding: 3.5rem; color: white; overflow: hidden; }
                .id-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('https://www.transparenttextures.com/patterns/carbon-fibre.png'); opacity: 0.15; pointer-events: none; }
                .id-content { position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: center; }
                .id-main { display: flex; gap: 2.5rem; align-items: center; }
                .id-badge { width: 70px; height: 90px; background: #2563eb; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 950; color: white; box-shadow: 0 15px 30px rgba(37, 99, 235, 0.3); }
                .plate-text-ultra { font-family: 'Monaco', monospace; font-size: 4.5rem; font-weight: 950; margin: 0; letter-spacing: 5px; line-height: 1; text-shadow: 0 10px 30px rgba(0,0,0,0.5); }
                .plate-sub { display: flex; align-items: center; gap: 12px; margin-top: 15px; }
                .p-tag { font-size: 1rem; font-weight: 700; color: rgba(255,255,255,0.6); text-transform: uppercase; }
                .p-dot { width: 4px; height: 4px; border-radius: 50%; background: #3b82f6; }

                .id-status-panel { text-align: right; }
                .status-pill { padding: 12px 24px; border-radius: 15px; font-size: 0.85rem; font-weight: 950; display: flex; align-items: center; gap: 10px; margin-bottom: 15px; box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
                .status-pill.active { background: #10b981; color: white; }
                .status-pill.expired { background: #ef4444; color: white; }
                .id-meta { font-size: 0.7rem; font-weight: 950; color: rgba(255,255,255,0.3); letter-spacing: 2px; }

                .tactical-tabs { display: flex; gap: 10px; background: #f8fafc; padding: 10px; border-radius: 24px; margin-bottom: 2rem; }
                .tab-btn { flex: 1; padding: 15px; border-radius: 18px; border: none; background: transparent; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 10px; font-weight: 950; font-size: 0.85rem; color: #94a3b8; }
                .tab-btn.active { background: white; color: #0f172a; box-shadow: 0 10px 20px -5px rgba(0,0,0,0.05); }

                .tab-content-box { background: white; border-radius: 40px; padding: 3rem; box-shadow: 0 20px 50px -15px rgba(0,0,0,0.03); }
                
                .dossier-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; }
                .dossier-card { border-left: 4px solid #f1f5f9; padding-left: 2rem; }
                .d-header { font-size: 0.75rem; font-weight: 950; color: #94a3b8; display: flex; align-items: center; gap: 8px; margin-bottom: 2rem; letter-spacing: 1px; }
                .field { margin-bottom: 2rem; }
                .field label { display: block; font-size: 0.65rem; font-weight: 950; color: #cbd5e1; margin-bottom: 6px; letter-spacing: 0.5px; }
                .field p { margin: 0; font-size: 1.1rem; font-weight: 800; color: #0f172a; }
                .val-lg { font-size: 1.75rem !important; fontWeight: 950 !important; letter-spacing: -0.5px; }
                .val-link { color: #2563eb !important; text-decoration: underline; }
                .val-badge { display: inline-block; padding: 6px 14px; background: #f1f5f9; border-radius: 10px; font-size: 0.9rem !important; }
                .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
                
                .tactical-sub-card { padding: 1.5rem; background: #eff6ff; border-radius: 20px; border: 1.5px solid #dbeafe; }
                .s-label { font-size: 0.65rem; font-weight: 950; color: #1e40af; }
                .s-val { font-size: 2rem; font-weight: 950; color: #2563eb; margin-top: 5px; }

                .specs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2.5rem; }
                .spec-item { display: flex; gap: 1.5rem; align-items: center; padding: 1.5rem; background: #f8fafc; border-radius: 24px; border: 1.5px solid #f1f5f9; }
                .s-icon { width: 50px; height: 50px; background: white; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: #3b82f6; box-shadow: 0 8px 15px rgba(0,0,0,0.03); }
                .spec-item label { font-size: 0.65rem; font-weight: 950; color: #94a3b8; }
                .spec-item .val { font-size: 1.25rem; font-weight: 950; color: #0f172a; margin: 0; }
                .spec-item .mono-val { font-family: monospace; font-size: 1.1rem; font-weight: 950; color: #2563eb; background: #eff6ff; padding: 4px 10px; border-radius: 6px; }
                .spec-full-item { grid-column: 1 / -1; padding-top: 2rem; border-top: 1px solid #f1f5f9; }
                .spec-full-item label { display: block; font-size: 0.65rem; font-weight: 950; color: #cbd5e1; margin-bottom: 10px; }
                .spec-full-item p { margin: 0; font-size: 0.95rem; line-height: 1.6; color: #64748b; font-style: italic; }

                .hist-section h4 { font-size: 0.75rem; font-weight: 950; color: #0f172a; margin-bottom: 1.5rem; letter-spacing: 1px; display: flex; align-items: center; gap: 10px; }
                .hist-section h4::after { content: ''; flex: 1; height: 2px; background: #f1f5f9; }
                .table-wrap { overflow-x: auto; }
                table { width: 100%; border-collapse: collapse; }
                th { text-align: left; padding: 12px; font-size: 0.65rem; font-weight: 950; color: #94a3b8; text-transform: uppercase; border-bottom: 2px solid #f8fafc; }
                td { padding: 15px 12px; font-size: 0.9rem; color: #475569; border-bottom: 1px solid #f8fafc; }
                .bold { font-weight: 900; color: #0f172a; }
                .danger { color: #ef4444; font-weight: 900; }
                .success { color: #10b981; font-weight: 900; }
                .empty-row { padding: 40px; text-align: center; font-size: 0.75rem; font-weight: 950; color: #cbd5e1; letter-spacing: 2px; }

                .pill-status { padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 950; text-transform: uppercase; }
                .pill-status.active, .pill-status.paid { background: #f0fdf4; color: #10b981; }
                .pill-status.expired, .pill-status.pending, .pill-status.cancelled { background: #fff1f2; color: #ef4444; }

                .intel-summary { padding: 2.5rem; border: none; background: white; box-shadow: 0 15px 35px -5px rgba(0,0,0,0.03); border-radius: 40px; }
                .intel-summary h3 { font-size: 0.8rem; font-weight: 950; color: #0f172a; margin-bottom: 2rem; display: flex; align-items: center; gap: 10px; }
                .i-stat { margin-bottom: 1.5rem; }
                .i-stat label { font-size: 0.65rem; font-weight: 950; color: #94a3b8; }
                .i-stat p { font-size: 1.25rem; font-weight: 950; color: #0f172a; margin: 4px 0 0; }
                .i-stat.alert p { color: #ef4444; }
                .total-box { margin-top: 2rem; padding: 2rem; background: #0f172a; border-radius: 24px; color: white; }
                .total-box label { font-size: 0.65rem; font-weight: 950; opacity: 0.5; letter-spacing: 1px; }
                .t-val { font-size: 2.25rem; font-weight: 950; margin-top: 5px; color: #10b981; }
                .t-val span { font-size: 1rem; opacity: 0.5; }

                .tech-audit { padding: 2rem; border-radius: 35px; background: #fffbeb; border: 1.5px solid #fef3c7; }
                .audit-header { display: flex; align-items: center; gap: 10px; font-size: 0.75rem; font-weight: 950; color: #92400e; margin-bottom: 1rem; }
                .tech-audit p { font-size: 0.85rem; line-height: 1.6; color: #b45309; fontWeight: 600; margin: 0 0 1.5rem; }
                .audit-footer { display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid rgba(146, 64, 14, 0.1); padding-top: 1rem; }
                .auditor label { font-size: 0.6rem; font-weight: 950; color: #d97706; }
                .auditor p { margin: 0; font-size: 0.8rem; font-weight: 900; color: #92400e; }
                .audit-time { font-size: 0.65rem; font-weight: 950; color: #d97706; }

                .utility-btn { height: 50px; border-radius: 12px; border: 1.5px solid #f1f5f9; background: white; font-weight: 950; font-size: 0.75rem; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.3s; }
                .utility-btn:hover { background: #f8fafc; border-color: #cbd5e1; color: #0f172a; }

                @media print {
                    .tactical-tabs, .tac-action-btn, .utility-btn, .auditor, .AUDIT-TIME { display: none !important; }
                    body { background: white !important; }
                    .card { box-shadow: none !important; border: 1px solid #eee !important; }
                    .tab-content-box { display: block !important; }
                    .identity-plate { color: black !important; background: white !important; border: 4px solid black !important; }
                    .plate-text-ultra { text-shadow: none !important; color: black !important; }
                    .id-overlay { display: none !important; }
                }
            `}</style>
        </motion.div>
    );
};

const TabBtn = ({ children, active, onClick, icon }) => (
    <button className={`tab-btn ${active ? 'active' : ''}`} onClick={onClick}>
        {icon} {children}
    </button>
);

export default MotorcycleDetails;
