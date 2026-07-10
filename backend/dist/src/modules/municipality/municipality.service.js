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
exports.MunicipalityService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infra/database/prisma.service");
let MunicipalityService = class MunicipalityService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async update(id, data) {
        const municipality = await this.prisma.municipality.findUnique({
            where: { id },
        });
        if (!municipality) {
            throw new common_1.NotFoundException('Município não localizado.');
        }
        return this.prisma.municipality.update({
            where: { id },
            data,
        });
    }
    async addSecretariat(municipalityId, data) {
        const municipality = await this.prisma.municipality.findUnique({
            where: { id: municipalityId },
        });
        if (!municipality) {
            throw new common_1.NotFoundException('Município não localizado.');
        }
        return this.prisma.secretariat.create({
            data: {
                name: data.name,
                code: data.code.toUpperCase(),
                municipalityId,
            },
        });
    }
};
exports.MunicipalityService = MunicipalityService;
exports.MunicipalityService = MunicipalityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MunicipalityService);
//# sourceMappingURL=municipality.service.js.map