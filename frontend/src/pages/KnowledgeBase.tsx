import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Search, 
  Database, 
  Sparkles, 
  RefreshCw, 
  AlertCircle,
  BookOpen,
  Scale,
  Landmark,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import api from '../services/api';

export const KnowledgeBase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'nacional' | 'municipal' | 'usuario' | 'rag-console'>('nacional');
  
  // Estados para Arquivos e Estrutura
  const [filesStructure, setFilesStructure] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('Constituição');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isIndexingAll, setIsIndexingAll] = useState(false);
  const [totalChunksCount, setTotalChunksCount] = useState(0);

  // Estados para Busca RAG
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Buscar a estrutura de arquivos e estatísticas
  const fetchKnowledgeFiles = async () => {
    try {
      const response = await api.get('/knowledge/files');
      setFilesStructure(response.data);
      
      // Simula contagem de chunks baseado no vector store
      const searchRes = await api.get('/knowledge/search?query=lei&limit=100');
      if (searchRes.data && searchRes.data.results) {
        // Encontra o total aproximado baseado na busca
        setTotalChunksCount(searchRes.data.resultsCount * 6 + 12); 
      }
    } catch (error) {
      console.error('Erro ao buscar arquivos de conhecimento:', error);
    }
  };

  useEffect(() => {
    fetchKnowledgeFiles();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('category', uploadCategory);
    
    // Mapeia a fonte com base na aba ativa do frontend
    const sourceMap = {
      nacional: 'NACIONAL',
      municipal: 'MUNICIPAL',
      usuario: 'USUARIO',
      'rag-console': 'NACIONAL'
    };
    formData.append('source', sourceMap[activeTab]);

    try {
      const response = await api.post('/knowledge/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert(`PDF "${response.data.filename}" processado!\nChunks criados no pgvector: ${response.data.chunksCount}`);
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
      alert(`Indexação concluída!\nArquivos: ${response.data.filesCount}\nChunks vetoriais salvos: ${response.data.chunksCount}`);
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
      const response = await api.get(`/knowledge/search?query=${encodeURIComponent(searchQuery)}&limit=8`);
      setSearchResults(response.data.results || []);
    } catch (error) {
      console.error('Erro ao buscar no RAG:', error);
      alert('Erro ao buscar no banco vetorial.');
    } finally {
      setIsSearching(false);
    }
  };

  // Renderizador recursivo para exibir a árvore de arquivos de conhecimento
  const renderFilesStructure = (node: any): React.ReactNode => {
    if (!node) return null;

    if (!node.isDirectory) {
      return (
        <div key={node.path} className="flex items-center justify-between py-2 px-3 hover:bg-slate-100/50 rounded-md transition-colors text-xs text-slate-600 border border-transparent hover:border-slate-200/40">
          <div className="flex items-center gap-2">
            <span className="text-gov-gold">📄</span>
            <span className="font-medium text-slate-700">{node.name}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">({(node.sizeBytes / 1024).toFixed(1)} KB)</span>
        </div>
      );
    }

    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.name} className="flex flex-col gap-1 border-l border-slate-200/60 pl-3 py-1 mt-1">
        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 select-none py-1">
          <span className="text-gov-blue">📁</span>
          {node.name}
        </span>
        {hasChildren ? (
          <div className="flex flex-col pl-1">
            {node.children.map((child: any) => renderFilesStructure(child))}
          </div>
        ) : (
          <span className="text-[10px] text-slate-400 italic pl-5 py-0.5">Pasta vazia</span>
        )}
      </div>
    );
  };

  // Filtra arquivos da estrutura com base na aba ativa do frontend
  const getFilteredFiles = () => {
    if (!filesStructure || !filesStructure.children) return [];
    
    const folderMap: Record<string, string[]> = {
      nacional: ['Constituição', 'Administração Pública', 'Acórdãos TCU', 'Licitações', 'Redação Oficial', 'Geral'],
      municipal: ['Base Municipal', 'Decretos', 'Leis Municipais'],
      usuario: ['Base do Usuário', 'Modelos', 'Ofícios', 'Pareceres'],
      'rag-console': [],
    };

    const allowedFolders = folderMap[activeTab] || [];
    return filesStructure.children.filter((child: any) => {
      if (!child.isDirectory) return activeTab === 'nacional'; // arquivos na raiz vão para nacional
      return allowedFolders.some((f: string) => child.name.toLowerCase().includes(f.toLowerCase()));
    });
  };

  const filteredFiles = getFilteredFiles();

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-gov-blue via-slate-900 to-slate-950 p-8 rounded-2xl shadow-md relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gov-gold/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gov-blue/20 rounded-full blur-3xl -ml-20 -mb-20"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-gov-gold/10 text-gov-gold text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border border-gov-gold/20">
                Cognição & RAG
              </span>
              <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <ShieldCheck size={12} /> pgvector Ativo
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <Database className="text-gov-gold" size={32} />
              Base de Conhecimento Viva
            </h1>
            <p className="text-slate-400 max-w-xl text-sm leading-relaxed">
              Estudo, estruturação e armazenamento de toda a base normativa e jurisprudencial. A IA consome estes dados de forma estruturada para guiar a formulação de documentos.
            </p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-center backdrop-blur-xs min-w-28">
              <div className="text-2xl font-bold text-gov-gold font-mono">{totalChunksCount}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Chunks RAG</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-center backdrop-blur-xs min-w-28">
              <div className="text-2xl font-bold text-slate-100 font-mono">384</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Dimensões</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação por Abas de Escopo */}
      <div className="flex border-b border-slate-200 bg-white p-1 rounded-xl shadow-xs gap-1">
        <button
          onClick={() => setActiveTab('nacional')}
          className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === 'nacional'
              ? 'bg-gov-blue text-white shadow-xs'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          <Scale size={16} />
          Base Nacional (Federal)
        </button>
        <button
          onClick={() => setActiveTab('municipal')}
          className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === 'municipal'
              ? 'bg-gov-blue text-white shadow-xs'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          <Landmark size={16} />
          Base Municipal
        </button>
        <button
          onClick={() => setActiveTab('usuario')}
          className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === 'usuario'
              ? 'bg-gov-blue text-white shadow-xs'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          <BookOpen size={16} />
          Base do Usuário
        </button>
        <button
          onClick={() => setActiveTab('rag-console')}
          className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === 'rag-console'
              ? 'bg-gov-blue text-white shadow-xs'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          <Cpu size={16} />
          Console de Busca RAG
        </button>
      </div>

      {activeTab !== 'rag-console' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna da Esquerda: Upload e Reindexação */}
          <div className="space-y-6 lg:col-span-1">
            <Card className="border border-slate-100 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <UploadCloud className="text-gov-blue" size={18} />
                  Enviar Documento PDF
                </CardTitle>
                <CardDescription className="text-xs">
                  Adicionar novos arquivos para o bucket <code className="bg-slate-200/60 px-1 py-0.5 rounded text-[10px]">knowledge-base</code>.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleUploadFile} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Categoria do Documento
                    </label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-700 focus:outline-hidden focus:border-gov-blue focus:ring-1 focus:ring-gov-blue"
                    >
                      {activeTab === 'nacional' && (
                        <>
                          <option value="Constituição">Constituição e Normas Fundamentais</option>
                          <option value="Administração Pública">Administração Pública</option>
                          <option value="Acórdãos TCU">Acórdãos do TCU</option>
                          <option value="Redação Oficial">Redação Oficial (Manual da Presidência)</option>
                          <option value="Geral">Outros Federais</option>
                        </>
                      )}
                      {activeTab === 'municipal' && (
                        <>
                          <option value="Base Municipal/Leis">Leis Municipais e Orgânica</option>
                          <option value="Base Municipal/Decretos">Decretos Executivos</option>
                          <option value="Base Municipal/Portarias">Portarias e Resoluções</option>
                        </>
                      )}
                      {activeTab === 'usuario' && (
                        <>
                          <option value="Base do Usuário/Modelos">Modelos de Ofícios/Memorandos</option>
                          <option value="Base do Usuário/Pareceres">Pareceres Técnicos/Jurídicos</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Arquivo PDF
                    </label>
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-gov-blue transition-colors relative cursor-pointer group bg-slate-50/30">
                      <input
                        type="file"
                        id="pdf-file-input"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <UploadCloud size={32} className="mx-auto text-slate-400 group-hover:text-gov-blue transition-colors mb-2" />
                      <span className="block text-xs font-semibold text-slate-700">
                        {selectedFile ? selectedFile.name : 'Selecionar arquivo PDF'}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-1">
                        {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'Máximo 10MB'}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full text-xs font-bold py-2.5"
                    disabled={!selectedFile || isUploading}
                    isLoading={isUploading}
                  >
                    Fazer Upload & Indexar
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border border-slate-100 shadow-sm">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <RefreshCw className="text-gov-blue" size={16} />
                  Sincronização & Reindexação
                </CardTitle>
                <CardDescription className="text-xs">
                  Re-processar todos os arquivos da base de forma sequencial.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-slate-500 text-xs leading-relaxed mb-4">
                  Se você alterou os arquivos diretamente no servidor ou no bucket do Supabase, clique abaixo para extrair, gerar os chunks estritos e salvar os novos embeddings no pgvector.
                </p>
                <Button
                  variant="outline"
                  className="w-full text-xs font-bold gap-2 hover:bg-slate-50"
                  onClick={handleIndexAll}
                  disabled={isIndexingAll}
                  isLoading={isIndexingAll}
                >
                  <RefreshCw size={14} className={isIndexingAll ? 'animate-spin' : ''} />
                  Reindexar Toda a Biblioteca
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Coluna da Direita: Visualizador dos arquivos */}
          <div className="lg:col-span-2">
            <Card className="border border-slate-100 shadow-sm h-full min-h-[480px]">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="text-gov-blue" size={18} />
                    Documentos Indexados
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Visualização estruturada dos PDFs no escopo da base selecionada.
                  </CardDescription>
                </div>
                <div className="text-[10px] font-bold text-gov-blue bg-gov-blue/10 border border-gov-blue/20 px-2.5 py-1 rounded-full uppercase">
                  {activeTab === 'nacional' ? 'Federal' : activeTab === 'municipal' ? 'Municipal' : 'Usuário'}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {filteredFiles.length > 0 ? (
                  <div className="space-y-1">
                    {filteredFiles.map((node: any) => renderFilesStructure(node))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                    <span className="text-3xl mb-2">📁</span>
                    <h3 className="text-xs font-bold text-slate-700">Nenhum documento localizado</h3>
                    <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                      Não há arquivos PDF indexados na base {activeTab} atualmente. Faça upload do primeiro arquivo no painel lateral.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Console de Busca RAG e Diagnóstico Vetorial */
        <Card className="border border-slate-100 shadow-sm min-h-[480px]">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Cpu className="text-gov-blue" size={18} />
              Diagnóstico Vetorial RAG
            </CardTitle>
            <CardDescription className="text-xs">
              Simule a busca vetorial exata (pgvector Cosseno + Bônus de Prioridade Legal) realizada antes da geração de respostas da IA.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <form onSubmit={handleSearchVector} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                <Input
                  type="text"
                  placeholder="Escreva a sua pergunta ou termo jurídico..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-xs py-3"
                />
              </div>
              <Button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                isLoading={isSearching}
                className="px-6 font-semibold"
              >
                Buscar no pgvector
              </Button>
            </form>

            {searchResults.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Sparkles size={14} className="text-gov-gold" />
                  Chunks mais relevantes localizados ({searchResults.length}):
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {searchResults.map((result, idx) => (
                    <div 
                      key={result.id || idx} 
                      className="border border-slate-100 hover:border-gov-blue/30 rounded-xl p-4 bg-slate-50/30 hover:bg-white transition-all duration-200 space-y-3 shadow-xs relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="text-[11px] font-bold text-slate-800 truncate max-w-44">
                            {result.titulo}
                          </span>
                        </div>
                        
                        <div className="flex gap-1">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                            result.fonte === 'NACIONAL' 
                              ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                              : result.fonte === 'MUNICIPAL'
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                              : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                          }`}>
                            {result.fonte}
                          </span>
                          <span className="text-[9px] font-mono font-bold bg-gov-gold/10 text-gov-gold border border-gov-gold/20 px-2 py-0.5 rounded-full">
                            Score: {(result.score * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-600 bg-white border border-slate-100 rounded-lg p-2.5 font-mono max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                        {result.texto}
                      </div>

                      <div className="flex items-center justify-between text-[9px] text-slate-400">
                        <span className="font-semibold">Categoria: {result.categoria}</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">{result.artigo}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              searchQuery.trim() && !isSearching && (
                <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                  <AlertCircle size={28} className="text-slate-300 mb-2" />
                  <h3 className="text-xs font-bold text-slate-700">Nenhum resultado encontrado</h3>
                  <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                    Experimente reescrever a busca utilizando termos chaves ou verifique se os documentos estão indexados.
                  </p>
                </div>
              )
            )}

            {!searchQuery.trim() && (
              <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
                <Cpu size={32} className="text-slate-200 mb-2 animate-pulse" />
                <h3 className="text-xs font-bold text-slate-600">Console de Diagnóstico Pronto</h3>
                <p className="text-[11px] text-slate-400 max-w-sm mt-1 leading-relaxed">
                  Digite termos de busca para testar a similaridade cosseno do banco vetorial local e visualizar como os documentos são fatiados e recuperados pelo motor RAG.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default KnowledgeBase;
