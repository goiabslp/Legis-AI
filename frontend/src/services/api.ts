import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

api.interceptors.request.use(async (config) => {
  // Apenas tenta obter a sessão do Supabase se estiver configurado, evitando falhas de rede no placeholder local
  if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
    try {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (session) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (error) {
      console.warn('Falha ao injetar sessão do Supabase no cabeçalho:', error);
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
