import React from 'react';
import { 
    WifiOff, RefreshCw, UserMinus, 
    Home, AlertTriangle, Globe, 
    ShieldAlert, Database, LogOut 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

const SystemErrorScreen = ({ errorType, message, technicalDetails }) => {
    
    const getContent = () => {
        switch (errorType) {
            case 'NETWORK':
                return {
                    icon: <WifiOff size={48} />,
                    title: 'Dificuldades de Conexão',
                    desc: message || 'Não foi possível estabelecer uma ligação segura com os servidores MotoGest. Verifique o seu acesso à internet.',
                    action: 'TENTAR RECONEXÃO',
                    color: '#ef4444',
                    bg: '#fef2f2'
                };
            case 'NO_PROFILE':
                return {
                    icon: <UserMinus size={48} />,
                    title: 'Perfil não Localizado',
                    desc: 'A sua conta de autenticação existe, mas não encontrámos um perfil associado na base de dados MotoGest v2.',
                    action: 'VOLTAR AO LOGIN',
                    color: '#f59e0b',
                    bg: '#fffbeb',
                    onAction: async () => {
                        await supabase.auth.signOut();
                        window.location.href = '/login';
                    }
                };
            case 'NO_MUNICIPALITY':
                return {
                    icon: <Home size={48} />,
                    title: 'Município não Associado',
                    desc: 'O seu perfil está activo, mas não está vinculado a nenhum município. Contacte o Administrador do Sistema.',
                    action: 'CONTACTAR SUPORTE',
                    color: '#3b82f6',
                    bg: '#eff6ff'
                };
            case 'INVALID_ROLE':
                return {
                    icon: <ShieldAlert size={48} />,
                    title: 'Acesso Restrito',
                    desc: 'O seu nível de acesso actual não permite a entrada neste painel operacional.',
                    action: 'TERMINAR SESSÃO',
                    color: '#7c3aed',
                    bg: '#f5f3ff',
                    onAction: async () => {
                        await supabase.auth.signOut();
                        window.location.href = '/login';
                    }
                };
            default:
                return {
                    icon: <Database size={48} />,
                    title: 'Erro de Sistema',
                    desc: message || 'Ocorreu um erro inesperado ao processar os seus dados de acesso.',
                    action: 'RECARREGAR SISTEMA',
                    color: '#64748b',
                    bg: '#f8fafc'
                };
        }
    };

    const content = getContent();

    return (
        <div style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            backgroundColor: '#f8fafc',
            padding: '2rem'
        }}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                    maxWidth: '550px',
                    width: '100%',
                    background: 'white',
                    padding: '4rem',
                    borderRadius: '40px',
                    textAlign: 'center',
                    boxShadow: '0 40px 80px -20px rgba(0,0,0,0.08)',
                    border: '1.5px solid #f1f5f9'
                }}
            >
                <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 3rem auto' }}>
                    <motion.div 
                        animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.3, 1] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        style={{ position: 'absolute', inset: 0, background: content.color, borderRadius: '50%' }}
                    />
                    <div style={{ 
                        position: 'relative', 
                        width: '100%', 
                        height: '100%', 
                        background: content.bg, 
                        borderRadius: '38px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: content.color,
                        boxShadow: `0 15px 30px ${content.color}20`
                    }}>
                        {content.icon}
                    </div>
                </div>

                <h2 style={{ fontSize: '2rem', fontWeight: '950', color: '#0f172a', letterSpacing: '-1.5px', margin: '0 0 1.25rem' }}>
                    {content.title}
                </h2>
                
                <p style={{ fontSize: '1.1rem', color: '#64748b', fontWeight: '600', lineHeight: '1.7', margin: '0 0 3.5rem' }}>
                    {content.desc}
                </p>

                {technicalDetails && (
                    <div style={{ 
                        textAlign: 'left', 
                        background: '#f8fafc', 
                        padding: '1.5rem', 
                        borderRadius: '20px', 
                        marginBottom: '2.5rem',
                        fontSize: '0.8rem',
                        fontFamily: 'monospace',
                        color: '#94a3b8',
                        border: '1.5px solid #f1f5f9'
                    }}>
                        <strong>DETALHES TÉCNICOS:</strong><br/>
                        {technicalDetails}
                    </div>
                )}

                <div style={{ display: 'grid', gap: '1.25rem' }}>
                    <button 
                        onClick={content.onAction || (() => window.location.reload())}
                        style={{
                            height: '72px',
                            background: '#0f172a',
                            color: 'white',
                            border: 'none',
                            borderRadius: '22px',
                            fontWeight: '950',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.3)',
                            transition: '0.3s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        {content.action === 'TERMINAR SESSÃO' ? <LogOut size={20} /> : <RefreshCw size={20} />} 
                        {content.action}
                    </button>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '1.5rem', color: '#cbd5e1', fontSize: '0.7rem', fontWeight: '950', letterSpacing: '1.5px' }}>
                        <Globe size={14} /> STATUS: NÓ CENTRAL AUDITADO
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default SystemErrorScreen;
