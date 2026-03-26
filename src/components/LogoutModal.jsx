import React from 'react';
import { LogOut, X } from 'lucide-react';

const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '360px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '40px', height: '40px', borderRadius: '12px', 
              backgroundColor: '#fee2e2', display: 'flex', 
              alignItems: 'center', justifyContent: 'center' 
            }}>
              <LogOut size={20} color="#dc2626" />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#1e293b' }}>
              Confirmar Saída
            </h3>
          </div>
          <button onClick={onClose} style={{ color: '#94a3b8', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>
        
        <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '0.9rem', lineHeight: '1.6', fontWeight: '500' }}>
          Tem certeza que deseja sair do sistema?
        </p>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={onClose}
            style={{ 
              flex: 1,
              padding: '12px', borderRadius: '10px', fontWeight: '700', fontSize: '0.85rem',
              color: '#475569', backgroundColor: '#f1f5f9',
              border: 'none', cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm}
            style={{ 
              flex: 1,
              padding: '12px', borderRadius: '10px', fontWeight: '700', fontSize: '0.85rem',
              color: 'white', backgroundColor: '#dc2626',
              border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)'
            }}
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
