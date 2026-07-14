import { PrismaService } from '../../infra/database/prisma.service';
export declare class MunicipalityService {
    private prisma;
    constructor(prisma: PrismaService);
    update(id: string, data: {
        name?: string;
        cnpj?: string;
        logoUrl?: string;
        primaryColor?: string;
    }): Promise<{
        id: string;
        cnpj: string;
        name: string;
        logoUrl: string | null;
        primaryColor: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    addSecretariat(municipalityId: string, data: {
        name: string;
        code: string;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        municipalityId: string;
        code: string;
    }>;
}
