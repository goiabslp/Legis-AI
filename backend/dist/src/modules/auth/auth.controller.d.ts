import { AuthService } from './auth.service';
interface RegisterDto {
    userId: string;
    email: string;
    name: string;
    municipalityName: string;
    cnpj: string;
    secretariatName: string;
    secretariatCode: string;
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
            createdAt: Date;
            updatedAt: Date;
            secretariatId: string | null;
            municipalityId: string;
        };
        secretariat: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            municipalityId: string;
            code: string;
        };
        municipality: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            cnpj: string;
            logoUrl: string | null;
            primaryColor: string;
        };
    }>;
}
export {};
