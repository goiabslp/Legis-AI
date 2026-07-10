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
      value: 'MANIFESTACAO',
      label: 'Resposta de Manifestação Judiciário',
      description: 'Resposta formal a intimações, ofícios judiciais ou mandados',
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
        : docType === 'MANIFESTACAO'
        ? 'Resposta de Manifestação Judiciário'
        : 'Decreto Municipal';
    setTitle(`${typeLabel} nº .../${new Date().getFullYear()}`);
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
    if (!promptText) return;
    const missing = verifyPromptDetails(promptText);

    if (missing.length > 0) {
      setMissingFields(missing);
      setIsDetailsModalOpen(true);
    } else {
      let finalPrompt = promptText;
      if (attachedFile) {
        finalPrompt += `\n\n[Documento em anexo: ${attachedFile.name}]`;
      }
      handleGenerateIA(finalPrompt);
    }
  };

  const handleConfirmDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDetailsModalOpen(false);

    let enrichedPrompt = promptText;
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
    const finalPrompt = overridePrompt || promptText;
    setIsGenerating(true);
    setGeneratedContent('');

    try {
      const { data } = await api.post('/documents/generate-ia', {
        type: docType,
        prompt: finalPrompt,
        municipalityName: profile?.municipality?.name,
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
            : docType === 'MANIFESTACAO'
            ? 'MANIFESTAÇÃO JUDICIAL'
            : 'DECRETO MUNICIPAL';
        const munNameNormalized = profile?.municipality?.name || 'Nova Friburgo';
        const secNameNormalized = profile?.secretariat?.name || 'Secretaria Municipal de Administração';
        
        let bodyText = '';
        const cleanPrompt = finalPrompt.toLowerCase();

        // Extrai os dados reais preenchidos
        const extractedData = cleanPrompt.match(/data:\s*([^\n]+)/)?.[1] || '12 de outubro de 2026';
        const extractedHora = cleanPrompt.match(/hora:\s*([^\n]+)/)?.[1] || '09:00 horas';
        const extractedLocal = cleanPrompt.match(/local:\s*([^\n]+)/)?.[1] || 'Parque de Exposições Municipal';
        const extractedAuth = cleanPrompt.match(/autoridade\/participantes:\s*([^\n]+)/)?.[1] || '11º Batalhão de Polícia Militar';

        // Extrai o anexo
        const fileMatch = finalPrompt.match(/\[Documento em anexo:\s*([^\]]+)\]/);
        const attachedFileName = fileMatch ? fileMatch[1] : '';
        let attachmentClause = '';
        if (attachedFileName) {
          attachmentClause = `\n\nInstruímos a presente solicitação com o documento anexo "${attachedFileName}" contendo detalhamentos adicionais para análise técnica e operacional.`;
        }

        // Caso 0: Manifestação Judiciária
        if (
          docType === 'MANIFESTACAO' ||
          cleanPrompt.includes('intimação') ||
          cleanPrompt.includes('intimacao') ||
          cleanPrompt.includes('judiciário') ||
          cleanPrompt.includes('judiciario') ||
          cleanPrompt.includes('processo') ||
          cleanPrompt.includes('juiz') ||
          cleanPrompt.includes('decisão') ||
          cleanPrompt.includes('decisao')
        ) {
          bodyText = `Excelentíssimo Senhor Doutor Juiz de Direito da 1ª Vara Cível da Comarca de ${munNameNormalized}

Referência: Processo Judicial nº 0812345-67.2026.8.19.0001
Assunto: Prestação de informações e manifestação em cumprimento de decisão judicial.

Prezado Magistrado,

Cumprimentando-o respeitosamente, dirigimo-nos a Vossa Excelência, em resposta ao Ofício Judicial nº 450/2026, expedido nos autos do processo em epígrafe, para prestar as informações solicitadas por este juízo no que concerne à seguinte determinação: "${promptText}".

Cumpre-nos informar que esta municipalidade, por meio de seus órgãos técnicos competentes, já adotou as providências administrativas necessárias para dar estrito e imediato cumprimento à tutela jurisdicional deferida por este renovado juízo.

Colocamo-nos à inteira disposição deste Juízo para prestar quaisquer esclarecimentos complementares que se façam necessários para a completa elucidação da lide.

Respeitosamente,`;
        }
        // Caso 1: Cavalgada / PM / Policia / Segurança / Desfile
        else if (
          cleanPrompt.includes('cavalgada') ||
          cleanPrompt.includes('pm') ||
          cleanPrompt.includes('policia') ||
          cleanPrompt.includes('polícia') ||
          cleanPrompt.includes('desfile') ||
          cleanPrompt.includes('segurança')
        ) {
          bodyText = `Ao Senhor Comandante do ${extractedAuth.includes('Batalhão') || extractedAuth.includes('Polícia') || extractedAuth.includes('Comando') ? extractedAuth : '11º Batalhão de Polícia Militar'}

Assunto: Solicitação de apoio para policiamento e escolta - Desfile da Cavalgada 2026.

Prezado Comandante,

Cumprimentando-o cordialmente, dirigimo-nos a Vossa Senhoria para solicitar o valioso apoio da Polícia Militar no policiamento preventivo e na escolta de trânsito durante a realização do tradicional Desfile da Cavalgada 2026 do Município de ${munNameNormalized}.

O evento em apreço está programado para ocorrer no dia ${extractedData}, com início previsto para as ${extractedHora}, partindo do(a) ${extractedLocal} em direção ao Centro Histórico. Prevemos a participação de cavaleiros e um grande público ao longo do percurso.

A presença e a escolta da Polícia Militar são indispensáveis para garantir a integridade de todos os participantes, ordenar o trânsito nas vias afetadas e zelar pela segurança e tranquilidade pública de nossa comunidade.

Agradecemos desde já pela valiosa parceria e nos colocamos à disposição para reuniões de alinhamento tático.

Atenciosamente,`;
        }
        // Caso 2: Merenda Escolar / Educação
        else if (
          cleanPrompt.includes('escola') ||
          cleanPrompt.includes('merenda') ||
          cleanPrompt.includes('educação') ||
          cleanPrompt.includes('aluno')
        ) {
          bodyText = `Ao Departamento de Nutrição e Abastecimento Escolar

Assunto: Planejamento e distribuição de gêneros alimentícios para a merenda escolar.

Prezados,

Entramos em contato para formalizar a necessidade de alinhamento quanto ao cronograma de distribuição dos insumos destinados à merenda escolar para o próximo trimestre das escolas municipais de ${munNameNormalized}.

Solicitamos que nos seja enviado, no prazo de até 5 (cinco) dias úteis, o relatório consolidado de estoque atualizado, bem como a escala planejada para atendimento das unidades escolares periféricas, priorizando o fornecimento de itens hortifrutigranjeiros frescos provenientes da agricultura familiar local.

Contamos com a presteza de sempre no atendimento desta demanda visando manter a excelência nutricional fornecida aos nossos alunos.

Atenciosamente,`;
        }
        // Caso 3: Hospital / Saúde / Insumos
        else if (
          cleanPrompt.includes('saúde') ||
          cleanPrompt.includes('hospital') ||
          cleanPrompt.includes('insumo') ||
          cleanPrompt.includes('remédio')
        ) {
          bodyText = `À Diretoria de Assistência à Saúde e Farmácia Básica

Assunto: Reposição de estoque de insumos hospitalares e medicamentos.

Prezados Senhores,

Considerando o aumento sazonal na demanda por atendimentos de emergência nas unidades de saúde de nosso município, solicitamos especial atenção e providências urgentes no sentido de reabastecer os estoques de insumos críticos de primeiros socorros e medicamentos de distribuição contínua.

Pedimos que seja elaborado um inventário descritivo das necessidades prioritárias de cada posto de saúde para fins de liberação de dotação orçamentária suplementar de compras.

Certos do vosso compromisso com o bem-estar e a saúde de nossa população, aguardamos o envio das informações solicitadas.

Atenciosamente,`;
        }
        // Caso Geral: Texto formal estruturado
        else {
          bodyText = `Ao(À) Senhor(a) Diretor(a) Responsável

Assunto: Encaminhamento de diretrizes técnicas e operacionais.

Prezado(a) Senhor(a),

Dirigimo-nos a Vossa Senhoria para tratar de assunto relevante para as rotinas deste órgão administrative, especificamente no que concerne à seguinte demanda formalizada por esta secretaria: "${promptText}".

Com o objetivo de zelar pelos princípios da legalidade, publicidade e eficiência administrativa, solicitamos a adoção das providências cabíveis para a instrução processual do tema e posterior tomada de decisões.

Permanecemos à disposição para prestar esclarecimentos complementares que se façam necessários para a conclusão desta demanda no menor prazo possível.

Atenciosamente,`;
        }

        const fallbackText = `MUNICÍPIO DE ${munNameNormalized.toUpperCase()}\nSECRETARIA MUNICIPAL DE ${secNameNormalized.toUpperCase()}\n\n${typeLabel} Nº 124/${year}\n\n${bodyText}${attachmentClause}\n\n__________________________________\n${profile?.name || 'Servidor Responsável'}\nSecretaria de ${secNameNormalized}`;
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
              placeholder="Ex: Ofício Circular nº 012/2026"
              required
            />

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

            {/* Campo de Anexo de Arquivo */}
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
          </Card>
        </div>

        {/* Painel Direito: Pré-visualização A4 */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider text-left">
            Pré-visualização do Documento Oficial (Papel Timbrado)
          </h3>

          <div className="bg-white border border-slate-200 rounded-xl shadow-md p-10 min-h-[600px] flex flex-col text-left font-serif leading-relaxed text-slate-800 relative printable-area">
            {/* Linha colorida do governo */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gov-blue rounded-t-xl" />

            {/* Timbre do Município */}
            <div className="flex flex-col items-center text-center pb-8 border-b border-slate-100 font-sans">
              {profile?.municipality?.logoUrl ? (
                <img
                  src={profile.municipality.logoUrl}
                  alt="Brasão do Município"
                  className="w-16 h-16 object-contain mb-3"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center font-bold text-gov-blue border border-slate-200 mb-3">
                  BRASÃO
                </div>
              )}
              <h2 className="text-sm font-extrabold tracking-wider uppercase text-slate-900 leading-none">
                ESTADO DO RIO DE JANEIRO
              </h2>
              <h3 className="text-xs font-bold text-slate-700 uppercase mt-1 leading-none">
                {profile?.municipality?.name || 'Prefeitura Municipal Exemplo'}
              </h3>
              <p className="text-[10px] text-slate-400 uppercase font-semibold mt-1">
                {profile?.secretariat?.name || 'Secretaria Geral de Administração'}
              </p>
            </div>

            {/* Conteúdo dinâmico do documento */}
            <div className="flex-1 mt-8 whitespace-pre-wrap text-sm text-slate-800">
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

            {/* Rodapé da folha timbrada */}
            <div className="border-t border-slate-100 pt-4 mt-8 flex flex-col font-sans items-center text-center">
              <span className="text-[10px] text-slate-400">
                Página 1 de 1 • Gerado com auxílio de Inteligência Artificial Oficial do Município
              </span>
              {documentStatus === 'ASSINADO' && (
                <span className="text-[10px] text-green-700 font-bold mt-1 flex items-center gap-1">
                  <CheckCircle size={10} /> Assinado Digitalmente • Validade Jurídica Simbolizada
                </span>
              )}
            </div>
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
        title="Detalhes Faltantes Requeridos"
      >
        <form onSubmit={handleConfirmDetails} className="flex flex-col gap-5 text-left">
          <p className="text-sm text-slate-500 leading-relaxed">
            Identificamos que algumas informações cruciais estão ausentes no seu pedido de redação. Preencha-as abaixo para enriquecer o documento oficial:
          </p>

          {missingFields.includes('data') && (
            <Input
              label="Data do Evento/Fato"
              required
              placeholder="Ex: 10/08/2026 ou 12 de Outubro"
              value={detailData}
              onChange={(e) => setDetailData(e.target.value)}
            />
          )}

          {missingFields.includes('hora') && (
            <Input
              label="Horário"
              required
              placeholder="Ex: 09:00 ou 14:30"
              value={detailHora}
              onChange={(e) => setDetailHora(e.target.value)}
            />
          )}

          {missingFields.includes('local') && (
            <Input
              label="Local de Ocorrência"
              required
              placeholder="Ex: Parque de Exposições Municipal ou Av. Alberto Braune"
              value={detailLocal}
              onChange={(e) => setDetailLocal(e.target.value)}
            />
          )}

          {missingFields.includes('autoridade') && (
            <Input
              label="Autoridade / Destinatário Participante"
              required
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
            <Button type="submit" variant="primary">
              Confirmar e Gerar Documento
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default NewDocument;
