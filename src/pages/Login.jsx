import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, AlertCircle, ChevronRight, Loader2, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn, signOut, user, profile, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    // Redirect if already logged in and profile is loaded
    useEffect(() => {
        if (!authLoading && user && profile) {
            if (profile.role === 'super_admin') {
                navigate('/super-admin/dashboard');
            } else if (['admin_municipal', 'tecnico', 'fiscal', 'financeiro'].includes(profile.role)) {
                navigate('/admin/dashboard');
            }
        }
    }, [user, profile, authLoading, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            const { data: authData, error: loginError } = await signIn(email, password);
            
            if (loginError) {
                console.error('Erro no login (Supabase Auth):', loginError.message);
                
                if (loginError.message?.includes('Failed to fetch') || loginError.status === 0) {
                    setError('Falha de ligação: Não foi possível contactar o servidor.');
                } else {
                    setError('As credenciais introduzidas são inválidas.');
                }
                
                setLoading(false);
                return;
            }

            const uid = authData?.user?.id;
            if (!uid) throw new Error("ID de utilizador ausente.");

            const { data: userProfile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', uid)
                .single();
                
            if (profileError || !userProfile) {
                setError('Perfil não encontrado. Contacte o administrador.');
                await signOut();
                setLoading(false);
                return;
            }

            const role = userProfile.role;
            if (role === 'super_admin') {
                navigate('/super-admin/dashboard');
            } else {
                navigate('/admin/dashboard');
            }

        } catch (err) {
            console.error('Erro inesperado:', err);
            setError('Ocorreu um problema de ligação ao servidor.');
            setLoading(false);
            await signOut();
        }
    };

    return (
        <div className="login-page-wrapper">
            {/* Left Side: Branding */}
            <div className="login-visual-side">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ textAlign: 'center', zIndex: 2 }}
                    className="brand-content"
                >
                    <div style={{ 
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', justifyContent: 'center'
                    }}>
                        <div style={{ 
                            backgroundColor: 'white', padding: '24px', borderRadius: '24px', 
                            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                            border: '1px solid rgba(255,255,255,0.1)' 
                        }}>
                            <ShieldCheck size={64} color="#0f172a" strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '3.5rem', fontWeight: '900', margin: 0, letterSpacing: '-2px', color: 'white' }}>MotoGest</h1>
                            <div style={{ height: '4px', width: '60px', backgroundColor: '#10b981', margin: '12px auto', borderRadius: '2px' }}></div>
                            <p style={{ fontSize: '1.25rem', color: '#94a3b8', maxWidth: '400px', margin: '0 auto', lineHeight: '1.6', fontWeight: '500' }}>
                                Gestão Inteligente de Mobilidade Municipal.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Background Decoration */}
                <div className="bg-decoration dec-1"></div>
                <div className="bg-decoration dec-2"></div>
            </div>

            {/* Right Side: Login Form */}
            <div className="login-form-side">
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    style={{ width: '100%', maxWidth: '400px' }}
                >
                    <div className="mobile-brand-header">
                         <ShieldCheck size={24} color="#10b981" />
                         <span style={{ fontWeight: 800, fontSize: '1.25rem' }}>MotoGest</span>
                    </div>

                    <div style={{ marginBottom: '2.5rem' }}>
                        <h2 style={{ fontSize: '1.875rem', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>Bem-vindo</h2>
                        <p style={{ color: '#64748b', fontWeight: '500', margin: 0 }}>Introduza as suas credenciais de acesso.</p>
                    </div>

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ 
                                    display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', 
                                    backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px',
                                    color: '#dc2626', fontSize: '0.875rem', fontWeight: '600', marginBottom: '1.5rem'
                                }}
                            >
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Email Institucional</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input 
                                    type="email" 
                                    required 
                                    placeholder="exemplo@municipio.gov.mz"
                                    style={{ 
                                        width: '100%', padding: '14px 16px 14px 48px', border: '1.5px solid #f1f5f9', 
                                        borderRadius: '12px', outline: 'none', fontSize: '1rem', fontWeight: '500',
                                        backgroundColor: '#f8fafc', transition: 'all 0.2s'
                                    }}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onFocus={(e) => { e.target.style.borderColor = '#0f172a'; e.target.style.backgroundColor = 'white' }}
                                    onBlur={(e) => { e.target.style.borderColor = '#f1f5f9'; e.target.style.backgroundColor = '#f8fafc' }}
                                />
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Palavra-passe</label>
                                <Link to="/forgot-password" style={{ fontSize: '0.75rem', fontWeight: '700', color: '#2563eb' }}>Esqueceu a senha?</Link>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input 
                                    type="password" 
                                    required 
                                    placeholder="••••••••"
                                    style={{ 
                                        width: '100%', padding: '14px 16px 14px 48px', border: '1.5px solid #f1f5f9', 
                                        borderRadius: '12px', outline: 'none', fontSize: '1rem', fontWeight: '500',
                                        backgroundColor: '#f8fafc', transition: 'all 0.2s'
                                    }}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onFocus={(e) => { 
                                        e.target.style.borderColor = '#0f172a'; 
                                        e.target.style.backgroundColor = 'white';
                                    }}
                                    onBlur={(e) => { 
                                        e.target.style.borderColor = '#f1f5f9'; 
                                        e.target.style.backgroundColor = '#f8fafc';
                                    }}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading || authLoading}
                            style={{ 
                                width: '100%', padding: '14px', borderRadius: '12px', backgroundColor: '#0f172a', 
                                color: 'white', fontWeight: '800', border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                marginTop: '1rem', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
                                transition: 'all 0.2s'
                            }}
                        >
                            {loading ? <Loader2 className="spin" size={20} /> : <ChevronRight size={20} />}
                            {loading ? 'A processar...' : 'Entrar na Plataforma'}
                        </button>
                    </form>

                    <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '500', margin: 0 }}>
                            &copy; {new Date().getFullYear()} MotoGest • Sistema de Gestão Municipal
                        </p>
                    </div>
                </motion.div>
            </div>

            <style>{`
                .login-page-wrapper { min-height: 100vh; display: flex; background-color: #f8fafc; font-family: 'Outfit', sans-serif; overflow: hidden; width: 100%; }
                .login-visual-side { flex: 1.2; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); display: flex; flexDirection: column; align-items: center; justify-content: center; padding: 4rem; color: white; position: relative; }
                .login-form-side { flex: 1; display: flex; items-center: center; justify-items: center; align-items: center; justify-content: center; padding: 2rem; background-color: white; }
                .bg-decoration { position: absolute; border-radius: 50%; }
                .dec-1 { bottom: -5%; left: -5%; width: 300px; height: 300px; background: radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, transparent 70%); }
                .dec-2 { top: 10%; right: 5%; width: 200px; height: 200px; background: radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%); }
                .mobile-brand-header { display: none; }

                @media (max-width: 900px) {
                    .login-page-wrapper { flex-direction: column; overflow-y: auto; }
                    .login-visual-side { padding: 4rem 2rem; height: 300px; flex: none; width: 100%; }
                    .brand-content h1 { font-size: 2.5rem !important; }
                    .brand-content p { font-size: 1rem !important; }
                    .login-form-side { padding: 3rem 2rem; flex: 1; }
                    .mobile-brand-header { display: flex; align-items: center; gap: 8px; justify-content: center; margin-bottom: 2rem; color: #0f172a; }
                }

                @keyframes spin { from {transform: rotate(0deg)} to {transform: rotate(360deg)}} 
                .spin { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
};

export default Login;
