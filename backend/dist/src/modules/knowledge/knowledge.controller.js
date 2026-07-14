"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const knowledge_service_1 = require("./knowledge.service");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
let KnowledgeController = class KnowledgeController {
    knowledgeService;
    constructor(knowledgeService) {
        this.knowledgeService = knowledgeService;
    }
    async indexAll() {
        return this.knowledgeService.indexAll();
    }
    async search(query, limit) {
        if (!query) {
            throw new common_1.BadRequestException('A query de busca é obrigatória.');
        }
        const limitNum = limit ? parseInt(limit, 10) : 5;
        const results = await this.knowledgeService.search(query, limitNum);
        return {
            query,
            resultsCount: results.length,
            results,
        };
    }
    getFilesStructure() {
        return this.knowledgeService.getFilesStructure();
    }
    async uploadFile(file, category, source) {
        if (!file) {
            throw new common_1.BadRequestException('Nenhum arquivo enviado.');
        }
        const cat = category || 'Geral';
        const src = source || 'NACIONAL';
        try {
            const fileBuffer = fs.readFileSync(file.path);
            const folder = src.toLowerCase();
            await this.knowledgeService.uploadToSupabase(fileBuffer, file.filename, file.mimetype, folder);
        }
        catch (e) {
        }
        const chunksCount = await this.knowledgeService.indexFile(file.path, cat, src);
        return {
            success: true,
            message: `Arquivo ${file.filename} adicionado e indexado na categoria "${cat}" (${src}) com sucesso.`,
            filename: file.filename,
            sizeBytes: file.size,
            path: file.path,
            category: cat,
            source: src,
            chunksCount,
        };
    }
};
exports.KnowledgeController = KnowledgeController;
__decorate([
    (0, common_1.Post)('index-all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "indexAll", null);
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)('query')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('files'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], KnowledgeController.prototype, "getFilesStructure", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: (req, file, cb) => {
                const rootPath = path.join(process.cwd().endsWith('backend') ? path.resolve(process.cwd(), '..') : process.cwd(), 'Conhecimento');
                const category = req.body.category || 'Geral';
                const destinationPath = path.join(rootPath, category);
                if (!fs.existsSync(destinationPath)) {
                    fs.mkdirSync(destinationPath, { recursive: true });
                }
                cb(null, destinationPath);
            },
            filename: (req, file, cb) => {
                const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
                cb(null, safeName);
            },
        }),
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('category')),
    __param(2, (0, common_1.Body)('source')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], KnowledgeController.prototype, "uploadFile", null);
exports.KnowledgeController = KnowledgeController = __decorate([
    (0, common_1.Controller)('knowledge'),
    __metadata("design:paramtypes", [knowledge_service_1.KnowledgeService])
], KnowledgeController);
//# sourceMappingURL=knowledge.controller.js.map