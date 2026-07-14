import { PrismaService } from '../../infra/database/prisma.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
export declare class DocumentService {
    private prisma;
    private knowledgeService;
    constructor(prisma: PrismaService, knowledgeService: KnowledgeService);
    generateIA(prompt: string, type: string, municipalityName?: string, secretariatName?: string): Promise<{
        content: string;
    }>;
    create(data: {
        title: string;
        content: string;
        type: string;
        status: string;
        secretariatId: string;
        authorId: string;
    }): Promise<{
        id: string;
        title: string;
        content: string;
        type: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        secretariatId: string;
        authorId: string;
    }>;
    findRecent(secretariatId: string): Promise<({
        author: {
            name: string;
        };
    } & {
        id: string;
        title: string;
        content: string;
        type: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        secretariatId: string;
        authorId: string;
    })[]>;
    findBySecretariat(secretariatId: string): Promise<({
        author: {
            name: string;
        };
    } & {
        id: string;
        title: string;
        content: string;
        type: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        secretariatId: string;
        authorId: string;
    })[]>;
    getStats(secretariatId: string, userId: string): Promise<{
        total: number;
        pending: number;
        templates: number;
        favorites: number;
    }>;
    sign(documentId: string, signerName: string, signerDocument: string, signatureHash: string): Promise<{
        id: string;
        signerName: string;
        signerDocument: string;
        signatureHash: string;
        signedAt: Date;
        documentId: string;
    }>;
}
export declare function rephraseInstruction(instruction: string, tema: string): string;
