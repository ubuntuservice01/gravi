import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Edit, User, Bike, Printer, 
  MapPin, Calendar, Shield, Info, 
  Download, History, Hash, CheckCircle, RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import PageHeader from '../../components/PageHeader';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

const BicycleDetails = () => {
  const { id } = useParams();
  const [bic, setBic] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBicData();
  }, [id]);

  const fetchBicData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('motorcycles') // In this version, motorcycles table stores all vehicles including bicycles
        .select(`
          *,
          owners (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setBic(data);
    } catch (error) {
      console.error('Erro ao buscar bicicleta:', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '20px' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><RefreshCw size={40} color="#f59e0b" /></motion.div>
      <p style={{ fontWeight: '800', color: '#64748b' }}>Acedendo aos registos de velocípedes...</p>
    </div>
  );

  if (!bic) return <div className="p-12 text-center text-red-500 font-black">Registo não localizado.</div>;

  return (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '6rem' }}
    >
      <PageHeader 
        title={`Registo #${bic.plate || bic.id.substring(0,8).toUpperCase()}`}
        subtitle="Inscrição Municipal de Veículo não Motorizado"
        breadcrumbs={[
            { label: 'Painel', path: '/admin/dashboard' },
            { label: 'Bicicletas', path: '/admin/bicycles' },
            { label: 'Detalhes' }
        ]}
        actions={
            <Link to={`/admin/bicycles/edit/${id}`} className="btn" style={{ backgroundColor: '#f59e0b', color: 'white', fontWeight: '950', padding: '12px 24px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none' }}>
                <Edit size={18} /> Actualizar Registo
            </Link>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '2.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            <div className="card" style={{ padding: '3rem', borderRadius: '32px', border: 'none', background: 'linear-gradient(135deg, #fffbeb 0%, #fff 100%)', boxShadow: '0 15px 40px -10px rgba(245,158,11,0.1)' }}>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '3rem' }}>
                    <div style={{ width: '70px', height: '70px', borderRadius: '22px', backgroundColor: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <Bike size={38} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '950', color: '#0f172a' }}>{bic.brand}</h2>
                        <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#92400e', backgroundColor: '#fef3c7', padding: '4px 12px', borderRadius: '8px', marginTop: '6px', display: 'inline-block' }}>Velocípede Municipal</span>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                    <DataField label="Cor da Unidade" value={bic.color} />
                    <DataField label="Ano de Registo" value={bic.year} />
                    <DataField label="Nº de Referência" value={bic.plate || bic.id.substring(0,10).toUpperCase()} font="monospace" highlight />
                    <DataField label="Estado" value={bic.status} />
                </div>
            </div>

            <div className="card" style={{ padding: '2.5rem', borderRadius: '32px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem', fontWeight: '950', color: '#64748b', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '2rem' }}>
                    <User size={18} color="#f59e0b" /> Proprietário
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <DataField label="Nome Completo" value={bic.owners?.full_name} size="large" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <DataField label="Nº BI / ID" value={bic.owners?.bi_number} />
                        <DataField label="Contacto Vivo" value={bic.owners?.phone} highlight />
                    </div>
                </div>
            </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card" style={{ padding: '2rem', borderRadius: '30px', background: '#0f172a', color: 'white', border: 'none' }}>
                <h4 style={{ margin: '0 0 1.5rem', fontSize: '0.9rem', fontWeight: '950', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}><Hash size={18} /> Administração</h4>
                <MetaRow label="Data Inscrição" value={format(new Date(bic.created_at), "dd/MM/yyyy")} />
                <MetaRow label="Taxa Urbana" value="Paga" color="#10b981" />
                <MetaRow label="Município" value="Central Maputo" />
            </div>

            <div style={{ padding: '2rem', background: '#fffbeb', borderRadius: '24px', border: '1.5px solid #fef3c7', display: 'flex', gap: '15px' }}>
                <Shield size={22} color="#f59e0b" />
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#92400e', fontWeight: '700', lineHeight: '1.5' }}>
                    O registo de velocípedes é obrigatório para circulação em vias públicas municipais.
                </p>
            </div>
            
            <button className="btn" style={{ width: '100%', padding: '16px', borderRadius: '18px', backgroundColor: 'white', border: '2px solid #f1f5f9', fontWeight: '900', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <Printer size={18} /> Imprimir Comprovativo
            </button>
        </div>
      </div>
    </motion.div>
  );
};

const DataField = ({ label, value, size = 'normal', highlight = false, font = 'inherit' }) => (
    <div>
        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>{label}</label>
        <div style={{ 
            fontSize: size === 'large' ? '1.4rem' : '1.1rem', 
            fontWeight: '900', 
            color: highlight ? '#f59e0b' : '#0f172a',
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

export default BicycleDetails;
