import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  FolderOpen,
  Plus,
  ArrowRight,
  Star,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface DocumentSummary {
  id: string;
  title: string;
  type: string;
  status: string;
  createdAt: string;
  authorName: string;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    templates: 0,
    favorites: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [docsRes, statsRes] = await Promise.all([
          api.get<DocumentSummary[]>('/documents/recent'),
          api.get<{ total: number; pending: number; templates: number; favorites: number }>('/documents/stats'),
        ]);

        setDocuments(docsRes.data);
        setStats(statsRes.data);
      } catch (err) {
        console.error('Erro ao buscar dados do dashboard:', err);
        // Inicia zerado sem dados mockados falsos
        setDocuments([]);
        setStats({
          total: 0,
          pending: 0,
          templates: 0,
          favorites: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [profile]);

  const kpis = [
    {
      title: 'Total de Documentos',
      value: stats.total,
      icon: <FileText size={24} className="text-gov-blue" />,
      bg: 'bg-blue-50',
    },
    {
      title: 'Pendentes de Assinatura',
      value: stats.pending,
      icon: <Clock size={24} className="text-amber-600" />,
      bg: 'bg-amber-50',
    },
    {
      title: 'Modelos Disponíveis',
      value: stats.templates,
      icon: <FolderOpen size={24} className="text-emerald-600" />,
      bg: 'bg-emerald-50',
    },
    {
      title: 'Favoritos Pessoais',
      value: stats.favorites,
      icon: <Star size={24} className="text-yellow-500 fill-yellow-500" />,
      bg: 'bg-yellow-50',
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Mensagem de Boas-Vindas */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight !m-0">
            Olá, {profile?.name?.split(' ')[0] || 'Servidor'}!
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Seja bem-vindo ao portal administrativo da secretaria de{' '}
            <strong className="text-slate-700">{profile?.secretariat?.name || 'Administração'}</strong>.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus size={18} />}
          onClick={() => navigate('/documentos/novo')}
        >
          Criar Novo Documento
        </Button>
      </div>

      {/* Grid de KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <Card key={idx} hoverable className="border border-slate-100 flex items-center gap-5 p-5">
            <div className={`p-3.5 rounded-xl ${kpi.bg} shrink-0`}>{kpi.icon}</div>
            <div className="flex flex-col">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">
                {loading ? '...' : kpi.value}
              </span>
              <span className="text-xs font-semibold text-slate-400 mt-1.5 uppercase tracking-wider">
                {kpi.title}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Grid Central */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lado Esquerdo - Tabela de Recentes */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-950 tracking-tight">Atividades Recentes</h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-gov-blue font-semibold hover:text-slate-800"
              rightIcon={<ArrowRight size={14} />}
              onClick={() => navigate('/documentos')}
            >
              Ver todos
            </Button>
          </div>

          <Card className="!p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Título do Documento
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Criado em
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-sm">
                        Carregando atividades recentes...
                      </td>
                    </tr>
                  ) : documents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-sm">
                        Nenhum documento gerado recentemente.
                      </td>
                    </tr>
                  ) : (
                    documents.map((doc) => (
                      <tr
                        key={doc.id}
                        onClick={() => navigate(`/documentos?id=${doc.id}`)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-all duration-150"
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900 max-w-xs truncate">
                          {doc.title}
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                          {doc.type}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              doc.status === 'ASSINADO'
                                ? 'bg-green-50 text-green-700'
                                : doc.status === 'FINALIZADO'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                doc.status === 'ASSINADO'
                                  ? 'bg-green-600'
                                  : doc.status === 'FINALIZADO'
                                  ? 'bg-blue-600'
                                  : 'bg-slate-400'
                              }`}
                            />
                            {doc.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {new Date(doc.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Lado Direito - Ações Rápidas & Modelos Populares */}
        <div className="flex flex-col gap-6">
          <h3 className="text-lg font-bold text-slate-950 tracking-tight">Criação Rápida</h3>
          <Card className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                className="w-full !justify-start hover:border-gov-blue hover:text-gov-blue gap-3"
                leftIcon={<Plus size={16} />}
                onClick={() => navigate('/documentos/novo?type=OFICIO')}
              >
                Ofício Circular
              </Button>
              <Button
                variant="outline"
                className="w-full !justify-start hover:border-gov-blue hover:text-gov-blue gap-3"
                leftIcon={<Plus size={16} />}
                onClick={() => navigate('/documentos/novo?type=MEMORANDO')}
              >
                Memorando Administrativo
              </Button>
              <Button
                variant="outline"
                className="w-full !justify-start hover:border-gov-blue hover:text-gov-blue gap-3"
                leftIcon={<Plus size={16} />}
                onClick={() => navigate('/documentos/novo?type=DECRETO')}
              >
                Decreto ou Edital
              </Button>
            </div>
          </Card>

          <h3 className="text-lg font-bold text-slate-950 tracking-tight mt-2">Dica de Produtividade</h3>
          <Card className="bg-radial-at-tr from-slate-950 to-slate-900 text-white relative overflow-hidden">
            <div className="relative z-10">
              <span className="text-[10px] text-gov-gold font-bold uppercase tracking-wider bg-white/10 px-2 py-1 rounded-md">
                Dica da IA
              </span>
              <p className="text-sm leading-relaxed mt-4 text-slate-300">
                Você sabia que pode detalhar tópicos, anexos e prazos legais no campo de prompt para que a IA gere a fundamentação legal de decretos automaticamente?
              </p>
              <Button
                variant="gold"
                size="sm"
                className="mt-6 w-full gap-2"
                onClick={() => navigate('/documentos/novo')}
                rightIcon={<ArrowRight size={14} />}
              >
                Testar Geração Avançada
              </Button>
            </div>
            {/* Decoração sutil */}
            <div className="absolute -bottom-20 -right-20 w-44 h-44 rounded-full bg-white/5" />
          </Card>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
