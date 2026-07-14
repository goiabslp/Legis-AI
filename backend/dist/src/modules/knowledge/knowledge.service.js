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
var KnowledgeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const pdf = __importStar(require("pdf-parse"));
const prisma_service_1 = require("../../infra/database/prisma.service");
const supabase_service_1 = require("../../infra/supabase/supabase.service");
let KnowledgeService = KnowledgeService_1 = class KnowledgeService {
    prisma;
    supabaseService;
    logger = new common_1.Logger(KnowledgeService_1.name);
    rootPath = path.join(process.cwd().endsWith('backend') ? path.resolve(process.cwd(), '..') : process.cwd(), 'Conhecimento');
    vectorDimensions = 384;
    constructor(prisma, supabaseService) {
        this.prisma = prisma;
        this.supabaseService = supabaseService;
    }
    async onModuleInit() {
        const folders = [
            'Constituição',
            'Administração Pública',
            'Acórdãos TCU',
            'Licitações/Manuais',
            'Licitações/Perguntas_Respostas',
            'Licitações/Notas_Tecnicas',
            'Saúde',
            'Educação',
            'Assistência Social',
            'Meio Ambiente',
            'Eleitoral',
            'Redação Oficial',
            'Base Municipal',
            'Base do Usuário'
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
        try {
            const supabase = this.supabaseService.getClient();
            const { data: buckets, error: listError } = await supabase.storage.listBuckets();
            if (!listError && buckets) {
                const exists = buckets.some((b) => b.name === 'knowledge-base');
                if (!exists) {
                    const { error: createError } = await supabase.storage.createBucket('knowledge-base', {
                        public: true,
                    });
                    if (createError) {
                        this.logger.warn(`Não foi possível criar o bucket "knowledge-base": ${createError.message}`);
                    }
                    else {
                        this.logger.log('Bucket "knowledge-base" criado com sucesso no Supabase Storage.');
                    }
                }
                else {
                    this.logger.log('Bucket "knowledge-base" já existe no Supabase Storage.');
                }
            }
        }
        catch (e) {
            this.logger.warn('Modo Demo: Falha ao conectar ao Supabase Storage. Usando armazenamento e processamento local.');
        }
    }
    async uploadToSupabase(fileBuffer, fileName, mimeType, folder) {
        try {
            const supabase = this.supabaseService.getClient();
            const cleanFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            const filePath = `${folder}/${Date.now()}_${cleanFileName}`;
            const { data, error } = await supabase.storage
                .from('knowledge-base')
                .upload(filePath, fileBuffer, {
                contentType: mimeType,
                upsert: true,
            });
            if (error) {
                this.logger.warn(`Erro no upload Supabase Storage: ${error.message}`);
                return null;
            }
            const { data: publicUrlData } = supabase.storage
                .from('knowledge-base')
                .getPublicUrl(filePath);
            return publicUrlData?.publicUrl || null;
        }
        catch (error) {
            this.logger.warn('Supabase offline ou chaves ausentes. Prosseguindo sem upload em nuvem.');
            return null;
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
    chunkText(text, title, category, source) {
        const lines = text.split('\n');
        const units = [];
        let currentUnit = '';
        const articleRegex = /^\s*(Art\.\s*\d+|Artigo\s*\d+)/i;
        const paragraphRegex = /^\s*(§\s*\d+|Parágrafo\s*único)/i;
        const clauseRegex = /^\s*([IVXLCDM]+\s*[-–]\s*)/i;
        const sectionRegex = /^\s*(CAPÍTULO|TÍTULO|SEÇÃO|SECCÃO)\s+[IVXLCDM\d+]/i;
        lines.forEach((line) => {
            const trimmedLine = line.trim();
            if (!trimmedLine)
                return;
            if (articleRegex.test(trimmedLine) ||
                paragraphRegex.test(trimmedLine) ||
                clauseRegex.test(trimmedLine) ||
                sectionRegex.test(trimmedLine)) {
                if (currentUnit.trim()) {
                    units.push(currentUnit.trim());
                }
                currentUnit = line;
            }
            else {
                currentUnit += (currentUnit ? ' ' : '') + line;
            }
        });
        if (currentUnit.trim()) {
            units.push(currentUnit.trim());
        }
        if (units.length <= 1) {
            const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text];
            let temp = '';
            sentences.forEach((s) => {
                if (temp.length + s.length > 800) {
                    units.push(temp.trim());
                    temp = s;
                }
                else {
                    temp += s;
                }
            });
            if (temp.trim())
                units.push(temp.trim());
        }
        const chunks = [];
        let currentChunk = '';
        let activeArticle = 'Preâmbulo';
        units.forEach((unit) => {
            const artMatch = unit.match(/(Art\.\s*\d+|Artigo\s*\d+|CAPÍTULO\s+[IVXLCDM\d+]+|SEÇÃO\s+[IVXLCDM\d+]+)/i);
            if (artMatch) {
                activeArticle = artMatch[1];
            }
            if (unit.length > 1000) {
                if (currentChunk.trim()) {
                    chunks.push({ content: currentChunk.trim(), article: activeArticle });
                    currentChunk = '';
                }
                chunks.push({ content: unit.trim(), article: activeArticle });
                return;
            }
            if (currentChunk.length + unit.length > 1000) {
                if (currentChunk.trim()) {
                    chunks.push({ content: currentChunk.trim(), article: activeArticle });
                }
                currentChunk = unit;
            }
            else {
                currentChunk += (currentChunk ? '\n\n' : '') + unit;
            }
        });
        if (currentChunk.trim()) {
            chunks.push({ content: currentChunk.trim(), article: activeArticle });
        }
        return chunks.map((c, index) => {
            const headerContext = `[${title}] | Categoria: ${category} | Seção/Artigo: ${c.article}\n\n`;
            return {
                id: `${title.replace(/[^a-zA-Z0-9]/g, '_')}-chunk-${index}`,
                title,
                category,
                source,
                type: category.toUpperCase().includes('CONSTITUIÇÃO') ? 'CONSTITUICAO' : 'LEI',
                article: c.article,
                content: headerContext + c.content,
                metadata: {
                    original_length: c.content.length,
                    chunk_index: index,
                    total_chunks: chunks.length,
                    article: c.article,
                },
            };
        });
    }
    async indexFile(filePath, category, source = 'NACIONAL') {
        if (!fs.existsSync(filePath)) {
            throw new Error(`Arquivo não encontrado: ${filePath}`);
        }
        const dataBuffer = fs.readFileSync(filePath);
        let pdfData;
        if (typeof pdf === 'function') {
            pdfData = await pdf(dataBuffer);
        }
        else if (pdf && typeof pdf.default === 'function') {
            pdfData = await pdf.default(dataBuffer);
        }
        else if (pdf && typeof pdf.PDFParse === 'function') {
            pdfData = await pdf.PDFParse(dataBuffer);
        }
        else {
            throw new Error('A biblioteca de extração de PDF (pdf-parse) não possui um método de parse válido.');
        }
        const text = pdfData.text;
        const fileName = path.basename(filePath, path.extname(filePath));
        const title = fileName.replace(/_/g, ' ');
        const newChunks = this.chunkText(text, title, category, source);
        for (const chunk of newChunks) {
            const embedding = this.generateEmbedding(chunk.content);
            const embeddingString = `[${embedding.join(',')}]`;
            await this.prisma.$executeRawUnsafe(`DELETE FROM documents WHERE id = $1`, chunk.id);
            await this.prisma.$executeRawUnsafe(`INSERT INTO documents (id, titulo, categoria, fonte, tipo, numero, artigo, texto, metadata, embedding, data_criacao)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::vector, $11)`, chunk.id, chunk.title, chunk.category, chunk.source, chunk.type, null, chunk.article, chunk.content, JSON.stringify(chunk.metadata), embeddingString, new Date());
        }
        return newChunks.length;
    }
    async indexAll() {
        const indexedFiles = [];
        let totalChunks = 0;
        const scanDir = async (dir, category, source) => {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    await scanDir(fullPath, category || item, source);
                }
                else if (stat.isFile() && path.extname(item).toLowerCase() === '.pdf') {
                    try {
                        const chunksCount = await this.indexFile(fullPath, category || 'Geral', source);
                        indexedFiles.push(item);
                        totalChunks += chunksCount;
                    }
                    catch (e) {
                        this.logger.error(`Erro ao indexar arquivo: ${fullPath}`, e);
                    }
                }
            }
        };
        if (fs.existsSync(this.rootPath)) {
            const items = fs.readdirSync(this.rootPath);
            for (const item of items) {
                const fullPath = path.join(this.rootPath, item);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    let source = 'NACIONAL';
                    const name = item.toLowerCase();
                    if (name.includes('municipal') || name.includes('prefeitura')) {
                        source = 'MUNICIPAL';
                    }
                    else if (name.includes('usuario') || name.includes('usuário') || name.includes('pessoal')) {
                        source = 'USUARIO';
                    }
                    await scanDir(fullPath, item, source);
                }
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
        if (!query)
            return [];
        const queryEmbedding = this.generateEmbedding(query);
        const queryEmbeddingString = `[${queryEmbedding.join(',')}]`;
        try {
            const dbResults = await this.prisma.$queryRawUnsafe(`SELECT id, titulo, categoria, fonte, tipo, numero, artigo, texto, metadata, data_criacao,
                (1 - (embedding <=> $1::vector)) as similarity
         FROM documents
         ORDER BY embedding <=> $1::vector ASC
         LIMIT $2`, queryEmbeddingString, limit * 2);
            if (!dbResults || dbResults.length === 0)
                return [];
            const scoredChunks = dbResults.map((chunk) => {
                const baseSimilarity = Number(chunk.similarity || 0);
                let priorityBonus = 0;
                const cat = (chunk.categoria || '').toLowerCase();
                const fonte = (chunk.fonte || '').toLowerCase();
                if (cat.includes('constituição') || cat.includes('fundamentais') || cat.includes('lindb')) {
                    priorityBonus = 0.25;
                }
                else if (fonte === 'nacional' && (cat.includes('administração pública') ||
                    cat.includes('licitações') ||
                    cat.includes('lei 14.133') ||
                    cat.includes('responsabilidade fiscal') ||
                    cat.includes('lrf') ||
                    cat.includes('acesso à informação') ||
                    cat.includes('lgpd') ||
                    cat.includes('processo administrativo') ||
                    cat.includes('educação') ||
                    cat.includes('saúde') ||
                    cat.includes('direito civil') ||
                    cat.includes('tributário') ||
                    cat.includes('trabalho'))) {
                    priorityBonus = 0.18;
                }
                else if (cat.includes('decreto')) {
                    priorityBonus = 0.14;
                }
                else if (cat.includes('acórdão') || cat.includes('acordao') || cat.includes('tcu')) {
                    priorityBonus = 0.11;
                }
                else if (cat.includes('súmula') || cat.includes('sumula') || cat.includes('repetitivos')) {
                    priorityBonus = 0.08;
                }
                else if (cat.includes('agu')) {
                    priorityBonus = 0.06;
                }
                else if (cat.includes('cgu')) {
                    priorityBonus = 0.04;
                }
                else {
                    priorityBonus = 0.02;
                }
                const finalScore = Math.min(1.0, baseSimilarity + priorityBonus * 0.4);
                return {
                    id: chunk.id,
                    titulo: chunk.titulo,
                    artigo: chunk.artigo || 'Geral',
                    texto: chunk.texto,
                    categoria: chunk.categoria,
                    fonte: chunk.fonte,
                    score: finalScore,
                };
            });
            return scoredChunks
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
        }
        catch (err) {
            this.logger.error('Erro na busca vetorial pgvector. Verifique a tabela no banco.', err);
            return [];
        }
    }
    getFilesStructure() {
        const getStructure = (dir) => {
            const name = path.basename(dir);
            const structure = { name, isDirectory: true, children: [] };
            if (!fs.existsSync(dir))
                return structure;
            const items = fs.readdirSync(dir);
            items.forEach((item) => {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    structure.children.push(getStructure(fullPath));
                }
                else if (path.extname(item).toLowerCase() === '.pdf') {
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
};
exports.KnowledgeService = KnowledgeService;
exports.KnowledgeService = KnowledgeService = KnowledgeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        supabase_service_1.SupabaseService])
], KnowledgeService);
//# sourceMappingURL=knowledge.service.js.map