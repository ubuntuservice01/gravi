import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, User, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LogoutModal from './LogoutModal';

const Sidebar = ({ menuGroups = [] }) => {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleConfirmLogout = async () => {
    setIsLogoutModalOpen(false);
    await signOut();
    navigate('/login');
  };

  return (
    <>
      <aside style={{
        width: '280px',
        backgroundColor: '#0f172a', // Deep Navy
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 100,
        borderRight: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.1)'
      }}>
        {/* Logo Section - Institutional */}
        <div style={{ padding: '32px 24px 24px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}>
              <span style={{ color: 'white', fontWeight: '800', fontSize: '1.1rem' }}>M</span>
            </div>
            <span style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.5px', color: 'white' }}>MotoGest</span>
          </div>
          <p style={{ fontSize: '0.65rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', margin: 0, paddingLeft: '2px' }}>
            Administrador Global
          </p>
        </div>

        {/* Navigation Groups */}
        <nav style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
          {menuGroups.map((group, idx) => (
            <div key={idx} style={{ marginBottom: '24px' }}>
              <div style={{ 
                fontSize: '0.65rem', 
                fontWeight: '800', 
                color: '#64748b', 
                padding: '0 12px 8px 12px',
                letterSpacing: '1px'
              }}>
                {group.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    style={({ isActive }) => ({
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 12px', borderRadius: '8px',
                      textDecoration: 'none', transition: 'all 0.2s',
                      backgroundColor: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                      color: isActive ? 'white' : '#94a3b8',
                      fontWeight: isActive ? '600' : '500',
                      fontSize: '0.9rem'
                    })}
                    className={({ isActive }) => isActive ? '' : 'sidebar-link-hover'}
                  >
                    <span style={{ opacity: 0.8 }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}

          {/* CONTA GROUP */}
          <div style={{ marginBottom: '24px' }}>
              <div style={{ 
                fontSize: '0.65rem', 
                fontWeight: '800', 
                color: '#64748b', 
                padding: '0 12px 8px 12px',
                letterSpacing: '1px'
              }}>
                CONTA
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <NavLink
                  to="/super-admin/profile"
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 12px', borderRadius: '8px',
                    textDecoration: 'none', transition: 'all 0.2s',
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                    color: isActive ? 'white' : '#94a3b8',
                    fontWeight: isActive ? '600' : '500',
                    fontSize: '0.9rem'
                  })}
                  className={({ isActive }) => isActive ? '' : 'sidebar-link-hover'}
                >
                  <User size={20} />
                  <span>Meu Perfil</span>
                </NavLink>
                
                <button 
                  onClick={() => setIsLogoutModalOpen(true)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 12px', borderRadius: '8px', border: 'none',
                    backgroundColor: 'transparent', color: '#94a3b8',
                    fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                      e.currentTarget.style.color = '#f87171';
                  }}
                  onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#94a3b8';
                  }}
                >
                  <LogOut size={20} />
                  <span>Sair do Sistema</span>
                </button>
              </div>
            </div>
        </nav>

        {/* User Info - Footer */}
        <div style={{ padding: '20px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#10b981', fontWeight: '700', fontSize: '0.8rem'
            }}>
              SA
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile?.full_name || 'Super Admin'}
              </span>
              <span style={{ fontSize: '0.6rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                Administrador
              </span>
            </div>
          </div>
        </div>
      </aside>

      <LogoutModal 
        isOpen={isLogoutModalOpen} 
        onClose={() => setIsLogoutModalOpen(false)} 
        onConfirm={handleConfirmLogout} 
      />

      <style>{`
        .sidebar-link-hover:hover {
          background-color: rgba(255, 255, 255, 0.04) !important;
          color: white !important;
        }
      `}</style>
    </>
  );
};

export default Sidebar;
