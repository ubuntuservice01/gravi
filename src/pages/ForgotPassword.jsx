import React, { useState } from 'react';
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);
    if (!error) {
      setSent(true);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/login" className="flex items-center gap-2 text-sm text-muted mb-6 hover:text-primary-color">
          <ArrowLeft size={16} /> Voltar ao login
        </Link>

        <div className="text-center mb-8">
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Recuperar Senha</h2>
          <p className="text-muted">Introduza o seu email para receber um link de recuperação.</p>
        </div>

        {sent ? (
          <div className="text-center p-6 bg-green-50 rounded-lg border border-green-100">
            <CheckCircle size={48} color="#10B981" style={{ margin: '0 auto 1rem' }} />
            <p className="font-semibold text-green-800 mb-2">Email Enviado!</p>
            <p className="text-sm text-green-700">Verifique a sua caixa de entrada para continuar.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Email de Utilizador</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  placeholder="exemplo@municipio.gov.mz" 
                  style={{ paddingLeft: '40px' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary w-full justify-center" 
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Enviando...' : (
                <>
                  <Send size={18} /> Enviar link de recuperação
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
