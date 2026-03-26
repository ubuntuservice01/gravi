import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { 
    ArrowLeft, 
    Save, 
    Car, 
    User, 
    FileText, 
    AlertCircle, 
    MapPin, 
    Gauge, 
    Loader2,
    Info,
    CheckCircle2
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import OwnerSearch from '../../components/OwnerSearch';
import { motion, AnimatePresence } from 'framer-motion';

const CarForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [selectedOwner, setSelectedOwner] = useState(null);

    const [formData, setFormData] = useState({
        plate: '',
        chassis: '',
        brand: '',
        model: '',
        color: '',
        year: new Date().getFullYear(),
        cc: '',
        purpose: 'Particular',
        status: 'Activa',
        operational_situation: 'Pendente',
        observations: '',
        type: 'car'
    });

    useEffect(() => {
        if (id) {
            fetchCar();
        }
    }, [id]);

    const fetchCar = async () => {
        setFetching(true);
        try {
            const { data, error } = await supabase
                .from('motorcycles')
                .select('*, owners(*)')
                .eq('id', id)
                .eq('type', 'car')
                .single();

            if (error) throw error;
            if (data) {
                setFormData(data);
                setSelectedOwner(data.owners);
            }
        } catch (err) {
            console.error('Error fetching car:', err);
            alert('Erro ao carregar dados do veículo.');
        } finally {
            setFetching(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedOwner) {
            alert('Por favor, identifique o proprietário.');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                owner_id: selectedOwner.id,
                municipality_id: profile.municipality_id,
                technician_id: profile.id,
                plate: formData.plate.toUpperCase(),
                chassis: formData.chassis.toUpperCase(),
                type: 'car'
            };

            delete payload.owners;

            let result;
            if (id) {
                result = await supabase
                    .from('motorcycles')
                    .update(payload)
                    .eq('id', id);
            } else {
                result = await supabase
                    .from('motorcycles')
                    .insert([payload]);
            }

            if (result.error) throw result.error;

            alert(id ? 'Dados actualizados com sucesso!' : 'Automóvel registado com sucesso!');
            navigate('/admin/cars');
        } catch (err) {
            console.error('Error saving car:', err);
            alert('Erro ao guardar: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <Loader2 className="spin" size={48} color="var(--primary)" />
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ maxWidth: '1000px', margin: '0 auto' }}
        >
            <PageHeader
                title={id ? 'Editar Automóvel' : 'Novo Recenseamento'}
                subtitle="Registo institucional de veículos ligeiros, pesados e máquinas."
                breadcrumbs={[
                    { label: 'Painel', path: '/admin/dashboard' },
                    { label: 'Automóveis', path: '/admin/cars' },
                    { label: id ? 'Editar' : 'Novo' }
                ]}
            />

            <form onSubmit={handleSubmit}>
                <div className="card" style={{ marginBottom: '2rem', padding: '2rem', borderRadius: '24px', border: '1.5px solid #f1f5f9' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <User size={24} color="#3b82f6" />
                            Proprietário do Veículo
                        </h3>
                        <p style={{ color: '#64748b', fontWeight: '500', fontSize: '0.9rem' }}>Vincule o automóvel a um cidadão registado.</p>
                    </div>
                    <OwnerSearch onSelect={setSelectedOwner} initialOwner={selectedOwner} />
                </div>

                <div className="card" style={{ marginBottom: '2rem', padding: '2.5rem', borderRadius: '24px', border: '1.5px solid #f1f5f9' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Car size={24} color="#3b82f6" />
                            Dados Técnicos e Legais
                        </h3>
                        <p style={{ color: '#64748b', fontWeight: '500', fontSize: '0.9rem' }}>Insira as informações do título de propriedade ou livrete.</p>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#475569', marginBottom: '8px' }}>Matrícula *</label>
                            <input
                                type="text"
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none', fontWeight: '900', textTransform: 'uppercase', fontFamily: 'monospace', fontSize: '1.1rem', backgroundColor: '#f8fafc' }}
                                required
                                placeholder="LD-00-00-XX"
                                value={formData.plate}
                                onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#475569', marginBottom: '8px' }}>Nº do Chassi (VIN) *</label>
                            <input
                                type="text"
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none', fontWeight: '700' }}
                                required
                                placeholder="Número gravado no quadro"
                                value={formData.chassis}
                                onChange={(e) => setFormData({ ...formData, chassis: e.target.value })}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#475569', marginBottom: '8px' }}>Ano de Fabrico</label>
                            <input
                                type="number"
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none', fontWeight: '700' }}
                                value={formData.year}
                                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#475569', marginBottom: '8px' }}>Marca *</label>
                            <input type="text" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none', fontWeight: '600' }} required value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#475569', marginBottom: '8px' }}>Modelo *</label>
                            <input type="text" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none', fontWeight: '600' }} required value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#475569', marginBottom: '8px' }}>Cor Predominante *</label>
                            <input type="text" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none', fontWeight: '600' }} required value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#475569', marginBottom: '8px' }}>Cilindrada / Motor</label>
                            <input type="text" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none', fontWeight: '600' }} value={formData.cc} onChange={(e) => setFormData({ ...formData, cc: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#475569', marginBottom: '8px' }}>Categoria de Uso</label>
                            <select
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none', backgroundColor: 'white', fontWeight: '700' }}
                                value={formData.purpose}
                                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                            >
                                <option value="Particular">Ligeiro Particular</option>
                                <option value="Transporte">Ligeiro de Aluguer / Táxi</option>
                                <option value="Serviço">Pesado / Industrial</option>
                                <option value="Estado">Estado / Institucional</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ marginBottom: '2rem', padding: '2.5rem', borderRadius: '24px', border: '1.5px solid #f1f5f9' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#475569', marginBottom: '12px' }}>Estado Operacional</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {['Activa', 'Bloqueada', 'Apreendida'].map(s => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, status: s })}
                                        style={{
                                            flex: 1, padding: '12px', borderRadius: '12px', border: '2px solid',
                                            borderColor: formData.status === s ? '#3b82f6' : '#f1f5f9',
                                            backgroundColor: formData.status === s ? '#eff6ff' : 'white',
                                            color: formData.status === s ? '#1e40af' : '#64748b',
                                            fontWeight: '800', fontSize: '0.8rem', transition: 'all 0.2s', cursor: 'pointer'
                                        }}
                                    >
                                        {s === 'Activa' && <CheckCircle2 size={16} style={{ marginBottom: '4px' }} />}
                                        <div style={{ textTransform: 'uppercase' }}>{s}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#475569', marginBottom: '12px' }}>Validação Administrativa</label>
                            <select 
                                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none', backgroundColor: 'white', fontWeight: '800', color: '#1e293b' }} 
                                value={formData.operational_situation} 
                                onChange={(e) => setFormData({ ...formData, operational_situation: e.target.value })}
                            >
                                <option value="Pendente">Aguardando Vistoria</option>
                                <option value="Regular">Regularizado</option>
                                <option value="Irregular">Irregularidade Detectada</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', padding: '2rem 0', borderTop: '2px solid #f1f5f9' }}>
                    <button 
                        type="button" 
                        style={{ padding: '14px 30px', borderRadius: '12px', border: 'none', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: '800', cursor: 'pointer' }} 
                        onClick={() => navigate('/admin/cars')}
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 40px', borderRadius: '12px', border: 'none', backgroundColor: '#0f172a', color: 'white', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="spin" size={20} /> : (id ? 'Atualizar Dados' : 'Finalizar Registo')}
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

export default CarForm;
