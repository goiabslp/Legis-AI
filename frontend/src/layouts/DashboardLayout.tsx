import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  FolderOpen,
  LogOut,
  Building,
  User as UserIcon,
  Brain,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const menuItems = [
    {
      label: 'Painel Geral',
      path: '/dashboard',
      icon: <LayoutDashboard size={20} />,
    },
    {
      label: 'Gerar Documento',
      path: '/documentos/novo',
      icon: <PlusCircle size={20} />,
    },
    {
      label: 'Meus Documentos',
      path: '/documentos',
      icon: <FileText size={20} />,
    },
    {
      label: 'Modelos Oficiais',
      path: '/modelos',
      icon: <FolderOpen size={20} />,
    },
    {
      label: 'Base de Conhecimento',
      path: '/conhecimento',
      icon: <Brain size={20} />,
    },
    {
      label: 'Prefeitura e Órgão',
      path: '/configuracoes',
      icon: <Building size={20} />,
    },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-66 bg-gov-blue text-white flex flex-col justify-between p-5 shrink-0 shadow-lg relative z-10">
        <div className="flex flex-col gap-8">
          {/* Logo / Município */}
          <div className="flex items-center gap-3 px-2">
            {localStorage.getItem('mun_logo_base64') || profile?.municipality?.logoUrl ? (
              <img
                src={localStorage.getItem('mun_logo_base64') || profile?.municipality?.logoUrl || ''}
                alt="Brasão"
                className="w-10 h-10 object-contain rounded-md bg-white/10 p-1"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center font-bold text-gov-gold">
                Gov
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight leading-tight">
                {profile?.municipality?.name || 'DocIA Gov'}
              </span>
              <span className="text-[10px] text-gov-gold font-semibold uppercase tracking-wider">
                {profile?.secretariat?.code || 'Administração'}
              </span>
            </div>
          </div>

          {/* Links de navegação */}
          <nav className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-white/10 text-gov-gold shadow-xs translate-x-1 border-l-3 border-gov-gold'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Rodapé da Sidebar / Usuário */}
        <div className="flex flex-col gap-4 border-t border-white/10 pt-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white">
              <UserIcon size={16} />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold truncate">
                {profile?.name || 'Servidor Público'}
              </span>
              <span className="text-xs text-slate-400 truncate">
                {profile?.email}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full !justify-start text-slate-300 hover:text-white hover:bg-white/5 gap-3"
            leftIcon={<LogOut size={16} />}
          >
            Sair do Painel
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 shrink-0">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">
            DocIA Gov <span className="text-gov-gold font-medium">|</span> Portal Administrativo
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-xs text-slate-500 font-semibold bg-slate-100 px-3 py-1.5 rounded-full uppercase tracking-wider">
              {profile?.role === 'ADMIN' ? 'Administrador Geral' : 'Servidor Autorizado'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
