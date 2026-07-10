import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, Building, FileText, ChevronRight } from 'lucide-react';
import { supabase } from '../services/supabase';
import api from '../services/api';
import { AuthLayout } from '../layouts/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form states
  const [municipalityName, setMunicipalityName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [secretariatName, setSecretariatName] = useState('');
  const [secretariatCode, setSecretariatCode] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const isDemoMode = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (isDemoMode) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setSuccess(true);
        return;
      }

      // 1. Cadastra o usuário no Supabase Auth
      const { data: signUpData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      const supabaseUser = signUpData.user;
      if (!supabaseUser) {
        throw new Error('Falha ao registrar credenciais de autenticação.');
      }

      // 2. Cria as entidades no banco via backend do NestJS
      await api.post('/auth/register', {
        userId: supabaseUser.id,
        email,
        name: userName,
        municipalityName,
        cnpj,
        secretariatName,
        secretariatCode,
      });

      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || err?.message || 'Erro ao realizar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-100">
            <ChevronRight size={32} className="rotate-90" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Cadastro Concluído!</h2>
          <p className="text-sm text-slate-500 mt-2 mb-8 leading-relaxed">
            O município e seu usuário de administrador foram registrados com sucesso. Um e-mail de confirmação foi enviado para <strong>{email}</strong>.
          </p>
          <Button onClick={() => navigate('/login')} className="w-full">
            Ir para o Login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="text-left mb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Cadastre seu Órgão</h2>
        <p className="text-sm text-slate-500 mt-1">
          Etapa {step} de 3 - {step === 1 ? 'Dados da Prefeitura' : step === 2 ? 'Dados da Secretaria' : 'Acesso do Administrador'}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-xs font-semibold p-4 rounded-lg mb-6 border border-red-100 flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleRegister} className="flex flex-col gap-5">
        {step === 1 && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <Input
              label="Nome do Município"
              placeholder="Ex: Prefeitura Municipal de Nova Friburgo"
              required
              value={municipalityName}
              onChange={(e) => setMunicipalityName(e.target.value)}
              leftIcon={<Building size={18} />}
            />
            <Input
              label="CNPJ do Órgão"
              placeholder="00.000.000/0000-00"
              required
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              leftIcon={<FileText size={18} />}
            />
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <Input
              label="Nome da Secretaria Inicial"
              placeholder="Ex: Secretaria de Educação"
              required
              value={secretariatName}
              onChange={(e) => setSecretariatName(e.target.value)}
              leftIcon={<Building size={18} />}
            />
            <Input
              label="Código/Sigla"
              placeholder="Ex: SEMED"
              required
              value={secretariatCode}
              onChange={(e) => setSecretariatCode(e.target.value.toUpperCase())}
              leftIcon={<FileText size={18} />}
            />
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <Input
              label="Nome do Servidor (Admin)"
              placeholder="Ex: Carlos Silva"
              required
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              leftIcon={<UserIcon size={18} />}
            />
            <Input
              label="E-mail Corporativo"
              type="email"
              placeholder="carlos.silva@municipio.gov.br"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail size={18} />}
            />
            <Input
              label="Senha"
              type="password"
              placeholder="Mínimo 6 caracteres"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock size={18} />}
            />
          </div>
        )}

        <div className="flex justify-between items-center mt-4 gap-4">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="flex-1"
            >
              Voltar
            </Button>
          )}
          <Button type="submit" isLoading={loading} className="flex-1">
            {step === 3 ? 'Finalizar Cadastro' : 'Continuar'}
          </Button>
        </div>
      </form>

      <div className="mt-6 text-center text-sm text-slate-500">
        Já possui conta?{' '}
        <Link to="/login" className="font-bold text-gov-blue hover:underline">
          Acesse o painel
        </Link>
      </div>
    </AuthLayout>
  );
};
export default Register;
