import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import api from '../services/api';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  secretariatId: string | null;
  municipalityId: string;
  municipality: {
    name: string;
    cnpj: string;
    logoUrl: string | null;
    primaryColor: string;
  };
  secretariat?: {
    name: string;
    code: string;
  } | null;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signInDemo: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await api.get<UserProfile>(`/users/${userId}`);
      setProfile(data);
      
      if (data?.municipality?.primaryColor) {
        document.documentElement.style.setProperty('--color-gov-blue', data.municipality.primaryColor);
      }
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário no backend:', error);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const signInDemo = async (email: string) => {
    setLoading(true);
    const mockUser = {
      id: 'usr-default-id',
      email: email || 'guilhermeafsantos@gmail.com',
      user_metadata: { name: 'Guilherme Santos' },
    } as any;
    setUser(mockUser);
    setProfile({
      id: 'usr-default-id',
      email: email || 'guilhermeafsantos@gmail.com',
      name: 'Guilherme Santos',
      role: 'ADMIN',
      secretariatId: 'sec-default-id',
      municipalityId: 'mun-default-id',
      municipality: {
        name: 'Prefeitura Municipal de Nova Friburgo',
        cnpj: '29.115.485/0001-20',
        logoUrl: null,
        primaryColor: '#0f2d59',
      },
      secretariat: {
        name: 'Secretaria Municipal de Administração',
        code: 'SEMAD',
      }
    });
    setLoading(false);
  };

  useEffect(() => {
    const isDemoMode = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (isDemoMode) {
      signInDemo('guilhermeafsantos@gmail.com');
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        signInDemo('guilhermeafsantos@gmail.com');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setLoading(true);
        await fetchProfile(session.user.id);
        setLoading(false);
      } else {
        signInDemo('guilhermeafsantos@gmail.com');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const isDemoMode = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (isDemoMode) {
      setUser(null);
      setProfile(null);
      return;
    }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signOut, refreshProfile, signInDemo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
