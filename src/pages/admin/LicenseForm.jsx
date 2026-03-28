import React, { useState, useEffect } from 'react';
import { 
  Save, Wallet, Bike, MessageSquare, AlertCircle, Info,
  Calendar, CreditCard, Search, ChevronRight, CheckCircle2,
  FileCheck, ShieldCheck, BadgeCheck, Receipt, ArrowLeft,
  Activity, Gauge, User, History, Download, Printer, Loader2
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';

const LicenseForm = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const vehicleIdParam = searchParams.get('vehicleId');

  const [loading, setLoading] = useState(false);
  const [fetchingVehicle, setFetchingVehicle] = useState(false);
  const [settings, setSettings] = useState(null);
  
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [searchPlate, setSearchPlate] = useState('');

  const [formData, setFormData] = useState({
    vehicle_id: '',
    license_type: 'Licença de circulação',
    issue_date: new Date().toISOString().split('T')[0],
    expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    value: 0,
    notes: ''
  });

  useEffect(() => {
    fetchSettings();
    if (vehicleIdParam) {
      fetchVehicleById(vehicleIdParam);
    }
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('municipal_settings')
      .select('*')
      .eq('municipality_id', profile.municipality_id)
      .single();
    
    if (data) setSettings(data);
  };

  const fetchVehicleById = async (id) => {
    setFetchingVehicle(true);
    const { data } = await supabase
      .from('motorcycles')
      .select('*, owners(full_name)')
      .eq('id', id)
      .single();
    
    if (data) {
      handleSelectVehicle(data);
    }
    setFetchingVehicle(false);
  };

  const searchVehicles = async () => {
    if (searchPlate.length < 3) return;
    
    setFetchingVehicle(true);
    const { data } = await supabase
      .from('motorcycles')
      .select('*, owners(full_name)')
      .ilike('plate', `%${searchPlate}%`)
      .eq('municipality_id', profile.municipality_id)
      .limit(5);
    
    setVehicles(data || []);
    setFetchingVehicle(false);
  };

  const handleSelectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    const defaultType = vehicle.purpose === 'Moto-Táxi' ? 'Licença de moto-táxi' : 'Licença de circulação';
    setFormData(prev => ({ 
      ...prev, 
      vehicle_id: vehicle.id,
      license_type: defaultType
    }));
    calculateValue(vehicle, defaultType);
    setVehicles([]);
    setSearchPlate('');
  };

  const calculateValue = (vehicle, type) => {
    if (!settings) return;

    let value = settings.license_issue_fee;

    if (type === 'Licença de moto-táxi') {
      value += settings.moto_taxi_tax;
    } else if (type === 'Manifesto / IAV') {
      value = settings.car_tax; 
    } else {
      if (vehicle.cc <= 125) value += settings.motorcycle_tax_low;
      else if (vehicle.cc <= 250) value += settings.motorcycle_tax_mid;
      else value += settings.motorcycle_tax_high;
    }

    setFormData(prev => ({ ...prev, value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vehicle_id) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('licenses')
        .insert([{
          ...formData,
          owner_id: selectedVehicle.owner_id,
          municipality_id: profile.municipality_id,
          issuer_id: profile.id,
          status: 'active'
        }]);

      if (error) throw error;
      navigate('/admin/licenses');
    } catch (error) {
      alert('Erro ao emitir licença: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const licenseTypes = [
    { id: 'Licença de circulação', label: 'Circulação Normal', color: '#3b82f6', icon: <Bike size={18} /> },
    { id: 'Licença anual', label: 'Anual Municipal', color: '#8b5cf6', icon: <Calendar size={18} /> },
    { id: 'Licença de moto-táxi', label: 'Especial Moto-Táxi', color: '#f59e0b', icon: <History size={18} /> },
    { id: 'Manifesto / IAV', label: 'Selo / IAV', color: '#10b981', icon: <BadgeCheck size={18} /> }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '6rem' }}
    >
      <PageHeader
        title="Emissão de Título Legal"
        subtitle="Processamento de licenças e conformidade fiscal para a frota municipal."
        breadcrumbs={[
          { label: 'Painel', path: '/admin/dashboard' },
          { label: 'Licenças', path: '/admin/licenses' },
          { label: 'Emissão' }
        ]}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '3rem' }}>
        
        {/* Left Side: Vehicle Selection & Analysis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card" style={{ padding: '3rem', borderRadius: '40px', background: 'white', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.03)' }}>
            <h3 className="section-title-ultra">
              <Search size={22} /> IDENTIFICAÇÃO MOTORIZADA
            </h3>
            
            <AnimatePresence mode="wait">
              {!selectedVehicle ? (
                <motion.div key="search">
                  <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                    <Search style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={22} />
                    <input
                      type="text"
                      placeholder="Pesquisar por Placa (Matrícula)..."
                      className="tac-input-ultra wide plate-input"
                      value={searchPlate}
                      onChange={(e) => setSearchPlate(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchVehicles())}
                    />
                  </div>
                  <button 
                    onClick={searchVehicles}
                    className="tac-btn-primary full-width"
                    disabled={fetchingVehicle}
                  >
                    {fetchingVehicle ? <Loader2 size={18} className="spin" /> : 'INICIAR BUSCA TÁCTICA'}
                  </button>

                  <div style={{ marginTop: '2rem' }}>
                    {vehicles.map(v => (
                      <motion.div 
                        key={v.id} 
                        initial={{ opacity: 0, x: -10 }} 
                        animate={{ opacity: 1, x: 0 }}
                        className="vehicle-search-result"
                        onClick={() => handleSelectVehicle(v)}
                      >
                        <div className="res-plate">{v.plate}</div>
                        <div style={{ flex: 1 }}>
                          <div className="res-brand">{v.brand} {v.model}</div>
                          <div className="res-owner">{v.owners?.full_name}</div>
                        </div>
                        <ChevronRight size={18} color="#cbd5e1" />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="selected"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="selected-vehicle-card"
                >
                  <div className="selected-header">
                    <div className="plate-badge">{selectedVehicle.plate}</div>
                    <button onClick={() => setSelectedVehicle(null)} className="btn-change">ALTERAR</button>
                  </div>
                  
                  <div className="vehicle-info-grid">
                    <div className="info-item">
                      <label>TITULAR</label>
                      <p>{selectedVehicle.owners?.full_name}</p>
                    </div>
                    <div className="info-item">
                      <label>MARCA/MODELO</label>
                      <p>{selectedVehicle.brand} {selectedVehicle.model}</p>
                    </div>
                    <div className="info-item">
                      <label>CC / CILINDRADA</label>
                      <p>{selectedVehicle.cc} CC</p>
                    </div>
                    <div className="info-item">
                      <label>FINALIDADE</label>
                      <p style={{ color: '#3b82f6', fontWeight: '950' }}>{selectedVehicle.purpose}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="card tac-alert-info">
             <Info size={24} style={{ flexShrink: 0 }} />
             <div>
               <h5 style={{ margin: 0, fontWeight: '950', color: '#10b981' }}>Validação Automática</h5>
               <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', fontWeight: '700', color: '#065f46', lineHeight: '1.5' }}>
                 O sistema calcula as taxas tributárias com base nas especificações técnicas (Cilindrada) e finalidade do veículo ({selectedVehicle?.purpose || '---'}).
               </p>
             </div>
          </div>
        </div>

        {/* Right Side: Form & Financials */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem', opacity: !selectedVehicle ? 0.3 : 1, pointerEvents: !selectedVehicle ? 'none' : 'auto', transition: 'all 0.4s' }}>
          
          <div className="card" style={{ padding: '3.5rem', borderRadius: '45px', background: 'white', boxShadow: '0 30px 60px -15px rgba(0,0,0,0.05)' }}>
            <h3 className="section-title-ultra">
              <Receipt size={22} /> PARÂMETROS DA LICENÇA
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2.5rem' }}>
              
              {/* License Type Chooser */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                {licenseTypes.map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      setFormData({...formData, license_type: type.id});
                      calculateValue(selectedVehicle, type.id);
                    }}
                    className={`license-type-btn ${formData.license_type === type.id ? 'active' : ''}`}
                  >
                    <div className="icon-box" style={{ background: formData.license_type === type.id ? type.color : '#f1f5f9', color: formData.license_type === type.id ? 'white' : '#64748b' }}>
                      {type.icon}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div className="type-label">{type.label}</div>
                      <div className="type-id">{type.id}</div>
                    </div>
                    {formData.license_type === type.id && <CheckCircle2 size={20} className="active-check" />}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
                <FormField label="Valor de Emissão (MT)">
                  <div style={{ position: 'relative' }}>
                    <Wallet style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#10b981' }} size={24} />
                    <input
                      type="number"
                      className="tac-input-ultra currency-input"
                      value={formData.value}
                      onChange={(e) => setFormData({...formData, value: parseFloat(e.target.value)})}
                      style={{ paddingLeft: '65px' }}
                    />
                  </div>
                </FormField>
                <div style={{ padding: '20px', background: '#ecfdf5', borderRadius: '20px', border: '1.5px solid #10b98130', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: '950', color: '#065f46', textTransform: 'uppercase' }}>Configuração Fiscal</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#059669', marginTop: '4px' }}>Taxa Municipal Base</div>
                    </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <FormField label="Início da Vigência">
                  <div style={{ position: 'relative' }}>
                    <Calendar style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={22} />
                    <input
                      type="date"
                      className="tac-input-ultra"
                      style={{ paddingLeft: '55px' }}
                      value={formData.issue_date}
                      onChange={(e) => setFormData({...formData, issue_date: e.target.value})}
                      required
                    />
                  </div>
                </FormField>
                <FormField label="Data de Expiração">
                  <div style={{ position: 'relative' }}>
                    <Calendar style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#ef4444' }} size={22} />
                    <input
                      type="date"
                      className="tac-input-ultra"
                      style={{ paddingLeft: '55px', color: '#ef4444' }}
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                      required
                    />
                  </div>
                </FormField>
              </div>

              <FormField label="Observações de Emissão (Campos Internos)">
                <textarea
                  className="tac-input-ultra"
                  style={{ minHeight: '120px', padding: '25px', resize: 'none' }}
                  placeholder="Justifique isenções ou notas especiais de licenciamento..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                ></textarea>
              </FormField>
            </div>
          </div>

          <div style={{ 
            display: 'flex', justifyContent: 'flex-end', gap: '1.5rem',
            padding: '2.5rem', background: 'white', borderRadius: '35px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.03)'
          }}>
            <button 
              type="button" 
              className="tac-nav-btn secondary"
              onClick={() => navigate('/admin/licenses')}
            >
              CANCELAR
            </button>
            <button 
              type="submit" 
              className="tac-nav-btn primary"
              disabled={loading || !selectedVehicle}
            >
              {loading ? <Loader2 size={24} className="spin" /> : <Save size={24} />}
              {loading ? 'EMITINDO...' : 'CONFIRMAR E EMITIR LICENÇA'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .section-title-ultra { display: flex; align-items: center; gap: 12px; font-size: 0.75rem; font-weight: 950; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 2.5rem; }
        
        .tac-input-ultra.wide { height: 64px; }
        .plate-input { font-family: 'Monaco', monospace; font-size: 1.25rem; font-weight: 950; letter-spacing: 1px; }

        .vehicle-search-result { display: flex; align-items: center; gap: 20px; padding: 18px; background: #f8fafc; border-radius: 20px; border: 1.5px solid transparent; cursor: pointer; transition: all 0.2s; margin-bottom: 10px; }
        .vehicle-search-result:hover { background: #eff6ff; border-color: #3b82f6; transform: translateX(5px); }
        .res-plate { font-family: 'Monaco', monospace; font-weight: 950; font-size: 1rem; color: #0f172a; background: white; padding: 6px 12px; border-radius: 8px; border: 1.5px solid #e2e8f0; }
        .res-brand { font-size: 0.95rem; font-weight: 900; color: #1e293b; }
        .res-owner { font-size: 0.75rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; }

        .selected-vehicle-card { background: #0f172a; border-radius: 35px; padding: 2.5rem; color: white; position: relative; overflow: hidden; }
        .selected-header { display: flex; justifyContent: space-between; alignItems: center; margin-bottom: 2.5rem; }
        .plate-badge { font-family: 'Monaco', monospace; font-size: 1.5rem; font-weight: 950; background: #3b82f6; padding: 10px 20px; border-radius: 12px; color: white; letter-spacing: 1px; }
        .btn-change { background: rgba(255,255,255,0.05); border: none; padding: 8px 18px; border-radius: 100px; color: #94a3b8; font-size: 0.7rem; font-weight: 950; cursor: pointer; transition: 0.2s; }
        .btn-change:hover { background: #ef4444; color: white; }
        
        .vehicle-info-grid { display: grid; gridTemplateColumns: 1fr 1fr; gap: 2rem; }
        .info-item label { display: block; fontSize: 0.65rem; fontWeight: 950; color: #475569; letterSpacing: 1px; margin-bottom: 6px; }
        .info-item p { margin: 0; fontSize: 1rem; fontWeight: 850; color: white; }

        .tac-alert-info { padding: 2rem; background: #ecfdf5; border-radius: 28px; border: 1.5px solid #10b98120; display: flex; gap: 1.5rem; alignItems: center; }

        .license-type-btn { padding: 1.25rem; border: 2.5px solid #f1f5f9; background: white; border-radius: 24px; display: flex; gap: 15px; align-items: center; cursor: pointer; transition: all 0.3s; position: relative; }
        .license-type-btn:hover { border-color: #cbd5e1; transform: translateY(-3px); }
        .license-type-btn.active { border-color: #0f172a; background: #f8fafc; }
        .icon-box { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
        .type-label { font-size: 0.9rem; font-weight: 950; color: #0f172a; }
        .type-id { font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-top: 2px; }
        .active-check { position: absolute; right: 20px; color: #0f172a; }

        .currency-input { font-size: 1.5rem !important; font-weight: 950 !important; color: #10b981 !important; background: #f0fdf4 !important; border-color: #10b98130 !important; }

        .tac-input-ultra { width: 100%; height: 60px; border-radius: 18px; border: 2.5px solid #f1f5f9; background: #f8fafc; padding: 0 25px; font-size: 1rem; font-weight: 700; color: #0f172a; outline: none; transition: all 0.2s; }
        .tac-input-ultra:focus { border-color: #3b82f6; background: white; }

        .tac-nav-btn { height: 64px; padding: 0 40px; border-radius: 22px; border: none; font-weight: 950; font-size: 0.95rem; cursor: pointer; display: flex; align-items: center; gap: 15px; transition: all 0.3s; }
        .tac-nav-btn.secondary { background: #f1f5f9; color: #64748b; }
        .tac-nav-btn.primary { background: #0f172a; color: white; box-shadow: 0 15px 30px -5px rgba(15, 23, 42, 0.25); }

        .spin { animation: spin 1.5s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </motion.div>
  );
};

const FormField = ({ label, children }) => (
    <div>
        <label style={{ display: 'block', fontSide: '0.75rem', fontWeight: '950', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '12px' }}>{label}</label>
        {children}
    </div>
);

const Building2 = ({ size, color }) => <Bike size={size} color={color} />; // Fallback

export default LicenseForm;
