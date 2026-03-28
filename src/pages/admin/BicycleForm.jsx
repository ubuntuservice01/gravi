import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { 
    ArrowLeft, 
    Save, 
    Bike, 
    User, 
    Loader2,
    Info,
    CheckCircle2
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import OwnerSearch from '../../components/OwnerSearch';
import { motion, AnimatePresence } from 'framer-motion';

const BicycleForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [selectedOwner, setSelectedOwner] = useState(null);

    const [formData, setFormData] = useState({
        chassis: '', // Frame Number
        brand: '',
        model: '',
        color: '',
        year: new Date().getFullYear(),
        purpose: 'Particular',
        status: 'active',
        operational_situation: 'Regular',
        observations: '',
        type: 'bicycle'
    });

    useEffect(() => {
        if (id) {
            fetchBicycle();
        }
    }, [id]);

    const fetchBicycle = async () => {
        setFetching(true);
        try {
            const { data, error } = await supabase
                .from('motorcycles')
                .select('*, owners(*)')
                .eq('id', id)
                .eq('type', 'bicycle')
                .single();

            if (error) throw error;
            if (data) {
                setFormData(data);
                setSelectedOwner(data.owners);
            }
        } catch (err) {
            console.error('Error fetching bicycle:', err);
            alert('Erro ao carregar dados da bicicleta.');
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
                chassis: formData.chassis.toUpperCase(),
                type: 'bicycle'
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

            alert(id ? 'Dados actualizados!' : 'Bicicleta registada!');
            navigate('/admin/bicycles');
        } catch (err) {
            console.error('Error saving bicycle:', err);
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
                title={id ? 'Editar Bicicleta' : 'Novo Recenseamento'}
                subtitle="Registo municipal de velocípedes e bicicletas licenciadas."
                breadcrumbs={[
                    { label: 'Painel', path: '/admin/dashboard' },
                    { label: 'Bicicletas', path: '/admin/bicycles' },
                    { label: id ? 'Editar' : 'Novo' }
                ]}
            />

            <form onSubmit={handleSubmit}>
                <div className="card" style={{ marginBottom: '2rem', padding: '2rem', borderRadius: '24px', border: '1.5px solid #f1f5f9' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <User size={24} color="#3b82f6" />
                            Proprietário
                        </h3>
                        <p style={{ color: '#64748b', fontWeight: '500', fontSize: '0.9rem' }}>Identifique o cidadão responsável pela bicicleta.</p>
                    </div>
                    <OwnerSearch onSelect={setSelectedOwner} initialOwner={selectedOwner} />
                </div>

                <div className="card" style={{ marginBottom: '2rem', padding: '2.5rem', borderRadius: '24px', border: '1.5px solid #f1f5f9' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Bike size={24} color="#10b981" />
                            Dados da Bicicleta
                        </h3>
                        <p style={{ color: '#64748b', fontWeight: '500', fontSize: '0.9rem' }}>Informações técnicas para emissão do selo municipal.</p>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#475569', marginBottom: '8px' }}>Número do Quadro (Série) *</label>
                            <input
                                type="text"
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none', fontWeight: '900', textTransform: 'uppercase', fontFamily: 'monospace', fontSize: '1.1rem', backgroundColor: '#f8fafc' }}
                                placeholder="Nº GRAVADO NO QUADRO"
                                required
                                value={formData.chassis}
                                onChange={(e) => setFormData({ ...formData, chassis: e.target.value })}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#475569', marginBottom: '8px' }}>Ano de Aquisição</label>
                            <input type="number" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none', fontWeight: '700' }} value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} required />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#475569', marginBottom: '8px' }}>Marca *</label>
                            <input type="text" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none', fontWeight: '600' }} required value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#475569', marginBottom: '8px' }}>Modelo</label>
                            <input type="text" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none', fontWeight: '600' }} value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#475569', marginBottom: '8px' }}>Cor Dominante *</label>
                            <input type="text" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0', outline: 'none', fontWeight: '600' }} required value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
                        </div>
                    </div>
                </div>

                <div className="card" style={{ marginBottom: '2rem', padding: '2.5rem', borderRadius: '24px', border: '1.5px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                        <Info size={20} color="#3b82f6" />
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '900', color: '#0f172a' }}>Notas do Vistoriador</label>
                    </div>
                    <textarea style={{ width: '100%', padding: '15px', borderRadius: '16px', border: '2px solid #e2e8f0', outline: 'none', minHeight: '100px', fontWeight: '500', fontSize: '0.95rem' }} value={formData.observations} onChange={(e) => setFormData({ ...formData, observations: e.target.value })} placeholder="Descreva o estado físico, pneus, travões ou acessórios..." />
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', padding: '2rem 0', borderTop: '2px solid #f1f5f9' }}>
                    <button 
                        type="button" 
                        style={{ padding: '14px 30px', borderRadius: '12px', border: 'none', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: '800', cursor: 'pointer' }} 
                        onClick={() => navigate('/admin/bicycles')}
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 40px', borderRadius: '12px', border: 'none', backgroundColor: '#10b981', color: 'white', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }} 
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="spin" size={20} /> : (id ? 'Atualizar Dados' : 'Concluir Registo')}
                        {!loading && <CheckCircle2 size={20} />}
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

export default BicycleForm;
