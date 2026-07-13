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
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const pdf = __importStar(require("pdf-parse"));
let KnowledgeService = class KnowledgeService {
    rootPath = path.join(process.cwd().endsWith('backend') ? path.resolve(process.cwd(), '..') : process.cwd(), 'Conhecimento');
    storePath = path.join(this.rootPath, 'vector-store.json');
    vectorDimensions = 384;
    onModuleInit() {
        const folders = [
            'Constituição',
            'Administração Pública',
            'Licitações/Acordaos_TCU',
            'Licitações/Manuais',
            'Licitações/Perguntas_Respostas',
            'Licitações/Notas_Tecnicas',
            'Saúde',
            'Educação',
            'Assistência Social',
            'Meio Ambiente',
            'Eleitoral',
            'Redação Oficial',
        ];
        if (!fs.existsSync(this.rootPath)) {
            fs.mkdirSync(this.rootPath, { recursive: true });
        }
        folders.forEach((folder) => {
            const folderPath = path.join(this.rootPath, folder);
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
            }
        });
        if (!fs.existsSync(this.storePath)) {
            fs.writeFileSync(this.storePath, JSON.stringify([]));
        }
    }
    generateEmbedding(text) {
        const embedding = new Array(this.vectorDimensions).fill(0);
        const cleanText = text.toLowerCase().replace(/[^\w\s]/g, '');
        const words = cleanText.split(/\s+/).filter((w) => w.length > 2);
        for (let i = 0; i < this.vectorDimensions; i++) {
            let val = 0;
            words.forEach((word, wordIdx) => {
                for (let charIdx = 0; charIdx < word.length; charIdx++) {
                    val += Math.sin(word.charCodeAt(charIdx) * (i + 1) + wordIdx);
                }
            });
            embedding[i] = Math.tanh(val / (words.length || 1));
        }
        const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        return magnitude > 0 ? embedding.map((val) => val / magnitude) : embedding;
    }
    cosineSimilarity(vecA, vecB) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        return normB && normA ? dotProduct / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
    }
    async indexFile(filePath, category) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`Arquivo não encontrado: ${filePath}`);
        }
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdf(dataBuffer);
        const text = pdfData.text;
        const articleRegex = /(?=Art\.\s*\d+|Artigo\s*\d+)/gi;
        let chunksText = text.split(articleRegex);
        if (chunksText.length <= 1) {
            chunksText = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text];
            const groupedChunks = [];
            let temp = '';
            chunksText.forEach((c) => {
                if (temp.length + c.length > 1000) {
                    groupedChunks.push(temp.trim());
                    temp = c;
                }
                else {
                    temp += c;
                }
            });
            if (temp.trim())
                groupedChunks.push(temp.trim());
            chunksText = groupedChunks;
        }
        const fileName = path.basename(filePath, path.extname(filePath));
        const newChunks = [];
        chunksText.forEach((chunk, index) => {
            const trimmedChunk = chunk.trim();
            if (trimmedChunk.length < 30)
                return;
            const artMatch = trimmedChunk.match(/^(Art\.\s*\d+|Artigo\s*\d+)/i);
            const artigoLabel = artMatch ? artMatch[1] : `Seção ${index + 1}`;
            const cleanWords = trimmedChunk
                .toLowerCase()
                .replace(/[^\w\s]/g, '')
                .split(/\s+/)
                .filter((w) => w.length > 4 && !this.isStopword(w));
            const wordCounts = {};
            cleanWords.forEach((w) => {
                wordCounts[w] = (wordCounts[w] || 0) + 1;
            });
            const sortedWords = Object.keys(wordCounts).sort((a, b) => wordCounts[b] - wordCounts[a]);
            const keywords = sortedWords.slice(0, 5);
            const subjects = keywords.map((k) => k.charAt(0).toUpperCase() + k.slice(1));
            const embedding = this.generateEmbedding(trimmedChunk);
            newChunks.push({
                id: `${fileName}-chunk-${index}`,
                titulo: fileName.replace(/_/g, ' '),
                artigo: artigoLabel,
                assunto: subjects.slice(0, 2),
                palavras_chave: keywords,
                texto: trimmedChunk,
                embedding: embedding,
                categoria: category,
            });
        });
        const currentStore = JSON.parse(fs.readFileSync(this.storePath, 'utf8'));
        const filteredStore = currentStore.filter((c) => !c.id.startsWith(`${fileName}-`));
        const updatedStore = [...filteredStore, ...newChunks];
        fs.writeFileSync(this.storePath, JSON.stringify(updatedStore, null, 2));
        return newChunks.length;
    }
    async indexAll() {
        const indexedFiles = [];
        let totalChunks = 0;
        const scanDir = async (dir, category) => {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    await scanDir(fullPath, category || item);
                }
                else if (stat.isFile() && path.extname(item).toLowerCase() === '.pdf') {
                    try {
                        const chunksCount = await this.indexFile(fullPath, category || 'Geral');
                        indexedFiles.push(item);
                        totalChunks += chunksCount;
                    }
                    catch (e) {
                        console.error(`Erro ao indexar arquivo: ${fullPath}`, e);
                    }
                }
            }
        };
        const items = fs.readdirSync(this.rootPath);
        for (const item of items) {
            const fullPath = path.join(this.rootPath, item);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                await scanDir(fullPath, item);
            }
        }
        return {
            success: true,
            filesCount: indexedFiles.length,
            chunksCount: totalChunks,
            files: indexedFiles,
        };
    }
    async search(query, limit = 5) {
        if (!fs.existsSync(this.storePath)) {
            return [];
        }
        const store = JSON.parse(fs.readFileSync(this.storePath, 'utf8'));
        if (store.length === 0)
            return [];
        const queryEmbedding = this.generateEmbedding(query);
        const scoredChunks = store.map((chunk) => {
            const similarity = this.cosineSimilarity(queryEmbedding, chunk.embedding);
            return {
                titulo: chunk.titulo,
                artigo: chunk.artigo,
                assunto: chunk.assunto,
                palavras_chave: chunk.palavras_chave,
                texto: chunk.texto,
                categoria: chunk.categoria,
                score: similarity,
            };
        });
        return scoredChunks
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }
    getFilesStructure() {
        const getStructure = (dir) => {
            const structure = { name: path.basename(dir), isDirectory: true, children: [] };
            const items = fs.readdirSync(dir);
            items.forEach((item) => {
                if (item === 'vector-store.json')
                    return;
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    structure.children.push(getStructure(fullPath));
                }
                else {
                    structure.children.push({
                        name: item,
                        isDirectory: false,
                        sizeBytes: stat.size,
                        path: fullPath,
                    });
                }
            });
            return structure;
        };
        return getStructure(this.rootPath);
    }
    getRootPath() {
        return this.rootPath;
    }
    isStopword(word) {
        const stopwords = [
            'para', 'como', 'uma', 'umas', 'pelo', 'pela', 'pelos', 'pelas', 'com', 'sem', 'sob', 'sobre',
            'mais', 'menos', 'este', 'esta', 'estes', 'estas', 'aquele', 'aquela', 'aqueles', 'aquelas',
            'seus', 'suas', 'meus', 'minhas', 'teus', 'tua', 'isso', 'isto', 'aquilo', 'tendo', 'sendo',
            'forma', 'lei', 'artigo', 'decreto', 'portaria', 'onde', 'quando', 'quem', 'cujo', 'cuja',
            'art', 'lei', 'leis', 'artigos', 'conforme', 'nos', 'nas', 'dos', 'das', 'uma', 'um'
        ];
        return stopwords.includes(word);
    }
};
exports.KnowledgeService = KnowledgeService;
exports.KnowledgeService = KnowledgeService = __decorate([
    (0, common_1.Injectable)()
], KnowledgeService);
//# sourceMappingURL=knowledge.service.js.map