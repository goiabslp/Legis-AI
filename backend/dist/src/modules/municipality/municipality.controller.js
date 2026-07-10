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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MunicipalityController = void 0;
const common_1 = require("@nestjs/common");
const municipality_service_1 = require("./municipality.service");
let MunicipalityController = class MunicipalityController {
    municipalityService;
    constructor(municipalityService) {
        this.municipalityService = municipalityService;
    }
    async update(id, data) {
        return this.municipalityService.update(id, data);
    }
    async addSecretariat(id, data) {
        return this.municipalityService.addSecretariat(id, data);
    }
};
exports.MunicipalityController = MunicipalityController;
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MunicipalityController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/secretariats'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MunicipalityController.prototype, "addSecretariat", null);
exports.MunicipalityController = MunicipalityController = __decorate([
    (0, common_1.Controller)('municipalities'),
    __metadata("design:paramtypes", [municipality_service_1.MunicipalityService])
], MunicipalityController);
//# sourceMappingURL=municipality.controller.js.map