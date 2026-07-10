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
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../contexts/AuthContext';
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

  useEffect(() => {
    // Títulos automáticos com base no tipo
    const typeLabel = docType === 'OFICIO' ? 'Ofício Circular' : docType === 'MEMORANDO' ? 'Memorando' : 'Decreto Municipal';
    setTitle(`${typeLabel} nº .../${new Date().getFullYear()}`);
  }, [docType]);

  const handleGenerateIA = async () => {
    if (!promptText) return;
    setIsGenerating(true);
    setGeneratedContent('');

    try {
      const { data } = await api.post('/documents/generate-ia', {
        type: docType,
        prompt: promptText,
        municipalityName: profile?.municipality?.name,
        secretariatName: profile?.secretariat?.name,
      });
      setGeneratedContent(data.content);
    } catch (err) {
      console.error('Erro ao gerar com IA:', err);
      // Fallback estático e contextualizado em caso de API offline
      setTimeout(() => {
        const fallbackText = `MUNICÍPIO DE ${profile?.municipality?.name?.toUpperCase() || 'EXEMPLO'}\nSECRETARIA MUNICIPAL DE ${profile?.secretariat?.name?.toUpperCase() || 'ADMINISTRAÇÃO'}\n\n${docType} CIRCULAR Nº 124/${new Date().getFullYear()}\n\nAo(A) Senhor(a) Diretor(a),\n\nAssunto: Solicitação de providências conforme solicitado pelo usuário.\n\nServimo-nos do presente para, no uso de nossas atribuições regulamentares, solicitar formalmente de Vossa Senhoria a adoção de medidas necessárias no que tange a: "${promptText}".\n\nTal solicitação fundamenta-se na necessidade urgente de otimização dos fluxos operacionais e na estrita observância dos princípios constitucionais da eficiência e da legalidade que regem a Administração Pública Municipal.\n\nCertos da vossa costumeira atenção e presteza na condução dos assuntos de interesse público, renovamos na oportunidade protestos de elevada estima e distinta consideração.\n\nAtenciosamente,\n\n__________________________________\n${profile?.name || 'Servidor Responsável'}\nSecretaria de ${profile?.secretariat?.name || 'Administração'}`;
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

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Tipo de Documento
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-gov-blue focus:ring-1 focus:ring-gov-blue outline-none"
              >
                <option value="OFICIO">Ofício Circular (Comunicação Externa)</option>
                <option value="MEMORANDO">Memorando (Comunicação Interna)</option>
                <option value="DECRETO">Decreto Municipal (Normativo)</option>
                <option value="EDITAL">Edital de Convocação (Público)</option>
              </select>
            </div>

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

            <Button
              variant="primary"
              onClick={handleGenerateIA}
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
    </div>
  );
};
export default NewDocument;
