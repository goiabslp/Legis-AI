import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma.service';

@Injectable()
export class DocumentService {
  constructor(private prisma: PrismaService) {}

  async generateIA(prompt: string, type: string, municipalityName?: string, secretariatName?: string) {
    // Integração simulada com IA generativa (OpenAI/Gemini)
    // Retorna a redação em papel timbrado municipal formatado de forma limpa.
    const year = new Date().getFullYear();
    const typeLabel = type === 'OFICIO' ? 'OFÍCIO CIRCULAR' : type === 'MEMORANDO' ? 'MEMORANDO INTERNO' : 'DECRETO MUNICIPAL';
    
    const content = `MUNICÍPIO DE ${municipalityName?.toUpperCase() || 'EXEMPLO'}\nSECRETARIA MUNICIPAL DE ${secretariatName?.toUpperCase() || 'ADMINISTRAÇÃO'}\n\n${typeLabel} Nº 124/${year}\n\nAo(A) Senhor(a) Diretor(a),\n\nAssunto: Solicitação de providências conforme solicitado pelo usuário.\n\nServimo-nos do presente para, no uso de nossas atribuições regulamentares, solicitar formalmente de Vossa Senhoria a adoção de medidas necessárias no que tange a: "${prompt}".\n\nTal solicitação fundamenta-se na necessidade urgente de otimização dos fluxos operacionais e na estrita observância dos princípios constitucionais da eficiência e da legalidade que regem a Administração Pública Municipal.\n\nCertos da vossa costumeira atenção e presteza na condução dos assuntos de interesse público, renovamos na oportunidade protestos de elevada estima e distinta consideração.\n\nAtenciosamente,\n\n__________________________________\nServidor Autorizado\nSecretaria de ${secretariatName || 'Administração'}`;

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
