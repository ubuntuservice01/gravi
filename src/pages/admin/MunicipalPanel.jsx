import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import MunicipalLayout from '../../components/MunicipalLayout';
import { useAuth } from '../../contexts/AuthContext';

import MunicipalDashboard from './Dashboard';
import MotorbikeDashboard from './MotorbikeDashboard';
import CarDashboard from './CarDashboard';
import BicycleDashboard from './BicycleDashboard';
import OwnersList from './OwnersList';
import CarsList from './CarsList';
import CarForm from './CarForm';
import CarDetails from './CarDetails';
import BicyclesList from './BicyclesList';
import BicycleForm from './BicycleForm';
import BicycleDetails from './BicycleDetails';
import MunicipalUsersList from './UsersList';
import MotorcyclesList from './MotorcyclesList';
import MotorcycleForm from './MotorcycleForm';
import MotorcycleDetails from './MotorcycleDetails';
import LicensesList from './LicensesList';
import LicenseForm from './LicenseForm';
import LicenseDetails from './LicenseDetails';
import LicenseRenewal from './LicenseRenewal';
import FinesList from './FinesList';
import FineForm from './FineForm';
import SeizuresList from './SeizuresList';
import SeizureForm from './SeizureForm';
import PaymentsList from './PaymentsList';
import PaymentForm from './PaymentForm';
import ReceiptsList from './ReceiptsList';
import Scanner from './Scanner';
import Reports from './Reports';
import MunicipalSettings from './MunicipalSettings';
import Profile from './Profile';
import Approvals from './Approvals';
import Blacklist from './Blacklist';
import FiscalizationMap from './FiscalizationMap';
import OwnerDetails from './OwnerDetails';

const PremiumPlaceholder = ({ title, icon: Icon }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="card" 
    style={{ 
        textAlign: 'center', 
        padding: '5rem 2rem', 
        borderRadius: '32px', 
        border: '1.5px solid #f1f5f9',
        maxWidth: '600px',
        margin: '4rem auto'
    }}
  >
    <div style={{ width: '80px', height: '80px', backgroundColor: '#eff6ff', color: '#3b82f6', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem auto' }}>
      <Icon size={40} />
    </div>
    <h2 style={{ fontSize: '1.5rem', fontWeight: '950', color: '#0f172a', marginBottom: '1rem', letterSpacing: '-0.5px' }}>{title}</h2>
    <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: '500', lineHeight: '1.6', marginBottom: '2.5rem' }}>
        Este módulo está em fase final de desenvolvimento e será disponibilizado em breve na próxima actualização do sistema.
    </p>
    <div style={{ display: 'inline-flex', padding: '10px 20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1.5px solid #e2e8f0', color: '#64748b', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
        Acesso Limitado • Fase 4
    </div>
  </motion.div>
);

import { motion } from 'framer-motion';
import { History, TrendingUp } from 'lucide-react';

const MunicipalPanel = () => {
  return (
    <MunicipalLayout>
      <Routes>
        <Route path="dashboard" element={<MunicipalDashboard />} />
        
        {/* Hub Dashboards */}
        <Route path="dashboard-motos" element={<MotorbikeDashboard />} />
        <Route path="dashboard-carros" element={<CarDashboard />} />
        <Route path="dashboard-bicicletas" element={<BicycleDashboard />} />

        {/* Vehicles */}
        <Route path="owners" element={<OwnersList />} />
        <Route path="owners/:id" element={<OwnerDetails />} />
        <Route path="motorcycles" element={<MotorcyclesList />} />
        <Route path="motorcycles/new" element={<MotorcycleForm />} />
        <Route path="motorcycles/edit/:id" element={<MotorcycleForm />} />
        <Route path="motorcycles/:id" element={<MotorcycleDetails />} />
        
        <Route path="cars" element={<CarsList />} />
        <Route path="cars/new" element={<CarForm />} />
        <Route path="cars/edit/:id" element={<CarForm />} />
        <Route path="cars/:id" element={<CarDetails />} />
        
        <Route path="bicycles" element={<BicyclesList />} />
        <Route path="bicycles/new" element={<BicycleForm />} />
        <Route path="bicycles/edit/:id" element={<BicycleForm />} />
        <Route path="bicycles/:id" element={<BicycleDetails />} />

        {/* Licensing & Fiscal */}
        <Route path="licenses" element={<LicensesList />} />
        <Route path="licenses/new" element={<LicenseForm />} />
        <Route path="licenses/:id" element={<LicenseDetails />} />
        <Route path="licenses/renew/:id" element={<LicenseRenewal />} />
        
        {/* Enforcement */}
        <Route path="search" element={<Scanner />} />
        <Route path="fines" element={<FinesList />} />
        <Route path="fines/new" element={<FineForm />} />
        <Route path="seizures" element={<SeizuresList />} />
        <Route path="seizures/new" element={<SeizureForm />} />
        <Route path="history" element={<PremiumPlaceholder title="O meu Histórico" icon={History} />} />

        {/* Finance & Analytics */}
        <Route path="payments" element={<PaymentsList />} />
        <Route path="payments/new" element={<PaymentForm />} />
        <Route path="receipts" element={<ReceiptsList />} />
        <Route path="revenue" element={<PremiumPlaceholder title="Controle de Receita" icon={TrendingUp} />} />
        <Route path="reports" element={<Reports />} />

        {/* Core */}
        <Route path="users" element={<MunicipalUsersList />} />
        <Route path="settings" element={<MunicipalSettings />} />
        <Route path="profile" element={<Profile />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="blacklist" element={<Blacklist />} />
        <Route path="map" element={<FiscalizationMap />} />
        
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </MunicipalLayout>
  );
};

export default MunicipalPanel;

