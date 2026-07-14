import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma.service';
import { SupabaseService } from '../../infra/supabase/supabase.service';
interface KnowledgeChunk {
    id: string;
    title: string;
    category: string;
    source: string;
    type: string;
    article: string;
    content: string;
    metadata: any;
}
export declare class KnowledgeService implements OnModuleInit {
    private readonly prisma;
    private readonly supabaseService;
    private readonly logger;
    private rootPath;
    private vectorDimensions;
    constructor(prisma: PrismaService, supabaseService: SupabaseService);
    onModuleInit(): Promise<void>;
    uploadToSupabase(fileBuffer: Buffer, fileName: string, mimeType: string, folder: string): Promise<string | null>;
    generateEmbedding(text: string): number[];
    chunkText(text: string, title: string, category: string, source: string): KnowledgeChunk[];
    indexFile(filePath: string, category: string, source?: string): Promise<number>;
    indexAll(): Promise<any>;
    search(query: string, limit?: number): Promise<any[]>;
    getFilesStructure(): any;
    getRootPath(): string;
}
export {};
