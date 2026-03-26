import React, { useState } from 'react';
import { 
    Settings, Shield, Landmark, Database, FileText, 
    Save, Play, Upload, CheckCircle2, AlertCircle, 
    Search, Filter, MapPin, User, Clock, Bell,
    ArrowRight, Mail, Phone, Globe, Palette,
    Lock, RefreshCw, HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GlobalSettings = () => {
    const [activeTab, setActiveTab] = useState('config');
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [loadingBackup, setLoadingBackup] = useState(false);

    const handleSave = () => {
        setSaving(true);
        setTimeout(() => {
            setSaving(false);
            setSuccessMsg('Configurações actualizadas com sucesso!');
            setTimeout(() => setSuccessMsg(''), 3000);
        }, 1500);
    };

    const handleRunBackup = () => {
        setLoadingBackup(true);
        setTimeout(() => {
            setLoadingBackup(false);
            setSuccessMsg('Backup realizado com sucesso!');
            setTimeout(() => setSuccessMsg(''), 3000);
        }, 2000);
    };

    // Card Component Wrapper
    const SettingCard = ({ title, description, icon: Icon, children, footer }) => (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card" 
            style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px', borderRadius: '16px' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: '#f1f5f9', color: '#0f172a' }}>
                    <Icon size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '800', color: '#0f172a' }}>{title}</h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '24px', fontWeight: '500' }}>{description}</p>
            
            <div style={{ flex: 1 }}>
                {children}
            </div>

            {footer && (
                <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
                    {footer}
                </div>
            )}
        </motion.div>
    );

    // Form Field Layouts
    const FieldGroup = ({ label, children }) => (
        <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
                {label}
            </label>
            {children}
        </div>
    );

    const Input = (props) => (
        <input 
            {...props}
            style={{ 
                width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #f1f5f9',
                backgroundColor: '#f8fafc', outline: 'none', fontSize: '0.875rem', fontWeight: '500', transition: 'all 0.2s',
                ...props.style
            }}
            onFocus={(e) => { e.target.style.borderColor = '#0f172a'; e.target.style.backgroundColor = 'white'; }}
            onBlur={(e) => { e.target.style.borderColor = '#f1f5f9'; e.target.style.backgroundColor = '#f8fafc'; }}
        />
    );

    const Select = ({ children, ...props }) => (
        <select 
            {...props}
            style={{ 
                width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #f1f5f9',
                backgroundColor: '#f8fafc', outline: 'none', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer'
            }}
        >
            {children}
        </select>
    );

    const Switch = ({ label, checked }) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#334155' }}>{label}</span>
            <div style={{ 
                width: '44px', height: '24px', borderRadius: '12px', backgroundColor: checked ? '#10b981' : '#e2e8f0',
                position: 'relative', cursor: 'pointer', transition: 'all 0.3s'
            }}>
                <div style={{ 
                    position: 'absolute', top: '2px', left: checked ? '22px' : '2px', width: '20px', height: '20px',
                    borderRadius: '50%', backgroundColor: 'white', transition: 'all 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }} />
            </div>
        </div>
    );

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#64748b', fontSize: '0.875rem', fontWeight: '500', marginBottom: '8px' }}>
                    <span>Super Admin</span>
                    <ArrowRight size={14} />
                    <span>Sistema</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>Configurações Globais</h1>
                        <p style={{ color: '#64748b', fontWeight: '500', margin: 0 }}>Gestão de parâmetros do sistema, backups e permissões globais.</p>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {successMsg && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        style={{ 
                            position: 'fixed', top: '24px', right: '24px', zIndex: 1000,
                            display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 24px',
                            backgroundColor: '#10b981', color: 'white', borderRadius: '12px',
                            boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)', fontWeight: '700'
                        }}
                    >
                        <CheckCircle2 size={24} />
                        {successMsg}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid-2" style={{ gap: '24px', alignItems: 'start' }}>
                
                {/* 1. CONFIGURAÇÕES GERAIS */}
                <SettingCard 
                    title="Configurações Gerais do Sistema" 
                    description="Defina os parâmetros institucionais e visuais globais da plataforma."
                    icon={Settings}
                    footer={
                        <button className="btn-primary w-full justify-center" onClick={handleSave} disabled={saving}>
                            {saving ? <RefreshCw className="spin" size={18} /> : <Save size={18} />}
                            {saving ? 'Guardando...' : 'Salvar Configurações'}
                        </button>
                    }
                >
                    <div className="grid-2" style={{ gap: '16px' }}>
                        <FieldGroup label="Nome da Plataforma">
                            <Input defaultValue="MotoGest v2" />
                        </FieldGroup>
                        <FieldGroup label="Email de Suporte">
                            <Input defaultValue="suporte@motogest.gov.mz" />
                        </FieldGroup>
                    </div>
                    <FieldGroup label="Descrição do Sistema">
                        <Input defaultValue="Sistema Nacional de Gestão Municipal de Mobilidade e Transportes" />
                    </FieldGroup>
                    <div className="grid-3" style={{ gap: '16px' }}>
                        <FieldGroup label="Telefone">
                            <Input defaultValue="+258 84 000 0000" />
                        </FieldGroup>
                        <FieldGroup label="Website">
                            <Input defaultValue="www.motogest.gov.mz" />
                        </FieldGroup>
                        <FieldGroup label="Moeda">
                            <Select><option>MT (Metical)</option></Select>
                        </FieldGroup>
                    </div>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginTop: '8px' }}>
                        <div style={{ flex: 1 }}>
                            <FieldGroup label="Logo Global">
                                <div style={{ 
                                    border: '2px dashed #e2e8f0', borderRadius: '12px', padding: '12px', 
                                    textAlign: 'center', cursor: 'pointer', backgroundColor: '#f8fafc' 
                                }}>
                                    <Upload size={20} style={{ color: '#64748b', marginBottom: '4px' }} />
                                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Clique para upload</p>
                                </div>
                            </FieldGroup>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                             <FieldGroup label="Primária">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#0f172a', border: '2px solid white', boxShadow: '0 0 0 1px #e2e8f0' }} />
                                    <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>#0F172A</span>
                                </div>
                             </FieldGroup>
                             <FieldGroup label="Destaque">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#10b981', border: '2px solid white', boxShadow: '0 0 0 1px #e2e8f0' }} />
                                    <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>#10B981</span>
                                </div>
                             </FieldGroup>
                        </div>
                    </div>
                </SettingCard>

                {/* 2. CONFIGURAÇÕES DE MUNICÍPIOS */}
                <SettingCard 
                    title="Configurações de Municípios" 
                    description="Controle regras globais aplicáveis aos municípios da plataforma."
                    icon={MapPin}
                    footer={
                        <button className="btn-primary w-full justify-center" onClick={handleSave} disabled={saving}>
                            {saving ? <RefreshCw className="spin" size={18} /> : <Save size={18} />}
                            {saving ? 'Aplicar Regras' : 'Salvar Regras dos Municípios'}
                        </button>
                    }
                >
                    <Switch label="Permitir criação automática de municípios" checked={false} />
                    <Switch label="Aprovação obrigatória para novos municípios" checked={true} />
                    <div className="grid-2" style={{ gap: '16px', marginTop: '12px' }}>
                        <FieldGroup label="Máx. Utilizadores / Município">
                            <Input type="number" defaultValue="50" />
                        </FieldGroup>
                        <FieldGroup label="Máx. Veículos / Município">
                            <Input type="number" defaultValue="100000" />
                        </FieldGroup>
                    </div>
                    <FieldGroup label="Modo Padrão do Município">
                        <Select>
                            <option>Produção</option>
                            <option>Teste</option>
                            <option>Demonstração</option>
                        </Select>
                        <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '6px' }}>Define o estado inicial de novos municípios registados no sistema.</p>
                    </FieldGroup>
                </SettingCard>

                {/* 3. TAXAS E MULTAS */}
                <SettingCard 
                    title="Sistema de Taxas e Multas" 
                    description="Defina regras e valores padrão globais para operação da plataforma."
                    icon={Landmark}
                    footer={
                        <button className="btn-primary w-full justify-center" onClick={handleSave} disabled={saving}>
                            {saving ? <RefreshCw className="spin" size={18} /> : <Save size={18} />}
                            {saving ? 'Actualizando...' : 'Salvar Taxas Globais'}
                        </button>
                    }
                >
                    <div className="grid-2" style={{ gap: '16px' }}>
                        <FieldGroup label="Valor Licença Anual (Padrão)">
                            <div style={{ position: 'relative' }}>
                                <Input defaultValue="1.000,00" style={{ paddingRight: '40px' }} />
                                <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8' }}>MT</span>
                            </div>
                        </FieldGroup>
                        <FieldGroup label="Valor Multa Base (Padrão)">
                            <div style={{ position: 'relative' }}>
                                <Input defaultValue="500,00" style={{ paddingRight: '40px' }} />
                                <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8' }}>MT</span>
                            </div>
                        </FieldGroup>
                    </div>
                    <FieldGroup label="Taxa Administrativa (%)">
                        <Input type="number" defaultValue="10" />
                    </FieldGroup>
                    <FieldGroup label="Métodos de Pagamento Permitidos">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '8px' }}>
                            {['M-Pesa', 'e-Mola', 'mKesh', 'Banco', 'POS'].map(method => (
                                <label key={method} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input type="checkbox" defaultChecked={['M-Pesa', 'Banco'].includes(method)} />
                                    <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{method}</span>
                                </label>
                            ))}
                        </div>
                    </FieldGroup>
                </SettingCard>

                {/* 4. SEGURANÇA */}
                <SettingCard 
                    title="Segurança do Sistema" 
                    description="Defina políticas globais de acesso e protecção da plataforma."
                    icon={Shield}
                    footer={
                        <button className="btn-primary w-full justify-center" onClick={handleSave} disabled={saving}>
                            {saving ? <RefreshCw className="spin" size={18} /> : <Save size={18} />}
                            {saving ? 'Reforçando...' : 'Salvar Configurações de Segurança'}
                        </button>
                    }
                >
                    <div className="grid-2" style={{ gap: '16px' }}>
                        <FieldGroup label="Tempo de Sessão">
                            <Select>
                                <option>30 minutos</option>
                                <option>1 hora</option>
                                <option>2 horas</option>
                                <option>4 horas</option>
                            </Select>
                        </FieldGroup>
                        <FieldGroup label="Máx. Tentativas Login">
                            <Input type="number" defaultValue="5" />
                        </FieldGroup>
                    </div>
                    <div style={{ marginTop: '8px' }}>
                        <Switch label="Bloqueio automático de conta" checked={true} />
                        <Switch label="Forçar alteração de senha no 1º acesso" checked={true} />
                        <Switch label="Autenticação em dois fatores (2FA)" checked={false} />
                    </div>
                </SettingCard>

                {/* 5. BACKUP */}
                <SettingCard 
                    title="Sistema de Backup" 
                    description="Gerencie as cópias de segurança e a protecção dos dados."
                    icon={Database}
                >
                    <Switch label="Backup automático" checked={true} />
                    <div className="grid-2" style={{ gap: '16px', marginTop: '8px' }}>
                        <FieldGroup label="Frequência">
                            <Select>
                                <option>Diário</option>
                                <option>Semanal</option>
                                <option>Mensal</option>
                            </Select>
                        </FieldGroup>
                        <FieldGroup label="Destino">
                            <Select>
                                <option>Supabase</option>
                                <option>Cloud Storage</option>
                            </Select>
                        </FieldGroup>
                    </div>
                    
                    <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', marginTop: '8px', border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b' }}>Último Backup</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#10b981' }}>COMPLETO</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '700', color: '#0f172a' }}>16 de Março de 2026, 14:30</p>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                        <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleRunBackup} disabled={loadingBackup}>
                            {loadingBackup ? <RefreshCw className="spin" size={18} /> : <Play size={18} />}
                            Executar Backup Agora
                        </button>
                        <button style={{ 
                            padding: '10px 20px', borderRadius: '12px', border: '1.5px solid #e2e8f0', 
                            fontSize: '0.875rem', fontWeight: '700', color: '#334155' 
                        }} onClick={handleSave}>
                            Salvar Regras
                        </button>
                    </div>
                </SettingCard>

                {/* 6. LOGS E AUDITORIA (FULL WIDTH) */}
                <div style={{ gridColumn: 'span 2' }}>
                    <SettingCard 
                        title="Logs e Auditoria do Sistema" 
                        description="Acompanhe as actividades críticas e eventos importantes da plataforma em tempo real."
                        icon={FileText}
                    >
                        {/* Filters Bar */}
                        <div style={{ 
                            display: 'flex', gap: '12px', marginBottom: '24px', backgroundColor: '#f8fafc', 
                            padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' 
                        }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input placeholder="Pesquisar utilizador ou evento..." style={{ 
                                    width: '100%', padding: '10px 12px 10px 40px', borderRadius: '8px', border: '1px solid #e2e8f0',
                                    fontSize: '0.875rem', outline: 'none'
                                }} />
                            </div>
                            <div style={{ width: '200px' }}>
                                <Select><option>Todos os Municípios</option></Select>
                            </div>
                            <div style={{ width: '180px' }}>
                                <Select><option>Qualquer Evento</option></Select>
                            </div>
                            <button style={{ 
                                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', 
                                borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.875rem', fontWeight: '700' 
                            }}>
                                <Filter size={18} /> Filtrar
                            </button>
                        </div>

                        {/* Recent Audit Table Placeholder */}
                        <div className="table-container" style={{ borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Data/Hora</th>
                                        <th>Município</th>
                                        <th>Utilizador</th>
                                        <th>Tipo de Evento</th>
                                        <th>Descrição</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { time: '19:40', mun: 'Maputo', user: 'Admin Global', type: 'SISTEMA', desc: 'Backup automático concluído', status: 'Sucesso' },
                                        { time: '18:15', mun: 'Matola', user: 'Admin Local', type: 'CADASTRO', desc: 'Município registado: Matola', status: 'Sucesso' },
                                        { time: '17:30', mun: 'Beira', user: 'Sistema', type: 'SEGURANÇA', desc: 'Falha de login múltipla detectada', status: 'Alerta' }
                                    ].map((log, i) => (
                                        <tr key={i} className="table-row-hover">
                                            <td style={{ whiteSpace: 'nowrap', color: '#64748b', fontWeight: '500' }}>Hoje às {log.time}</td>
                                            <td style={{ fontWeight: '700', color: '#0f172a' }}>{log.mun}</td>
                                            <td style={{ fontWeight: '600' }}>{log.user}</td>
                                            <td>
                                                <span style={{ 
                                                    fontSize: '0.7rem', fontWeight: '800', padding: '4px 8px', borderRadius: '6px',
                                                    backgroundColor: '#f1f5f9', color: '#475569'
                                                }}>{log.type}</span>
                                            </td>
                                            <td style={{ fontSize: '0.85rem' }}>{log.desc}</td>
                                            <td>
                                                <span className={`badge ${log.status === 'Sucesso' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                                                    {log.status === 'Sucesso' ? <CheckCircle2 size={12} style={{ marginRight: '4px' }} /> : <AlertCircle size={12} style={{ marginRight: '4px' }} />}
                                                    {log.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ marginTop: '20px', textAlign: 'center' }}>
                            <button style={{ color: '#2563eb', fontWeight: '700', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}>
                                Ver todos os logs de auditoria <ArrowRight size={16} />
                            </button>
                        </div>
                    </SettingCard>
                </div>
            </div>

            <style>{`
                .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); }
                .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); }
                .table-row-hover:hover { background-color: #f8fafc; cursor: default; }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @media (max-width: 900px) {
                    .grid-2, .grid-3 { grid-template-columns: 1fr !important; }
                    div[style*="gridColumn: span 2"] { grid-column: span 1 !important; }
                }
            `}</style>
        </div>
    );
};

export default GlobalSettings;
