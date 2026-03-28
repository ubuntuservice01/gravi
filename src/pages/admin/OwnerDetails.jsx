import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
    User, Phone, Mail, MapPin, Hash, ShieldCheck, 
    Bike, Car, CreditCard, ChevronRight, Edit, 
    Printer, Download, Activity, History, 
    AlertTriangle, CheckCircle2, RefreshCw, 
    Flag, Briefcase, Calendar, Fingerprint, 
    Smartphone, Search, Layers, Shield
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../../components/PageHeader';

const OwnerDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [owner, setOwner] = useState(null);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dossier');

    useEffect(() => {
        fetchOwnerData();
    }, [id]);

    const fetchOwnerData = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('owners')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setOwner(data);

            const { data: vData } = await supabase
                .from('motorcycles')
                .select('*')
                .eq('owner_id', id);

            setVehicles(vData || []);
        } catch (error) {
            console.error('Erro ao buscar proprietário:', error.message);
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
            <p style={{ fontWeight: '950', color: '#0f172a', letterSpacing: '1px' }}>RECUPERANDO DOSSIER DO CIDADÃO</p>
        </div>
    );

    if (!owner) return <div className="p-12 text-center text-red-500 font-black">CIDADÃO NÃO ENCONTRADO NO REGISTO MUNICIPAL.</div>;

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '6rem' }}
        >
            <PageHeader 
                title={owner.full_name}
                subtitle="Dossier Consolidado de Titular de Ativos Municipais"
                breadcrumbs={[
                    { label: 'Painel', path: '/admin/dashboard' },
                    { label: 'Proprietários', path: '/admin/owners' },
                    { label: 'Perfil' }
                ]}
                actions={
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => window.print()} className="tac-action-btn secondary">
                            <Printer size={18} /> EXPORTAR PERFIL
                        </button>
                        <button onClick={() => navigate(`/admin/owners/edit/${id}`)} className="tac-action-btn primary">
                            <Edit size={18} /> ACTUALIZAR CADASTRO
                        </button>
                    </div>
                }
            />

            <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '2.5rem' }}>
                
                {/* Left Side: Identity Card */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="card identity-card-premium">
                        <div className="id-carbon-pattern"></div>
                        <div className="id-top-bar"></div>
                        
                        <div className="id-content">
                            <div className="avatar-box">
                                <div className="avatar-main"><User size={48} /></div>
                                <div className="verified-badge"><ShieldCheck size={18} /></div>
                            </div>
                            
                            <h2 className="id-name">{owner.full_name}</h2>
                            <p className="id-sub">Cidadão Registado • Nível 1</p>
                            
                            <div className="id-stats-grid">
                                <div className="i-stat">
                                    <label>VEÍCULOS</label>
                                    <p>{vehicles.length}</p>
                                </div>
                                <div className="i-stat">
                                    <label>ESTADO</label>
                                    <p style={{ color: '#10b981' }}>ACTIVO</p>
                                </div>
                                <div className="i-stat">
                                    <label>CÓDIGO</label>
                                    <p>#{owner.id.slice(0, 5).toUpperCase()}</p>
                                </div>
                            </div>

                            <div className="id-contact-list">
                                <div className="c-item"><Smartphone size={16} /> {owner.phone}</div>
                                <div className="c-item"><Fingerprint size={16} /> {owner.bi_number}</div>
                            </div>
                        </div>
                    </div>

                    <div className="card operational-intel">
                        <h3><Layers size={18} /> INTELIGÊNCIA FISCAL</h3>
                        <div className="intel-list">
                            <div className="intel-item">
                                <label>Risco Fiscal</label>
                                <span className="risk-low">MÍNIMO</span>
                            </div>
                            <div className="intel-item">
                                <label>Multas Acumuladas</label>
                                <span>0.00 MT</span>
                            </div>
                            <div className="intel-item">
                                <label>Taxas em Dia</label>
                                <span className="text-green-500">SIM</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Detailed Info & Assets */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    <div className="tactical-tabs-premium">
                        <TabBtn active={activeTab === 'dossier'} onClick={() => setActiveTab('dossier')} icon={<Fingerprint size={18} />}>Dados Biométricos & Fiscais</TabBtn>
                        <TabBtn active={activeTab === 'ativos'} onClick={() => setActiveTab('ativos')} icon={<Layers size={18} />}>Património Registado ({vehicles.length})</TabBtn>
                        <TabBtn active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={<History size={18} />}>Histórico de Interacções</TabBtn>
                    </div>

                    <div className="tab-pane-premium">
                        <AnimatePresence mode="wait">
                            {activeTab === 'dossier' && (
                                <motion.div 
                                    key="dossier" 
                                    initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                                    className="dossier-layout"
                                >
                                    <div className="dossier-section">
                                        <h4>INFORMAÇÃO CIVIL</h4>
                                        <div className="d-grid">
                                            <DetailItem label="Nome Completo" value={owner.full_name} bold />
                                            <DetailItem label="Documento de Identidade" value={owner.bi_number} mono />
                                            <DetailItem label="NUIT Fiscal" value={owner.nuit || 'PENDENTE'} />
                                            <DetailItem label="Data de Registo" value={new Date(owner.created_at).toLocaleDateString()} />
                                        </div>
                                    </div>

                                    <div className="dossier-section">
                                        <h4>RESIDÊNCIA & LOCALIZAÇÃO</h4>
                                        <div className="d-grid">
                                            <DetailItem label="Morada Declarada" value={owner.address} span={2} />
                                            <DetailItem label="Canal Telefónico" value={owner.phone} highlight />
                                            <DetailItem label="Correio Electrónico" value={owner.email || 'NÃO DECLARADO'} />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'ativos' && (
                                <motion.div 
                                    key="ativos"
                                    initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                                    className="assets-list"
                                >
                                    {vehicles.map(v => (
                                        <div key={v.id} className="asset-card-premium" onClick={() => navigate(`/admin/motorcycles/${v.id}`)}>
                                            <div className="a-icon"><Bike size={24} /></div>
                                            <div className="a-main">
                                                <div className="a-plate">{v.plate}</div>
                                                <div className="a-desc">{v.brand} {v.model} • {v.color}</div>
                                            </div>
                                            <div className="a-status">
                                                 <span className={`pill-status ${v.status?.toLowerCase() === 'active' ? 'activa' : 'inactiva'}`}>REGULAR</span>
                                            </div>
                                            <div className="a-link"><ChevronRight size={20} /></div>
                                        </div>
                                    ))}
                                    {vehicles.length === 0 && (
                                        <div className="empty-assets">
                                            <AlertTriangle size={48} color="#cbd5e1" />
                                            <p>Nenhum veículo vinculado a este contribuinte.</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'logs' && (
                                <motion.div 
                                    key="logs"
                                    initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                                    className="logs-list"
                                >
                                    <LogEntry time="Hoje, 10:45" title="Consulta de Dossier" user="Dir. Municipal" />
                                    <LogEntry time="Ontem, 16:20" title="Actualização de Morada" user="Técnico Admin" />
                                    <LogEntry time="12 Mar, 2024" title="Registo de Novo Veículo" user="Técnico Admin" />
                                    <LogEntry time="01 Mar, 2024" title="Criação de Cadastro" user="Sistema Central" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <style>{`
                .tac-action-btn { height: 50px; padding: 0 25px; border-radius: 14px; font-weight: 950; font-size: 0.8rem; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: 0.3s; border: none; }
                .tac-action-btn.primary { background: #0f172a; color: white; }
                .tac-action-btn.secondary { background: white; border: 2px solid #f1f5f9; color: #64748b; }
                .tac-action-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 20px -5px rgba(0,0,0,0.1); }

                .identity-card-premium { position: relative; background: #0f172a; border-radius: 40px; padding: 4rem; color: white; overflow: hidden; text-align: center; }
                .id-carbon-pattern { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('https://www.transparenttextures.com/patterns/carbon-fibre.png'); opacity: 0.15; pointer-events: none; }
                .id-top-bar { position: absolute; top: 0; left: 0; right: 0; height: 10px; background: #3b82f6; }
                
                .id-content { position: relative; z-index: 1; }
                .avatar-box { position: relative; width: 120px; height: 120px; margin: 0 auto 2.5rem; }
                .avatar-main { width: 100%; height: 100%; background: rgba(255,255,255,0.05); border-radius: 40px; display: flex; align-items: center; justify-content: center; color: #3b82f6; border: 2px solid rgba(255,255,255,0.1); }
                .verified-badge { position: absolute; bottom: -5px; right: -5px; width: 36px; height: 36px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 4px solid #0f172a; }

                .id-name { font-size: 1.75rem; font-weight: 950; margin: 0; letter-spacing: -0.5px; }
                .id-sub { font-size: 0.9rem; font-weight: 700; color: #64748b; margin-top: 5px; }

                .id-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin: 3rem 0; padding: 2rem 0; border-top: 1px solid rgba(255,255,255,0.1); border-bottom: 1px solid rgba(255,255,255,0.1); }
                .i-stat label { font-size: 0.6rem; font-weight: 950; color: #94a3b8; letter-spacing: 1px; }
                .i-stat p { margin: 5px 0 0; font-size: 1.1rem; font-weight: 950; }

                .id-contact-list { display: flex; flex-direction: column; gap: 15px; }
                .c-item { display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 0.95rem; font-weight: 800; color: #cbd5e1; }

                .operational-intel h3 { font-size: 0.85rem; font-weight: 950; color: #0f172a; margin-bottom: 2rem; display: flex; align-items: center; gap: 10px; }
                .intel-list { display: flex; flex-direction: column; gap: 15px; }
                .intel-item { display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #f8fafc; border-radius: 12px; }
                .intel-item label { font-size: 0.8rem; font-weight: 800; color: #94a3b8; }
                .intel-item span { font-size: 0.85rem; font-weight: 950; color: #1e293b; }
                .risk-low { color: #10b981 !important; }

                .tactical-tabs-premium { display: flex; gap: 10px; background: #f8fafc; padding: 10px; border-radius: 28px; margin-bottom: 2rem; }
                .tab-btn { flex: 1; padding: 18px; border-radius: 20px; border: none; background: transparent; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 10px; font-weight: 950; font-size: 0.85rem; color: #94a3b8; }
                .tab-btn.active { background: white; color: #0f172a; box-shadow: 0 10px 20px -5px rgba(0,0,0,0.05); }

                .tab-pane-premium { background: white; border-radius: 40px; padding: 4rem; box-shadow: 0 20px 50px -15px rgba(0,0,0,0.03); }
                
                .dossier-section { margin-bottom: 4rem; }
                .dossier-section:last-child { margin-bottom: 0; }
                .dossier-section h4 { font-size: 0.75rem; font-weight: 950; color: #94a3b8; margin-bottom: 2rem; letter-spacing: 2px; display: flex; align-items: center; gap: 15px; }
                .dossier-section h4::after { content: ''; flex: 1; height: 1.5px; background: #f1f5f9; }
                .d-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; }
                
                .detail-item label { display: block; font-size: 0.65rem; font-weight: 950; color: #cbd5e1; margin-bottom: 8px; letter-spacing: 0.5px; }
                .detail-item p { margin: 0; font-size: 1.15rem; font-weight: 800; color: #0f172a; }
                .detail-item.bold p { font-size: 1.5rem; fontWeight: 950; }
                .detail-item.mono p { font-family: 'Monaco', monospace; background: #f1f5f9; padding: 4px 10px; border-radius: 6px; display: inline-block; font-size: 1rem; }
                .detail-item.highlight p { color: #3b82f6; }

                .assets-list { display: grid; gap: 15px; }
                .asset-card-premium { padding: 1.5rem 2rem; background: #f8fafc; border-radius: 24px; border: 1.5px solid #f1f5f9; display: flex; align-items: center; gap: 20px; cursor: pointer; transition: 0.3s; }
                .asset-card-premium:hover { background: #ffffff; border-color: #3b82f6; transform: translateX(10px); box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.1); }
                .a-icon { width: 56px; height: 56px; background: white; border-radius: 18px; display: flex; align-items: center; justify-content: center; color: #3b82f6; box-shadow: 0 5px 15px rgba(0,0,0,0.02); }
                .a-plate { font-family: 'Monaco', monospace; font-size: 1.25rem; font-weight: 950; color: #0f172a; }
                .a-desc { font-size: 0.85rem; font-weight: 700; color: #94a3b8; margin-top: 2px; }
                .a-link { marginLeft: auto; color: #cbd5e1; }
                .a-status .pill-status { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 950; }
                .pill-status.active, .pill-status.paid { background: #f0fdf4; color: #10b981; }
                .pill-status.expired, .pill-status.pending, .pill-status.cancelled { background: #fff1f2; color: #ef4444; }

                .log-entry { display: flex; gap: 20px; align-items: flex-start; padding-bottom: 1.5rem; border-bottom: 1.5px solid #f8fafc; }
                .log-time { font-size: 0.8rem; font-weight: 950; color: #cbd5e1; min-width: 100px; text-align: right; }
                .log-info .l-title { font-size: 1rem; font-weight: 850; color: #0f172a; }
                .log-info .l-user { font-size: 0.75rem; font-weight: 700; color: #94a3b8; margin-top: 2px; }

                @media print {
                    .tactical-tabs-premium, .tac-action-btn, .a-link { display: none !important; }
                    body { background: white !important; }
                    .tab-pane-premium { box-shadow: none !important; border: 1px solid #eee !important; padding: 2rem !important; }
                    .identity-card-premium { color: black !important; background: white !important; border: 4px solid black !important; }
                    .id-carbon-pattern { display: none !important; }
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

const DetailItem = ({ label, value, bold, mono, highlight, span = 1 }) => (
    <div className={`detail-item ${bold ? 'bold' : ''} ${mono ? 'mono' : ''} ${highlight ? 'highlight' : ''}`} style={{ gridColumn: span > 1 ? `span ${span}` : 'auto' }}>
        <label>{label}</label>
        <p>{value || '---'}</p>
    </div>
);

const LogEntry = ({ time, title, user }) => (
    <div className="log-entry">
        <div className="log-time">{time}</div>
        <div className="log-info">
            <div className="l-title">{title}</div>
            <div className="l-user">Executado por: {user}</div>
        </div>
    </div>
);

export default OwnerDetails;
