import { MunicipalityService } from './municipality.service';
export declare class MunicipalityController {
    private readonly municipalityService;
    constructor(municipalityService: MunicipalityService);
    update(id: string, data: {
        name?: string;
        cnpj?: string;
        logoUrl?: string;
        primaryColor?: string;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        cnpj: string;
        logoUrl: string | null;
        primaryColor: string;
    }>;
    addSecretariat(id: string, data: {
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
