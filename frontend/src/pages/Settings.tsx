import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Save, 
  Plus, 
  Trash2, 
  Brain, 
  Sparkles, 
  CheckSquare, 
  Database, 
  RefreshCw, 
  Wrench,
  Users,
  Building2,
  Scale,
  History,
  ArrowRightLeft,
  FolderOpen
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export const Settings: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'municipio';
  const activeSubTab = searchParams.get('subtab') || 'missao';

  const setActiveTab = (tab: string) => {
    if (tab === 'treinamento') {
      setSearchParams({ tab, subtab: 'missao' });
    } else {
      setSearchParams({ tab });
    }
  };

  const setActiveSubTab = (subtab: string) => {
    setSearchParams({ tab: 'treinamento', subtab });
  };

  // Estado das configurações do município
  const [name, setName] = useState(profile?.municipality?.name || '');
  const [cnpj, setCnpj] = useState(profile?.municipality?.cnpj || '');
  const [primaryColor, setPrimaryColor] = useState(profile?.municipality?.primaryColor || '#0f2d59');
  const [isSaving, setIsSaving] = useState(false);

  // Estado de Treinamento da IA
  const [aiMemory, setAiMemory] = useState({
    vocabulario: localStorage.getItem('ai_mem_vocabulario') || 'Utilizar termos formais como "Cumprimentando-o cordialmente", "Solicita-se", "Diante do exposto". Evitar gírias ou abreviações informais.',
    formaAssinatura: localStorage.getItem('ai_mem_assinatura') || 'Atenciosamente, [Nome do Prefeito/Secretário], [Cargo Oficial]',
    estruturaDocumentos: localStorage.getItem('ai_mem_estrutura') || 'Preâmbulo com justificativa, corpo do texto dividido em parágrafos temáticos numerados quando necessário, e encerramento padrão.',
    cabecalho: localStorage.getItem('ai_mem_cabecalho') || 'Prefeitura Municipal - Estado de Santa Catarina',
    rodape: localStorage.getItem('ai_mem_rodape') || 'Rua Principal, 123 - Centro - CNPJ: 00.000.000/0000-00',
    formaCitarLeis: localStorage.getItem('ai_mem_citar_leis') || 'Citar com o número da lei seguido do ano e a ementa ou artigo específico. Ex: "conforme o Art. 5º da Lei nº 14.133/2021".',
    formaCitarProcessos: localStorage.getItem('ai_mem_citar_processos') || 'Citar com o número do processo administrativo e o ano. Ex: "Processo Administrativo nº 1234/2026".',
    nomesRecorrentes: localStorage.getItem('ai_mem_nomes') || 'Secretário de Administração, Prefeito Municipal, Procurador Geral do Município',
    setoresEnvolvidos: localStorage.getItem('ai_mem_setores') || 'SEMAD (Administração), SEMED (Educação), SMS (Saúde), PGM (Procuradoria Geral)'
  });

  const [aiEvaluation, setAiEvaluation] = useState({
    claro: localStorage.getItem('ai_eval_claro') !== 'false',
    formal: localStorage.getItem('ai_eval_formal') !== 'false',
    repeticao: localStorage.getItem('ai_eval_repeticao') !== 'false',
    erroJuridico: localStorage.getItem('ai_eval_erro') !== 'false',
    contraditorio: localStorage.getItem('ai_eval_contraditorio') !== 'false',
    padraoPrefeitura: localStorage.getItem('ai_eval_padrao') !== 'false',
    ambiguo: localStorage.getItem('ai_eval_ambiguo') !== 'false'
  });

  const [municipalLaws, setMunicipalLaws] = useState<{ id: string; title: string; ementa: string; active: boolean }[]>(
    JSON.parse(localStorage.getItem('ai_municipal_laws') || '[]')
  );

  const [aiKnowledge] = useState([
    { id: '1', title: 'Constituição Federal', type: 'Federal', active: true },
    { id: '2', title: 'Lei nº 14.133/2021 (Licitações)', type: 'Federal', active: true },
    { id: '3', title: 'Lei nº 8.112 (Estatuto do Servidor)', type: 'Federal', active: true },
    { id: '4', title: 'Lei de Responsabilidade Fiscal', type: 'Federal', active: true },
    { id: '5', title: 'Lei de Acesso à Informação (LAI)', type: 'Federal', active: true },
    { id: '6', title: 'LGPD (Lei Geral de Proteção de Dados)', type: 'Federal', active: true },
    { id: '7', title: 'Manual de Redação da Presidência da República', type: 'Federal', active: true }
  ]);

  const [newLawTitle, setNewLawTitle] = useState('');
  const [newLawEmenta, setNewLawEmenta] = useState('');

  const [aiConfig, setAiConfig] = useState({
    ragEnabled: localStorage.getItem('ai_config_ragEnabled') !== 'false',
    saveMetadata: localStorage.getItem('ai_config_saveMetadata') !== 'false',
    blockRebuxado: localStorage.getItem('ai_config_blockRebuxado') !== 'false',
    notifyRisk: localStorage.getItem('ai_config_notifyRisk') !== 'false'
  });

  // Novos estados para a Base de Conhecimento Viva e Categorizada
  const [aiPeople, setAiPeople] = useState<{ id: string; name: string; role: string; type: string }[]>(
    JSON.parse(localStorage.getItem('ai_people') || `[
      { "id": "1", "name": "Dr. Marcos Silva", "role": "Procurador Geral do Município", "type": "PROCURADOR" },
      { "id": "2", "name": "Dra. Sandra Souza", "role": "Assessora Jurídica", "type": "ADVOGADO" },
      { "id": "3", "name": "Carlos Alberto", "role": "Fiscal de Contratos (SEMAD)", "type": "FISCAL" },
      { "id": "4", "name": "Prefeito Municipal", "role": "Chefe do Poder Executivo", "type": "AUTORIDADE" }
    ]`)
  );
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonRole, setNewPersonRole] = useState('');
  const [newPersonType, setNewPersonType] = useState('AUTORIDADE');

  const [aiOrgCompetencies, setAiOrgCompetencies] = useState<{ id: string; name: string; competency: string }[]>(
    JSON.parse(localStorage.getItem('ai_org_competencies') || `[
      { "id": "1", "name": "SEMAD", "competency": "Planejamento e coordenação de compras, licitações, contratos e gestão de pessoas." },
      { "id": "2", "name": "SEMED", "competency": "Gerenciamento da rede escolar municipal e aplicação de recursos do FUNDEB." },
      { "id": "3", "name": "SMS", "competency": "Execução de políticas públicas de saúde e regulação hospitalar municipal." }
    ]`)
  );
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgCompetency, setNewOrgCompetency] = useState('');

  const [aiProcesses, setAiProcesses] = useState<{ id: string; number: string; phase: string; basis: string }[]>(
    JSON.parse(localStorage.getItem('ai_processes') || `[
      { "id": "1", "number": "Processo Adm. nº 450/2026", "phase": "Fase de Julgamento", "basis": "Art. 75, II da Lei 14.133/21" },
      { "id": "2", "number": "Licitação Eletrônica nº 02/2026", "phase": "Fase de Homologação", "basis": "Lei de Licitações 14.133/21" }
    ]`)
  );
  const [newProcessNumber, setNewProcessNumber] = useState('');
  const [newProcessPhase, setNewProcessPhase] = useState('');
  const [newProcessBasis, setNewProcessBasis] = useState('');

  const [aiLinguagem, setAiLinguagem] = useState({
    expressoesPreferidas: localStorage.getItem('ai_lang_expressoes') || 'Em atenção ao, Conforme deliberado, Diante do exposto, Solicito providências',
    nivelFormalidade: localStorage.getItem('ai_lang_formalidade') || 'Alto (Padrão Oficial do Manual da Presidência da República)',
    formaInicio: localStorage.getItem('ai_lang_inicio') || 'Cumprimentando-o cordialmente, vimos por meio deste solicitar...',
    formaFim: localStorage.getItem('ai_lang_fim') || 'Respeitosamente / Atenciosamente',
    terminologiaJuridica: localStorage.getItem('ai_lang_term_juridica') || 'Ato administrativo, Homologação, Adjudicação, Parecer conclusivo',
    terminologiaAdmin: localStorage.getItem('ai_lang_term_admin') || 'Memorando eletrônico, Tramitação, Liquidação de despesa'
  });

  const [learnedCorrections] = useState<{ id: string; docType: string; original: string; corrected: string; reason: string }[]>(
    JSON.parse(localStorage.getItem('ai_learned_corrections') || `[
      { "id": "1", "docType": "Ofício", "original": "solicitamos urgencia no praso de dez dias", "corrected": "solicitamos urgência no prazo de 10 (dez) dias", "reason": "Correção ortográfica e clareza de prazo administrativo" },
      { "id": "2", "docType": "Decreto", "original": "o prefeito resolve decretar", "corrected": "O PREFEITO MUNICIPAL, no uso de suas atribuições legais, DECRETA:", "reason": "Ajuste de preâmbulo e formalidade de assinatura do poder executivo" }
    ]`)
  );

  // Estado para a simulação do treino
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingLogs, setTrainingLogs] = useState<string[]>([]);

  // Estados da Biblioteca de PDFs & Indexador
  const [knowledgeFiles, setKnowledgeFiles] = useState<any>(null);
  const [uploadCategory, setUploadCategory] = useState('Constituição');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isIndexingAll, setIsIndexingAll] = useState(false);

  const fetchKnowledgeFiles = async () => {
    try {
      const response = await api.get('/knowledge/files');
      setKnowledgeFiles(response.data);
    } catch (error) {
      console.error('Erro ao buscar arquivos de conhecimento:', error);
    }
  };

  useEffect(() => {
    fetchKnowledgeFiles();
  }, []);

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('category', uploadCategory);

    try {
      await api.post('/knowledge/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('PDF enviado e indexado no banco vetorial com sucesso!');
      setSelectedFile(null);
      const fileInput = document.getElementById('pdf-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      fetchKnowledgeFiles();
    } catch (error) {
      console.error('Erro ao fazer upload do PDF:', error);
      alert('Erro ao fazer upload do PDF. Verifique se o servidor backend está online.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleIndexAll = async () => {
    setIsIndexingAll(true);
    try {
      const response = await api.post('/knowledge/index-all');
      alert(`Biblioteca de Conhecimento indexada!\nArquivos processados: ${response.data.filesCount}\nSeções/Artigos indexados no banco vetorial: ${response.data.chunksCount}`);
      fetchKnowledgeFiles();
    } catch (error) {
      console.error('Erro ao reindexar biblioteca:', error);
      alert('Erro ao reindexar a biblioteca. Verifique o servidor backend.');
    } finally {
      setIsIndexingAll(false);
    }
  };

  const handleSearchVector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await api.get(`/knowledge/search?query=${encodeURIComponent(searchQuery)}`);
      setSearchResults(response.data.results);
    } catch (error) {
      console.error('Erro ao buscar no RAG:', error);
      alert('Erro ao buscar no banco vetorial.');
    } finally {
      setIsSearching(false);
    }
  };

  const renderFilesStructure = (node: any): React.ReactNode => {
    if (!node) return null;

    if (!node.isDirectory) {
      return (
        <div key={node.path} className="flex items-center gap-2 py-1 pl-6 hover:bg-slate-50 rounded text-xs text-slate-600">
          <span className="text-slate-400">•</span>
          <span className="font-medium text-slate-700">{node.name}</span>
          <span className="text-[10px] text-slate-400">({(node.sizeBytes / 1024).toFixed(1)} KB)</span>
        </div>
      );
    }

    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.name} className="flex flex-col gap-1 border-l border-slate-100 pl-4 py-1">
        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 select-none">
          <span className="text-gov-blue">📁</span>
          {node.name}
        </span>
        {hasChildren ? (
          <div className="flex flex-col">
            {node.children.map((child: any) => renderFilesStructure(child))}
          </div>
        ) : (
          <span className="text-[10px] text-slate-400 italic pl-6">Pasta vazia</span>
        )}
      </div>
    );
  };

  const handleSaveAiSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Salva Memória
    Object.entries(aiMemory).forEach(([key, value]) => {
      localStorage.setItem(`ai_mem_${key}`, value);
    });
    
    // Salva Autoavaliação
    Object.entries(aiEvaluation).forEach(([key, value]) => {
      localStorage.setItem(`ai_eval_${key}`, String(value));
    });
    
    // Salva Configurações RAG
    Object.entries(aiConfig).forEach(([key, value]) => {
      localStorage.setItem(`ai_config_${key}`, String(value));
    });

    // Salva Linguagem
    Object.entries(aiLinguagem).forEach(([key, value]) => {
      localStorage.setItem(`ai_lang_${key}`, value);
    });

    localStorage.setItem('ai_municipal_laws', JSON.stringify(municipalLaws));
    localStorage.setItem('ai_people', JSON.stringify(aiPeople));
    localStorage.setItem('ai_org_competencies', JSON.stringify(aiOrgCompetencies));
    localStorage.setItem('ai_processes', JSON.stringify(aiProcesses));
    
    setTimeout(() => {
      setIsSaving(false);
      alert('Configurações de Treinamento do Agente IA salvas com sucesso!');
    }, 800);
  };

  const handleAddMunicipalLaw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLawTitle || !newLawEmenta) return;
    const newLaw = {
      id: Math.random().toString(),
      title: newLawTitle,
      ementa: newLawEmenta,
      active: true
    };
    const updated = [...municipalLaws, newLaw];
    setMunicipalLaws(updated);
    localStorage.setItem('ai_municipal_laws', JSON.stringify(updated));
    setNewLawTitle('');
    setNewLawEmenta('');
  };

  const handleRemoveMunicipalLaw = (id: string) => {
    const updated = municipalLaws.filter((law) => law.id !== id);
    setMunicipalLaws(updated);
    localStorage.setItem('ai_municipal_laws', JSON.stringify(updated));
  };

  const handleToggleMunicipalLaw = (id: string) => {
    const updated = municipalLaws.map(law => law.id === id ? { ...law, active: !law.active } : law);
    setMunicipalLaws(updated);
    localStorage.setItem('ai_municipal_laws', JSON.stringify(updated));
  };

  // Handlers para Pessoas
  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonName || !newPersonRole) return;
    const newPerson = {
      id: Math.random().toString(),
      name: newPersonName,
      role: newPersonRole,
      type: newPersonType
    };
    const updated = [...aiPeople, newPerson];
    setAiPeople(updated);
    localStorage.setItem('ai_people', JSON.stringify(updated));
    setNewPersonName('');
    setNewPersonRole('');
  };

  const handleRemovePerson = (id: string) => {
    const updated = aiPeople.filter(p => p.id !== id);
    setAiPeople(updated);
    localStorage.setItem('ai_people', JSON.stringify(updated));
  };

  // Handlers para Órgãos
  const handleAddOrgCompetency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName || !newOrgCompetency) return;
    const newOrg = {
      id: Math.random().toString(),
      name: newOrgName.toUpperCase(),
      competency: newOrgCompetency
    };
    const updated = [...aiOrgCompetencies, newOrg];
    setAiOrgCompetencies(updated);
    localStorage.setItem('ai_org_competencies', JSON.stringify(updated));
    setNewOrgName('');
    setNewOrgCompetency('');
  };

  const handleRemoveOrgCompetency = (id: string) => {
    const updated = aiOrgCompetencies.filter(o => o.id !== id);
    setAiOrgCompetencies(updated);
    localStorage.setItem('ai_org_competencies', JSON.stringify(updated));
  };

  // Handlers para Processos
  const handleAddProcess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProcessNumber || !newProcessPhase) return;
    const newProc = {
      id: Math.random().toString(),
      number: newProcessNumber,
      phase: newProcessPhase,
      basis: newProcessBasis
    };
    const updated = [...aiProcesses, newProc];
    setAiProcesses(updated);
    localStorage.setItem('ai_processes', JSON.stringify(updated));
    setNewProcessNumber('');
    setNewProcessPhase('');
    setNewProcessBasis('');
  };

  const handleRemoveProcess = (id: string) => {
    const updated = aiProcesses.filter(p => p.id !== id);
    setAiProcesses(updated);
    localStorage.setItem('ai_processes', JSON.stringify(updated));
  };

  const handleStartTraining = () => {
    setIsTraining(true);
    setTrainingProgress(0);
    setTrainingLogs([]);
    
    const logs = [
      'Iniciando ciclo de auto-treinamento da IA...',
      'Acessando banco de conhecimento e referências constitucionais...',
      'Processando dados da Memória e regras de estilo do município...',
      'Mapeando Pessoas, Cargos e relações institucionais oficiais...',
      'Mapeando Órgãos municipais e suas respectivas competências...',
      'Processando legislações federais e legislações municipais do RAG...',
      'Vinculando históricos processuais e fundamentos jurídicos cadastrados...',
      'Indexando metadados de gerações anteriores (tipo, assunto, secretarias)...',
      'Configurando busca semântica (RAG) no histórico de documentos...',
      'Analisando padrão linguístico, expressões preferidas e assinaturas...',
      'Carregando regras de correção extraídas das revisões anteriores de usuários...',
      'Aplicando regras de autoavaliação interna aos modelos de teste...',
      'Avaliando clareza, formalidade e consistência de leis, cargos, nomes e datas...',
      'Treinamento concluído com sucesso! Agente IA atualizado com as novas regras.'
    ];
    
    let currentLogIndex = 0;
    
    const interval = setInterval(() => {
      if (currentLogIndex < logs.length) {
        setTrainingLogs(prev => [...prev, logs[currentLogIndex]]);
        setTrainingProgress(Math.min(Math.round(((currentLogIndex + 1) / logs.length) * 100), 100));
        currentLogIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsTraining(false);
          alert('Treinamento completo! O Agente IA agora aprendeu os novos padrões de escrita da prefeitura.');
        }, 500);
      }
    }, 1000);
  };

  // Estado das imagens base64/URL
  const [logoBase64, setLogoBase64] = useState(
    localStorage.getItem('mun_logo_base64') || profile?.municipality?.logoUrl || ''
  );
  const [watermarkBase64, setWatermarkBase64] = useState(
    localStorage.getItem('mun_watermark_base64') || ''
  );

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoBase64(base64String);
        localStorage.setItem('mun_logo_base64', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWatermarkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setWatermarkBase64(base64String);
        localStorage.setItem('mun_watermark_base64', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // Lista de Secretarias do município (simulado)
  const [secretariats, setSecretariats] = useState([
    { id: '1', name: 'Secretaria Municipal de Administração', code: 'SEMAD' },
    { id: '2', name: 'Secretaria Municipal de Educação', code: 'SEMED' },
    { id: '3', name: 'Secretaria Municipal de Saúde', code: 'SMS' },
  ]);
  const [newSecName, setNewSecName] = useState('');
  const [newSecCode, setNewSecCode] = useState('');

  const colors = [
    { name: 'Azul Governo (Padrão)', value: '#0f2d59' },
    { name: 'Verde Brasília', value: '#064e3b' },
    { name: 'Cinza Executivo', value: '#1e293b' },
    { name: 'Bordô Oficial', value: '#7f1d1d' },
    { name: 'Azul Royal', value: '#1d4ed8' },
  ];

  const handleSaveMunicipality = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put(`/municipalities/${profile?.municipalityId}`, {
        name,
        cnpj,
        primaryColor,
        logoUrl: logoBase64,
      });
      await refreshProfile();
      alert('Configurações do município atualizadas com sucesso!');
    } catch (err) {
      console.error(err);
      // Simulação para preview na interface
      document.documentElement.style.setProperty('--color-gov-blue', primaryColor);
      alert('[Demonstração] Configurações de cores e dados aplicadas localmente!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSecretariat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSecName || !newSecCode) return;
    const newSec = {
      id: Math.random().toString(),
      name: newSecName,
      code: newSecCode.toUpperCase(),
    };
    setSecretariats([...secretariats, newSec]);
    setNewSecName('');
    setNewSecCode('');
  };

  const handleRemoveSecretariat = (id: string) => {
    setSecretariats(secretariats.filter((s) => s.id !== id));
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight !m-0">
          Prefeitura e Configurações
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Gerencie a identidade visual da prefeitura e a estrutura de órgãos/secretarias vinculados.
        </p>
      </div>

      {/* Tabs Layout */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('municipio')}
          className={`pb-3 text-sm font-semibold tracking-tight transition-all relative ${
            activeTab === 'municipio'
              ? 'text-gov-blue border-b-2 border-gov-blue'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Identidade do Município
        </button>
        <button
          onClick={() => setActiveTab('secretarias')}
          className={`pb-3 text-sm font-semibold tracking-tight transition-all relative ${
            activeTab === 'secretarias'
              ? 'text-gov-blue border-b-2 border-gov-blue'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Órgãos e Secretarias
        </button>
        <button
          onClick={() => setActiveTab('treinamento')}
          className={`pb-3 text-sm font-semibold tracking-tight transition-all relative ${
            activeTab === 'treinamento'
              ? 'text-gov-blue border-b-2 border-gov-blue'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Brain size={16} className={activeTab === 'treinamento' ? 'text-gov-blue' : 'text-slate-400'} />
            Treinamento do Agente IA
          </span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'municipio' && (
        <form onSubmit={handleSaveMunicipality} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lado Esquerdo - Formulário */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Dados Gerais</CardTitle>
                <CardDescription>
                  Insira as informações oficiais que constarão no timbre e rodapé de todos os documentos gerados.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <Input
                  label="Nome da Prefeitura"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Prefeitura Municipal de Nova Friburgo"
                  required
                />
                <Input
                  label="CNPJ Oficial"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="00.000.000/0000-00"
                  required
                />
                {/* Upload do Brasão */}
                <div className="flex flex-col gap-2 text-left">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Brasão do Cabeçalho (Timbre Oficial)
                  </label>
                  <div className="flex items-center gap-4 border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                    {logoBase64 ? (
                      <img
                        src={logoBase64}
                        alt="Preview Brasão"
                        className="w-16 h-16 object-contain rounded-lg border border-slate-200 bg-white p-1"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg border border-dashed border-slate-200 bg-white flex items-center justify-center text-[10px] text-slate-400 font-bold text-center">
                        Sem Brasão
                      </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                      <label className="inline-flex items-center justify-center px-4 py-2 border border-slate-200 bg-white rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs transition-all">
                        Selecionar Imagem
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoUpload}
                        />
                      </label>
                      <span className="text-[10px] text-slate-400">Formatos recomendados: PNG ou SVG (Fundo transparente)</span>
                    </div>
                  </div>
                </div>

                {/* Upload da Marca d'Água */}
                <div className="flex flex-col gap-2 text-left">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Marca d'Água Central (Fundo do Documento)
                  </label>
                  <div className="flex items-center gap-4 border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                    {watermarkBase64 ? (
                      <img
                        src={watermarkBase64}
                        alt="Preview Marca d'Água"
                        className="w-16 h-16 object-contain rounded-lg border border-slate-200 bg-white p-1 opacity-50"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg border border-dashed border-slate-200 bg-white flex items-center justify-center text-[10px] text-slate-400 font-bold text-center">
                        Sem Marca
                      </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                      <label className="inline-flex items-center justify-center px-4 py-2 border border-slate-200 bg-white rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs transition-all">
                        Selecionar Imagem
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleWatermarkUpload}
                        />
                      </label>
                      <span className="text-[10px] text-slate-400">Formatos recomendados: PNG ou SVG (Fundo transparente)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Identidade Visual & Cores</CardTitle>
                <CardDescription>
                  Selecione a cor primária do município. Ela será aplicada em todo o painel administrativo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {colors.map((color) => (
                    <div
                      key={color.value}
                      onClick={() => setPrimaryColor(color.value)}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        primaryColor === color.value
                          ? 'border-gov-blue bg-slate-50'
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: color.value }}
                      />
                      <span className="text-xs font-semibold text-slate-700">{color.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" isLoading={isSaving} leftIcon={<Save size={16} />}>
                  Salvar Alterações
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Lado Direito - Preview em tempo real */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Pré-visualização do Tema
            </h3>
            <Card className="flex flex-col items-center text-center p-8 border-slate-200 relative overflow-hidden animate-scale-up">
              {/* Marca d'água simulada no preview */}
              {watermarkBase64 && (
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none">
                  <img src={watermarkBase64} alt="Marca d'água" className="w-40 h-40 object-contain" />
                </div>
              )}
              
              {logoBase64 ? (
                <img
                  src={logoBase64}
                  alt="Brasão Oficial"
                  className="w-20 h-20 object-contain mb-4 border-2 rounded-xl p-1 shadow-sm transition-all duration-300"
                  style={{ borderColor: primaryColor }}
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center font-bold text-white shadow-md text-xl mb-4 transition-all duration-300"
                  style={{ backgroundColor: primaryColor }}
                >
                  Gov
                </div>
              )}
              <h4 className="font-extrabold text-slate-900 text-base relative z-10">{name || 'Minha Prefeitura'}</h4>
              <span className="text-[10px] text-gov-gold font-bold uppercase tracking-wider mt-1.5 relative z-10">
                Brasão / Logotipo Oficial
              </span>
              <p className="text-xs text-slate-400 mt-4 leading-relaxed relative z-10">
                As áreas de navegação e componentes principais adotarão este esquema de cores.
              </p>
            </Card>
          </div>
        </form>
      )}

      {activeTab === 'secretarias' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lado Esquerdo - Lista de Secretarias */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-slate-950 tracking-tight">Órgãos Cadastrados</h3>
            <Card className="!p-0 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Nome da Secretaria / Órgão
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {secretariats.map((sec) => (
                    <tr key={sec.id} className="hover:bg-slate-50/40">
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        {sec.name}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                        {sec.code}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="!p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                          leftIcon={<Trash2 size={16} />}
                          onClick={() => handleRemoveSecretariat(sec.id)}
                        >
                          Excluir
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          {/* Lado Direito - Adicionar Secretaria */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Nova Secretaria</CardTitle>
                <CardDescription>Vincule um novo órgão ao município.</CardDescription>
              </CardHeader>
              <form onSubmit={handleAddSecretariat}>
                <CardContent className="flex flex-col gap-4">
                  <Input
                    label="Nome do Órgão/Secretaria"
                    placeholder="Ex: Secretaria Municipal de Educação"
                    required
                    value={newSecName}
                    onChange={(e) => setNewSecName(e.target.value)}
                  />
                  <Input
                    label="Sigla / Código"
                    placeholder="Ex: SEMED"
                    required
                    value={newSecCode}
                    onChange={(e) => setNewSecCode(e.target.value)}
                  />
                </CardContent>
                <CardFooter className="mt-4">
                  <Button type="submit" className="w-full" leftIcon={<Plus size={16} />}>
                    Adicionar Órgão
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'treinamento' && (
        <div className="flex flex-col gap-6 text-left w-full">
          {/* Header do Agente IA */}
          <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Brain size={150} />
            </div>
            <div className="flex flex-col gap-1 relative z-10">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Brain className="text-gov-blue animate-pulse" size={24} />
                Agente de Inteligência Artificial Institucional
              </h2>
              <p className="text-xs text-slate-500 max-w-2xl leading-normal">
                Você não é apenas um gerador de documentos. Este é o seu espaço de evolução contínua: um sistema inteligente que aprende com dados produzidos, revisados e aprovados pela prefeitura para garantir precisão, consistência institucional e conformidade legal.
              </p>
            </div>
            <div className="shrink-0 relative z-10">
              <span className="px-3 py-1.5 bg-gov-blue/10 text-gov-blue text-xs font-bold rounded-full uppercase tracking-wider">
                Base RAG Ativa
              </span>
            </div>
          </div>

          {/* Subabas de Navegação do Treinamento */}
          <div className="flex border-b border-slate-200 gap-4 overflow-x-auto whitespace-nowrap pb-1">
            <button
              onClick={() => setActiveSubTab('missao')}
              className={`pb-3 text-xs font-bold tracking-tight transition-all relative ${
                activeSubTab === 'missao'
                  ? 'text-gov-blue border-b-2 border-gov-blue'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} />
                Missão & Evolução
              </span>
            </button>
            <button
              onClick={() => setActiveSubTab('base-conhecimento')}
              className={`pb-3 text-xs font-bold tracking-tight transition-all relative ${
                activeSubTab === 'base-conhecimento'
                  ? 'text-gov-blue border-b-2 border-gov-blue'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Database size={14} />
                Base de Informações Viva
              </span>
            </button>
            <button
              onClick={() => setActiveSubTab('estilo')}
              className={`pb-3 text-xs font-bold tracking-tight transition-all relative ${
                activeSubTab === 'estilo'
                  ? 'text-gov-blue border-b-2 border-gov-blue'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Wrench size={14} />
                Estilo & Linguagem
              </span>
            </button>
            <button
              onClick={() => setActiveSubTab('qualidade')}
              className={`pb-3 text-xs font-bold tracking-tight transition-all relative ${
                activeSubTab === 'qualidade'
                  ? 'text-gov-blue border-b-2 border-gov-blue'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <CheckSquare size={14} />
                Controle de Qualidade & Correções
              </span>
            </button>
            <button
              onClick={() => setActiveSubTab('biblioteca-rag')}
              className={`pb-3 text-xs font-bold tracking-tight transition-all relative ${
                activeSubTab === 'biblioteca-rag'
                  ? 'text-gov-blue border-b-2 border-gov-blue'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <FolderOpen size={14} />
                Biblioteca de PDFs (RAG)
              </span>
            </button>
          </div>

          {/* CONTEÚDO DAS SUBABAS */}

          {/* Subaba 1: Missão & Evolução */}
          {activeSubTab === 'missao' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 flex flex-col gap-6">
                
                {/* Painel da Missão */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-extrabold text-slate-900">Missão de Aprendizado</CardTitle>
                    <CardDescription>
                      Entenda como o Agente IA absorve as informações e garante exatidão.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-5 text-sm text-slate-600 leading-relaxed">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-2">
                      <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">Aumentar a Precisão a Cada Interação</span>
                      <p className="text-xs">
                        Nosso objetivo principal é preservar a consistência institucional das peças geradas, sem inventar fatos, leis ou decisões administrativas. A IA torna-se cada vez mais especialista na linguagem da prefeitura através do monitoramento de correções e validações do usuário.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">O Processo de Aprendizado Contínuo (Pós-Finalização):</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 border border-slate-100 rounded-lg bg-white">
                          <span className="font-bold text-slate-800 block mb-1">1. Análise Completa</span>
                          A IA escaneia e processa o documento homologado na sua totalidade.
                        </div>
                        <div className="p-3 border border-slate-100 rounded-lg bg-white">
                          <span className="font-bold text-slate-800 block mb-1">2. Comparação de Similaridade</span>
                          Compara com históricos anteriores para rastrear alterações no estilo.
                        </div>
                        <div className="p-3 border border-slate-100 rounded-lg bg-white">
                          <span className="font-bold text-slate-800 block mb-1">3. Mapeamento de Mudanças</span>
                          Identifica termos que foram adicionados, substituídos ou descartados pelo usuário.
                        </div>
                        <div className="p-3 border border-slate-100 rounded-lg bg-white">
                          <span className="font-bold text-slate-800 block mb-1">4. Feedback de Erros</span>
                          Erros e incoerências detectados e corrigidos pelo usuário viram novas diretrizes de bloqueio.
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Card de Informações RAG e Aprendizado Semântico */}
                <Card className="border-gov-blue/20 bg-slate-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                      <Database size={18} className="text-gov-blue" />
                      Metadados RAG e Ingestão de Histórico
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Indexação automática dos documentos da prefeitura para similaridade semântica.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4 text-left">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <label className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50/20 transition-all">
                        <div className="flex flex-col pr-2">
                          <span className="text-xs font-bold text-slate-700">Salvar Metadados da Geração</span>
                          <span className="text-[9px] text-slate-400">Salva tipo de ato, assunto, secretaria, quem aprovou e alterações locais.</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={aiConfig.saveMetadata}
                          onChange={(e) => setAiConfig({ ...aiConfig, saveMetadata: e.target.checked })}
                          className="rounded border-slate-300 text-gov-blue focus:ring-gov-blue w-4 h-4 shrink-0"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50/20 transition-all">
                        <div className="flex flex-col pr-2">
                          <span className="text-xs font-bold text-slate-700">Busca Semântica (RAG) Ativa</span>
                          <span className="text-[9px] text-slate-400">Varre a base de documentos aprovados antes de iniciar novos rascunhos.</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={aiConfig.ragEnabled}
                          onChange={(e) => setAiConfig({ ...aiConfig, ragEnabled: e.target.checked })}
                          className="rounded border-slate-300 text-gov-blue focus:ring-gov-blue w-4 h-4 shrink-0"
                        />
                      </label>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Lado Direito - Terminal de Treino */}
              <div>
                <Card className="bg-slate-900 border-slate-800 text-white relative overflow-hidden h-full">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Brain size={120} />
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                      <RefreshCw size={16} className={`text-gov-gold ${isTraining ? 'animate-spin' : ''}`} />
                      Ciclo de Auto-Treinamento
                    </CardTitle>
                    <CardDescription className="text-[11px] text-slate-400">
                      Inicie o processamento vetorial para alinhar a IA com os últimos documentos, alterações e dados do município.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4 mt-2">
                    {isTraining ? (
                      <div className="flex flex-col gap-3">
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-gov-gold h-full transition-all duration-300" 
                            style={{ width: `${trainingProgress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                          <span>Sincronizando base de dados...</span>
                          <span>{trainingProgress}%</span>
                        </div>

                        <div className="bg-black/85 rounded-lg p-3 font-mono text-[9px] text-green-400 h-64 overflow-y-auto flex flex-col gap-1.5 border border-slate-800 text-left">
                          {trainingLogs.map((log, index) => (
                            <div key={index} className="flex gap-1.5 items-start leading-normal">
                              <span className="text-slate-600 select-none">&gt;</span>
                              <span>{log}</span>
                            </div>
                          ))}
                          <div className="animate-pulse w-2 h-3.5 bg-green-400 mt-1 inline-block" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl text-left flex flex-col gap-2">
                          <span className="text-[10px] text-gov-gold font-bold uppercase tracking-wider">Estatísticas do Banco</span>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>• Pessoas/Cargos: <span className="font-bold text-slate-200">{aiPeople.length}</span></div>
                            <div>• Órgãos/Compet.: <span className="font-bold text-slate-200">{aiOrgCompetencies.length}</span></div>
                            <div>• Legislações: <span className="font-bold text-slate-200">{aiKnowledge.length + municipalLaws.length}</span></div>
                            <div>• Regras Aprendidas: <span className="font-bold text-slate-200">{learnedCorrections.length}</span></div>
                          </div>
                        </div>
                        <Button 
                          onClick={handleStartTraining}
                          className="w-full bg-gov-gold hover:bg-gov-gold/90 text-slate-950 font-extrabold border-none py-3"
                          leftIcon={<Brain size={16} />}
                        >
                          Iniciar Auto-Treinamento
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Subaba 2: Base de Informações Viva (Cadastros Dinâmicos Categorizados) */}
          {activeSubTab === 'base-conhecimento' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              
              {/* 1. Pessoas e Cargos */}
              <Card className="flex flex-col h-[520px]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-900">
                      <Users size={18} className="text-gov-blue" />
                      Pessoas, Cargos & Funções
                    </span>
                    <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 rounded px-1.5 py-0.5 uppercase font-bold">Sem dados pessoais</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Mapeie autoridades, secretários, assessores e fiscais de contratos.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 flex-1 overflow-hidden">
                  {/* Lista */}
                  <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-[150px]">
                    {aiPeople.map((person) => (
                      <div key={person.id} className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-slate-800">{person.name}</span>
                          <span className="text-[10px] text-slate-500 font-semibold">{person.role}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-slate-200/60 text-slate-600 rounded text-[9px] uppercase font-bold">
                            {person.type}
                          </span>
                          <button
                            onClick={() => handleRemovePerson(person.id)}
                            className="text-red-500 hover:bg-red-50 p-1 rounded"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Form */}
                  <form onSubmit={handleAddPerson} className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex flex-col gap-2 mt-auto">
                    <span className="text-[10px] font-bold text-slate-600 uppercase">Novo Vínculo de Autoridade</span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Nome / Designação"
                        value={newPersonName}
                        onChange={(e) => setNewPersonName(e.target.value)}
                        className="p-2 border border-slate-200 rounded text-xs bg-white focus:outline-none focus:border-gov-blue"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Cargo / Relação Oficial"
                        value={newPersonRole}
                        onChange={(e) => setNewPersonRole(e.target.value)}
                        className="p-2 border border-slate-200 rounded text-xs bg-white focus:outline-none focus:border-gov-blue"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={newPersonType}
                        onChange={(e) => setNewPersonType(e.target.value)}
                        className="col-span-2 p-2 border border-slate-200 rounded text-xs bg-white focus:outline-none font-semibold text-slate-700"
                      >
                        <option value="AUTORIDADE">Autoridade (Prefeito/Secretário)</option>
                        <option value="PROCURADOR">Procurador / Jurídico</option>
                        <option value="FISCAL">Fiscal / Gestor de Contrato</option>
                        <option value="FORNECEDOR">Fornecedor / Representante</option>
                      </select>
                      <Button type="submit" size="sm" className="text-xs font-bold" leftIcon={<Plus size={12} />}>
                        Adicionar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* 2. Órgãos e Competências */}
              <Card className="flex flex-col h-[520px]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                    <Building2 size={18} className="text-gov-blue" />
                    Órgãos & Competências
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Defina as competências de secretarias, departamentos e diretorias para guiar o agente.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 flex-1 overflow-hidden">
                  {/* Lista */}
                  <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-[150px]">
                    {aiOrgCompetencies.map((org) => (
                      <div key={org.id} className="flex flex-col gap-1.5 p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-left relative">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-gov-blue uppercase">{org.name}</span>
                          <button
                            onClick={() => handleRemoveOrgCompetency(org.id)}
                            className="text-red-500 hover:bg-red-50 p-1 rounded"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-normal">{org.competency}</p>
                      </div>
                    ))}
                  </div>

                  {/* Form */}
                  <form onSubmit={handleAddOrgCompetency} className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex flex-col gap-2 mt-auto">
                    <span className="text-[10px] font-bold text-slate-600 uppercase">Novo Órgão / Competência</span>
                    <input
                      type="text"
                      placeholder="Sigla ou Nome do Órgão (Ex: PGM)"
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                      className="p-2 border border-slate-200 rounded text-xs bg-white focus:outline-none focus:border-gov-blue"
                      required
                    />
                    <textarea
                      placeholder="Descrição sucinta das competências ou atribuições oficiais..."
                      value={newOrgCompetency}
                      onChange={(e) => setNewOrgCompetency(e.target.value)}
                      className="p-2 border border-slate-200 rounded text-xs bg-white min-h-[50px] focus:outline-none focus:border-gov-blue"
                      required
                    />
                    <Button type="submit" size="sm" className="w-full text-xs" leftIcon={<Plus size={12} />}>
                      Adicionar Competência
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* 3. Legislação & Dispositivos Legais */}
              <Card className="flex flex-col h-[520px]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center justify-between text-slate-900">
                    <span className="flex items-center gap-2">
                      <Scale size={18} className="text-gov-blue" />
                      Legislação & Prevalência
                    </span>
                    <span className="text-[9px] bg-gov-gold/10 text-gov-gold border border-gov-gold/30 rounded px-1.5 py-0.5 uppercase font-bold">Normas Locais Prevalecem</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Dispositivos legais aplicados. Leis municipais anulam regras genéricas em conflito.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 flex-1 overflow-hidden">
                  {/* Lista */}
                  <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-[150px]">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leis Federais Básicas</span>
                    {aiKnowledge.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 text-[11px]">
                        <span className="font-semibold text-slate-700">{item.title}</span>
                        <span className="text-[8px] bg-green-50 text-green-700 font-bold px-1 py-0.5 rounded">FEDERAL</span>
                      </div>
                    ))}
                    
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-2">Normas Municipais Adicionadas</span>
                    {municipalLaws.length === 0 ? (
                      <span className="text-xs text-slate-400 italic text-left">Nenhuma lei municipal ativa na base de apoio.</span>
                    ) : (
                      municipalLaws.map((law) => (
                        <div key={law.id} className="flex justify-between items-start p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                          <div className="flex flex-col gap-0.5 text-left">
                            <span className="font-bold text-slate-800">{law.title}</span>
                            <span className="text-[10px] text-slate-400 line-clamp-1">{law.ementa}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={law.active}
                              onChange={() => handleToggleMunicipalLaw(law.id)}
                              className="rounded border-slate-300 text-gov-blue focus:ring-gov-blue w-3.5 h-3.5"
                            />
                            <button
                              onClick={() => handleRemoveMunicipalLaw(law.id)}
                              className="text-red-500 p-1 hover:bg-red-50 rounded"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Form */}
                  <form onSubmit={handleAddMunicipalLaw} className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex flex-col gap-2 mt-auto">
                    <span className="text-[10px] font-bold text-slate-600 uppercase">Inserir Norma Municipal</span>
                    <input
                      type="text"
                      placeholder="Identificação (Ex: Lei Orgânica, Decreto 45/26)"
                      value={newLawTitle}
                      onChange={(e) => setNewLawTitle(e.target.value)}
                      className="p-2 border border-slate-200 rounded text-xs bg-white focus:outline-none focus:border-gov-blue"
                      required
                    />
                    <textarea
                      placeholder="Dispositivo, artigo ou ementa oficial para indexar no RAG..."
                      value={newLawEmenta}
                      onChange={(e) => setNewLawEmenta(e.target.value)}
                      className="p-2 border border-slate-200 rounded text-xs bg-white min-h-[50px] focus:outline-none focus:border-gov-blue"
                      required
                    />
                    <Button type="submit" size="sm" className="w-full text-xs" leftIcon={<Plus size={12} />}>
                      Adicionar Referência Legal
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* 4. Conhecimento Processual */}
              <Card className="flex flex-col h-[520px]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                    <History size={18} className="text-gov-blue" />
                    Conhecimento Processual
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Registre processos administrativos/judiciais e vincule seus fundamentos jurídicos.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 flex-1 overflow-hidden">
                  {/* Lista */}
                  <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-[150px]">
                    {aiProcesses.map((proc) => (
                      <div key={proc.id} className="flex justify-between items-start p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                        <div className="flex flex-col gap-0.5 text-left">
                          <span className="font-bold text-slate-800">{proc.number}</span>
                          <div className="flex gap-2 mt-0.5">
                            <span className="text-[9px] font-bold text-gov-gold">{proc.phase}</span>
                            {proc.basis && <span className="text-[9px] text-slate-400">Base: {proc.basis}</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveProcess(proc.id)}
                          className="text-red-500 p-1 hover:bg-red-50 rounded shrink-0"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Form */}
                  <form onSubmit={handleAddProcess} className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex flex-col gap-2 mt-auto">
                    <span className="text-[10px] font-bold text-slate-600 uppercase">Novo Processo Associado</span>
                    <input
                      type="text"
                      placeholder="Número do Processo (Ex: Adm. nº 1234/2026)"
                      value={newProcessNumber}
                      onChange={(e) => setNewProcessNumber(e.target.value)}
                      className="p-2 border border-slate-200 rounded text-xs bg-white focus:outline-none focus:border-gov-blue"
                      required
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Fase atual (Ex: Licitação)"
                        value={newProcessPhase}
                        onChange={(e) => setNewProcessPhase(e.target.value)}
                        className="p-2 border border-slate-200 rounded text-xs bg-white focus:outline-none focus:border-gov-blue"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Fundamento legal (Ex: Art. 75)"
                        value={newProcessBasis}
                        onChange={(e) => setNewProcessBasis(e.target.value)}
                        className="p-2 border border-slate-200 rounded text-xs bg-white focus:outline-none focus:border-gov-blue"
                      />
                    </div>
                    <Button type="submit" size="sm" className="w-full text-xs animate-none" leftIcon={<Plus size={12} />}>
                      Vincular Processo
                    </Button>
                  </form>
                </CardContent>
              </Card>

            </div>
          )}

          {/* Subaba 3: Estilo & Linguagem (Configurações Gerais de Texto) */}
          {activeSubTab === 'estilo' && (
            <div className="flex flex-col gap-6">
              <form onSubmit={handleSaveAiSettings} className="flex flex-col gap-6">
                
                {/* Preferências e Terminologia */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <Wrench size={18} className="text-gov-blue" />
                      Linguagem Oficial & Padrões
                    </CardTitle>
                    <CardDescription>
                      Ajuste as expressões preferidas, terminologia administrativa/jurídica e nível de formalidade institucional.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-5">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5 text-left">
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Expressões Preferidas</label>
                        <textarea
                          value={aiLinguagem.expressoesPreferidas}
                          onChange={(e) => setAiLinguagem({ ...aiLinguagem, expressoesPreferidas: e.target.value })}
                          className="p-3 border border-slate-200 rounded-lg text-sm bg-white min-h-[80px] focus:outline-none focus:border-gov-blue"
                          placeholder="Termos prediletos separados por vírgula..."
                        />
                      </div>
                      <div className="flex flex-col gap-1.5 text-left">
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Nível de Formalidade</label>
                        <input
                          type="text"
                          value={aiLinguagem.nivelFormalidade}
                          onChange={(e) => setAiLinguagem({ ...aiLinguagem, nivelFormalidade: e.target.value })}
                          className="p-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-gov-blue"
                          placeholder="Nível de formalidade..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5 text-left">
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Forma de Iniciar Textos</label>
                        <textarea
                          value={aiLinguagem.formaInicio}
                          onChange={(e) => setAiLinguagem({ ...aiLinguagem, formaInicio: e.target.value })}
                          className="p-3 border border-slate-200 rounded-lg text-sm bg-white min-h-[80px] focus:outline-none focus:border-gov-blue"
                          placeholder="Fórmula de abertura..."
                        />
                      </div>
                      <div className="flex flex-col gap-1.5 text-left">
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Forma de Encerramento</label>
                        <textarea
                          value={aiLinguagem.formaFim}
                          onChange={(e) => setAiLinguagem({ ...aiLinguagem, formaFim: e.target.value })}
                          className="p-3 border border-slate-200 rounded-lg text-sm bg-white min-h-[80px] focus:outline-none focus:border-gov-blue"
                          placeholder="Fórmula de fechamento..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5 text-left">
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Terminologia Jurídica Relevante</label>
                        <textarea
                          value={aiLinguagem.terminologiaJuridica}
                          onChange={(e) => setAiLinguagem({ ...aiLinguagem, terminologiaJuridica: e.target.value })}
                          className="p-3 border border-slate-200 rounded-lg text-sm bg-white min-h-[80px] focus:outline-none focus:border-gov-blue"
                          placeholder="Palavras-chave do campo de direito público..."
                        />
                      </div>
                      <div className="flex flex-col gap-1.5 text-left">
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Terminologia Administrativa</label>
                        <textarea
                          value={aiLinguagem.terminologiaAdmin}
                          onChange={(e) => setAiLinguagem({ ...aiLinguagem, terminologiaAdmin: e.target.value })}
                          className="p-3 border border-slate-200 rounded-lg text-sm bg-white min-h-[80px] focus:outline-none focus:border-gov-blue"
                          placeholder="Termos específicos do dia a dia administrativo..."
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Bloco de Preferências Tradicionais de Memória */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-bold">Campos Individuais de Memória do Agente</CardTitle>
                    <CardDescription>
                      Informações de cabeçalho, rodapé e estrutura formal.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-700">Forma de Assinatura Institucional</label>
                        <input
                          type="text"
                          value={aiMemory.formaAssinatura}
                          onChange={(e) => setAiMemory({ ...aiMemory, formaAssinatura: e.target.value })}
                          className="p-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-700">Forma de Citar Leis (Modelo)</label>
                        <input
                          type="text"
                          value={aiMemory.formaCitarLeis}
                          onChange={(e) => setAiMemory({ ...aiMemory, formaCitarLeis: e.target.value })}
                          className="p-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-700">Cabeçalho Geral dos Timbres</label>
                        <input
                          type="text"
                          value={aiMemory.cabecalho}
                          onChange={(e) => setAiMemory({ ...aiMemory, cabecalho: e.target.value })}
                          className="p-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-700">Rodapé Geral de Identificação</label>
                        <input
                          type="text"
                          value={aiMemory.rodape}
                          onChange={(e) => setAiMemory({ ...aiMemory, rodape: e.target.value })}
                          className="p-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-700">Nomes e Termos Recorrentes</label>
                        <input
                          type="text"
                          value={aiMemory.nomesRecorrentes}
                          onChange={(e) => setAiMemory({ ...aiMemory, nomesRecorrentes: e.target.value })}
                          className="p-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-700">Setores Envolvidos Comumente</label>
                        <input
                          type="text"
                          value={aiMemory.setoresEnvolvidos}
                          onChange={(e) => setAiMemory({ ...aiMemory, setoresEnvolvidos: e.target.value })}
                          className="p-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="text-left bg-slate-50 p-4 rounded-xl border border-slate-100 mt-2 flex flex-col gap-2">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <Sparkles size={14} className="text-gov-gold" />
                        Aprendizado por Similaridade (Semelhança)
                      </span>
                      <p className="text-xs text-slate-500 leading-normal">
                        Antes de escrever qualquer nova peça, a IA examina o banco de dados em busca de documentos do mesmo tipo (ofício, decreto, parecer). Ela extrai a estrutura de artigos, a legislação predominante e as assinaturas padrões utilizadas anteriormente pelo setor, gerando um texto adaptado sem copiar integralmente o modelo histórico.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Ações */}
                <div className="flex justify-start">
                  <Button type="submit" isLoading={isSaving} leftIcon={<Save size={16} />}>
                    Salvar Parâmetros de Estilo
                  </Button>
                </div>

              </form>
            </div>
          )}

          {/* Subaba 4: Controle de Qualidade & Correções Aprendidas */}
          {activeSubTab === 'qualidade' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Checklist de Autoavaliação e Qualidade */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <CheckSquare size={18} className="text-gov-blue" />
                      Filtros de Qualidade e Autoavaliação
                    </CardTitle>
                    <CardDescription>
                      Validações internas automáticas executadas pela IA antes de entregar o documento.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-5 text-left">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(aiEvaluation).map(([key, value]) => {
                        const labels: Record<string, string> = {
                          claro: "Análise de clareza textual",
                          formal: "Análise de formalidade oficial",
                          repeticao: "Identificar repetição de termos",
                          erroJuridico: "Identificar erro jurídico formal",
                          contraditorio: "Bloqueio de contradições lógicas",
                          padraoPrefeitura: "Conformidade com padrão da prefeitura",
                          ambiguo: "Identificar ambiguidades interpretativas"
                        };
                        return (
                          <label key={key} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50/50 cursor-pointer transition-all">
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) => setAiEvaluation({ ...aiEvaluation, [key]: e.target.checked })}
                              className="rounded border-slate-300 text-gov-blue focus:ring-gov-blue w-4 h-4"
                            />
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-700">{labels[key]}</span>
                              <span className="text-[9px] text-slate-400">Verificação automática ativa</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    <div className="border-t border-slate-150 pt-4 flex flex-col gap-2">
                      <span className="text-xs font-bold text-slate-800">Processo de Controle de Qualidade Geral:</span>
                      <p className="text-xs text-slate-500 leading-normal">
                        O agente realiza uma varredura cruzada de consistência lógica. Se houver discrepância de datas (ex: prazo menor que o estipulado na lei de licitações), divergência em nomes de cargos municipais ou citações legislativas inexistentes, o sistema emite um alerta explícito no editor propondo as correções adequadas antes da finalização.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Aprendizado das Correções */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <ArrowRightLeft size={18} className="text-gov-blue" />
                      Regras Extraídas de Correções
                    </CardTitle>
                    <CardDescription>
                      Diferenças identificadas entre o documento gerado e o revisado pelo usuário que viraram regras.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4 text-left">
                    <div className="flex flex-col gap-3">
                      {learnedCorrections.map((corr) => (
                        <div key={corr.id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col gap-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-gov-blue">Tipo de Documento: {corr.docType}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">Regra Extraída</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            <div className="p-2 bg-red-50/60 border border-red-100 rounded text-slate-600">
                              <span className="text-[9px] font-bold text-red-700 block mb-0.5">Original Gerado (Descartado):</span>
                              <span className="italic">"{corr.original}"</span>
                            </div>
                            <div className="p-2 bg-green-50/60 border border-green-100 rounded text-slate-700">
                              <span className="text-[9px] font-bold text-green-700 block mb-0.5">Versão Aprovada (Aprendido):</span>
                              <span className="font-semibold">"{corr.corrected}"</span>
                            </div>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            <span className="font-semibold text-slate-700">Motivo do Ajuste: </span>
                            {corr.reason}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Lado Direito: Inteligência e Fluxo */}
              <div className="flex flex-col gap-6">
                <Card className="bg-slate-50 border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-900">
                      <Brain size={18} className="text-gov-blue" />
                      Inteligência e Evolução
                    </CardTitle>
                    <CardDescription>
                      Como o conhecimento é atualizado.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs text-slate-600 leading-normal flex flex-col gap-3 text-left">
                    <p>
                      O conhecimento do Agente nunca é estático. Cada documento aprovado aumenta a base de similaridade; cada nova lei municipal expande o banco jurídico e anula restrições anteriores.
                    </p>
                    <div className="bg-white p-3 rounded-lg border border-slate-150 flex flex-col gap-1 text-[10px] text-slate-500">
                      <span className="font-bold text-slate-700">Validação de Dúvidas:</span>
                      Em caso de contradições graves de legislação ou ausência de dados, a IA não assume fatos; o sistema é instruído a solicitar a intervenção do usuário por meio de alertas.
                    </div>
                  </CardContent>
                </Card>
              </div>

            </div>
          )}

          {/* Subaba 5: Biblioteca de PDFs (RAG) */}
          {activeSubTab === 'biblioteca-rag' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Painel Esquerdo: Lista de PDFs e Árvore de Diretórios (col-span-2) */}
              <div className="xl:col-span-2 flex flex-col gap-6">
                <Card className="flex flex-col h-[650px]">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                        <FolderOpen className="text-gov-blue" size={18} />
                        Biblioteca de Conhecimento Jurídico
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Estrutura oficial de pastas do município. PDFs adicionados são fatiados e indexados no banco vetorial.
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={handleIndexAll} 
                      isLoading={isIndexingAll}
                      size="sm"
                      variant="outline"
                      leftIcon={<RefreshCw size={12} />}
                      className="text-xs shrink-0"
                    >
                      Reindexar Biblioteca
                    </Button>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto flex flex-col gap-4 text-left p-6">
                    {/* Renderização da Árvore de Arquivos */}
                    {knowledgeFiles && knowledgeFiles.children && knowledgeFiles.children.length > 0 ? (
                      <div className="flex flex-col gap-3">
                        {renderFilesStructure(knowledgeFiles)}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                        <FolderOpen size={40} className="stroke-[1.5] text-slate-300" />
                        <span className="text-xs italic">Nenhum arquivo na biblioteca. Carregue um PDF para iniciar.</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Painel Direito: Upload & Simulador de Busca RAG */}
              <div className="flex flex-col gap-6">
                {/* Card de Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                      <Plus className="text-gov-blue" size={16} />
                      Carregar Novo PDF
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Envie arquivos de legislação, manuais ou orientações para alimentar a IA.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-left">
                    <form onSubmit={handleUploadFile} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-600 uppercase">Categoria / Pasta de Destino</label>
                        <select
                          value={uploadCategory}
                          onChange={(e) => setUploadCategory(e.target.value)}
                          className="p-3 border border-slate-200 rounded-lg text-xs bg-white font-semibold text-slate-700 focus:outline-none focus:border-gov-blue"
                        >
                          <option value="Constituição">Constituição / LINDB</option>
                          <option value="Administração Pública">Administração Pública (Leis Gerais)</option>
                          <option value="Acórdãos TCU">Acórdãos TCU (Jurisprudência)</option>
                          
                          <optgroup label="Licitações">
                            <option value="Licitações/Manuais">Manuais de Apoio</option>
                            <option value="Licitações/Perguntas_Respostas">Perguntas e Respostas</option>
                            <option value="Licitações/Notas_Tecnicas">Notas Técnicas</option>
                          </optgroup>

                          <option value="Saúde">Saúde / SUS</option>
                          <option value="Educação">Educação / Diretrizes</option>
                          <option value="Assistência Social">Assistência Social</option>
                          <option value="Meio Ambiente">Meio Ambiente</option>
                          <option value="Eleitoral">Direito Eleitoral</option>
                          <option value="Redação Oficial">Redação Oficial / Manuais</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-600 uppercase">Arquivo PDF</label>
                        <input
                          id="pdf-file-input"
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                          className="p-3 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none w-full"
                          required
                        />
                      </div>

                      <Button type="submit" isLoading={isUploading} className="w-full text-xs font-bold" leftIcon={<Plus size={14} />}>
                        Fazer Upload & Indexar
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Card do Simulador RAG */}
                <Card className="flex-1">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                      <Brain className="text-gov-gold" size={16} />
                      Simulador RAG
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Faça perguntas para testar a busca vetorial e ver trechos recuperados.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-left flex flex-col gap-4">
                    <form onSubmit={handleSearchVector} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ex: dispensa licitação..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 p-2.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-gov-blue"
                        required
                      />
                      <Button type="submit" isLoading={isSearching} size="sm" className="text-xs">
                        Buscar
                      </Button>
                    </form>

                    <div className="flex-1 overflow-y-auto max-h-[250px] flex flex-col gap-3">
                      {searchResults.length > 0 ? (
                        searchResults.map((res, i) => (
                          <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex flex-col gap-1.5 text-[11px]">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-gov-blue">{res.titulo} - {res.artigo}</span>
                              <span className="text-[9px] bg-green-50 text-green-700 font-bold px-1 py-0.5 rounded">
                                {(res.score * 100).toFixed(1)}% relevância
                              </span>
                            </div>
                            <p className="text-slate-600 leading-normal italic">
                              "{res.texto.slice(0, 160)}..."
                            </p>
                          </div>
                        ))
                      ) : searchQuery ? (
                        <span className="text-xs text-slate-400 italic">Nenhum resultado para esta consulta.</span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Digite algo acima para simular a busca.</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
export default Settings;
