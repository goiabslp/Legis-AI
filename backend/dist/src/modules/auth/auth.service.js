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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infra/database/prisma.service");
let AuthService = class AuthService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async register(dto) {
        const existingMunicipality = await this.prisma.municipality.findUnique({
            where: { cnpj: dto.cnpj },
        });
        if (existingMunicipality) {
            throw new common_1.ConflictException('Já existe um município cadastrado com este CNPJ.');
        }
        try {
            return await this.prisma.$transaction(async (tx) => {
                const municipality = await tx.municipality.create({
                    data: {
                        name: dto.municipalityName,
                        cnpj: dto.cnpj,
                    },
                });
                const secretariat = await tx.secretariat.create({
                    data: {
                        name: dto.secretariatName,
                        code: dto.secretariatCode.toUpperCase(),
                        municipalityId: municipality.id,
                    },
                });
                const user = await tx.user.create({
                    data: {
                        id: dto.userId,
                        email: dto.email,
                        name: dto.name,
                        role: 'ADMIN',
                        secretariatId: secretariat.id,
                        municipalityId: municipality.id,
                    },
                });
                return {
                    user,
                    secretariat,
                    municipality,
                };
            });
        }
        catch (error) {
            console.error('Erro na transação de registro:', error);
            throw new common_1.InternalServerErrorException('Falha interna ao criar as entidades no banco.');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map