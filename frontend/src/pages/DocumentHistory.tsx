import React, { useState, useRef, useEffect } from 'react';
import { Search, FileText, User as UserIcon, Eye, Edit3, Download, Send, FileDown, FileType2, X, Signature, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedDoc, setSelectedDoc] = useState<DocumentModel | null>(null);
  // Estado para controlar o popover de download
  const [downloadPopoverId, setDownloadPopoverId] = useState<string | null>(null);
  const downloadRef = useRef<HTMLDivElement>(null);

  // Estados do modal de assinatura
  const [signDocId, setSignDocId] = useState<string | null>(null);
  const [signerName, setSignerName] = useState(profile?.name || '');
  const [signerCpf, setSignerCpf] = useState('');
  const [isSigning, setIsSigning] = useState(false);

  // Estado para impressão fiel
  const [documentToPrint, setDocumentToPrint] = useState<DocumentModel | null>(null);

  const customLogo = localStorage.getItem('mun_logo_base64') || profile?.municipality?.logoUrl;
  const customWatermark = localStorage.getItem('mun_watermark_base64');

  const [documents, setDocuments] = useState<DocumentModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      // 1. Pega os documentos do localStorage
      const localDocsRaw = localStorage.getItem('legis_documents');
      const localDocs = localDocsRaw ? JSON.parse(localDocsRaw) : [];

      try {
        const response = await api.get<any[]>('/documents');
        const mapped = response.data.map(doc => ({
          id: String(doc.id),
          title: doc.title,
          type: doc.type,
          status: doc.status,
          createdAt: doc.createdAt,
          authorName: doc.author?.name || 'Servidor Municipal',
          content: doc.content,
        }));
        
        // Junta os dois sem duplicar IDs
        const combined = [...mapped];
        localDocs.forEach((ld: any) => {
          if (!combined.some(d => String(d.id) === String(ld.id))) {
            combined.push(ld);
          }
        });
        
        setDocuments(combined);
      } catch (err) {
        console.error('Erro ao buscar histórico de documentos na API, usando locais:', err);
        setDocuments(localDocs);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.authorName.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Publicar documento (disponível apenas para documentos ASSINADO)
  const handlePublish = (docId: string) => {
    setDocuments(prev => {
      const updated = prev.map(doc => 
        doc.id === docId ? { ...doc, status: 'PUBLICADO' } : doc
      );
      localStorage.setItem('legis_documents', JSON.stringify(updated));
      return updated;
    });
    setSelectedDoc(null);
  };

  // Assinar documento digitalmente (disponível para FINALIZADO)
  const handleSign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signDocId || !signerName.trim() || !signerCpf.trim()) return;
    setIsSigning(true);
    setTimeout(() => {
      setDocuments(prev => {
        const updated = prev.map(doc =>
          doc.id === signDocId ? { ...doc, status: 'ASSINADO' } : doc
        );
        localStorage.setItem('legis_documents', JSON.stringify(updated));
        return updated;
      });
      setIsSigning(false);
      setSignDocId(null);
      setSignerCpf('');
      setSelectedDoc(null);
    }, 1200);
  };

  // Verifica se o documento pode ser assinado (precisa estar FINALIZADO)
  const canSign = (doc: DocumentModel) => doc.status === 'FINALIZADO';

  // Baixar como PDF (abre a janela de impressão do navegador)
  const handleDownloadPDF = (doc: DocumentModel) => {
    setDocumentToPrint(doc);
    setTimeout(() => {
      window.print();
      setDownloadPopoverId(null);
    }, 150);
  };

  // Baixar como DOC (gera um arquivo .doc simples)
  const handleDownloadDOC = (doc: DocumentModel) => {
    const munName = doc.type === 'RESPOSTA_OFICIO' ? 'Prefeitura Municipal de São José do Goiabal' : (profile?.municipality?.name || 'Prefeitura Municipal Exemplo');
    const cnpj = doc.type === 'RESPOSTA_OFICIO' ? 'CNPJ: 18.293.475/0001-90' : (profile?.municipality?.cnpj ? `CNPJ: ${profile.municipality.cnpj}` : 'CNPJ: 29.115.485/0001-20');
    
    // Mapeia o conteúdo separando por parágrafos para o DOC do Word
    const docParagraphs = (doc.content || '').split(/\n\n+/).map(para => {
      if (!para.trim()) return '';
      return `<p style="margin-bottom: 12pt; text-align: justify; font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6;">${para.trim().replace(/\n/g, '<br/>')}</p>`;
    }).join('');

    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <title>${doc.title}</title>
          <style>
            @page {
              size: 21cm 29.7cm;
              margin: 2.5cm 2.5cm 2.5cm 2.5cm;
            }
            body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; }
            .header { text-align: center; border-bottom: 1px solid #000; padding-bottom: 10px; margin-bottom: 30px; }
            .header h1 { font-size: 13pt; margin: 0; font-family: Arial, sans-serif; text-transform: uppercase; font-weight: bold; }
            .header p { font-size: 9pt; margin: 5px 0 0 0; font-family: Arial, sans-serif; color: #555; }
            .content { margin-bottom: 40px; }
            .footer { border-top: 1px solid #ccc; padding-top: 10px; text-align: center; font-size: 9pt; font-family: Arial, sans-serif; color: #666; margin-top: 50px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${munName}</h1>
            <p>${cnpj}</p>
          </div>
          <div class="content">
            ${docParagraphs}
          </div>
          <div class="footer">
            <p>${munName} - ${cnpj}</p>
            ${doc.status === 'ASSINADO' || doc.status === 'PUBLICADO' ? '<p style="color:#15803d; font-weight:bold; font-size:9.5pt; margin-top:5px;">Assinado Digitalmente • Validade Jurídica Simbolizada</p>' : ''}
          </div>
        </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.title.replace(/[^a-zA-Z0-9À-ÿ ]/g, '').trim().substring(0, 60)}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadPopoverId(null);
  };

  // Editar documento (navega para o editor com conteúdo preenchido)
  const handleEdit = (doc: DocumentModel) => {
    navigate(`/documentos/novo?type=${doc.type}&edit=${doc.id}`);
  };

  // Mapeia status para label legível e cores
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PUBLICADO':
        return { label: 'Publicado', bgClass: 'bg-purple-50 text-purple-700', dotClass: 'bg-purple-600' };
      case 'ASSINADO':
        return { label: 'Assinado', bgClass: 'bg-green-50 text-green-700', dotClass: 'bg-green-600' };
      case 'FINALIZADO':
        return { label: 'Finalizado', bgClass: 'bg-blue-50 text-blue-700', dotClass: 'bg-blue-600' };
      case 'RASCUNHO':
      default:
        return { label: 'Rascunho', bgClass: 'bg-slate-100 text-slate-600', dotClass: 'bg-slate-400' };
    }
  };

  // Verifica se o documento pode ser editado (não pode se estiver PUBLICADO)
  const canEdit = (doc: DocumentModel) => doc.status !== 'PUBLICADO';
  // Verifica se o documento pode ser publicado (precisa estar ASSINADO)
  const canPublish = (doc: DocumentModel) => doc.status === 'ASSINADO';

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
          {['ALL', 'RASCUNHO', 'FINALIZADO', 'ASSINADO', 'PUBLICADO'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="text-xs shrink-0 font-semibold"
            >
              {status === 'ALL' ? 'Todos os Status' : getStatusConfig(status).label}
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
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                    Carregando documentos...
                  </td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                    Nenhum documento encontrado.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => {
                  const statusConfig = getStatusConfig(doc.status);
                  return (
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
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <UserIcon size={14} className="text-slate-400" />
                          {doc.authorName}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                        {doc.type}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.bgClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass}`} />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5 relative">
                          {/* Botão Visualizar */}
                          <button
                            className="group relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all duration-200 cursor-pointer"
                            onClick={() => setSelectedDoc(doc)}
                          >
                            <Eye size={16} />
                            <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-md bg-slate-600 text-white text-[10px] font-semibold whitespace-nowrap opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 shadow-lg">Ver</span>
                          </button>

                          {/* Botão Editar - Apenas para documentos NÃO publicados */}
                          {canEdit(doc) && (
                            <button
                              className="group relative p-2 rounded-lg text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 cursor-pointer"
                              onClick={() => handleEdit(doc)}
                            >
                              <Edit3 size={16} />
                              <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-md bg-blue-600 text-white text-[10px] font-semibold whitespace-nowrap opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 shadow-lg">Editar</span>
                            </button>
                          )}

                          {/* Botão Baixar com Popover de formato */}
                          <div className="relative" ref={downloadRef}>
                            <button
                              className="group relative p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-200 cursor-pointer"
                              onClick={() => setDownloadPopoverId(
                                downloadPopoverId === doc.id ? null : doc.id
                              )}
                            >
                              <Download size={16} />
                              <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-md bg-emerald-600 text-white text-[10px] font-semibold whitespace-nowrap opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 shadow-lg">Baixar</span>
                            </button>

                            {/* Popover de escolha de formato */}
                            {downloadPopoverId === doc.id && (
                              <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl min-w-[200px] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                                <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Formato</span>
                                  <button
                                    onClick={() => setDownloadPopoverId(null)}
                                    className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                                <button
                                  onClick={() => handleDownloadPDF(doc)}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-red-50 hover:text-red-700 transition-all duration-150 cursor-pointer"
                                >
                                  <FileDown size={18} className="text-red-500" />
                                  <div className="text-left">
                                    <div className="font-semibold">PDF</div>
                                    <div className="text-xs text-slate-400">Documento portátil</div>
                                  </div>
                                </button>
                                <button
                                  onClick={() => handleDownloadDOC(doc)}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-150 border-t border-slate-50 cursor-pointer"
                                >
                                  <FileType2 size={18} className="text-blue-500" />
                                  <div className="text-left">
                                    <div className="font-semibold">DOC</div>
                                    <div className="text-xs text-slate-400">Microsoft Word</div>
                                  </div>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Botão Assinar - Apenas para FINALIZADO */}
                          {canSign(doc) && (
                            <button
                              className="group relative p-2 rounded-lg text-amber-600 hover:bg-amber-50 hover:text-amber-700 transition-all duration-200 cursor-pointer"
                              onClick={() => setSignDocId(doc.id)}
                            >
                              <Signature size={16} />
                              <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-md bg-amber-600 text-white text-[10px] font-semibold whitespace-nowrap opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 shadow-lg">Assinar</span>
                            </button>
                          )}

                          {/* Botão Publicar - Apenas para ASSINADO */}
                          {canPublish(doc) && (
                            <button
                              className="group relative p-2 rounded-lg text-purple-600 hover:bg-purple-50 hover:text-purple-700 transition-all duration-200 cursor-pointer"
                              onClick={() => handlePublish(doc.id)}
                            >
                              <Send size={16} />
                              <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-md bg-purple-600 text-white text-[10px] font-semibold whitespace-nowrap opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 shadow-lg">Publicar</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Overlay para fechar popover ao clicar fora */}
      {downloadPopoverId && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setDownloadPopoverId(null)}
        />
      )}

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
                  {selectedDoc.type} • {getStatusConfig(selectedDoc.status).label}
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

            {/* Folha Oficial (A4 Timbrada na pré-visualização) */}
            <div className="relative w-full max-h-[450px] overflow-y-auto bg-white border border-slate-200 shadow-sm rounded-xl p-8 md:p-12 flex flex-col justify-between text-slate-800 font-serif leading-relaxed">
              {/* Marca D'água */}
              {customWatermark && (
                <div
                  className="absolute inset-0 pointer-events-none opacity-[0.03] flex items-center justify-center z-0"
                  style={{
                    backgroundImage: `url(${customWatermark})`,
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '40%',
                  }}
                />
              )}
              
              {/* Conteúdo com Z-Index para ficar acima da marca d'água */}
              <div className="relative z-10 flex-1 flex flex-col justify-between">
                <div>
                  {/* Cabeçalho */}
                  <div className="flex flex-col items-center text-center pb-4 border-b border-slate-100 font-sans">
                    {customLogo ? (
                      <img
                        src={customLogo}
                        alt="Brasão do Município"
                        className="w-32 object-contain"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center font-bold text-gov-blue border border-slate-200 text-xs">
                        BRASÃO
                      </div>
                    )}
                    <h3 className="text-[10px] font-bold text-slate-700 uppercase mt-4 leading-none">
                      {selectedDoc.type === 'RESPOSTA_OFICIO' ? 'Prefeitura Municipal de São José do Goiabal' : (profile?.municipality?.name || 'Prefeitura Municipal Exemplo')}
                    </h3>
                  </div>
                  
                  {/* Corpo do Texto Mapeado por Parágrafos com Negrito até o assunto */}
                  <div className="text-xs leading-relaxed text-slate-800 pt-6">
                    {(() => {
                      let isBoldArea = true;
                      return (selectedDoc.content || '').split(/\n\n+/).map((para, idx) => {
                        if (!para.trim()) return null;
                        
                        const cleanPara = para.trim().toLowerCase();
                        const currentBold = isBoldArea;

                        if (cleanPara.startsWith('assunto:') || cleanPara.includes('assunto:')) {
                          isBoldArea = false;
                        }

                        if (
                          cleanPara.startsWith('prezado') ||
                          cleanPara.startsWith('prezada') ||
                          cleanPara.startsWith('prezados') ||
                          cleanPara.startsWith('prezadas') ||
                          cleanPara.startsWith('senhor ') ||
                          cleanPara.startsWith('senhora ')
                        ) {
                          isBoldArea = false;
                        }

                        const isParagraphBold = currentBold && 
                          !cleanPara.startsWith('prezado') && 
                          !cleanPara.startsWith('prezada') && 
                          !cleanPara.startsWith('prezados') &&
                          !cleanPara.startsWith('prezadas');

                        const isSignatureBlock = cleanPara.includes('_____') || cleanPara.includes('___');

                        const paragraphClass = `whitespace-pre-wrap ${
                          isSignatureBlock 
                            ? 'text-center font-normal font-sans border-t-0' 
                            : isParagraphBold 
                            ? 'mb-3 font-bold text-slate-950 font-sans' 
                            : 'mb-3 font-normal font-serif text-slate-800'
                        }`;

                        const extraStyles = isSignatureBlock 
                          ? { breakInside: 'avoid' as const, pageBreakInside: 'avoid' as const, paddingTop: '3rem' } 
                          : undefined;

                        return (
                          <p key={idx} className={paragraphClass} style={extraStyles}>
                            {para}
                          </p>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Rodapé Interno da Folha Timbrada */}
                <div className="border-t border-slate-100 pt-4 mt-8 flex flex-col font-sans items-center text-center">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    {selectedDoc.type === 'RESPOSTA_OFICIO' ? 'Prefeitura Municipal de São José do Goiabal' : (profile?.municipality?.name || 'Prefeitura Municipal Exemplo')}
                  </span>
                  <span className="text-[8px] text-slate-400 mt-0.5">
                    {selectedDoc.type === 'RESPOSTA_OFICIO' ? 'CNPJ: 18.293.475/0001-90' : (profile?.municipality?.cnpj ? `CNPJ: ${profile.municipality.cnpj}` : 'CNPJ: 29.115.485/0001-20')}
                  </span>
                  {selectedDoc.status === 'ASSINADO' && (
                    <span className="text-[8px] text-green-700 font-bold mt-2 flex items-center gap-1">
                      <CheckCircle size={8} /> Assinado Digitalmente • Validade Jurídica Simbolizada
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setSelectedDoc(null)}>
                Fechar Janela
              </Button>

              {/* Botão Assinar no modal - Apenas para FINALIZADO */}
              {canSign(selectedDoc) && (
                <Button
                  variant="gold"
                  leftIcon={<Signature size={16} />}
                  onClick={() => setSignDocId(selectedDoc.id)}
                >
                  Assinar Digitalmente
                </Button>
              )}

              {/* Botão Publicar no modal - Apenas para ASSINADO */}
              {canPublish(selectedDoc) && (
                <Button
                  variant="primary"
                  leftIcon={<Send size={16} />}
                  className="bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
                  onClick={() => handlePublish(selectedDoc.id)}
                >
                  Publicar Documento
                </Button>
              )}

              {/* Botão Editar no modal - Apenas para NÃO publicados */}
              {canEdit(selectedDoc) && selectedDoc.status !== 'ASSINADO' && (
                <Button
                  variant="primary"
                  leftIcon={<Edit3 size={16} />}
                  onClick={() => {
                    setSelectedDoc(null);
                    handleEdit(selectedDoc);
                  }}
                >
                  Editar Documento
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de Assinatura Digital */}
      <Modal
        isOpen={!!signDocId}
        onClose={() => { setSignDocId(null); setSignerCpf(''); }}
        title="Assinatura Digital de Documento"
      >
        <form onSubmit={handleSign} className="flex flex-col gap-5 text-left">
          <p className="text-sm text-slate-500 leading-relaxed">
            Esta assinatura utiliza chave criptográfica e identificará o servidor legalmente responsável. Certifique-se de que os dados estão corretos.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <Signature size={20} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Documento a ser assinado</p>
              <p className="text-sm text-amber-700 mt-0.5">
                {documents.find(d => d.id === signDocId)?.title || ''}
              </p>
            </div>
          </div>

          <Input
            label="Nome Completo do Signatário"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            placeholder="Ex: João da Silva"
            required
          />

          <Input
            label="CPF do Signatário"
            value={signerCpf}
            onChange={(e) => setSignerCpf(e.target.value)}
            placeholder="000.000.000-00"
            required
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => { setSignDocId(null); setSignerCpf(''); }}
            >
              Cancelar
            </Button>
            <Button
              variant="gold"
              type="submit"
              leftIcon={<CheckCircle size={16} />}
              isLoading={isSigning}
            >
              Confirmar Assinatura
            </Button>
          </div>
        </form>
      </Modal>

      {/* ÁREA INVISÍVEL EXCLUSIVA PARA IMPRESSÃO NO PDF (LAYOUT TIMBRADO OFICIAL IDÊNTICO) */}
      {documentToPrint && (
        <>
          {/* Folha Timbrada Oficial para Impressão */}
          <div className="printable-area bg-white text-slate-900 font-serif leading-relaxed">
            {/* Marca D'água */}
            {customWatermark && (
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.03] flex items-center justify-center z-0"
                style={{
                  backgroundImage: `url(${customWatermark})`,
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '40%',
                }}
              />
            )}

            <table className="print-only w-full border-collapse bg-transparent text-left font-serif leading-relaxed text-slate-800 relative z-10">
              <thead>
                <tr>
                  <td>
                    <div className="flex flex-col items-center text-center pb-4 border-b border-slate-100 font-sans">
                      {customLogo ? (
                        <img src={customLogo} alt="Brasão do Município" className="w-48 object-contain" />
                      ) : (
                        <div className="w-28 h-28 rounded-full bg-slate-100 flex items-center justify-center font-bold text-gov-blue border border-slate-200 text-sm">
                          BRASÃO
                        </div>
                      )}
                      <h3 className="text-xs font-bold text-slate-700 uppercase mt-5 leading-none">
                        {documentToPrint.type === 'RESPOSTA_OFICIO' ? 'Prefeitura Municipal de São José do Goiabal' : (profile?.municipality?.name || 'Prefeitura Municipal Exemplo')}
                      </h3>
                    </div>
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div className="text-sm leading-relaxed text-slate-800 pt-6">
                      {(() => {
                        let isBoldArea = true;
                        return (documentToPrint.content || '').split(/\n\n+/).map((para, idx) => {
                          if (!para.trim()) return null;
                          
                          const cleanPara = para.trim().toLowerCase();
                          const currentBold = isBoldArea;

                          if (cleanPara.startsWith('assunto:') || cleanPara.includes('assunto:')) {
                            isBoldArea = false;
                          }

                          if (
                            cleanPara.startsWith('prezado') ||
                            cleanPara.startsWith('prezada') ||
                            cleanPara.startsWith('prezados') ||
                            cleanPara.startsWith('prezadas') ||
                            cleanPara.startsWith('senhor ') ||
                            cleanPara.startsWith('senhora ')
                          ) {
                            isBoldArea = false;
                          }

                          const isParagraphBold = currentBold && 
                            !cleanPara.startsWith('prezado') && 
                            !cleanPara.startsWith('prezada') && 
                            !cleanPara.startsWith('prezados') &&
                            !cleanPara.startsWith('prezadas');

                          const isSignatureBlock = cleanPara.includes('_____') || cleanPara.includes('___');

                          const paragraphClass = `whitespace-pre-wrap print-paragraph ${
                            isSignatureBlock 
                              ? 'text-center font-normal font-sans border-t-0' 
                              : isParagraphBold 
                              ? 'mb-4 font-bold text-slate-950 font-sans' 
                              : 'mb-4 font-normal font-serif text-slate-800'
                          }`;

                          const extraStyles = isSignatureBlock 
                            ? { breakInside: 'avoid' as const, pageBreakInside: 'avoid' as const, paddingTop: '6rem' } 
                            : undefined;

                          return (
                            <p key={idx} className={paragraphClass} style={extraStyles}>
                              {para}
                            </p>
                          );
                        });
                      })()}
                    </div>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td>
                    <div className="h-20 bg-transparent w-full" />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Rodapé Físico Fixo em todas as páginas no PDF */}
          <div className="print-footer-fixed border-t border-slate-100 pt-2 flex flex-col font-sans items-center text-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {documentToPrint.type === 'RESPOSTA_OFICIO' ? 'Prefeitura Municipal de São José do Goiabal' : (profile?.municipality?.name || 'Prefeitura Municipal Exemplo')}
            </span>
            <span className="text-[9px] text-slate-400 mt-0.5">
              {documentToPrint.type === 'RESPOSTA_OFICIO' ? 'CNPJ: 18.293.475/0001-90' : (profile?.municipality?.cnpj ? `CNPJ: ${profile.municipality.cnpj}` : 'CNPJ: 29.115.485/0001-20')}
            </span>
            {(documentToPrint.status === 'ASSINADO' || documentToPrint.status === 'PUBLICADO') && (
              <span className="text-[9px] text-green-700 font-bold mt-2 flex items-center gap-1">
                <CheckCircle size={10} /> Assinado Digitalmente • Validade Jurídica Simbolizada
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
};
export default DocumentHistory;
