import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma.service';

@Injectable()
export class DocumentService {
  constructor(private prisma: PrismaService) {}

  async generateIA(prompt: string, type: string, municipalityName?: string, secretariatName?: string) {
    const year = new Date().getFullYear();
    const typeLabel =
      type === 'OFICIO'
        ? 'OFÍCIO CIRCULAR'
        : type === 'MEMORANDO'
        ? 'MEMORANDO INTERNO'
        : type === 'MANIFESTACAO'
        ? 'MANIFESTAÇÃO JUDICIAL'
        : 'DECRETO MUNICIPAL';
    const munNameNormalized = municipalityName || 'Nova Friburgo';
    const secNameNormalized = secretariatName || 'Secretaria Municipal de Administração';

    let bodyText = '';
    const cleanPrompt = prompt.toLowerCase();

    // Caso 0: Manifestação Judiciária
    if (
      type === 'MANIFESTACAO' ||
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

Cumprimentando-o respeitosamente, dirigimo-nos a Vossa Excelência, em resposta ao Ofício Judicial nº 450/2026, expedido nos autos do processo em epígrafe, para prestar as informações solicitadas por este juízo no que concerne à seguinte determinação: "${prompt}".

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
      bodyText = `Ao Senhor Comandante do 11º Batalhão de Polícia Militar

Assunto: Solicitação de apoio para policiamento e escolta - Desfile da Cavalgada 2026.

Prezado Comandante,

Cumprimentando-o cordialmente, dirigimo-nos a Vossa Senhoria para solicitar o valioso apoio da Polícia Militar no policiamento preventivo e na escolta de trânsito durante a realização do tradicional Desfile da Cavalgada 2026 do Município de ${munNameNormalized}.

O evento em apreço está programado para ocorrer no dia 12 de outubro de 2026, com início previsto para as 09:00 horas, partindo do Parque de Exposições Municipal em direção ao Centro Histórico. Prevemos a participação de aproximadamente 500 cavaleiros e um grande público ao longo do percurso.

A presença e a escolta da Polícia Militar são indispensáveis para garantir a integridade dos participantes, ordenar o trânsito nas vias afetadas e zelar pela segurança e tranquilidade pública de nossa comunidade.

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

Dirigimo-nos a Vossa Senhoria para tratar de assunto relevante para as rotinas deste órgão administrativo, especificamente no que concerne à seguinte demanda formalizada por esta secretaria: "${prompt}".

Com o objetivo de zelar pelos princípios da legalidade, publicidade e eficiência administrativa, solicitamos a adoção das providências cabíveis para a instrução processual do tema e posterior tomada de decisões.

Permanecemos à disposição para prestar esclarecimentos complementares que se façam necessários para a conclusão desta demanda no menor prazo possível.

Atenciosamente,`;
    }

    const content = `MUNICÍPIO DE ${munNameNormalized.toUpperCase()}\nSECRETARIA MUNICIPAL DE ${secNameNormalized.toUpperCase()}\n\n${typeLabel} Nº 124/${year}\n\n${bodyText}\n\n__________________________________\nServidor Responsável\nSecretaria de ${secNameNormalized}`;

    return { content };
  }

  async create(data: { title: string; content: string; type: string; status: string; secretariatId: string; authorId: string }) {
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

  async findRecent(secretariatId: string) {
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

  async getStats(secretariatId: string, userId: string) {
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

  async sign(documentId: string, signerName: string, signerDocument: string, signatureHash: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Documento não localizado.');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Cria a assinatura digital
      const signature = await tx.digitalSignature.create({
        data: {
          documentId,
          signerName,
          signerDocument,
          signatureHash,
        },
      });

      // 2. Atualiza o status do documento para ASSINADO
      await tx.document.update({
        where: { id: documentId },
        data: { status: 'ASSINADO' },
      });

      return signature;
    });
  }
}
