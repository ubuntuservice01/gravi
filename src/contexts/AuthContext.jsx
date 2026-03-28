import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import SystemErrorScreen from '../components/SystemErrorScreen';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorType, setErrorType] = useState(null); // 'NETWORK', 'NO_PROFILE', 'NO_MUNICIPALITY', 'FETCH_ERROR', 'INVALID_ROLE'
  const [errorMessage, setErrorMessage] = useState('');
  const [technicalDetails, setTechnicalDetails] = useState('');
  const fetchInProgress = React.useRef(false);

  const fetchProfile = async (uid) => {
    if (fetchInProgress.current) {
        console.log('[AUTH_LOG] Fetch já em andamento, ignorando...');
        return;
    }
    
    fetchInProgress.current = true;
    console.log('[AUTH_LOG] 1. Início do profile fetch para UID:', uid);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, municipalities(*)')
        .eq('id', uid)
        .maybeSingle();

      console.log('[AUTH_LOG] 2. Resposta da query ao Supabase:', { hasData: !!data, hasError: !!error });

      if (error) {
        console.error('[AUTH_LOG] ERR: Erro real retornado pelo Supabase:', error);
        
        if (error.message?.includes('Fetch is aborted') || error.message?.includes('AbortError')) {
          console.warn('[AUTH_LOG] WARN: Fetch abortado (race condition). Ignorando...');
          // Don't set error type to allow retry
          fetchInProgress.current = false;
          return;
        }
        
        if (error.message?.includes('Failed to fetch') || error.code === 'PGRST301' || error.status === 0) {
          setErrorType('NETWORK');
          setErrorMessage('Falha real de rede ou Supabase indisponível.');
        } else {
          setErrorType('FETCH_ERROR');
          setErrorMessage('Erro ao buscar profile na base de dados.');
          setTechnicalDetails(error.message || JSON.stringify(error));
        }
        
        setProfile(null);
        fetchInProgress.current = false;
        return;
      }

      if (!data) {
        console.warn('[AUTH_LOG] 3. Perfil não encontrado para o utilizador:', uid);
        setProfile(null);
        setErrorType('NO_PROFILE');
        return;
      }

      console.log('[AUTH_LOG] 4. Profile encontrado. Role:', data.role);
      console.log('[AUTH_LOG] 5. Municipality ID encontrado:', data.municipality_id);

      // Validation logic
      if (data.role !== 'super_admin' && !data.municipality_id) {
        console.error('[AUTH_LOG] ERR: Utilizador staff sem municipality_id associado.');
        setErrorType('NO_MUNICIPALITY');
        setProfile(data); // We still have a profile, but it's restricted
        return;
      }

      setProfile(data);
      setErrorType(null); // Clear errors if successful
      console.log('[AUTH_LOG] 6. Decisão: Perfil validado e acesso permitido.');
      
      if (data.municipality_id) {
         checkExpiredLicenses(data.municipality_id);
      }
      fetchInProgress.current = false;
    } catch (err) {
      console.error('[AUTH_LOG] ERR: Excepção inesperada no catch:', err);
      if (err.message?.includes('Failed to fetch')) {
        setErrorType('NETWORK');
      } else {
        setErrorType('FETCH_ERROR');
        setTechnicalDetails(err.message || String(err));
      }
      fetchInProgress.current = false;
    }
  };

  const checkExpiredLicenses = async (mid) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await supabase
        .from('licenses')
        .update({ status: 'Expirada' })
        .eq('municipality_id', mid)
        .eq('status', 'Activa')
        .lt('expiry_date', today);
    } catch (e) {
      console.warn('[AUTH_LOG] Silent skip: checkExpiredLicenses failed (offline?).');
    }
  };

  useEffect(() => {
    let mounted = true;

    // Timeout protective mechanism: 12 seconds
    const timeoutId = setTimeout(() => {
      if (loading && mounted && !errorType) {
        console.error('[AUTH_LOG] ERR: Timeout interno (12s) atingido sem resolução.');
        setErrorType('NETWORK');
        setErrorMessage('O sistema demorou demasiado tempo a responder (Timeout).');
      }
    }, 12000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AUTH_LOG] Auth LifeCycle Event:', event);
      console.log('[AUTH_LOG] Auth LifeCycle Session:', session ? 'Encontrada' : 'Ausente');
      
      if (!mounted) return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
        // If we are on /login or public pages, don't show error
        if (event === 'SIGNED_OUT') {
           setErrorType(null);
        }
      }

      if (mounted) {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const signIn = async (email, password) => {
    console.log('[AUTH_LOG] Tentativa de login:', email);
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = async () => {
    console.log('[AUTH_LOG] Utilizador solicitou logout.');
    setProfile(null);
    setUser(null);
    setErrorType(null);
    return await supabase.auth.signOut();
  };

  // Only show the system error screen if we have a critical error AND we are not on the login page (or trying to load the initial system)
  if (errorType && loading) {
    return (
      <SystemErrorScreen 
        errorType={errorType} 
        message={errorMessage} 
        technicalDetails={technicalDetails} 
      />
    );
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, errorType }}>
      {loading ? (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
          <div className="text-center">
            <div style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #003366', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}></div>
            <p style={{ color: '#64748b', fontWeight: '500' }}>Iniciando MotoGest Tactical...</p>
          </div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : errorType && errorType !== 'NETWORK' ? (
        // For non-network errors that happen after loading is finished, also show the screen
        <SystemErrorScreen 
          errorType={errorType} 
          message={errorMessage} 
          technicalDetails={technicalDetails} 
        />
      ) : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


