import { OnModuleInit } from '@nestjs/common';
export declare class KnowledgeService implements OnModuleInit {
    private rootPath;
    private storePath;
    private vectorDimensions;
    onModuleInit(): void;
    generateEmbedding(text: string): number[];
    private cosineSimilarity;
    indexFile(filePath: string, category: string): Promise<number>;
    indexAll(): Promise<any>;
    search(query: string, limit?: number): Promise<any[]>;
    getFilesStructure(): any;
    getRootPath(): string;
    private isStopword;
}
