import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Eye, Edit2, Search, Bike, CheckCircle, X, Filter, Download, LayoutGrid, List as ListIcon, MapPin, Hash } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import SkeletonLoader from '../../components/SkeletonLoader';
import EmptyState from '../../components/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';

const BicyclesList = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [bicycles, setBicycles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // Grid as default for bicycles

    useEffect(() => {
        if (profile?.municipality_id) {
            fetchBicycles();
        }
    }, [profile?.municipality_id]);

    const fetchBicycles = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('motorcycles') // motorcycles table stores all vehicles
                .select(`
                    *,
                    owners (full_name, phone)
                `)
                .eq('municipality_id', profile.municipality_id)
                .eq('type', 'Bicicleta')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBicycles(data || []);
        } catch (err) {
            console.error('Error fetching bicycles:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        return status === 'active' 
            ? { bg: '#fffbe6', color: '#d97706', icon: <CheckCircle size={14} /> }
            : { bg: '#f1f5f9', color: '#64748b', icon: <X size={14} /> };
    };

    const filteredBicycles = bicycles.filter(b =>
        (b.plate?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (b.owners?.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (b.brand?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.05 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        show: { opacity: 1, scale: 1 }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ maxWidth: '1600px', margin: '0 auto', paddingBottom: '5rem' }}
        >
            <PageHeader 
                title="Gestão de Velocípedes"
                subtitle="Controle e registo de bicicletas e outros veículos não motorizados."
                breadcrumbs={[
                    { label: 'Painel', path: '/admin/dashboard' },
                    { label: 'Bicicletas' }
                ]}
                actions={
                    (profile?.role === 'admin_municipal' || profile?.role === 'tecnico') && (
                        <button 
                            onClick={() => navigate('/admin/bicycles/new')} 
                            className="btn btn-primary" 
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 28px', 
                                borderRadius: '16px', fontWeight: '950', backgroundColor: '#f59e0b', 
                                border: 'none', boxShadow: '0 10px 20px -5px rgba(245,158,11,0.3)' 
                            }}
                        >
                            <Plus size={22} /> Novo Registo
                        </button>
                    )
                }
            />

            <div className="card" style={{ padding: '0', overflow: 'hidden', borderRadius: '32px', border: 'none', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.05)' }}>
                <div style={{ padding: '2rem', borderBottom: '1.5px solid #f8fafc', backgroundColor: '#ffffff', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={20} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            style={{ 
                                width: '100%', padding: '15px 18px 15px 54px', border: '2.5px solid #f1f5f9', borderRadius: '20px', 
                                outline: 'none', fontWeight: '700', fontSize: '1rem', backgroundColor: '#fffbeb'
                            }}
                            placeholder="Procurar por proprietário, marca ou referência..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div style={{ display: 'flex', background: '#fef3c7', padding: '6px', borderRadius: '14px', gap: '4px' }}>
                        <button onClick={() => setViewMode('table')} style={{ padding: '8px', borderRadius: '10px', background: viewMode === 'table' ? 'white' : 'transparent', color: viewMode === 'table' ? '#f59e0b' : '#d97706', border: 'none', cursor: 'pointer' }}>
                            <ListIcon size={20} />
                        </button>
                        <button onClick={() => setViewMode('grid')} style={{ padding: '8px', borderRadius: '10px', background: viewMode === 'grid' ? 'white' : 'transparent', color: viewMode === 'grid' ? '#f59e0b' : '#d97706', border: 'none', cursor: 'pointer' }}>
                            <LayoutGrid size={20} />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '3rem' }}>
                        <SkeletonLoader type="table" rows={6} />
                    </div>
                ) : filteredBicycles.length === 0 ? (
                    <EmptyState 
                        icon={<Bike size={64} color="#fcd34d" />}
                        title="Nenhuma Bicicleta"
                        description={searchTerm ? "Sem resultados para esta pesquisa." : "Ainda não existem velocípedes registados no sistema."}
                        actionText={!searchTerm ? "Registar Primeira" : "Limpar Busca"}
                        onAction={() => searchTerm ? setSearchTerm('') : navigate('/admin/bicycles/new')}
                    />
                ) : viewMode === 'table' ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', backgroundColor: '#ffffff' }}>
                                    <th style={{ padding: '1.5rem 2rem', color: '#94a3b8', fontSize: '0.7rem', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '2.5px solid #f8fafc' }}>Identificação</th>
                                    <th style={{ padding: '1.5rem 2rem', color: '#94a3b8', fontSize: '0.7rem', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '2.5px solid #f8fafc' }}>Proprietário</th>
                                    <th style={{ padding: '1.5rem 2rem', color: '#94a3b8', fontSize: '0.7rem', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '2.5px solid #f8fafc' }}>Marca / Cor</th>
                                    <th style={{ padding: '1.5rem 2rem', color: '#94a3b8', fontSize: '0.7rem', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '2.5px solid #f8fafc' }}>Estado</th>
                                    <th style={{ padding: '1.5rem 2rem', color: '#94a3b8', fontSize: '0.7rem', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '2.5px solid #f8fafc', textAlign: 'right' }}>Acções</th>
                                </tr>
                            </thead>
                            <motion.tbody variants={containerVariants} initial="hidden" animate="show">
                                {filteredBicycles.map((b) => (
                                    <motion.tr key={b.id} variants={itemVariants} className="bic-row">
                                        <td style={{ padding: '1.5rem 2rem', borderBottom: '1.5px solid #f8fafc' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                                                    <Hash size={18} />
                                                </div>
                                                <div style={{ fontWeight: '950', color: '#0f172a', fontSize: '1.1rem', fontFamily: 'monospace' }}>{b.plate || b.id.substring(0,8).toUpperCase()}</div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.5rem 2rem', borderBottom: '1.5px solid #f8fafc' }}>
                                            <div style={{ fontWeight: '900', color: '#1e293b' }}>{b.owners?.full_name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700' }}>{b.owners?.phone}</div>
                                        </td>
                                        <td style={{ padding: '1.5rem 2rem', borderBottom: '1.5px solid #f8fafc', fontWeight: '800', color: '#475569' }}>
                                            {b.brand} <span style={{ color: '#cbd5e1' }}>•</span> {b.color}
                                        </td>
                                        <td style={{ padding: '1.5rem 2rem', borderBottom: '1.5px solid #f8fafc' }}>
                                            <span style={{ 
                                                display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '10px',
                                                backgroundColor: getStatusStyle(b.status).bg, color: getStatusStyle(b.status).color, fontWeight: '950', fontSize: '0.7rem', textTransform: 'uppercase'
                                            }}>
                                                {getStatusStyle(b.status).icon} {b.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1.5rem 2rem', borderBottom: '1.5px solid #f8fafc', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                <Link to={`/admin/bicycles/${b.id}`} className="action-btn"><Eye size={18} /></Link>
                                                <Link to={`/admin/bicycles/edit/${b.id}`} className="action-btn highlight"><Edit2 size={18} /></Link>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </motion.tbody>
                        </table>
                    </div>
                ) : (
                    <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem', padding: '2.5rem' }}>
                        {filteredBicycles.map(bic => (
                            <motion.div key={bic.id} variants={itemVariants} className="bic-card">
                                <Link to={`/admin/bicycles/${bic.id}`} style={{ textDecoration: 'none' }}>
                                    <div style={{ padding: '2rem', backgroundColor: 'white', borderRadius: '28px', border: '2.5px solid #f1f5f9', transition: 'all 0.3s ease', textAlign: 'center' }}>
                                        <div style={{ width: '64px', height: '64px', borderRadius: '20px', backgroundColor: '#f59e0b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto', boxShadow: '0 10px 20px -5px rgba(245,158,11,0.3)' }}>
                                            <Bike size={32} />
                                        </div>
                                        <div style={{ fontWeight: '950', fontSize: '1.1rem', color: '#0f172a', marginBottom: '4px', fontFamily: 'monospace' }}>{bic.plate || bic.id.substring(0,8).toUpperCase()}</div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#94a3b8', marginBottom: '1.5rem' }}>{bic.brand} • {bic.color}</div>
                                        <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '14px', fontSize: '0.85rem', fontWeight: '900', color: '#475569' }}>
                                            {bic.owners?.full_name}
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>

            <style>{`
                .bic-row:hover { background-color: #fefefb; }
                .action-btn { padding: 10px; border-radius: 12px; background: #f8fafc; border: 1.5px solid #e2e8f0; color: #64748b; transition: all 0.2s; display: inline-flex; }
                .action-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.05); border-color: #cbd5e1; }
                .action-btn.highlight { color: #f59e0b; background: #fffbe6; border-color: #fef3c7; }
                .bic-card:hover div { border-color: #f59e0b !important; transform: translateY(-8px); box-shadow: 0 25px 50px -12px rgba(245,158,11,0.15); }
            `}</style>
        </motion.div>
    );
};

export default BicyclesList;
