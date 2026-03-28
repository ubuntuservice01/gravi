import React, { useState, useEffect } from 'react';
import { Search, Plus, User, Phone, Check, X, Loader2, UserPlus, Fingerprint, BadgeCheck, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const OwnerSearch = ({ onSelect, initialOwner }) => {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newOwner, setNewOwner] = useState({ full_name: '', bi_number: '', nuit: '', phone: '' });
  const [selectedOwner, setSelectedOwner] = useState(initialOwner || null);

  useEffect(() => {
    if (searchTerm.length > 2) {
      const delay = setTimeout(() => {
        searchOwners();
      }, 300);
      return () => clearTimeout(delay);
    } else {
      setResults([]);
    }
  }, [searchTerm]);

  const searchOwners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('owners')
        .select('*')
        .or(`full_name.ilike.%${searchTerm}%,nuit.ilike.%${searchTerm}%,bi_number.ilike.%${searchTerm}%`)
        .eq('municipality_id', profile.municipality_id)
        .limit(5);

      if (!error) setResults(data);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOwner = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('owners')
        .insert([{ ...newOwner, municipality_id: profile.municipality_id }])
        .select()
        .single();

      if (!error) {
        onSelect(data);
        setSelectedOwner(data);
        setIsCreating(false);
        setSearchTerm('');
      } else {
        alert('Erro ao criar proprietário: ' + error.message);
      }
    } catch (err) {
      console.error('Create error:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectOwner = (owner) => {
    onSelect(owner);
    setSelectedOwner(owner);
    setResults([]);
    setSearchTerm('');
  };

  if (selectedOwner) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ 
          padding: '1.5rem 2.5rem', 
          background: '#0f172a', 
          borderRadius: '25px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.2)',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.05)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ 
            width: '64px', height: '64px', borderRadius: '18px', 
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', fontWeight: '950', boxShadow: '0 10px 20px rgba(37, 99, 235, 0.3)'
          }}>
            {selectedOwner.full_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: '950', color: 'white', letterSpacing: '-0.5px' }}>{selectedOwner.full_name}</div>
            <div style={{ display: 'flex', gap: '15px', marginTop: '6px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: '950', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>NUIT: {selectedOwner.nuit || '---'}</div>
              <div style={{ fontSize: '0.7rem', fontWeight: '950', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>ID: {selectedOwner.bi_number || '---'}</div>
            </div>
          </div>
        </div>
        <button 
          onClick={() => { setSelectedOwner(null); onSelect(null); }}
          style={{ width: '48px', height: '48px', borderRadius: '15px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
          onMouseOver={e => { e.currentTarget.style.backgroundColor = '#ef4444'; e.currentTarget.style.color = 'white'; }}
          onMouseOut={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#94a3b8'; }}
        >
          <X size={20} />
        </button>
      </motion.div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <AnimatePresence mode="wait">
        {!isCreating ? (
          <motion.div 
            key="search"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', gap: '15px' }}
          >
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={22} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Pesquisar por Nome, NUIT ou Número de Identidade..." 
                className="tac-input-ultra"
                style={{ height: '64px', paddingLeft: '60px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {loading && <Loader2 size={24} className="spin" style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', color: '#3b82f6' }} />}
              
              <AnimatePresence>
                {results.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    style={{ 
                      position: 'absolute', zIndex: 100, width: '100%', marginTop: '12px', 
                      background: 'white', borderRadius: '24px', border: '2px solid #f1f5f9',
                      boxShadow: '0 30px 60px -15px rgba(0,0,0,0.1)', overflow: 'hidden'
                    }}
                  >
                    {results.map((owner) => (
                      <button
                        key={owner.id}
                        type="button"
                        onClick={() => selectOwner(owner)}
                        className="search-result-row"
                      >
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f8fafc', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User size={20} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '950', fontSize: '0.95rem', color: '#0f172a' }}>{owner.full_name}</div>
                          <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginTop: '2px' }}>NUIT: {owner.nuit} • ID: {owner.bi_number}</div>
                        </div>
                        <ChevronRight size={18} color="#cbd5e1" />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button 
              type="button"
              onClick={() => setIsCreating(true)}
              className="tac-btn-add-owner"
            >
              <UserPlus size={22} /> NOVO TITULAR
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="create"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{ 
              padding: '3rem', borderRadius: '35px', 
              background: '#f8fafc', border: '2.5px dashed #e2e8f0'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '15px', background: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Fingerprint size={24} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '950', color: '#0f172a', letterSpacing: '-0.5px' }}>Registo de Novo Titular</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Insira os dados de identidade para verificação central.</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsCreating(false)} style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'white', border: '1.5px solid #f1f5f9', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <label className="tac-label-owner">Nome Completo do Cidadão</label>
                <input 
                  type="text" 
                  className="tac-input-ultra white"
                  value={newOwner.full_name}
                  onChange={e => setNewOwner({...newOwner, full_name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="tac-label-owner">Nº de Documento (BI / PASS)</label>
                <input 
                  type="text" 
                  className="tac-input-ultra white"
                  value={newOwner.bi_number}
                  onChange={e => setNewOwner({...newOwner, bi_number: e.target.value})}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <label className="tac-label-owner">Número NUIT</label>
                <input 
                  type="text" 
                  className="tac-input-ultra white"
                  value={newOwner.nuit}
                  onChange={e => setNewOwner({...newOwner, nuit: e.target.value})}
                />
              </div>
              <div>
                <label className="tac-label-owner">Telefone de Contacto</label>
                <input 
                  type="tel" 
                  className="tac-input-ultra white"
                  value={newOwner.phone}
                  onChange={e => setNewOwner({...newOwner, phone: e.target.value})}
                  required
                />
              </div>
            </div>

            <button 
              type="button" 
              onClick={handleCreateOwner}
              className="tac-btn-submit-owner"
              disabled={loading}
            >
              {loading ? <Loader2 size={22} className="spin" /> : <BadgeCheck size={22} />}
              {loading ? 'EXECUTANDO REGISTO...' : 'VERIFICAR E GUARDAR TITULAR'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .search-result-row { 
          width: 100%; padding: 18px 25px; text-align: left; background: white; border: none; 
          border-bottom: 1.5px solid #f8fafc; display: flex; align-items: center; gap: 20px; 
          cursor: pointer; transition: all 0.2s; 
        }
        .search-result-row:hover { background-color: #f8fafc; }
        .search-result-row:last-child { border-bottom: none; }
        
        .tac-btn-add-owner { 
          height: 64px; padding: 0 35px; border-radius: 20px; border: none; 
          background: #0f172a; color: white; font-weight: 950; font-size: 0.85rem; 
          display: flex; align-items: center; gap: 12px; cursor: pointer; transition: all 0.3s;
          box-shadow: 0 15px 30px -5px rgba(15, 23, 42, 0.2);
        }
        .tac-btn-add-owner:hover { transform: translateY(-3px); box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.35); }

        .tac-label-owner { display: block; font-size: 0.7rem; font-weight: 950; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px; }
        
        .tac-input-ultra.white { background: white; border-color: #f1f5f9; }

        .tac-btn-submit-owner { 
          width: 100%; height: 60px; border-radius: 20px; border: none; 
          background: #3b82f6; color: white; font-weight: 950; display: flex; 
          align-items: center; justify-content: center; gap: 15px; cursor: pointer; 
          transition: all 0.3s; font-size: 0.95rem; letter-spacing: 0.5px;
          box-shadow: 0 15px 30px -5px rgba(59, 130, 246, 0.3);
        }
        .tac-btn-submit-owner:hover { background: #2563eb; transform: translateY(-3px); box-shadow: 0 20px 40px -10px rgba(59, 130, 246, 0.4); }
        .tac-btn-submit-owner:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .spin { animation: spin 1.5s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default OwnerSearch;
