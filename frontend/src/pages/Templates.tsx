import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

interface DocumentTemplate {
  id: string;
  title: string;
  description: string;
  type: string;
  secretariat: string;
  fields: string[];
}

export const Templates: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const templatesList: DocumentTemplate[] = [
    {
      id: 't1',
      title: 'Ofício Circular Padrão',
      description: 'Modelo oficial para comunicação externa com órgãos e secretarias externas.',
      type: 'OFICIO',
      secretariat: 'Administração',
      fields: ['Destinatário', 'Assunto', 'Mensagem Principal'],
    },
    {
      id: 't2',
      title: 'Memorando Interno de TI',
      description: 'Solicitação de suporte técnico, equipamentos ou permissões no sistema municipal.',
      type: 'MEMORANDO',
      secretariat: 'Tecnologia da Informação',
      fields: ['Setor Solicitante', 'Descritivo de Equipamento', 'Urgência'],
    },
    {
      id: 't3',
      title: 'Decreto de Nomeação de Cargo Comissionado',
      description: 'Nomeação oficial fundamentada na Lei Orgânica Municipal.',
      type: 'DECRETO',
      secretariat: 'Gabinete do Prefeito',
      fields: ['Nome do Nomeado', 'Cargo', 'Vigência', 'Símbolo do Cargo'],
    },
    {
      id: 't4',
      title: 'Edital de Pregão Presencial',
      description: 'Estrutura legal para chamamento de licitantes e abertura de concorrência.',
      type: 'EDITAL',
      secretariat: 'Licitações e Contratos',
      fields: ['Objeto do Pregão', 'Data do Certame', 'Valor Estimado'],
    },
    {
      id: 't5',
      title: 'Portaria de Instauração de Sindicância',
      description: 'Abertura de processo administrativo disciplinar corporativo.',
      type: 'DECRETO',
      secretariat: 'Procuradoria Geral',
      fields: ['Matrícula do Servidor', 'Fato Investigado', 'Comissão'],
    },
  ];

  const filteredTemplates = templatesList.filter((tpl) => {
    const matchesSearch =
      tpl.title.toLowerCase().includes(search.toLowerCase()) ||
      tpl.description.toLowerCase().includes(search.toLowerCase()) ||
      tpl.secretariat.toLowerCase().includes(search.toLowerCase());
      
    const matchesType = filterType === 'ALL' || tpl.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="text-left">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight !m-0">
          Biblioteca de Modelos Oficiais
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Selecione uma estrutura institucional padronizada para gerar novos documentos.
        </p>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-96">
          <Input
            placeholder="Pesquisar por título ou secretaria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={18} />}
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1">
          {['ALL', 'OFICIO', 'MEMORANDO', 'DECRETO', 'EDITAL', 'PROJETO_LEI'].map((type) => (
            <Button
              key={type}
              variant={filterType === type ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilterType(type)}
              className="text-xs shrink-0 font-semibold"
            >
              {type === 'ALL'
                ? 'Todos os Tipos'
                : type === 'OFICIO'
                ? 'Ofícios'
                : type === 'MEMORANDO'
                ? 'Memorandos'
                : type === 'DECRETO'
                ? 'Decretos'
                : type === 'PROJETO_LEI'
                ? 'Projetos de Lei'
                : 'Editais'}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid de Modelos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            Nenhum modelo localizado com os termos informados.
          </div>
        ) : (
          filteredTemplates.map((tpl) => (
            <Card key={tpl.id} hoverable className="flex flex-col justify-between border-slate-100">
              <CardHeader className="!pb-2">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[10px] text-gov-gold font-extrabold uppercase tracking-wider bg-slate-950 px-2 py-0.5 rounded-sm">
                    {tpl.type}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <Building size={12} /> {tpl.secretariat}
                  </span>
                </div>
                <CardTitle className="mt-3 text-base text-slate-950">{tpl.title}</CardTitle>
                <CardDescription className="line-clamp-2 mt-1">{tpl.description}</CardDescription>
              </CardHeader>

              <CardContent className="mt-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Campos Estruturais Requeridos:
                </span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tpl.fields.map((f, i) => (
                    <span
                      key={i}
                      className="text-xs bg-slate-50 text-slate-600 px-2 py-1 rounded-md border border-slate-100"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 border-slate-200 hover:border-gov-blue hover:text-gov-blue"
                  rightIcon={<ArrowRight size={14} />}
                  onClick={() => navigate(`/documentos/novo?type=${tpl.type}`)}
                >
                  Usar Modelo
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
export default Templates;
