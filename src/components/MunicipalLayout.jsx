import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Bike, Car, Search, LogOut, Menu, Settings, 
  CheckCircle, Home, Wallet, CreditCard, 
  Map, AlertOctagon, AlertCircle, Users,
  FileBadge, Banknote, Briefcase, 
  ShieldAlert, BarChart3, User, ShieldCheck,
  ChevronRight, Lock, QrCode, History,
  LayoutDashboard
} from 'lucide-react';
import './MunicipalLayout.css';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import LogoutModal from './LogoutModal';

const MunicipalLayout = ({ children }) => {
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    
    let settings = { primaryColor: '#003366', municipalityName: 'MotoGest', logoUrl: null };
    let profile = null;
    let signOut = () => {};

    try {
        const settingsCtx = useSettings();
        settings = settingsCtx.settings || settings;
    } catch (e) {
        console.warn('MunicipalLayout: SettingsContext not available', e);
    }

    try {
        const authCtx = useAuth();
        profile = authCtx.profile;
        signOut = authCtx.signOut;
    } catch (e) {
        console.warn('MunicipalLayout: AuthContext not available', e);
    }

    const isActive = (path) => location.pathname === path ? 'active' : '';

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'Bom dia';
        if (hour >= 12 && hour < 18) return 'Boa tarde';
        return 'Boa noite';
    };

    const canAccess = (role, item) => {
        if (!role) return false;
        if (role === 'admin_municipal' || role === 'super_admin') return true;

        const accessMap = {
            tecnico: ['/admin/dashboard', '/admin/motorcycles', '/admin/cars', '/admin/bicycles', '/admin/licenses', '/admin/fines', '/admin/payments', '/admin/map', '/admin/blacklist', '/admin/approvals'],
            fiscal: ['/admin/dashboard', '/admin/motorcycles', '/admin/cars', '/admin/bicycles', '/admin/map', '/admin/search', '/admin/blacklist'],
            financeiro: ['/admin/dashboard', '/admin/payments', '/admin/receipts', '/admin/reports']
        };

        const allowedPaths = accessMap[role] || [];
        return allowedPaths.includes(item);
    };

    const navGroups = [
        {
            title: 'GERAL',
            items: [
                { path: '/admin/dashboard', label: 'Painel Principal', icon: <LayoutDashboard size={20} /> },
            ]
        },
        {
            title: 'GESTÃO DE FROTA',
            items: [
                { path: '/admin/motorcycles', label: 'Motorizadas', icon: <Bike size={20} /> },
                { path: '/admin/cars', label: 'Automóveis', icon: <Car size={20} /> },
                { path: '/admin/bicycles', label: 'Bicicletas', icon: <Bike size={20} /> },
            ]
        },
        {
            title: 'DOCUMENTAÇÃO & TAXAS',
            items: [
                { path: '/admin/licenses', label: 'Licenças / Taxas', icon: <FileBadge size={20} /> },
                { path: '/admin/fines', label: 'Multas Aplicadas', icon: <AlertCircle size={20} /> },
                { path: '/admin/seizures', label: 'Apreensões', icon: <Lock size={20} /> },
            ]
        },
        {
            title: 'FISCALIZAÇÃO MUNICIPAL',
            items: [
                { path: '/admin/search', label: 'Scanner QR', icon: <QrCode size={20} /> },
                { path: '/admin/map', label: 'Mapa de Calor', icon: <Map size={20} /> },
                { path: '/admin/blacklist', label: 'Lista Negra', icon: <ShieldAlert size={20} /> },
                { path: '/admin/history', label: 'Meu Histórico', icon: <History size={20} /> },
            ]
        },
        {
            title: 'CONFIGURAÇÃO',
            items: [
                { path: '/admin/users', label: 'Equipa Municipal', icon: <Users size={20} /> },
                { path: '/admin/settings', label: 'Definições do Sistema', icon: <Settings size={20} /> },
            ]
        },
        {
            title: 'MINHA CONTA',
            items: [
                { path: '/admin/profile', label: 'Perfil de Utilizador', icon: <User size={20} /> },
                { type: 'button', onClick: () => setIsLogoutModalOpen(true), label: 'Sair do Portal', icon: <LogOut size={20} /> },
            ]
        }
    ];

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    return (
        <div className="layout">
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} style={{ backgroundColor: settings.primaryColor }}>
                <div className="sidebar-header">
                    <div className="logo-section">
                        <div className="logo-container">
                            {settings.logoUrl ? (
                                <img src={settings.logoUrl} alt="Logo" style={{ height: '32px' }} />
                            ) : (
                                <ShieldCheck size={28} color="#10b981" strokeWidth={2.5} />
                            )}
                        </div>
                        <div>
                            <h1 className="brand-name">MotoGest</h1>
                            <span className="brand-subtitle">Adm. Municipal</span>
                        </div>
                    </div>
                </div>

                <div className="sidebar-nav-container">
                    {navGroups.map((group, groupIdx) => {
                        const filteredItems = group.items.filter(item => 
                            item.type === 'button' || canAccess(profile?.role, item.path)
                        );

                        if (filteredItems.length === 0) return null;

                        return (
                            <div key={groupIdx} className="nav-group">
                                <h3 className="nav-group-title">{group.title}</h3>
                                {filteredItems.map((item, itemIdx) => (
                                    item.type === 'button' ? (
                                        <button 
                                            key={itemIdx} 
                                            onClick={item.onClick} 
                                            className="nav-item w-full bg-transparent border-none cursor-pointer text-left"
                                        >
                                            <span className="nav-icon">{item.icon}</span>
                                            <span className="nav-label">{item.label}</span>
                                        </button>
                                    ) : (
                                        <Link 
                                            key={itemIdx} 
                                            to={item.path} 
                                            className={`nav-item ${isActive(item.path)}`}
                                            onClick={() => setSidebarOpen(false)}
                                        >
                                            <span className="nav-icon">{item.icon}</span>
                                            <span className="nav-label">{item.label}</span>
                                        </Link>
                                    )
                                ))}
                            </div>
                        );
                    })}
                </div>

                <div className="sidebar-footer">
                    <div className="user-footer-card">
                        <div className="user-avatar">
                            {getInitials(profile?.full_name)}
                        </div>
                        <div className="user-info">
                            <span className="name">{profile?.full_name || 'Utilizador'}</span>
                            <span className="role">
                                {profile?.role === 'super_admin' ? 'Super Admin' : 'Admin Municipal'} • {settings.municipalityName}
                            </span>
                        </div>
                    </div>
                </div>
            </aside>

            <main className="main-content">
                <header className="topbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button className="btn-icon mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                            <Menu size={24} />
                        </button>
                        <div className="topbar-municipality">
                            <h2 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>
                                {settings.municipalityName}
                            </h2>
                            <p style={{ fontSize: '0.7rem', color: '#64748b', margin: 0, fontWeight: '600' }}>
                                Portal Administrativo
                            </p>
                        </div>
                    </div>

                    <div className="user-profile">
                        <div className="text-right hidden-mobile">
                            <span className="greeting-text">{getGreeting()}, </span>
                            <span className="user-name">{profile?.full_name?.split(' ')[0] || 'Funcionário'}</span>
                        </div>
                        <div className="user-initials-circle" style={{ backgroundColor: settings.primaryColor }}>
                            {profile?.full_name?.charAt(0) || 'U'}
                        </div>
                    </div>
                </header>
                <div className="page-content">
                    {children}
                </div>
            </main>

            <LogoutModal 
                isOpen={isLogoutModalOpen} 
                onClose={() => setIsLogoutModalOpen(false)} 
                onConfirm={() => {
                    setIsLogoutModalOpen(false);
                    signOut();
                }} 
            />
        </div>
    );
};

export default MunicipalLayout;
