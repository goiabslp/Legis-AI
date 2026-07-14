import { DocumentService } from './document.service';
export declare class DocumentController {
    private readonly documentService;
    constructor(documentService: DocumentService);
    generateIA(body: {
        prompt: string;
        type: string;
        municipalityName?: string;
        secretariatName?: string;
    }): Promise<{
        content: string;
    }>;
    create(body: {
        title: string;
        content: string;
        type: string;
        status: string;
        secretariatId?: string;
        authorId?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        secretariatId: string;
        title: string;
        content: string;
        type: string;
        status: string;
        authorId: string;
    }>;
    findRecent(secretariatId?: string): Promise<({
        author: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        secretariatId: string;
        title: string;
        content: string;
        type: string;
        status: string;
        authorId: string;
    })[]>;
    getStats(secretariatId?: string, userId?: string): Promise<{
        total: number;
        pending: number;
        templates: number;
        favorites: number;
    }>;
    findOne(id: string): Promise<{
        secretariat: {
            name: string;
        };
        histories: ({
            author: {
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            content: string;
            authorId: string;
            documentId: string;
            originalContent: string | null;
            diff: import("@prisma/client/runtime/client").JsonValue | null;
        })[];
        author: {
            name: string;
            email: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        secretariatId: string;
        title: string;
        content: string;
        type: string;
        status: string;
        authorId: string;
    }>;
    update(id: string, body: {
        title?: string;
        content?: string;
        status?: string;
        authorId?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        secretariatId: string;
        title: string;
        content: string;
        type: string;
        status: string;
        authorId: string;
    }>;
    sign(body: {
        documentId: string;
        signerName: string;
        signerDocument: string;
        signatureHash: string;
    }): Promise<{
        id: string;
        signerName: string;
        signerDocument: string;
        signatureHash: string;
        signedAt: Date;
        documentId: string;
    }>;
}
