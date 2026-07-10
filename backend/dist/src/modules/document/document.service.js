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
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infra/database/prisma.service");
let DocumentService = class DocumentService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateIA(prompt, type, municipalityName, secretariatName) {
        const year = new Date().getFullYear();
        const typeLabel = type === 'OFICIO' ? 'OFÍCIO CIRCULAR' : type === 'MEMORANDO' ? 'MEMORANDO INTERNO' : 'DECRETO MUNICIPAL';
        const content = `MUNICÍPIO DE ${municipalityName?.toUpperCase() || 'EXEMPLO'}\nSECRETARIA MUNICIPAL DE ${secretariatName?.toUpperCase() || 'ADMINISTRAÇÃO'}\n\n${typeLabel} Nº 124/${year}\n\nAo(A) Senhor(a) Diretor(a),\n\nAssunto: Solicitação de providências conforme solicitado pelo usuário.\n\nServimo-nos do presente para, no uso de nossas atribuições regulamentares, solicitar formalmente de Vossa Senhoria a adoção de medidas necessárias no que tange a: "${prompt}".\n\nTal solicitação fundamenta-se na necessidade urgente de otimização dos fluxos operacionais e na estrita observância dos princípios constitucionais da eficiência e da legalidade que regem a Administração Pública Municipal.\n\nCertos da vossa costumeira atenção e presteza na condução dos assuntos de interesse público, renovamos na oportunidade protestos de elevada estima e distinta consideração.\n\nAtenciosamente,\n\n__________________________________\nServidor Autorizado\nSecretaria de ${secretariatName || 'Administração'}`;
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
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DocumentService);
//# sourceMappingURL=document.service.js.map