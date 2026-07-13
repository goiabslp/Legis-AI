import { KnowledgeService } from './knowledge.service';
export declare class KnowledgeController {
    private readonly knowledgeService;
    constructor(knowledgeService: KnowledgeService);
    indexAll(): Promise<any>;
    search(query: string, limit?: string): Promise<{
        query: string;
        resultsCount: number;
        results: any[];
    }>;
    getFilesStructure(): any;
    uploadFile(file: any, category: string): Promise<{
        success: boolean;
        message: string;
        filename: any;
        sizeBytes: any;
        path: any;
        category: string;
        chunksCount: number;
    }>;
}
