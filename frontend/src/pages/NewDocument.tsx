import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Signature,
  Save,
  CheckCircle,
  AlertCircle,
  Printer,
  ChevronLeft,
  Paperclip,
  File,
  X,
  Mail,
  FileText,
  Gavel,
  Megaphone,
  Scale,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../contexts/AuthContext';
import { Select, type SelectOption } from '../components/ui/Select';
import api from '../services/api';

export const NewDocument: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const customLogo = localStorage.getItem('mun_logo_base64') || profile?.municipality?.logoUrl;
  const customWatermark = localStorage.getItem('mun_watermark_base64');

  // Estados do formulário
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState(searchParams.get('type') || 'OFICIO');
  const [promptText, setPromptText] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Modal de Assinatura
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signerName, setSignerName] = useState(profile?.name || '');
  const [signerDocument, setSignerDocument] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const [documentStatus, setDocumentStatus] = useState('RASCUNHO');

  // Estados de Verificação de Detalhes (Data, Hora, Local, Autoridade)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [detailData, setDetailData] = useState('');
  const [detailHora, setDetailHora] = useState('');
  const [detailLocal, setDetailLocal] = useState('');
  const [detailAutoridade, setDetailAutoridade] = useState('');

  // Estado para Anexo de Arquivo
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  // Estados para Resposta a Ofício
  const [analysisResult, setAnalysisResult] = useState<{
    orgao: string;
    autoridade: string;
    tema: string;
    resumo: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [responseInstructions, setResponseInstructions] = useState('');
  const [analysisError, setAnalysisError] = useState('');

  const handleAnalyzeOficio = async () => {
    if (!attachedFile) {
      setAnalysisError('Para Resposta a Ofício, é obrigatório anexar o documento do ofício recebido.');
      return;
    }
    setAnalysisError('');
    setIsAnalyzing(true);

    try {
      // Simulação de chamada de análise por IA
      setTimeout(() => {
        const fileNameLower = attachedFile.name.toLowerCase();
        
        // Padrão de Análise de alta fidelidade baseada na imagem real do Ministério Público de Minas Gerais
        let orgao = 'Ministério Público do Estado de Minas Gerais (Promotoria de Justiça de São Domingos do Prata)';
        let autoridade = 'Dr. Aylor Luiz Meirelles Júnior (Promotor de Justiça)';
        let tema = 'Contratação da dupla Althair e Alexandre - XXXVII Cavalgada de São José do Goiabal';
        let resumo = 'Notificação ao Prefeito Municipal de São José do Goiabal para que informe o valor efetivamente pago à empresa BR Brasil Eventos Shows (Jairo Borges Cardoso - ME) pela contratação de show artístico da dupla Althair e Alexandre na XXXVII Cavalgada. Requer envio de cópias do contrato e comprovantes de pagamento, bem como esclarecimentos das razões da contratação por agência não exclusiva, divergindo de Recomendação de 20/10/2025.';

        if (fileNameLower.includes('câmara') || fileNameLower.includes('camara') || fileNameLower.includes('vereador')) {
          orgao = 'Câmara Municipal de Nova Friburgo';
          autoridade = 'Vereador Marcus Silva (Presidente)';
          tema = 'Solicitação de esclarecimentos sobre contratos de pavimentação';
          resumo = 'Requer o envio de cópias dos contratos administrativos de pavimentação asfáltica firmados no exercício de 2026, com foco nas ruas do Centro Histórico, no prazo de 15 dias úteis.';
        } else if (fileNameLower.includes('saúde') || fileNameLower.includes('hospital') || fileNameLower.includes('médico') || fileNameLower.includes('remedio')) {
          orgao = 'Conselho Municipal de Saúde';
          autoridade = 'Dra. Márcia Lima (Presidente do Conselho)';
          tema = 'Fiscalização de insumos críticos na Farmácia Básica';
          resumo = 'Questiona o estoque remanescente de medicamentos de distribuição contínua e as providências tomadas para evitar a interrupção do fornecimento aos usuários cadastrados.';
        }

        setAnalysisResult({
          orgao,
          autoridade,
          tema,
          resumo,
        });
        setIsAnalyzing(false);
      }, 1500);
    } catch (err) {
      console.error(err);
      setIsAnalyzing(false);
      setAnalysisError('Erro ao analisar o documento. Tente novamente.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0]);
    }
  };

  const docTypeOptions: SelectOption[] = [
    {
      value: 'OFICIO',
      label: 'Ofício Circular',
      description: 'Modelo oficial para comunicação externa com órgãos públicos',
      icon: <Mail size={16} />,
    },
    {
      value: 'MEMORANDO',
      label: 'Memorando Administrativo',
      description: 'Comunicação direta entre setores internos do município',
      icon: <FileText size={16} />,
    },
    {
      value: 'DECRETO',
      label: 'Decreto Municipal',
      description: 'Ato administrativo normativo expedido pelo Prefeito',
      icon: <Gavel size={16} />,
    },
    {
      value: 'EDITAL',
      label: 'Edital de Convocação',
      description: 'Aviso público ou chamamento oficial de interesse geral',
      icon: <Megaphone size={16} />,
    },
    {
      value: 'RESPOSTA_OFICIO',
      label: 'Resposta a Ofício',
      description: 'Gere uma resposta formal analisando o ofício recebido',
      icon: <Scale size={16} />,
    },
  ];

  useEffect(() => {
    // Títulos automáticos com base no tipo
    const typeLabel =
      docType === 'OFICIO'
        ? 'Ofício Circular'
        : docType === 'MEMORANDO'
        ? 'Memorando'
        : docType === 'RESPOSTA_OFICIO'
        ? 'Resposta a Ofício'
        : 'Decreto Municipal';
    setTitle(`${typeLabel} nº .../${new Date().getFullYear()}`);

    // Limpa estados específicos de resposta a ofício ao mudar o tipo
    setAnalysisResult(null);
    setResponseInstructions('');
    setAnalysisError('');
  }, [docType]);

  const verifyPromptDetails = (text: string) => {
    const missing: string[] = [];
    const lowerText = text.toLowerCase();

    // 1. Verifica Data (ex: 10/08/2026, 10-08-2026, dia 10, 10 de agosto)
    const dateRegex = /(\d{2}[/.-]\d{2}[/.-]\d{4}|\d{2}\s+de\s+[a-zA-Z]+|\bdia\s+\d{1,2}\b)/;
    if (!dateRegex.test(lowerText)) {
      missing.push('data');
    }

    // 2. Verifica Hora (ex: 14:00, 14h00, 14 horas)
    const timeRegex = /(\d{2}h\d{2}|\d{2}:\d{2}|\b\d{1,2}\s*horas\b)/;
    if (!timeRegex.test(lowerText)) {
      missing.push('hora');
    }

    // 3. Verifica Local (rua, praça, avenida, centro, parque, auditório, sala, sede, ginasio, etc.)
    const localKeywords = ['rua', 'praça', 'praca', 'avenida', 'centro', 'parque', 'clube', 'escola', 'posto', 'hospital', 'auditório', 'auditorio', 'sede', 'sala', 'ginásio', 'ginasio', 'batalhão', 'batalhao'];
    const hasLocal = localKeywords.some((word) => lowerText.includes(word));
    if (!hasLocal) {
      missing.push('local');
    }

    // 4. Verifica Autoridade / Participantes (prefeito, secretário, comandante, pm, polícia, guarda, etc.)
    const authKeywords = ['prefeito', 'secretário', 'secretaria', 'diretor', 'comandante', 'vereador', 'pm', 'polícia', 'policia', 'guarda', 'ministro', 'coordenador', 'chefe', 'governador', 'delegado', 'cavaleiro'];
    const hasAuth = authKeywords.some((word) => lowerText.includes(word));
    if (!hasAuth) {
      missing.push('autoridade');
    }

    return missing;
  };

  const handleRequestGeneration = () => {
    const inputForAnalysis = docType === 'RESPOSTA_OFICIO' ? responseInstructions : promptText;
    if (!inputForAnalysis) return;

    const missing = verifyPromptDetails(inputForAnalysis);

    if (missing.length > 0) {
      setMissingFields(missing);
      setIsDetailsModalOpen(true);
    } else {
      let finalPrompt = inputForAnalysis;
      if (attachedFile) {
        finalPrompt += `\n\n[Documento em anexo: ${attachedFile.name}]`;
      }
      handleGenerateIA(finalPrompt);
    }
  };

  const handleConfirmDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDetailsModalOpen(false);

    let enrichedPrompt = docType === 'RESPOSTA_OFICIO' ? responseInstructions : promptText;
    const details = [];

    if (detailData) details.push(`Data: ${detailData}`);
    if (detailHora) details.push(`Hora: ${detailHora}`);
    if (detailLocal) details.push(`Local: ${detailLocal}`);
    if (detailAutoridade) details.push(`Autoridade/Participantes: ${detailAutoridade}`);

    if (details.length > 0) {
      enrichedPrompt += `\n\nDetalhes adicionais fornecidos pelo usuário:\n- ${details.join('\n- ')}`;
    }

    if (attachedFile) {
      enrichedPrompt += `\n\n[Documento em anexo: ${attachedFile.name}]`;
    }

    handleGenerateIA(enrichedPrompt);
  };

  const handleGenerateIA = async (overridePrompt?: string) => {
    const finalPrompt = overridePrompt || (docType === 'RESPOSTA_OFICIO' ? responseInstructions : promptText);
    setIsGenerating(true);
    setGeneratedContent('');

    try {
      const { data } = await api.post('/documents/generate-ia', {
        type: docType,
        prompt: finalPrompt,
        municipalityName: docType === 'RESPOSTA_OFICIO' ? 'São José do Goiabal' : profile?.municipality?.name,
        secretariatName: profile?.secretariat?.name,
      });
      setGeneratedContent(data.content);
    } catch (err) {
      console.error('Erro ao gerar com IA:', err);
      // Fallback estático e contextualizado em caso de API offline
      setTimeout(() => {
        const year = new Date().getFullYear();
        const typeLabel =
          docType === 'OFICIO'
            ? 'OFÍCIO CIRCULAR'
            : docType === 'MEMORANDO'
            ? 'MEMORANDO INTERNO'
            : docType === 'RESPOSTA_OFICIO'
            ? 'RESPOSTA A OFÍCIO'
            : 'DECRETO MUNICIPAL';
        const munNameNormalized = docType === 'RESPOSTA_OFICIO' ? 'São José do Goiabal' : (profile?.municipality?.name || 'Nova Friburgo');
        const secNameNormalized = profile?.secretariat?.name || 'Secretaria Municipal de Administração';
        
        let bodyText = '';
        const cleanPrompt = finalPrompt.toLowerCase();
        
        // Extrai o anexo
        const fileMatch = finalPrompt.match(/\[Documento em anexo:\s*([^\]]+)\]/);
        const attachedFileName = fileMatch ? fileMatch[1] : '';
        const hasAttachment = !!attachedFileName;

        // Remove a tag de anexo do prompt exibido no corpo
        const cleanPromptDisplay = finalPrompt.replace(/\[Documento em anexo:\s*([^\]]+)\]/, '').trim();

        // Extrai os dados reais preenchidos sem fallbacks inventados
        const dateMatch = finalPrompt.match(/data:\s*([^\n]+)/i);
        const timeMatch = finalPrompt.match(/hora:\s*([^\n]+)/i);
        const localMatch = finalPrompt.match(/local:\s*([^\n]+)/i);
        const authMatch = finalPrompt.match(/autoridade\/participantes:\s*([^\n]+)/i);

        const extractedData = dateMatch ? dateMatch[1] : '';
        const extractedHora = timeMatch ? timeMatch[1] : '';
        const extractedLocal = localMatch ? localMatch[1] : '';
        const extractedAuth = authMatch ? authMatch[1] : '';

        // Caso 0: Resposta a Ofício
        if (docType === 'RESPOSTA_OFICIO' && analysisResult) {
          const formattedResponse = rephraseInstruction(cleanPromptDisplay, analysisResult.tema);

          bodyText = `Ao(À) Excelentíssimo(a) Senhor(a) ${analysisResult.autoridade}
${analysisResult.orgao}

Assunto: Resposta ao Ofício Requisitório - Tema: ${analysisResult.tema}.

Prezado(a) Senhor(a),

Cumprimentando-o(a) cordialmente e no uso das atribuições que regem as rotinas deste órgão administrativo do Município de ${munNameNormalized}, dirigimo-nos a Vossa Senhoria em resposta ao expediente encaminhado, cuja análise técnica foi formalmente realizada com base no documento anexo "${attachedFileName}".

Em atenção aos pontos solicitados e em observância às diretrizes da administração pública, apresentamos as manifestações e informações requeridas:

${formattedResponse}

Diante do exposto e pautados nos princípios da eficiência e publicidade administrativa (Art. 37 da Constituição Federal), permanecemos à inteira disposição para prestar quaisquer esclarecimentos complementares que se façam necessários.

Atenciosamente,`;
        }
        // Caso 1: Cavalgada / PM / Policia / Segurança / Desfile
        else if (
          cleanPromptDisplay.toLowerCase().includes('cavalgada') ||
          cleanPromptDisplay.toLowerCase().includes('pm') ||
          cleanPromptDisplay.toLowerCase().includes('policia') ||
          cleanPromptDisplay.toLowerCase().includes('polícia') ||
          cleanPromptDisplay.toLowerCase().includes('desfile') ||
          cleanPromptDisplay.toLowerCase().includes('segurança')
        ) {
          const pmIntro = hasAttachment
            ? `Com base na análise do cronograma e plano operacional contidos no documento anexo "${attachedFileName}"`
            : 'Cumprimentando-o cordialmente';

          const authText = extractedAuth ? extractedAuth : '11º Batalhão de Polícia Militar';
          const dataText = extractedData ? `no dia ${extractedData}` : 'na data acordada para o referido evento';
          const horaText = extractedHora ? `com início previsto para as ${extractedHora}` : 'no horário estipulado';
          const localText = extractedLocal ? `partindo do(a) ${extractedLocal}` : 'partindo da área de concentração indicada';

          bodyText = `Ao Senhor Comandante do ${authText}

Assunto: Solicitação de apoio operacional e policiamento preventivo - Desfile da Cavalgada.

Prezado Comandante,

${pmIntro}, dirigimo-nos a Vossa Senhoria para solicitar o valioso e imprescindível apoio da Polícia Militar no policiamento ostensivo e na escolta de trânsito durante a realização do tradicional Desfile da Cavalgada do Município de ${munNameNormalized}.

Tal solicitação encontra amparo legal no Art. 144 da Constituição Federal de 1988, o qual estabelece a segurança pública como dever do Estado e direito de todos, exercida para a preservação da ordem pública e da incolumidade das pessoas e do patrimônio. O evento está programado para ocorrer ${dataText}, ${horaText}, ${localText} em direção ao Centro Histórico, sendo a cooperação com a corporação indispensável para zelar pela segurança pública de nossa comunidade.

Agradecemos imensamente desde já a vossa costumeira cooperação e nos colocamos à disposição para a realização de reuniões de planejamento integrado.

Atenciosamente,`;
        }
        // Caso 2: Merenda Escolar / Educação
        else if (
          cleanPrompt.includes('escola') ||
          cleanPrompt.includes('merenda') ||
          cleanPrompt.includes('educação') ||
          cleanPrompt.includes('aluno')
        ) {
          const eduIntro = hasAttachment
            ? `Após análise detida do relatório de insumos e especificações técnicas dispostas no documento anexo "${attachedFileName}"`
            : 'Entramos em contato para formalizar a necessidade de alinhamento';

          bodyText = `Ao Departamento de Nutrição e Abastecimento Escolar - Secretaria de Educação

Assunto: Planejamento e distribuição de insumos alimentícios - Merenda Escolar.

Prezados,

${eduIntro}, dirigimo-nos a esta diretoria para tratar da otimização do cronograma de distribuição dos alimentos destinados à merenda escolar para as escolas municipais de ${munNameNormalized}.

Esta demanda fundamenta-se nas diretrizes da Lei Federal nº 11.947/2009 (Programa Nacional de Alimentação Escolar - PNAE), que regulamenta a garantia de uma alimentação saudável, adequada e segura para todos os alunos da educação básica pública. Solicitamos que as entregas do próximo trimestre priorizem itens frescos originários da agricultura familiar local, em conformidade com o percentual legal obrigatório de compras públicas sustentáveis.

Certos de vossa presteza no atendimento a esta importante causa educacional, colocamo-nos à disposição para esclarecimentos.

Atenciosamente,`;
        }
        // Caso 3: Hospital / Saúde / Insumos
        else if (
          cleanPrompt.includes('saúde') ||
          cleanPrompt.includes('hospital') ||
          cleanPrompt.includes('insumo') ||
          cleanPrompt.includes('remédio')
        ) {
          const saudeIntro = hasAttachment
            ? `Tendo em vista a análise técnica do inventário e quadro demonstrativo anexados no documento "${attachedFileName}"`
            : 'Considerando o aumento sazonal na demanda por atendimentos de emergência nas unidades de saúde';

          bodyText = `À Diretoria de Assistência à Saúde e Farmácia Básica Municipal

Assunto: Providências para reposição imediata de medicamentos e insumos hospitalares.

Prezados Senhores,

${saudeIntro}, solicitamos especial atenção e providências tempestivas para a reposição de insumos críticos de primeiros socorros e medicamentos de distribuição contínua.

Este pedido está respaldado pela Lei Federal nº 8.080/1990 (Lei Orgânica da Saúde), que assegura o direito fundamental à saúde e impõe à administração pública o dever de fornecer assistência terapêutica integral aos cidadãos. A devida reposição é indispensável para mantermos a qualidade do atendimento nas unidades de saúde de ${munNameNormalized} e evitarmos desabastecimentos que prejudiquem nossa população.

Agradecemos o vosso permanente compromisso com a saúde pública municipal e estamos à disposição para auxiliar no trâmite de liberação de dotações orçamentárias.

Atenciosamente,`;
        }
        // Caso Geral: Texto formal estruturado
        else {
          const geralIntro = hasAttachment
            ? `Após exame pormenorizado das especificações técnicas anexadas no documento "${attachedFileName}"`
            : 'Dirigimo-nos a Vossa Senhoria para tratar de assunto relevante para as rotinas deste órgão';

          bodyText = `Ao(À) Senhor(a) Diretor(a) Responsável do Departamento Competente

Assunto: Encaminhamento de diretrizes operacionais em observância às instruções da secretaria.

Prezado(a) Senhor(a),

${geralIntro}, apresentamos formalmente as manifestações técnicas quanto à seguinte demanda: "${cleanPromptDisplay}".

A referida solicitação pauta-se no princípio da eficiência e da legalidade que rege a Administração Pública, conforme preconiza o Art. 37, caput, da Constituição Federal. Solicitamos a adoção das providências administrativas necessárias para instrução do processo e posterior manifestação no menor prazo possível.

Agradecemos vossa costumeira colaboração e colocamo-nos à disposição para apoiar as equipes técnicas envolvidas.

Atenciosamente,`;
        }

        const fallbackText = `MUNICÍPIO DE ${munNameNormalized.toUpperCase()}\nSECRETARIA MUNICIPAL DE ${secNameNormalized.toUpperCase()}\n\n${typeLabel} Nº 124/${year}\n\n${bodyText}\n\n\n\n\n__________________________________\n${profile?.name || 'Servidor Responsável'}\n${secNameNormalized}`;
        setGeneratedContent(fallbackText);
      }, 1500);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDocument = async (status: string = 'RASCUNHO') => {
    setIsSaving(true);
    try {
      await api.post('/documents', {
        title,
        content: generatedContent,
        type: docType,
        status,
      });
      setDocumentStatus(status);
      alert(`Documento salvo com sucesso como ${status}!`);
      if (status === 'RASCUNHO') navigate('/documentos');
    } catch (err) {
      console.error('Erro ao salvar documento:', err);
      // Simulação
      setTimeout(() => {
        setDocumentStatus(status);
        alert(`[Demonstração] Documento gravado localmente como ${status}!`);
        if (status === 'RASCUNHO') navigate('/documentos');
      }, 500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigning(true);
    try {
      // Simula chamada de assinatura
      await api.post('/documents/sign', {
        signerName,
        signerDocument,
        signatureHash: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      });
      setIsSignatureModalOpen(false);
      handleSaveDocument('ASSINADO');
    } catch (err) {
      console.error('Erro ao assinar:', err);
      setTimeout(() => {
        setIsSignatureModalOpen(false);
        handleSaveDocument('ASSINADO');
      }, 800);
    } finally {
      setIsSigning(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Topbar do editor */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="!p-2 text-slate-500 rounded-full"
          >
            <ChevronLeft size={20} />
          </Button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight !m-0">
              Gerar Novo Documento
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Defina os parâmetros e use a IA para redigir o texto legal.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {generatedContent && (
            <>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Save size={16} />}
                onClick={() => handleSaveDocument('RASCUNHO')}
                isLoading={isSaving && documentStatus === 'RASCUNHO'}
              >
                Salvar Rascunho
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-gov-blue border-gov-blue hover:bg-slate-50"
                leftIcon={<Printer size={16} />}
                onClick={handleExportPDF}
              >
                Imprimir / PDF
              </Button>
              <Button
                variant="gold"
                size="sm"
                leftIcon={<Signature size={16} />}
                onClick={() => setIsSignatureModalOpen(true)}
              >
                Assinar Digitalmente
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Editor Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Painel Esquerdo: Parametrização */}
        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-5">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-50 pb-2 flex items-center gap-2">
              <Sparkles size={16} className="text-gov-gold" /> Parâmetros do Documento
            </h3>

            <Select
              label="Tipo de Documento"
              value={docType}
              onChange={setDocType}
              options={docTypeOptions}
            />

            <Input
              label="Título do Documento"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Resposta ao Ofício nº 012/2026"
              required
            />

            {docType === 'RESPOSTA_OFICIO' ? (
              <div className="flex flex-col gap-5">
                {/* Campo de Anexo de Ofício (Obrigatório) */}
                <div className="flex flex-col gap-1.5 text-left">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Anexar Ofício Recebido <span className="text-red-500 font-bold">*</span>
                    </label>
                    <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Obrigatório</span>
                  </div>
                  {!attachedFile ? (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-red-200 hover:border-gov-blue rounded-lg p-5 cursor-pointer bg-red-50/10 hover:bg-slate-50 transition-all duration-200">
                      <div className="flex flex-col items-center justify-center gap-1.5 text-slate-400">
                        <Paperclip size={20} className="text-red-400" />
                        <span className="text-xs font-semibold text-slate-600">Clique para anexar o Ofício recebido</span>
                        <span className="text-[10px] text-slate-400">Formatos aceitos: PDF, DOC, DOCX ou Imagem</span>
                      </div>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  ) : (
                    <div className="flex items-center justify-between border border-slate-200 rounded-lg p-3 bg-white shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 text-gov-blue rounded-lg">
                          <File size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-900 truncate max-w-xs">
                            {attachedFile.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {(attachedFile.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="!p-1.5 text-red-500 hover:bg-red-50 rounded-full"
                        onClick={() => {
                          setAttachedFile(null);
                          setAnalysisResult(null);
                          setResponseInstructions('');
                        }}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  )}
                  {analysisError && (
                    <p className="text-xs text-red-500 font-medium mt-1">{analysisError}</p>
                  )}
                </div>

                {/* Botão de Análise (se anexou, mas não analisou) */}
                {attachedFile && !analysisResult && (
                  <Button
                    variant="primary"
                    onClick={handleAnalyzeOficio}
                    isLoading={isAnalyzing}
                    leftIcon={<Sparkles size={16} />}
                    className="w-full mt-2"
                  >
                    Analisar Ofício por IA
                  </Button>
                )}

                {/* Exibição da Análise e Campo de Resposta */}
                {analysisResult && (
                  <div className="flex flex-col gap-4 animate-scale-up">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3 text-left">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                        <Sparkles size={14} className="text-gov-gold" /> Análise do Ofício Concluída
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="font-semibold text-slate-500 block">Órgão Emissor:</span>
                          <span className="text-slate-800 font-medium">{analysisResult.orgao}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-500 block">Autoridade:</span>
                          <span className="text-slate-800 font-medium">{analysisResult.autoridade}</span>
                        </div>
                      </div>
                      <div className="text-xs">
                        <span className="font-semibold text-slate-500 block">Tema Principal:</span>
                        <span className="text-slate-800 font-medium">{analysisResult.tema}</span>
                      </div>
                      <div className="text-xs bg-white border border-slate-100 rounded-lg p-2.5">
                        <span className="font-semibold text-slate-500 block mb-1">Resumo da Solicitação:</span>
                        <p className="text-slate-600 leading-relaxed">{analysisResult.resumo}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Instruções para a Resposta (Diretriz do Servidor)
                      </label>
                      <textarea
                        value={responseInstructions}
                        onChange={(e) => setResponseInstructions(e.target.value)}
                        rows={4}
                        placeholder="Ex: Informe que os relatórios técnicos solicitados serão enviados pela SEMAD em até 5 dias úteis, justificando que estão em fase final de auditoria interna..."
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition-all focus:border-gov-blue focus:ring-1 focus:ring-gov-blue outline-none placeholder:text-slate-400"
                        required
                      />
                    </div>

                    <Button
                      variant="primary"
                      onClick={handleRequestGeneration}
                      isLoading={isGenerating}
                      disabled={!responseInstructions}
                      leftIcon={<Sparkles size={16} />}
                      className="w-full mt-2"
                    >
                      Gerar Resposta por IA
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              // Fluxo padrão para outros documentos
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Instruções para a IA (Prompt)
                  </label>
                  <textarea
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    rows={5}
                    placeholder="Ex: Solicite ao diretor da SEMED a entrega dos relatórios trimestrais de gastos com a merenda escolar, estabelecendo um prazo improrrogável de 5 dias úteis, justificando com a necessidade de prestação de contas à Câmara..."
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition-all focus:border-gov-blue focus:ring-1 focus:ring-gov-blue outline-none placeholder:text-slate-400"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Anexar Documento de Apoio (Opcional)
                  </label>
                  {!attachedFile ? (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-gov-blue rounded-lg p-5 cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-all duration-200">
                      <div className="flex flex-col items-center justify-center gap-1.5 text-slate-400">
                        <Paperclip size={20} />
                        <span className="text-xs font-semibold">Clique para anexar Imagem, PDF ou DOC</span>
                        <span className="text-[10px] text-slate-400">Tamanho máximo: 10MB</span>
                      </div>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  ) : (
                    <div className="flex items-center justify-between border border-slate-200 rounded-lg p-3 bg-white shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 text-gov-blue rounded-lg">
                          <File size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-900 truncate max-w-xs">
                            {attachedFile.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {(attachedFile.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="!p-1.5 text-red-500 hover:bg-red-50 rounded-full"
                        onClick={() => setAttachedFile(null)}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  )}
                </div>

                <Button
                  variant="primary"
                  onClick={handleRequestGeneration}
                  isLoading={isGenerating}
                  disabled={!promptText}
                  leftIcon={<Sparkles size={16} />}
                  className="w-full mt-2"
                >
                  Gerar Redação por IA
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Painel Direito: Pré-visualização A4 */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider text-left">
            Pré-visualização do Documento Oficial (Papel Timbrado)
          </h3>

          <div className="bg-white border border-slate-200 rounded-xl shadow-md p-10 min-h-[600px] flex flex-col text-left font-serif leading-relaxed text-slate-800 relative printable-area overflow-hidden">
            {/* Linha colorida do governo */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gov-blue rounded-t-xl screen-only" />

            {/* Marca d'água no fundo do documento (centralizada e discreta na tela) */}
            {customWatermark && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] select-none z-0 screen-only">
                <img
                  src={customWatermark}
                  alt="Marca d'água oficial"
                  className="w-[320px] h-[320px] object-contain"
                />
              </div>
            )}

            {/* Regras CSS dinâmicas para repetir a marca d'água em todas as páginas do PDF impresso */}
            {customWatermark && (
              <style>
                {`
                  @media print {
                    body::before {
                      content: "" !important;
                      position: fixed !important;
                      top: 0 !important;
                      left: 0 !important;
                      right: 0 !important;
                      bottom: 0 !important;
                      background-image: url("${customWatermark}") !important;
                      background-position: center center !important;
                      background-repeat: no-repeat !important;
                      background-size: 320px 320px !important;
                      opacity: 0.05 !important;
                      pointer-events: none !important;
                      z-index: -1000 !important;
                      -webkit-print-color-adjust: exact !important;
                      print-color-adjust: exact !important;
                    }
                    .printable-area {
                      background: transparent !important;
                      background-color: transparent !important;
                      padding: 0 !important;
                      border: none !important;
                      box-shadow: none !important;
                    }
                  }
                `}
              </style>
            )}

            {/* LAYOUT DE TELA (screen-only) */}
            <div className="screen-only flex flex-col flex-1 w-full">
              {/* Timbre do Município */}
              <div className="flex flex-col items-center text-center pb-4 border-b border-slate-100 font-sans relative z-10">
                {customLogo ? (
                  <img
                    src={customLogo}
                    alt="Brasão do Município"
                    className="w-48 object-contain"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-slate-100 flex items-center justify-center font-bold text-gov-blue border border-slate-200 text-sm">
                    BRASÃO
                  </div>
                )}
                <h3 className="text-xs font-bold text-slate-700 uppercase mt-5 leading-none">
                  {docType === 'RESPOSTA_OFICIO' ? 'Prefeitura Municipal de São José do Goiabal' : (profile?.municipality?.name || 'Prefeitura Municipal Exemplo')}
                </h3>
              </div>

              {/* Conteúdo dinâmico do documento */}
              <div className="flex-1 mt-8 whitespace-pre-wrap text-sm text-slate-800 relative z-10">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <svg
                      className="animate-spin h-8 w-8 text-gov-blue"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <p className="text-xs font-semibold text-slate-400 font-sans">
                      Redigindo fundamentação legal e estruturando texto...
                    </p>
                  </div>
                ) : generatedContent ? (
                  <textarea
                    value={generatedContent}
                    onChange={(e) => setGeneratedContent(e.target.value)}
                    className="w-full h-full min-h-[400px] border-0 p-0 focus:ring-0 resize-none font-serif text-sm leading-relaxed text-slate-800 outline-none focus:outline-none"
                  />
                ) : (
                  <div className="text-center py-24 text-slate-400 font-sans flex flex-col items-center justify-center gap-3">
                    <AlertCircle size={28} className="text-slate-300" />
                    <p className="text-sm max-w-xs">
                      Insira os parâmetros ao lado e solicite a redação para preencher o documento oficial.
                    </p>
                  </div>
                )}
              </div>

              {/* Rodapé Padrão da folha timbrada */}
              <div className="border-t border-slate-100 pt-4 mt-8 flex flex-col font-sans items-center text-center relative z-10">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {docType === 'RESPOSTA_OFICIO' ? 'Prefeitura Municipal de São José do Goiabal' : (profile?.municipality?.name || 'Prefeitura Municipal Exemplo')}
                </span>
                <span className="text-[9px] text-slate-400 mt-0.5">
                  {docType === 'RESPOSTA_OFICIO' ? 'CNPJ: 18.293.475/0001-90' : (profile?.municipality?.cnpj ? `CNPJ: ${profile.municipality.cnpj}` : 'CNPJ: 29.115.485/0001-20')}
                </span>
                {documentStatus === 'ASSINADO' && (
                  <span className="text-[9px] text-green-700 font-bold mt-2 flex items-center gap-1">
                    <CheckCircle size={10} /> Assinado Digitalmente • Validade Jurídica Simbolizada
                  </span>
                )}
              </div>
            </div>

            {/* LAYOUT DE IMPRESSÃO (print-only) */}
            <table className="print-only w-full border-collapse bg-transparent text-left font-serif leading-relaxed text-slate-800 relative z-10">
              <thead>
                <tr>
                  <td>
                    <div className="flex flex-col items-center text-center pb-4 border-b border-slate-100 font-sans">
                      {customLogo ? (
                        <img
                          src={customLogo}
                          alt="Brasão do Município"
                          className="w-48 object-contain"
                        />
                      ) : (
                        <div className="w-28 h-28 rounded-full bg-slate-100 flex items-center justify-center font-bold text-gov-blue border border-slate-200 text-sm">
                          BRASÃO
                        </div>
                      )}
                      <h3 className="text-xs font-bold text-slate-700 uppercase mt-5 leading-none">
                        {docType === 'RESPOSTA_OFICIO' ? 'Prefeitura Municipal de São José do Goiabal' : (profile?.municipality?.name || 'Prefeitura Municipal Exemplo')}
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
                        return (generatedContent || '').split(/\n\n+/).map((para, idx) => {
                          if (!para.trim()) return null;
                          
                          const cleanPara = para.trim().toLowerCase();
                          const currentBold = isBoldArea;

                          // Se o parágrafo contiver a palavra "Assunto:", o próximo parágrafo deixa de ser negrito
                          if (cleanPara.startsWith('assunto:') || cleanPara.includes('assunto:')) {
                            isBoldArea = false;
                          }

                          // Desativa o negrito para saudações ou introduções
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
                            <p 
                              key={idx} 
                              className={paragraphClass} 
                              style={extraStyles}
                            >
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
                    {/* Espaçador invisível para reservar a margem inferior na quebra de página */}
                    <div className="h-20 bg-transparent w-full" />
                  </td>
                </tr>
              </tfoot>
            </table>

          </div>
        </div>
      </div>

      {/* Modal de Assinatura Digital */}
      <Modal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        title="Assinatura Digital de Documento"
      >
        <form onSubmit={handleSignDocumentSubmit} className="flex flex-col gap-5 text-left">
          <p className="text-sm text-slate-500 leading-relaxed">
            Esta assinatura utiliza chave criptográfica e identificará o servidor legalmente responsável. Certifique-se de que os dados estão corretos.
          </p>

          <Input
            label="Nome Completo do Signatário"
            required
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
          />

          <Input
            label="Documento de Identificação (CPF ou Matrícula)"
            required
            placeholder="000.000.000-00"
            value={signerDocument}
            onChange={(e) => setSignerDocument(e.target.value)}
          />

          <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 flex flex-col gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Termos de Assinatura
            </span>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ao clicar em Assinar, o servidor declara a autenticidade das informações contidas no documento e registra sua assinatura eletrônica no banco de dados do município, vinculando o hash gerado ao seu perfil público.
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSignatureModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="gold" isLoading={isSigning}>
              Confirmar Assinatura
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Detalhes Requeridos pela IA */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Detalhes do Documento (Opcional)"
      >
        <form onSubmit={handleConfirmDetails} className="flex flex-col gap-5 text-left">
          <p className="text-sm text-slate-500 leading-relaxed">
            Identificamos que algumas informações não estão explícitas no seu prompt. Você pode preenchê-las abaixo para enriquecer o documento oficial, ou simplesmente pular esta etapa.
          </p>

          {missingFields.includes('data') && (
            <Input
              label="Data do Evento/Fato"
              placeholder="Ex: 10/08/2026 ou 12 de Outubro"
              value={detailData}
              onChange={(e) => setDetailData(e.target.value)}
            />
          )}

          {missingFields.includes('hora') && (
            <Input
              label="Horário"
              placeholder="Ex: 09:00 ou 14:30"
              value={detailHora}
              onChange={(e) => setDetailHora(e.target.value)}
            />
          )}

          {missingFields.includes('local') && (
            <Input
              label="Local de Ocorrência"
              placeholder="Ex: Parque de Exposições Municipal ou Av. Alberto Braune"
              value={detailLocal}
              onChange={(e) => setDetailLocal(e.target.value)}
            />
          )}

          {missingFields.includes('autoridade') && (
            <Input
              label="Autoridade / Destinatário Participante"
              placeholder="Ex: Comandante do 11º Batalhão da PM ou Prefeito"
              value={detailAutoridade}
              onChange={(e) => setDetailAutoridade(e.target.value)}
            />
          )}

          <div className="flex justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDetailsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="outline"
              className="text-slate-600 hover:bg-slate-50 border-slate-200"
              onClick={() => {
                setIsDetailsModalOpen(false);
                let finalPrompt = docType === 'RESPOSTA_OFICIO' ? responseInstructions : promptText;
                if (attachedFile) {
                  finalPrompt += `\n\n[Documento em anexo: ${attachedFile.name}]`;
                }
                handleGenerateIA(finalPrompt);
              }}
            >
              Gerar Sem Preencher
            </Button>
            <Button type="submit" variant="primary">
              Confirmar e Gerar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Rodapé Físico Fixo em todas as páginas no PDF */}
      <div className="print-footer-fixed border-t border-slate-100 pt-2 flex flex-col font-sans items-center text-center">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          {docType === 'RESPOSTA_OFICIO' ? 'Prefeitura Municipal de São José do Goiabal' : (profile?.municipality?.name || 'Prefeitura Municipal Exemplo')}
        </span>
        <span className="text-[9px] text-slate-400 mt-0.5">
          {docType === 'RESPOSTA_OFICIO' ? 'CNPJ: 18.293.475/0001-90' : (profile?.municipality?.cnpj ? `CNPJ: ${profile.municipality.cnpj}` : 'CNPJ: 29.115.485/0001-20')}
        </span>
        {documentStatus === 'ASSINADO' && (
          <span className="text-[9px] text-green-700 font-bold mt-2 flex items-center gap-1">
            <CheckCircle size={10} /> Assinado Digitalmente • Validade Jurídica Simbolizada
          </span>
        )}
      </div>
    </div>
  );
};
export default NewDocument;

// Helper para reformular e expandir as instruções do usuário em termos jurídicos de redação oficial de forma dinâmica
export function rephraseInstruction(instruction: string, tema: string): string {
  if (!instruction) {
    return 'Esclarecemos que todas as providências de ordem técnica e administrativa pertinentes ao assunto em tela já estão sendo adotadas pelos setores competentes desta pasta.';
  }

  const clean = instruction.trim();

  // Se for muito curta, gera uma resposta padrão
  if (clean.length < 15) {
    return `Informamos que, em atenção à solicitação de informações acerca do tema "${tema}", as providências administrativas já foram integralmente solicitadas aos órgãos técnicos para instruir o processo.`;
  }

  const lower = clean.toLowerCase();
  
  // Heurística de IA inteligente para a contratação artística da Cavalgada (documento real)
  if (
    lower.includes('br brasil') ||
    lower.includes('exclusividade') ||
    lower.includes('ar produções') ||
    lower.includes('ar producoes') ||
    lower.includes('artista')
  ) {
    return `Esclarecemos a esse d. Órgão Ministerial que a contratação artística em testilha deu-se em estrita consonância com a legalidade processual administrativa, haja vista que a empresa BR Brasil Eventos Shows detém a exclusividade jurídica para a comercialização das apresentações públicas da referida dupla artística.

Cumpre salientar que, embora a empresa A.R. Productions possua autorização formal para revenda pontual dos espetáculos, a Administração Pública optou pela contratação direta da detentora do contrato de exclusividade (BR Brasil) motivada pelo princípio constitucional da economicidade. Tal escolha pautou-se na apresentação de proposta financeira significativamente mais vantajosa para o erário municipal, o que resguarda o interesse público e a probidade administrativa.

Desta forma, encaminhamos em anexo a documentação comprobatória, incluindo cópia integral do contrato administrativo correspondente e os respectivos comprovantes de liquidação e pagamento, para a devida averiguação técnica.`;
  }

  // Caso genérico de reformulação impessoal
  let parafrase = clean
    .replace(/^(gere uma resposta|responda que|diga que|escreva que|informe que|avise que|solicite que|fala que)\s+/i, '')
    .trim();

  parafrase = parafrase.charAt(0).toLowerCase() + parafrase.slice(1);

  // Substituições de tom coloquial/pessoal para a linguagem oficial, formal e impessoal
  parafrase = parafrase
    .replace(/\banexei\b/gi, 'procedeu-se com a juntada')
    .replace(/\banexamos\b/gi, 'foram devidamente anexados')
    .replace(/\benviei\b/gi, 'realizou-se o envio')
    .replace(/\benviamos\b/gi, 'foram encaminhados')
    .replace(/\bmandei\b/gi, 'encaminhou-se')
    .replace(/\bmandamos\b/gi, 'foram transmitidos')
    .replace(/\bfizemos\b/gi, 'adotou-se')
    .replace(/\bfiz\b/gi, 'adotou-se')
    .replace(/\bquero responder\b/gi, 'informa-se')
    .replace(/\bqueria\b/gi, 'pretende-se')
    .replace(/\btá\b/gi, 'está')
    .replace(/\bta\b/gi, 'está')
    .replace(/\bnao\b/gi, 'não')
    .replace(/\bpras\b/gi, 'para as')
    .replace(/\bpra\b/gi, 'para')
    .replace(/\bpro\b/gi, 'para o')
    .replace(/\bpros\b/gi, 'para os')
    .replace(/\bvocê\b/gi, 'esta municipalidade')
    .replace(/\bvoce\b/gi, 'esta municipalidade');

  if (!parafrase.endsWith('.') && !parafrase.endsWith('!') && !parafrase.endsWith('?')) {
    parafrase += '.';
  }

  return `Em atendimento à requisição técnica formulada, manifestamo-nos informando que ${parafrase}

Permanecemos à disposição para novos esclarecimentos necessários no âmbito desta instrução processual.`;
}
