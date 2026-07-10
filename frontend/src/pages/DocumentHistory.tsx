import React, { useState } from 'react';
import { Search, FileText, User as UserIcon, Eye } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../contexts/AuthContext';

interface DocumentModel {
  id: string;
  title: string;
  type: string;
  status: string;
  createdAt: string;
  authorName: string;
  content: string;
}

export const DocumentHistory: React.FC = () => {
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedDoc, setSelectedDoc] = useState<DocumentModel | null>(null);

  // Dados fictícios para simulação de atividades
  const documents: DocumentModel[] = [
    {
      id: '1',
      title: 'Ofício Circular nº 42/2026 - Convocação de Assembleia Extraordinária',
      type: 'OFICIO',
      status: 'ASSINADO',
      createdAt: new Date().toISOString(),
      authorName: profile?.name || 'Carlos Silva',
      content: 'MUNICÍPIO DE EXEMPLO\nSECRETARIA DE ADMINISTRAÇÃO\n\nOFÍCIO CIRCULAR Nº 42/2026\n\nPrezados Servidores,\n\nConvocamos todos para a Assembleia Geral Extraordinária a ser realizada na próxima segunda-feira às 14:00 na sala de reuniões principal, cujo objetivo será debater as novas diretrizes do plano de cargos municipais.\n\nContamos com a pontualidade e presença de todos.\n\nAtenciosamente,\nCarlos Silva\nSecretário de Administração',
    },
    {
      id: '2',
      title: 'Memorando de Aquisição de Insumos Hospitalares Especiais',
      type: 'MEMORANDO',
      status: 'RASCUNHO',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      authorName: profile?.name || 'Carlos Silva',
      content: 'MEMORANDO INTERNO nº 015/2026\n\nPara: Departamento de Compras\nDe: Secretaria de Saúde\n\nAssunto: Aquisição de insumos urgentes.\n\nSolicitamos celeridade no processo de aquisição dos insumos descritos em anexo, necessários para suprir a demanda da UTI móvel municipal pelos próximos 60 dias.\n\nAtenciosamente,\nEquipe de Planejamento',
    },
    {
      id: '3',
      title: 'Decreto Municipal nº 115 - Férias Coletivas dos Servidores',
      type: 'DECRETO',
      status: 'FINALIZADO',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      authorName: 'Ana Cláudia (RH)',
      content: 'DECRETO MUNICIPAL Nº 115/2026\n\nO Prefeito Municipal, no uso de suas atribuições legais,\n\nDECRETA:\n\nArt. 1º - Fica instituído o período de férias coletivas para a secretaria de Educação no intervalo de 20/12/2026 a 05/01/2027.\n\nArt. 2º - Este decreto entra em vigor na data de sua publicação.\n\nRegistre-se e Publique-se.',
    },
  ];

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.authorName.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight !m-0">
          Meus Documentos e Histórico
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Gerencie e filtre todos os documentos administrativos gerados pelo seu órgão.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-96">
          <Input
            placeholder="Pesquisar por título ou autor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={18} />}
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1">
          {['ALL', 'RASCUNHO', 'FINALIZADO', 'ASSINADO'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="text-xs shrink-0 font-semibold"
            >
              {status === 'ALL' ? 'Todos os Status' : status}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid ou Tabela de Documentos */}
      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Documento
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Autor
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                    Nenhum documento encontrado.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-all duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 text-slate-400 rounded-lg">
                          <FileText size={18} />
                        </div>
                        <span className="text-sm font-semibold text-slate-900 max-w-xs truncate">
                          {doc.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 flex items-center gap-1.5">
                      <UserIcon size={14} className="text-slate-400" />
                      {doc.authorName}
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
                      {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="!p-1.5 hover:bg-slate-100 rounded-lg text-gov-blue"
                        leftIcon={<Eye size={16} />}
                        onClick={() => setSelectedDoc(doc)}
                      >
                        Visualizar
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal para Visualizar Documento */}
      {selectedDoc && (
        <Modal
          isOpen={!!selectedDoc}
          onClose={() => setSelectedDoc(null)}
          title={selectedDoc.title}
          size="lg"
        >
          <div className="flex flex-col gap-6 text-left">
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Tipo / Status
                </span>
                <span className="text-sm font-semibold text-slate-700">
                  {selectedDoc.type} • {selectedDoc.status}
                </span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Autor
                </span>
                <span className="text-sm font-semibold text-slate-700">
                  {selectedDoc.authorName}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-6 rounded-lg font-serif text-sm text-slate-800 leading-relaxed max-h-[350px] overflow-y-auto whitespace-pre-wrap">
              {selectedDoc.content}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setSelectedDoc(null)}>
                Fechar Janela
              </Button>
              {selectedDoc.status === 'RASCUNHO' && (
                <Button
                  variant="primary"
                  onClick={() => {
                    setSelectedDoc(null);
                    // Redireciona para novo com parâmetros simulando edição
                    alert('Carregando conteúdo no editor...');
                  }}
                >
                  Continuar Editando
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
export default DocumentHistory;
