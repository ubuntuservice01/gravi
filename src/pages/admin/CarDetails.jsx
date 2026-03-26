import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, User, Car, Printer, 
  FileText, CheckCircle, AlertTriangle, Info, 
  Calendar, Shield, Wallet, RefreshCw, Eye, 
  History, Clock, MapPin, Hash,
  Download, ExternalLink, AlertCircle, Gauge, Fuel, Settings
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../../components/PageHeader';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

const CarDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCarData();
  }, [id]);

  const fetchCarData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('motorcycles') // In this version, motorcycles table stores all vehicles including cars
        .select(`
          *,
          owners (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setCar(data);
    } catch (error) {
      console.error('Erro ao buscar automóvel:', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '20px' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><RefreshCw size={40} color="#3b82f6" /></motion.div>
      <p style={{ fontWeight: '800', color: '#64748b' }}>Sincronizando ficha técnica...</p>
    </div>
  );

  if (!car) return <div className="p-12 text-center text-red-500 font-black">Viatura não localizada nos arquivos municipais.</div>;

  const statusColor = car.status === 'Activa' ? '#10b981' : '#ef4444';

  return (
    <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ maxWidth: '1300px', margin: '0 auto', paddingBottom: '6rem' }}
    >
      <PageHeader 
        title={`Viatura ${car.plate}`}
        subtitle={`${car.brand} ${car.model} • Gestão de Frota Municipal`}
        breadcrumbs={[
            { label: 'Painel', path: '/admin/dashboard' },
            { label: 'Automóveis', path: '/admin/cars' },
            { label: car.plate }
        ]}
        actions={
            <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn" style={{ backgroundColor: 'white', border: '2px solid #e2e8f0', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '14px' }}>
                    <Printer size={18} /> Imprimir Ficha
                </button>
                <Link to={`/admin/cars/edit/${id}`} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '14px', fontWeight: '900' }}>
                    <Edit size={18} /> Rectificar Dados
                </Link>
            </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: '2.5rem', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            
            {/* Visual Identification */}
            <div className="card" style={{ padding: '3.5rem', borderRadius: '32px', border: 'none', boxShadow: '0 20px 50px -10px rgba(0,0,0,0.08)', backgroundColor: 'white', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '100%', background: 'linear-gradient(90deg, transparent 0%, #f8fafc 100%)', zOrigin: 0 }}></div>
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
                        <div style={{ display: 'flex', gap: '24px' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '24px', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Car size={42} color="white" />
                            </div>
                            <div>
                                <div style={{ 
                                    display: 'inline-flex', padding: '4px 12px', borderRadius: '8px', 
                                    backgroundColor: '#0f172a', color: 'white', fontWeight: '950', 
                                    fontFamily: 'monospace', fontSize: '1.5rem', border: '3px solid #334155',
                                    marginBottom: '8px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                                }}>{car.plate}</div>
                                <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '950', color: '#0f172a' }}>{car.brand} {car.model}</h2>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ padding: '8px 16px', borderRadius: '12px', backgroundColor: `${statusColor}15`, color: statusColor, fontWeight: '950', fontSize: '0.85rem', textTransform: 'uppercase', border: `1.5px solid ${statusColor}30` }}>
                                {car.status.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem' }}>
                        <SpecItem icon={<Gauge size={20} />} label="Quilometragem" value="--- km" />
                        <SpecItem icon={<Fuel size={20} />} label="Combustível" value={car.fuel_type || 'Gasóleo'} />
                        <SpecItem icon={<Settings size={20} />} label="Transmissão" value="Manual" />
                        <SpecItem icon={<Calendar size={20} />} label="Ano Fabrico" value={car.year} />
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div className="card" style={{ padding: '2.5rem', borderRadius: '32px' }}>
                    <SectionTitle icon={<User size={20} />} title="Proprietário / Titular" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <DataField label="Nome do Proprietário" value={car.owners?.full_name} size="large" />
                        <DataField label="Documento de Identidade (BI)" value={car.owners?.bi_number} />
                        <DataField label="Contacto Telefónico" value={car.owners?.phone} highlight />
                    </div>
                </div>

                <div className="card" style={{ padding: '2.5rem', borderRadius: '32px' }}>
                    <SectionTitle icon={<Shield size={20} />} title="Especificações Técnicas" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <DataField label="Número de Chassis" value={car.chassis} font="monospace" />
                        <DataField label="Cor Predominante" value={car.color} />
                        <DataField label="Uso Autorizado" value={car.purpose || 'Transporte Público'} highlight />
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: '2.5rem', borderRadius: '32px' }}>
                <SectionTitle icon={<History size={20} />} title="Histórico de Actividade" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <HistoryItem date="15 Mar 2024" action="Pagamento de Taxa Anual" status="Concluído" />
                    <HistoryItem date="10 Jan 2024" action="Inspecção Periódica" status="Aprovado" />
                    <HistoryItem date="02 Nov 2023" action="Registo de Propriedade" status="Original" isLast />
                </div>
            </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card" style={{ padding: '2.5rem', borderRadius: '32px', background: '#0f172a', color: 'white', border: 'none' }}>
                <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: '950', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '10px' }}><Hash size={20} /> Metadados</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <MetaRow label="Data de Cadastro" value={format(new Date(car.created_at), "dd/MM/yyyy")} />
                    <MetaRow label="Cadastrado por" value="Admin Municipal" />
                    <MetaRow label="Localização" value="Distrito Municipal 1" />
                    <MetaRow label="Vencimento Taxa" value=" Dezembro 2024" color="#fbbf24" />
                </div>
            </div>

            <div className="card" style={{ padding: '2.5rem', borderRadius: '32px' }}>
                <h3 style={{ margin: '0 0 1.5rem', fontSize: '1rem', fontWeight: '950', color: '#0f172a' }}>Documentos Anexos</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <DocAction icon={<FileText size={18} />} title="Título de Propriedade" />
                    <DocAction icon={<FileText size={18} />} title="Livrete Digital" />
                    <DocAction icon={<FileText size={18} />} title="Apólice de Seguro" />
                </div>
            </div>

            <div style={{ padding: '2rem', background: '#eff6ff', borderRadius: '24px', border: '1.5px solid #dbeafe', display: 'flex', gap: '15px' }}>
                <Info size={24} color="#3b82f6" />
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#1e40af', fontWeight: '600', lineHeight: '1.5' }}>
                    Esta viatura está autorizada para circulação municipal sob o regime de transporte público de passageiros.
                </p>
            </div>
        </div>
      </div>
    </motion.div>
  );
};

const SpecItem = ({ icon, label, value }) => (
    <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '20px', border: '1.5px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6', marginBottom: '8px' }}>{icon} <span style={{ fontSize: '0.7rem', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase' }}>{label}</span></div>
        <div style={{ fontSize: '1.1rem', fontWeight: '950', color: '#0f172a' }}>{value}</div>
    </div>
);

const SectionTitle = ({ icon, title }) => (
    <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem', fontWeight: '950', color: '#64748b', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '2rem' }}>
        <span style={{ color: '#3b82f6' }}>{icon}</span> {title}
    </h3>
);

const DataField = ({ label, value, size = 'normal', highlight = false, font = 'inherit' }) => (
    <div>
        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>{label}</label>
        <div style={{ 
            fontSize: size === 'large' ? '1.5rem' : '1.1rem', 
            fontWeight: '900', 
            color: highlight ? '#2563eb' : '#0f172a',
            fontFamily: font
        }}>
            {value || '---'}
        </div>
    </div>
);

const MetaRow = ({ label, value, color = 'white' }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8' }}>{label}</span>
        <span style={{ fontSize: '0.8rem', fontWeight: '900', color: color }}>{value}</span>
    </div>
);

const DocAction = ({ icon, title }) => (
    <button style={{ 
        width: '100%', padding: '14px 20px', borderRadius: '16px', background: '#f8fafc', border: '1.5px solid #f1f5f9', 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s' 
    }} onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'} onMouseLeave={e => e.currentTarget.style.borderColor = '#f1f5f9'}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#475569', fontWeight: '800', fontSize: '0.85rem' }}>
            {icon} {title}
        </div>
        <Download size={16} color="#3b82f6" />
    </button>
);

const HistoryItem = ({ date, action, status, isLast = false }) => (
    <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#3b82f6', border: '3px solid #dbeafe' }}></div>
            {!isLast && <div style={{ width: '2px', flex: 1, backgroundColor: '#f1f5f9', margin: '4px 0' }}></div>}
        </div>
        <div style={{ paddingBottom: isLast ? 0 : '1.5rem', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '900', color: '#0f172a' }}>{action}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8' }}>{date}</span>
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#10b981', textTransform: 'uppercase', marginTop: '2px' }}>{status}</div>
        </div>
    </div>
);

export default CarDetails;
