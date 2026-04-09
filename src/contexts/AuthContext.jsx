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
    try {
      console.log('[AUTH_LOG] 1. Perfil fetch iniciado.');
      const { data, error } = await supabase
        .from('profiles')
        .select('*, municipalities(*)')
        .eq('id', uid)
        .maybeSingle();

      console.log('[AUTH_LOG] 2. Supabase respondeu:', { hasData: !!data, hasError: !!error });

      if (error) {
        console.error('[AUTH_LOG] ERRO Supabase:', error);
        
        if (error.message?.includes('Fetch is aborted')) {
          console.warn('[AUTH_LOG] Fetch abortado (race condition).');
          fetchInProgress.current = false;
          return;
        }
        
        setErrorType('NETWORK');
        setErrorMessage('Falha na comunicação com a base de dados.');
        setTechnicalDetails(`Code: ${error.code} | Message: ${error.message}`);
        setProfile(null);
        fetchInProgress.current = false;
        return;
      }

      if (!data) {
        console.warn('[AUTH_LOG] 3. Perfil não encontrado no DB para UID:', uid);
        setProfile(null);
        setErrorType('NO_PROFILE');
        fetchInProgress.current = false;
        return;
      }

      console.log('[AUTH_LOG] 4. Sucesso: Perfil carregado.', { role: data.role });
      setProfile(data);
      setErrorType(null);
      
      if (data.municipality_id) {
         checkExpiredLicenses(data.municipality_id);
      }
    } catch (err) {
      console.error('[AUTH_LOG] Excepção crítica em fetchProfile:', err);
      setErrorType('FETCH_ERROR');
      setTechnicalDetails(err.message || String(err));
    } finally {
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
    } catch {
      console.warn('[AUTH_LOG] Silent skip: checkExpiredLicenses failed (offline?).');
    }
  };

  useEffect(() => {
    let mounted = true;

    // Timeout protective mechanism: 8 seconds
    const timeoutId = setTimeout(() => {
      if (loading && mounted) {
        console.error('[AUTH_LOG] TIMEOUT Atingido (8s). Forçando exibição de erro.');
        setErrorType('NETWORK');
        setErrorMessage('O sistema demorou demasiado tempo a responder. Isto pode ser um erro de rede ou sincronização de base de dados.');
        setLoading(false);
      }
    }, 8000);

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


