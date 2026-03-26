import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { LayoutDashboard, Building2, Users, Settings, Shield, TrendingUp } from 'lucide-react';
import SuperAdminDashboard from './Dashboard';
import MunicipalitiesList from './MunicipalitiesList';
import MunicipalityForm from './MunicipalityForm';
import MunicipalityDetails from './MunicipalityDetails';
import GlobalUsersList from './UsersList';
import SecurityLogs from './SecurityLogs';
import GlobalSettings from './GlobalSettings';

const SuperAdminPanel = () => {
    const menuGroups = [
        {
            title: 'PRINCIPAL',
            items: [
                { path: '/super-admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
                { path: '/super-admin/municipalities', label: 'Municípios', icon: <Building2 size={20} /> },
                { path: '/super-admin/users', label: 'Utilizadores', icon: <Users size={20} /> },
                { path: '/super-admin/reports', label: 'Relatórios', icon: <TrendingUp size={20} /> },
            ]
        },
        {
            title: 'SISTEMA',
            items: [
                { path: '/super-admin/system', label: 'Configurações', icon: <Settings size={20} /> },
                { path: '/super-admin/security', label: 'Segurança', icon: <Shield size={20} /> },
            ]
        }
    ];

    return (
        <div className="dashboard-container">
            <Sidebar menuGroups={menuGroups} />
            <main className="main-content">
                <Routes>
                    <Route path="dashboard" element={<SuperAdminDashboard />} />
                    <Route path="municipalities" element={<MunicipalitiesList />} />
                    <Route path="municipalities/new" element={<MunicipalityForm />} />
                    <Route path="municipalities/edit/:id" element={<MunicipalityForm />} />
                    <Route path="municipalities/:id" element={<MunicipalityDetails />} />
                    <Route path="users" element={<GlobalUsersList />} />
                    <Route path="reports" element={
                        <div className="card text-center p-12">
                            <TrendingUp size={48} color="var(--primary)" style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Relatórios Consolidados</h2>
                            <p style={{ color: '#64748b' }}>A processar agregados mensais para todos os municípios.</p>
                        </div>
                    } />
                    <Route path="system" element={<GlobalSettings />} />
                    <Route path="security" element={<SecurityLogs />} />
                    <Route path="*" element={<Navigate to="/super-admin/dashboard" replace />} />
                </Routes>
            </main>
        </div>
    );
};

export default SuperAdminPanel;
