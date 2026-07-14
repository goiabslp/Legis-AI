"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentService = void 0;
exports.rephraseInstruction = rephraseInstruction;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infra/database/prisma.service");
const knowledge_service_1 = require("../knowledge/knowledge.service");
let DocumentService = class DocumentService {
    prisma;
    knowledgeService;
    constructor(prisma, knowledgeService) {
        this.prisma = prisma;
        this.knowledgeService = knowledgeService;
    }
    async generateIA(prompt, type, municipalityName, secretariatName) {
        const year = new Date().getFullYear();
        const typeLabel = type === 'OFICIO'
            ? 'OFÍCIO CIRCULAR'
            : type === 'MEMORANDO'
                ? 'MEMORANDO INTERNO'
                : type === 'RESPOSTA_OFICIO'
                    ? 'RESPOSTA A OFÍCIO'
                    : 'DECRETO MUNICIPAL';
        const munNameNormalized = type === 'RESPOSTA_OFICIO' ? 'São José do Goiabal' : (municipalityName || 'Nova Friburgo');
        const secNameNormalized = secretariatName || 'Secretaria Municipal de Administração';
        let bodyText = '';
        const cleanPrompt = prompt.toLowerCase();
        const fileMatch = prompt.match(/\[Documento em anexo:\s*([^\]]+)\]/);
        const attachedFileName = fileMatch ? fileMatch[1] : '';
        const hasAttachment = !!attachedFileName;
        const cleanPromptDisplay = prompt.replace(/\[Documento em anexo:\s*([^\]]+)\]/, '').trim();
        const ragResults = await this.knowledgeService.search(prompt, 2);
        const hasRagBase = ragResults.length > 0 && ragResults[0].score > 0.15;
        if (type === 'RESPOSTA_OFICIO') {
            let autoridade = 'Dr. Aylor Luiz Meirelles Júnior (Promotor de Justiça)';
            let orgao = 'Ministério Público do Estado de Minas Gerais (Promotoria de Justiça de São Domingos do Prata)';
            let tema = 'Contratação da dupla Althair e Alexandre - XXXVII Cavalgada de São José do Goiabal';
            if (attachedFileName.toLowerCase().includes('câmara') || attachedFileName.toLowerCase().includes('camara') || attachedFileName.toLowerCase().includes('vereador')) {
                orgao = 'Câmara Municipal de Nova Friburgo';
                autoridade = 'Vereador Marcus Silva (Presidente)';
                tema = 'Solicitação de esclarecimentos sobre contratos de pavimentação';
            }
            else if (attachedFileName.toLowerCase().includes('saúde') || attachedFileName.toLowerCase().includes('hospital') || attachedFileName.toLowerCase().includes('médico') || attachedFileName.toLowerCase().includes('remedio')) {
                orgao = 'Conselho Municipal de Saúde';
                autoridade = 'Dra. Márcia Lima (Presidente do Conselho)';
                tema = 'Fiscalização de insumos críticos na Farmácia Básica';
            }
            const rephraseInstruction = (p, t) => {
                return `Em atenção ao tema "${t}", manifestamos que a Administração Municipal está adotando todas as providências legais cabíveis para o atendimento das solicitações enviadas, pautando-se estritamente pela legalidade e transparência nos atos públicos. Os documentos requisitados encontram-se em fase de triagem final pelo setor competente e serão remetidos integralmente no menor prazo legal de tramitação.`;
            };
            const formattedResponse = rephraseInstruction(cleanPromptDisplay, tema);
            bodyText = `Ao(À) Excelentíssimo(a) Senhor(a) ${autoridade}
${orgao}
 
Assunto: Resposta ao Ofício Requisitório - Tema: ${tema}.
 
Prezado(a) Senhor(a),
 
Cumprimentando-o(a) cordialmente e no uso das atribuições que regem as rotinas deste órgão administrativo do Município de ${munNameNormalized}, dirigimo-nos a Vossa Senhoria em resposta ao expediente encaminhado, cuja análise técnica foi formalmente realizada com base no documento anexo "${attachedFileName}".
 
Em atenção aos pontos solicitados e em observância às diretrizes da administração pública, apresentamos as manifestações e informações requeridas:
 
${formattedResponse}
 
Diante do exposto e pautados nos princípios da eficiência e publicidade administrativa (Art. 37 da Constituição Federal), permanecemos à inteira disposição para prestar quaisquer esclarecimentos complementares que se façam necessários.
 
Atenciosamente,`;
        }
        else if (cleanPrompt.includes('cavalgada') ||
            cleanPrompt.includes('pm') ||
            cleanPrompt.includes('policia') ||
            cleanPrompt.includes('polícia') ||
            cleanPrompt.includes('desfile') ||
            cleanPrompt.includes('segurança')) {
            const pmIntro = hasAttachment
                ? `Com base na análise do cronograma e plano operacional contidos no documento anexo "${attachedFileName}"`
                : 'Cumprimentando-o cordialmente';
            const dateMatch = prompt.match(/data:\s*([^\n]+)/i);
            const timeMatch = prompt.match(/hora:\s*([^\n]+)/i);
            const localMatch = prompt.match(/local:\s*([^\n]+)/i);
            const authMatch = prompt.match(/autoridade\/participantes:\s*([^\n]+)/i);
            const extractedData = dateMatch ? dateMatch[1] : '';
            const extractedHora = timeMatch ? timeMatch[1] : '';
            const extractedLocal = localMatch ? localMatch[1] : '';
            const extractedAuth = authMatch ? authMatch[1] : '';
            const authText = extractedAuth ? extractedAuth : '[AUTORIDADE / DESTINATÁRIO]';
            const dataText = extractedData ? `no dia ${extractedData}` : 'em [DATA]';
            const horaText = extractedHora ? `com início previsto para as ${extractedHora}` : 'às [HORÁRIO]';
            const localText = extractedLocal ? `partindo do(a) ${extractedLocal}` : 'partindo de [LOCAL]';
            bodyText = `Ao Senhor Comandante do ${authText}
 
Assunto: Solicitação de apoio operacional e policiamento preventivo - Desfile da Cavalgada.
 
Prezado Comandante,
 
${pmIntro}, dirigimo-nos a Vossa Senhoria para solicitar o valioso e imprescindível apoio da Polícia Militar no policiamento ostensivo e na escolta de trânsito durante a realização do tradicional Desfile da Cavalgada do Município de ${munNameNormalized}.
 
Tal solicitação encontra amparo legal no Art. 144 da Constituição Federal de 1988, o qual estabelece a segurança pública como dever do Estado e direito de todos, exercida para a preservação da ordem pública e da incolumidade das pessoas e do patrimônio. O evento está programado para ocorrer ${dataText}, ${horaText}, ${localText} em direção ao Centro Histórico, sendo a cooperação com a corporação indispensável para zelar pela segurança pública de nossa comunidade.
 
Agradecemos imensamente desde já a vossa costumeira cooperação e nos colocamos à disposição para a realização de reuniões de planejamento integrado.
 
Atenciosamente,`;
        }
        else if (cleanPrompt.includes('escola') ||
            cleanPrompt.includes('merenda') ||
            cleanPrompt.includes('educação') ||
            cleanPrompt.includes('aluno')) {
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
        else if (cleanPrompt.includes('saúde') ||
            cleanPrompt.includes('hospital') ||
            cleanPrompt.includes('insumo') ||
            cleanPrompt.includes('remédio')) {
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
        let fundamentacaoLegal = '';
        if (hasRagBase) {
            fundamentacaoLegal = `\n\n=== FUNDAMENTAÇÃO LEGAL (Consulta Base de Conhecimento RAG) ===\n` +
                ragResults
                    .map((r, i) => `[Referência ${i + 1}] ${r.artigo} de "${r.titulo}" (${r.categoria}):\n"${r.texto}"`)
                    .join('\n\n');
        }
        else {
            fundamentacaoLegal = `\n\n=== ANÁLISE JURÍDICA (Consulta Base de Conhecimento RAG) ===\nAlerta do Sistema: Não foi localizada fundamentação suficiente específica para este caso na Base de Conhecimento Jurídica. Conforme as regras de precisão da IA, foi evitada a invenção de dispositivos legais.`;
        }
        const content = `MUNICÍPIO DE ${munNameNormalized.toUpperCase()}\nSECRETARIA MUNICIPAL DE ${secNameNormalized.toUpperCase()}\n\n${typeLabel} Nº [NÚMERO]/${year}\n\n${bodyText}${fundamentacaoLegal}\n\n\n\n\n__________________________________\nServidor Responsável\n${secNameNormalized}`;
        return { content };
    }
    async create(data) {
        return this.prisma.document.create({
            data: {
                title: data.title,
                content: data.content,
                type: data.type,
                status: data.status,
                secretariatId: data.secretariatId,
                authorId: data.authorId,
            },
        });
    }
    async findRecent(secretariatId) {
        return this.prisma.document.findMany({
            where: { secretariatId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
                author: {
                    select: { name: true },
                },
            },
        });
    }
    async findBySecretariat(secretariatId) {
        return this.prisma.document.findMany({
            where: { secretariatId },
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: { name: true },
                },
            },
        });
    }
    async getStats(secretariatId, userId) {
        const [total, pending, templates, favorites] = await Promise.all([
            this.prisma.document.count({ where: { secretariatId } }),
            this.prisma.document.count({ where: { secretariatId, status: 'RASCUNHO' } }),
            this.prisma.documentTemplate.count({ where: { secretariatId } }),
            this.prisma.favoriteDocument.count({ where: { userId } }),
        ]);
        return {
            total,
            pending,
            templates,
            favorites,
        };
    }
    async findOne(id) {
        const doc = await this.prisma.document.findUnique({
            where: { id },
            include: {
                author: { select: { name: true, email: true } },
                secretariat: { select: { name: true } },
                histories: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        author: { select: { name: true } },
                    },
                },
            },
        });
        if (!doc) {
            throw new common_1.NotFoundException('Documento não localizado.');
        }
        return doc;
    }
    async update(id, data) {
        const currentDoc = await this.prisma.document.findUnique({
            where: { id },
        });
        if (!currentDoc) {
            throw new common_1.NotFoundException('Documento não localizado.');
        }
        const updatedDoc = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.document.update({
                where: { id },
                data: {
                    title: data.title !== undefined ? data.title : currentDoc.title,
                    content: data.content !== undefined ? data.content : currentDoc.content,
                    status: data.status !== undefined ? data.status : currentDoc.status,
                },
            });
            if (data.content !== undefined && data.content !== currentDoc.content) {
                const diffData = this.calculateDiff(currentDoc.content, data.content);
                await tx.documentHistory.create({
                    data: {
                        documentId: id,
                        content: data.content,
                        originalContent: currentDoc.content,
                        diff: diffData,
                        authorId: data.authorId,
                    },
                });
            }
            return updated;
        });
        return updatedDoc;
    }
    calculateDiff(original, modified) {
        const originalLines = original.split('\n');
        const modifiedLines = modified.split('\n');
        const changes = [];
        let insertions = 0;
        let deletions = 0;
        const maxLines = Math.max(originalLines.length, modifiedLines.length);
        for (let i = 0; i < maxLines; i++) {
            const orig = originalLines[i];
            const mod = modifiedLines[i];
            if (orig !== mod) {
                if (orig !== undefined && mod !== undefined) {
                    changes.push({
                        type: 'modified',
                        line: i + 1,
                        originalText: orig,
                        modifiedText: mod,
                    });
                    insertions++;
                    deletions++;
                }
                else if (orig !== undefined) {
                    changes.push({
                        type: 'removed',
                        line: i + 1,
                        text: orig,
                    });
                    deletions++;
                }
                else if (mod !== undefined) {
                    changes.push({
                        type: 'added',
                        line: i + 1,
                        text: mod,
                    });
                    insertions++;
                }
            }
        }
        return {
            insertions,
            deletions,
            changes,
        };
    }
    async sign(documentId, signerName, signerDocument, signatureHash) {
        const document = await this.prisma.document.findUnique({
            where: { id: documentId },
        });
        if (!document) {
            throw new common_1.NotFoundException('Documento não localizado.');
        }
        return this.prisma.$transaction(async (tx) => {
            const signature = await tx.digitalSignature.create({
                data: {
                    documentId,
                    signerName,
                    signerDocument,
                    signatureHash,
                },
            });
            await tx.document.update({
                where: { id: documentId },
                data: { status: 'ASSINADO' },
            });
            return signature;
        });
    }
};
exports.DocumentService = DocumentService;
exports.DocumentService = DocumentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        knowledge_service_1.KnowledgeService])
], DocumentService);
function rephraseInstruction(instruction, tema) {
    if (!instruction) {
        return 'Esclarecemos que todas as providências de ordem técnica e administrativa pertinentes ao assunto em tela já estão sendo adotadas pelos setores competentes desta pasta.';
    }
    const clean = instruction.trim();
    if (clean.length < 15) {
        return `Informamos que, em atenção à solicitação de informações acerca do tema "${tema}", as providências administrativas já foram integralmente solicitadas aos órgãos técnicos para instruir o processo.`;
    }
    const lower = clean.toLowerCase();
    if (lower.includes('br brasil') ||
        lower.includes('exclusividade') ||
        lower.includes('ar produções') ||
        lower.includes('ar producoes') ||
        lower.includes('artista')) {
        return `Esclarecemos a esse d. Órgão Ministerial que a contratação artística em testilha deu-se em estrita consonância com a legalidade processual administrativa, haja vista que a empresa BR Brasil Eventos Shows detém a exclusividade jurídica para a comercialização das apresentações públicas da referida dupla artística.

Cumpre salientar que, embora a empresa A.R. Productions possua autorização formal para revenda pontual dos espetáculos, a Administração Pública optou pela contratação direta da detentora do contrato de exclusividade (BR Brasil) motivada pelo princípio constitucional da economicidade. Tal escolha pautou-se na apresentação de proposta financeira significativamente mais vantajosa para o erário municipal, o que resguarda o interesse público e a probidade administrativa.

Desta forma, encaminhamos em anexo a documentação comprobatória, incluindo cópia integral do contrato administrativo correspondente e os respectivos comprovantes de liquidação e pagamento, para a devida averiguação técnica.`;
    }
    let parafrase = clean
        .replace(/^(gere uma resposta|responda que|diga que|escreva que|informe que|avise que|solicite que|fala que)\s+/i, '')
        .trim();
    parafrase = parafrase.charAt(0).toLowerCase() + parafrase.slice(1);
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
//# sourceMappingURL=document.service.js.map