import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import SuperAdminPanel from './pages/super-admin/SuperAdminPanel';
import MunicipalPanel from './pages/admin/MunicipalPanel';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, profile, loading } = useAuth();

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
      <div className="text-center">
        <div style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #003366', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}></div>
        <p style={{ color: '#64748b', fontWeight: '500' }}>Verificando permissões...</p>
      </div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!user) return <Navigate to="/login" />;
  
// If we have a user but no profile, the AuthContext should have already dealt with it 
  // via errorType. If we are here and profile is missing, it's a critical logic error.
  if (!profile && !loading) {
    console.error('ProtectedRoute: Profile is missing even though loading is finished.');
    return <Navigate to="/login" />;
  }

  
  if (allowedRoles && !allowedRoles.includes(profile?.role)) {
    console.warn(`ProtectedRoute: Access denied for role ${profile?.role}. Allowed: ${allowedRoles.join(', ')}`);
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            <Route path="/" element={<HomeRedirect />} />

            {/* Super Admin Routes */}
            <Route path="/super-admin/*" element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <SuperAdminPanel />
              </ProtectedRoute>
            } />

            {/* All Municipal Staff (Admin, Técnico, Fiscal, Financeiro) use the same Panel structure but different content */}
            <Route path="/admin/*" element={
              <ProtectedRoute allowedRoles={['admin_municipal', 'tecnico', 'fiscal', 'financeiro']}>
                <MunicipalPanel />
              </ProtectedRoute>
            } />

            <Route path="/unauthorized" element={<div className="p-12 text-center text-red-600"><h1>Acesso Negado</h1><p>Não tem permissão para aceder a esta página.</p></div>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </SettingsProvider>
    </AuthProvider>
  );
}

const HomeRedirect = () => {
  const { user, profile } = useAuth();

  if (!user) return <Navigate to="/login" />;
  
  if (profile?.role === 'super_admin') {
    return <Navigate to="/super-admin/dashboard" />;
  }
  
  // All other roles go to /admin/dashboard
  return <Navigate to="/admin/dashboard" />;
};

export default App;
