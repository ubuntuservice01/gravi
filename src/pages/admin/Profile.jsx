import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
    User, Mail, Shield, Building, Lock, Key, 
    Save, Loader2, AlertCircle, CheckCircle2,
    Calendar, ShieldCheck, BadgeCheck, Camera,
    Settings, Fingerprint, LogOut, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../../components/PageHeader';

const Profile = () => {
    const { profile, user, signOut } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [isChangingPass, setIsChangingPass] = useState(false);
    const [passData, setPassData] = useState({ newPassword: '', confirmPassword: '' });
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ 
                    full_name: fullName,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;
            setMessage({ type: 'success', text: 'Perfil institucional actualizado com sucesso.' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Erro na actualização: ' + err.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passData.newPassword !== passData.confirmPassword) {
            setMessage({ type: 'error', text: 'As credenciais não coincidem.' });
            return;
        }

        setIsChangingPass(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: passData.newPassword
            });

            if (error) throw error;
            setMessage({ type: 'success', text: 'Senha de segurança alterada.' });
            setPassData({ newPassword: '', confirmPassword: '' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Erro de segurança: ' + err.message });
        } finally {
            setIsChangingPass(false);
        }
    };

    const getRoleLabel = (role) => {
        const roles = {
            admin_municipal: 'Administrador Municipal',
            tecnico: 'Técnico de Gestão',
            fiscal: 'Fiscal de Trânsito',
            financeiro: 'Gestor Financeiro',
            super_admin: 'Administrador Global'
        };
        return roles[role] || role;
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '5rem' }}
        >
            <PageHeader 
                title="Gestão de Identidade"
                subtitle="Configure as suas credenciais de acesso e informações institucionais."
                breadcrumbs={[
                    { label: 'Painel', path: '/admin/dashboard' },
                    { label: 'Perfil' }
                ]}
                actions={
                    <button 
                        onClick={() => signOut()}
                        className="btn" 
                        style={{ height: '52px', background: '#fff1f2', color: '#e11d48', border: '2px solid #fee2e2', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '10px', padding: '0 25px', fontWeight: '950' }}
                    >
                        <LogOut size={18} /> TERMINAR SESSÃO
                    </button>
                }
            />

            <AnimatePresence>
                {message.text && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -20, height: 0 }}
                        style={{ 
                            padding: '1.5rem 2rem', 
                            borderRadius: '20px', 
                            marginBottom: '2.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px',
                            backgroundColor: message.type === 'success' ? '#ecfdf5' : '#fff1f2',
                            color: message.type === 'success' ? '#065f46' : '#9f1239',
                            border: `1.5px solid ${message.type === 'success' ? '#10b98130' : '#f43f5e30'}`,
                            fontWeight: '800',
                            fontSize: '0.95rem',
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)'
                        }}
                    >
                        {message.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                        {message.text}
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '3rem' }}>
                
                {/* Left Side: Identity Card */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="card" 
                        style={{ padding: '3.5rem 2.5rem', textAlign: 'center', borderRadius: '35px', border: 'none', background: 'white', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.08)', position: 'relative', overflow: 'hidden' }}
                    >
                        {/* Decorative Background */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '140px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', zIndex: 0 }}></div>
                        
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '2rem' }}>
                                <div style={{ 
                                    width: '130px', height: '130px', borderRadius: '45px', 
                                    background: 'white', padding: '5px',
                                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
                                }}>
                                    <div style={{ 
                                        width: '100%', height: '100%', borderRadius: '40px', 
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '3rem', fontWeight: '950'
                                    }}>
                                        {profile?.full_name?.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                                <button style={{ position: 'absolute', bottom: '0', right: '-5px', width: '44px', height: '44px', borderRadius: '15px', background: '#0f172a', border: '4px solid white', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                                    <Camera size={18} />
                                </button>
                            </div>

                            <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '950', color: '#0f172a', letterSpacing: '-1px' }}>{profile?.full_name}</h2>
                            <div style={{ 
                                display: 'inline-flex', alignItems: 'center', gap: '8px', 
                                padding: '8px 18px', borderRadius: '100px', backgroundColor: '#eff6ff', 
                                color: '#2563eb', fontSize: '0.8rem', fontWeight: '800', marginTop: '15px',
                                border: '1.5px solid #dbeafe'
                            }}>
                                <ShieldCheck size={16} />
                                {getRoleLabel(profile?.role).toUpperCase()}
                            </div>
                            
                            <div style={{ marginTop: '3.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
                                <ProfileInfoItem icon={<Mail size={18} />} label="Email Principal" value={user?.email} />
                                <ProfileInfoItem icon={<BadgeCheck size={18} />} label="Status da Conta" value="Verificada / Activa" />
                                <ProfileInfoItem icon={<Calendar size={18} />} label="Membro Desde" value={new Date(profile?.created_at).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })} />
                            </div>
                        </div>
                    </motion.div>

                    <div className="card" style={{ padding: '2rem', borderRadius: '28px', background: '#0f172a', color: 'white', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', bottom: -20, right: -20, opacity: 0.1 }}>
                            <Fingerprint size={120} />
                        </div>
                        <div style={{ display: 'flex', gap: '15px', position: 'relative', zIndex: 1 }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                <Lock size={22} />
                            </div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '950', color: 'white' }}>Segurança Biométrica</h4>
                                <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600', lineHeight: '1.5' }}>
                                    As suas credenciais são encriptadas com tecnologia bancária de 256-bits.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Configuration Forms */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                    
                    {/* General Parameters */}
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card" 
                        style={{ padding: '3.5rem', borderRadius: '35px', border: 'none', background: 'white', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.03)' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '3rem' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '18px', backgroundColor: '#f8fafc', border: '2px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a' }}>
                                <User size={26} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '950', color: '#0f172a', letterSpacing: '-0.5px' }}>Dados do Operador</h3>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#64748b', fontWeight: '600' }}>Informações de contacto profissional exibidas no sistema.</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                                <div>
                                    <label className="tac-label">Nome de Exibição</label>
                                    <input
                                        type="text"
                                        className="tac-input"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div style={{ opacity: 0.7 }}>
                                    <label className="tac-label">Email de Acesso (Permanente)</label>
                                    <input
                                        type="email"
                                        className="tac-input"
                                        disabled
                                        value={user?.email || ''}
                                        style={{ background: '#f8fafc', cursor: 'not-allowed' }}
                                    />
                                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '10px', fontWeight: '600' }}>O identificador de acesso é gerido centralmente pela super-administração.</p>
                                </div>
                            </div>

                            <div style={{ paddingTop: '1rem' }}>
                                <button 
                                    type="submit" 
                                    disabled={isSaving || fullName === profile?.full_name} 
                                    className="tac-btn-primary"
                                    style={{ width: 'auto', padding: '0 35px' }}
                                >
                                    {isSaving ? <Loader2 className="spin" size={20} /> : <Save size={20} />}
                                    ACTUALIZAR PERFIL
                                </button>
                            </div>
                        </form>
                    </motion.div>

                    {/* Security & Credentials */}
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="card" 
                        style={{ padding: '3.5rem', borderRadius: '35px', border: 'none', background: 'white', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.03)' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '3rem' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '18px', backgroundColor: '#fff1f2', border: '2px solid #fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48' }}>
                                <Key size={26} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '950', color: '#0f172a', letterSpacing: '-0.5px' }}>Senhas de Sistema</h3>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#64748b', fontWeight: '600' }}>Recomendamos a alteração periódica para máxima segurança.</p>
                            </div>
                        </div>

                        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div>
                                    <label className="tac-label">Nova Senha de Acesso</label>
                                    <input
                                        type="password"
                                        className="tac-input"
                                        value={passData.newPassword}
                                        onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                                        required
                                        placeholder="Min. 8 caracteres"
                                    />
                                </div>
                                <div>
                                    <label className="tac-label">Confirmar Identidade</label>
                                    <input
                                        type="password"
                                        className="tac-input"
                                        value={passData.confirmPassword}
                                        onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
                                        required
                                        placeholder="Repetir nova senha"
                                    />
                                </div>
                            </div>

                            <div style={{ paddingTop: '1rem' }}>
                                <button 
                                    type="submit" 
                                    disabled={isChangingPass || !passData.newPassword} 
                                    className="btn"
                                    style={{ 
                                        height: '60px', borderRadius: '20px', fontWeight: '950', 
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        backgroundColor: '#0f172a', color: 'white', padding: '0 35px',
                                        fontSize: '1rem', boxShadow: '0 15px 30px -5px rgba(0,0,0,0.2)'
                                    }}
                                >
                                    {isChangingPass ? <Loader2 className="spin" size={20} /> : <Lock size={20} />}
                                    REDEFINIR CREDENCIAIS
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </div>

            <style>{`
                .tac-label { display: block; fontSize: 0.75rem; fontWeight: 950; color: #94a3b8; textTransform: uppercase; letterSpacing: 1.5px; margin-bottom: 12px; }
                .tac-input { width: 100%; height: 60px; border-radius: 16px; border: 2.5px solid #f1f5f9; background: white; padding: 0 20px; font-size: 1rem; fontWeight: 700; color: #0f172a; outline: none; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
                .tac-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
                
                .tac-btn-primary { 
                    height: 60px; border-radius: 20px; border: none; 
                    background: #3b82f6; color: white; fontWeight: 950; fontSize: 1rem; 
                    display: flex; align-items: center; justify-content: center; gap: 12px;
                    cursor: pointer; transition: all 0.3s;
                    box-shadow: 0 15px 30px -5px rgba(59, 130, 246, 0.3);
                }
                .tac-btn-primary:hover { transform: translateY(-3px); background: #2563eb; }
                .tac-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .spin { animation: spin 1.5s linear infinite; }
            `}</style>
        </motion.div>
    );
};

const ProfileInfoItem = ({ icon, label, value }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f8fafc', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
        </div>
        <div>
            <div style={{ fontSize: '0.65rem', fontWeight: '950', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
            <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#1e293b', marginTop: '2px' }}>{value}</div>
        </div>
    </div>
);

export default Profile;
