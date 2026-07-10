import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { supabase } from '../services/supabase';
import { AuthLayout } from '../layouts/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Se as chaves reais não estiverem configuradas, simula login de demonstração
      const isDemoMode = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (isDemoMode) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        navigate('/dashboard');
        return;
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError('Credenciais inválidas. Verifique seu e-mail e senha.');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError('Ocorreu um erro no servidor. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="text-left mb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Acesse o Painel</h2>
        <p className="text-sm text-slate-500 mt-1">
          Insira suas credenciais corporativas autorizadas para continuar.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-xs font-semibold p-4 rounded-lg mb-6 border border-red-100 flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="flex flex-col gap-5">
        <Input
          label="E-mail Institucional"
          type="email"
          placeholder="exemplo@municipio.gov.br"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail size={18} />}
        />

        <Input
          label="Senha de Acesso"
          type="password"
          placeholder="••••••••"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock size={18} />}
        />

        <div className="text-right -mt-2">
          <a href="#" className="text-xs font-semibold text-gov-blue hover:text-slate-700">
            Esqueceu a senha?
          </a>
        </div>

        <Button type="submit" isLoading={loading} className="w-full mt-2">
          Entrar no Sistema
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-500">
        Não possui login?{' '}
        <Link to="/cadastro" className="font-bold text-gov-blue hover:underline">
          Cadastre seu Órgão
        </Link>
      </div>
    </AuthLayout>
  );
};
export default Login;
