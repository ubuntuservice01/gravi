import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Eye, Edit2, Search, Car, AlertTriangle, CheckCircle, X, Filter, Download, LayoutGrid, List as ListIcon, MapPin, Gauge } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import SkeletonLoader from '../../components/SkeletonLoader';
import EmptyState from '../../components/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';

const CarsList = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('table');

    useEffect(() => {
        if (profile?.municipality_id) {
            fetchCars();
        }
    }, [profile?.municipality_id]);

    const fetchCars = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('motorcycles') // motorcycles table stores all vehicles
                .select(`
                    *,
                    owners (full_name, bi_number, nuit, phone)
                `)
                .eq('municipality_id', profile.municipality_id)
                .eq('type', 'Carro')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCars(data || []);
        } catch (err) {
            console.error('Error fetching cars:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        const styles = {
            'Activa': { bg: '#ecfdf5', color: '#10b981', icon: <CheckCircle size={14} /> },
            'Inactiva': { bg: '#fef2f2', color: '#ef4444', icon: <X size={14} /> },
            'Suspensa': { bg: '#fffbeb', color: '#f59e0b', icon: <AlertTriangle size={14} /> },
            'Bloqueada': { bg: '#1e293b', color: 'white', icon: <X size={14} /> },
            'Pendente': { bg: '#f1f5f9', color: '#64748b', icon: <div className="animate-spin h-3 w-3 border-2 border-slate-300 border-t-slate-600 rounded-full" /> }
        };
        return styles[status] || styles['Pendente'];
    };

    const filteredCars = cars.filter(c =>
        (c.plate?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (c.owners?.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (c.brand?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.05 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ maxWidth: '1600px', margin: '0 auto', paddingBottom: '5rem' }}
        >
            <PageHeader 
                title="Frota Automóvel"
                subtitle="Controle de veículos ligeiros, pesados e utilitários sob jurisdição municipal."
                breadcrumbs={[
                    { label: 'Painel', path: '/admin/dashboard' },
                    { label: 'Automóveis' }
                ]}
                actions={
                    (profile?.role === 'admin_municipal' || profile?.role === 'tecnico') && (
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="btn" style={{ background: 'white', border: '2px solid #e2e8f0', color: '#64748b', fontWeight: '800', padding: '10px 20px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Download size={18} /> Relatório
                            </button>
                            <button 
                                onClick={() => navigate('/admin/cars/new')} 
                                className="btn btn-primary" 
                                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 28px', borderRadius: '16px', fontWeight: '950', boxShadow: '0 10px 25px -5px rgba(59,130,246,0.3)' }}
                            >
                                <Plus size={22} /> Novo Registo
                            </button>
                        </div>
                    )
                }
            />

            <div className="card" style={{ padding: '0', overflow: 'hidden', borderRadius: '32px', border: 'none', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.05)' }}>
                {/* Modern Search & Layout Toggle */}
                <div style={{ padding: '2rem', borderBottom: '1.5px solid #f8fafc', backgroundColor: '#ffffff', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={20} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            style={{ 
                                width: '100%', padding: '15px 18px 15px 54px', border: '2.5px solid #f1f5f9', borderRadius: '20px', 
                                outline: 'none', fontWeight: '700', fontSize: '1rem', backgroundColor: '#f8fafc'
                            }}
                            placeholder="Pesquisar por matrícula, proprietário, marca ou modelo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div style={{ display: 'flex', background: '#f1f5f9', padding: '6px', borderRadius: '14px', gap: '4px' }}>
                        <button onClick={() => setViewMode('table')} style={{ padding: '8px', borderRadius: '10px', background: viewMode === 'table' ? 'white' : 'transparent', color: viewMode === 'table' ? '#3b82f6' : '#94a3b8', border: 'none', cursor: 'pointer' }}>
                            <ListIcon size={20} />
                        </button>
                        <button onClick={() => setViewMode('grid')} style={{ padding: '8px', borderRadius: '10px', background: viewMode === 'grid' ? 'white' : 'transparent', color: viewMode === 'grid' ? '#3b82f6' : '#94a3b8', border: 'none', cursor: 'pointer' }}>
                            <LayoutGrid size={20} />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '3rem' }}>
                        <SkeletonLoader type="table" rows={8} />
                    </div>
                ) : filteredCars.length === 0 ? (
                    <EmptyState 
                        icon={<Car size={64} color="#cbd5e1" />}
                        title="Frota Inexistente"
                        description={searchTerm ? "Nenhum automóvel corresponde aos termos da pesquisa." : "Ainda não existem viaturas registadas neste município."}
                        actionText={!searchTerm && (profile?.role === 'admin_municipal' || profile?.role === 'tecnico') ? "Registar Agora" : "Limpar Pesquisa"}
                        onAction={() => searchTerm ? setSearchTerm('') : navigate('/admin/cars/new')}
                    />
                ) : viewMode === 'table' ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', backgroundColor: '#ffffff' }}>
                                    <th style={{ padding: '1.5rem 2rem', color: '#94a3b8', fontSize: '0.7rem', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '2.5px solid #f8fafc' }}>Viatura & Matrícula</th>
                                    <th style={{ padding: '1.5rem 2rem', color: '#94a3b8', fontSize: '0.7rem', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '2.5px solid #f8fafc' }}>Titular / Proprietário</th>
                                    <th style={{ padding: '1.5rem 2rem', color: '#94a3b8', fontSize: '0.7rem', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '2.5px solid #f8fafc' }}>Dados Técnicos</th>
                                    <th style={{ padding: '1.5rem 2rem', color: '#94a3b8', fontSize: '0.7rem', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '2.5px solid #f8fafc' }}>Estado Operacional</th>
                                    <th style={{ padding: '1.5rem 2rem', color: '#94a3b8', fontSize: '0.7rem', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '2.5px solid #f8fafc', textAlign: 'right' }}>Gestão</th>
                                </tr>
                            </thead>
                            <motion.tbody variants={containerVariants} initial="hidden" animate="show">
                                {filteredCars.map((c) => {
                                    const status = getStatusStyle(c.status);
                                    return (
                                        <motion.tr key={c.id} variants={itemVariants} className="car-row">
                                            <td style={{ padding: '1.5rem 2rem', borderBottom: '1.5px solid #f8fafc' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                    <div style={{ width: '50px', height: '50px', borderRadius: '14px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                                                        <Car size={24} />
                                                    </div>
                                                    <div>
                                                        <div style={{ 
                                                            display: 'inline-flex', padding: '2px 8px', borderRadius: '6px', 
                                                            backgroundColor: '#0f172a', color: 'white', fontWeight: '950', 
                                                            fontFamily: 'monospace', fontSize: '0.9rem', marginBottom: '4px'
                                                        }}>{c.plate}</div>
                                                        <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#64748b' }}>{c.brand} {c.model}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.5rem 2rem', borderBottom: '1.5px solid #f8fafc' }}>
                                                <div style={{ fontWeight: '900', color: '#1e293b', fontSize: '1rem' }}>{c.owners?.full_name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginTop: '2px' }}>{c.owners?.phone || 'Sem contacto'}</div>
                                            </td>
                                            <td style={{ padding: '1.5rem 2rem', borderBottom: '1.5px solid #f8fafc' }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#475569' }}>{c.purpose || 'Particular'}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginTop: '4px' }}>{c.year} • {c.color}</div>
                                            </td>
                                            <td style={{ padding: '1.5rem 2rem', borderBottom: '1.5px solid #f8fafc' }}>
                                                <div style={{ 
                                                    display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '12px', 
                                                    backgroundColor: status.bg, color: status.color, fontWeight: '950', fontSize: '0.7rem', textTransform: 'uppercase',
                                                    border: `1.5px solid ${status.color}20`
                                                }}>
                                                    {status.icon} {c.status}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.5rem 2rem', borderBottom: '1.5px solid #f8fafc', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                    <Link to={`/admin/cars/${c.id}`} style={{ padding: '10px', borderRadius: '12px', background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#64748b', transition: 'all 0.2s' }} className="action-btn">
                                                        <Eye size={18} />
                                                    </Link>
                                                    {(profile?.role === 'admin_municipal' || profile?.role === 'tecnico') && (
                                                        <Link to={`/admin/cars/edit/${c.id}`} style={{ padding: '10px', borderRadius: '12px', background: '#eff6ff', border: '1.5px solid #dbeafe', color: '#3b82f6', transition: 'all 0.2s' }} className="action-btn">
                                                            <Edit2 size={18} />
                                                        </Link>
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </motion.tbody>
                        </table>
                    </div>
                ) : (
                    <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem', padding: '2.5rem' }}>
                        {filteredCars.map(car => (
                            <motion.div key={car.id} variants={itemVariants} className="car-card">
                                <Link to={`/admin/cars/${car.id}`} style={{ textDecoration: 'none' }}>
                                    <div style={{ padding: '2rem', backgroundColor: 'white', borderRadius: '30px', border: '2.5px solid #f1f5f9', transition: 'all 0.3s ease' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                            <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                                <Car size={30} />
                                            </div>
                                            <div style={{ 
                                                backgroundColor: '#f8fafc', border: '1.5px solid #e2e8f0', padding: '6px 12px', borderRadius: '10px', 
                                                fontWeight: '950', fontFamily: 'monospace', fontSize: '1.1rem', color: '#0f172a' 
                                            }}>{car.plate}</div>
                                        </div>
                                        <h4 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: '950', color: '#0f172a' }}>{car.brand} {car.model}</h4>
                                        <p style={{ margin: '0 0 1.5rem', color: '#94a3b8', fontWeight: '700', fontSize: '0.9rem' }}>Prop: {car.owners?.full_name}</p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.5rem', borderTop: '1.5px solid #f8fafc' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3b82f6', fontWeight: '900', fontSize: '0.8rem' }}><MapPin size={14} /> Cidade Maputo</div>
                                            <div style={{ color: getStatusStyle(car.status).color, fontSize: '0.75rem', fontWeight: '950', textTransform: 'uppercase' }}>{car.status}</div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>

            <style>{`
                .car-row:hover { background-color: #fcfdfe; }
                .action-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.05); border-color: #cbd5e1; color: #0f172a; }
                .car-card:hover div { border-color: #3b82f6 !important; transform: translateY(-8px); box-shadow: 0 25px 50px -12px rgba(59,130,246,0.1); }
            `}</style>
        </motion.div>
    );
};

export default CarsList;
