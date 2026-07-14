import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as pdf from 'pdf-parse';
import { PrismaService } from '../../infra/database/prisma.service';
import { SupabaseService } from '../../infra/supabase/supabase.service';

interface KnowledgeChunk {
  id: string;
  title: string;
  category: string;
  source: string;
  type: string;
  article: string;
  content: string;
  metadata: any;
}

@Injectable()
export class KnowledgeService implements OnModuleInit {
  private readonly logger = new Logger(KnowledgeService.name);
  
  private rootPath = path.join(
    process.cwd().endsWith('backend') ? path.resolve(process.cwd(), '..') : process.cwd(),
    'Conhecimento'
  );
  
  private vectorDimensions = 384;

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async onModuleInit() {
    // Garante que a estrutura de pastas recomendada exista
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

    // Inicializa o bucket "knowledge-base" no Supabase Storage de forma segura
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
          } else {
            this.logger.log('Bucket "knowledge-base" criado com sucesso no Supabase Storage.');
          }
        } else {
          this.logger.log('Bucket "knowledge-base" já existe no Supabase Storage.');
        }
      }
    } catch (e) {
      this.logger.warn('Modo Demo: Falha ao conectar ao Supabase Storage. Usando armazenamento e processamento local.');
    }
  }

  // Faz upload de arquivos PDF para o Supabase Storage se disponível
  async uploadToSupabase(fileBuffer: Buffer, fileName: string, mimeType: string, folder: string): Promise<string | null> {
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
    } catch (error) {
      this.logger.warn('Supabase offline ou chaves ausentes. Prosseguindo sem upload em nuvem.');
      return null;
    }
  }

  // Gera embeddings determinísticos de 384 dimensões offline
  generateEmbedding(text: string): number[] {
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

    // L2 Normalization
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? embedding.map((val) => val / magnitude) : embedding;
  }

  // Algoritmo de chunking estrito: nunca divide artigos, parágrafos ou incisos ao meio
  chunkText(text: string, title: string, category: string, source: string): KnowledgeChunk[] {
    const lines = text.split('\n');
    const units: string[] = [];
    let currentUnit = '';

    // Regexes de divisões legais
    const articleRegex = /^\s*(Art\.\s*\d+|Artigo\s*\d+)/i;
    const paragraphRegex = /^\s*(§\s*\d+|Parágrafo\s*único)/i;
    const clauseRegex = /^\s*([IVXLCDM]+\s*[-–]\s*)/i; // Incisos em algarismos romanos
    const sectionRegex = /^\s*(CAPÍTULO|TÍTULO|SEÇÃO|SECCÃO)\s+[IVXLCDM\d+]/i;

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      if (
        articleRegex.test(trimmedLine) ||
        paragraphRegex.test(trimmedLine) ||
        clauseRegex.test(trimmedLine) ||
        sectionRegex.test(trimmedLine)
      ) {
        if (currentUnit.trim()) {
          units.push(currentUnit.trim());
        }
        currentUnit = line;
      } else {
        currentUnit += (currentUnit ? ' ' : '') + line;
      }
    });

    if (currentUnit.trim()) {
      units.push(currentUnit.trim());
    }

    // Fallback: se o PDF não for formatado em lei, divide por sentenças a cada 800 caracteres
    if (units.length <= 1) {
      const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text];
      let temp = '';
      sentences.forEach((s) => {
        if (temp.length + s.length > 800) {
          units.push(temp.trim());
          temp = s;
        } else {
          temp += s;
        }
      });
      if (temp.trim()) units.push(temp.trim());
    }

    const chunks: any[] = [];
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
      } else {
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
        source, // NACIONAL, MUNICIPAL, USUARIO
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

  // Extrai texto do PDF e insere os chunks indexados no banco pgvector
  async indexFile(filePath: string, category: string, source = 'NACIONAL'): Promise<number> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo não encontrado: ${filePath}`);
    }

    const dataBuffer = fs.readFileSync(filePath);
    
    let text = '';
    if (typeof pdf === 'function') {
      const pdfData = await (pdf as any)(dataBuffer);
      text = pdfData.text;
    } else if (pdf && typeof (pdf as any).default === 'function') {
      const pdfData = await (pdf as any).default(dataBuffer);
      text = pdfData.text;
    } else if (pdf && typeof (pdf as any).PDFParse === 'function') {
      const parser = new (pdf as any).PDFParse({ data: dataBuffer });
      const result = await parser.getText();
      text = result.text;
    } else {
      throw new Error('A biblioteca de extração de PDF (pdf-parse) não possui um método de parse válido.');
    }

    const fileName = path.basename(filePath, path.extname(filePath));
    const title = fileName.replace(/_/g, ' ');

    const newChunks = this.chunkText(text, title, category, source);

    for (const chunk of newChunks) {
      const embedding = this.generateEmbedding(chunk.content);
      const embeddingString = `[${embedding.join(',')}]`;

      // Evita duplicações
      await this.prisma.$executeRawUnsafe(
        `DELETE FROM documents WHERE id = $1`,
        chunk.id
      );

      // Insere o chunk no banco via SQL brutas
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO documents (id, titulo, categoria, fonte, tipo, numero, artigo, texto, metadata, embedding, data_criacao)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::vector, $11)`,
        chunk.id,
        chunk.title,
        chunk.category,
        chunk.source,
        chunk.type,
        null,
        chunk.article,
        chunk.content,
        JSON.stringify(chunk.metadata),
        embeddingString,
        new Date()
      );
    }

    return newChunks.length;
  }

  // Faz a varredura recursiva das pastas de Conhecimento do servidor para indexar PDFs
  async indexAll(): Promise<any> {
    const indexedFiles: string[] = [];
    let totalChunks = 0;

    const scanDir = async (dir: string, category: string, source: string) => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          await scanDir(fullPath, category || item, source);
        } else if (stat.isFile() && path.extname(item).toLowerCase() === '.pdf') {
          try {
            const chunksCount = await this.indexFile(fullPath, category || 'Geral', source);
            indexedFiles.push(item);
            totalChunks += chunksCount;
          } catch (e) {
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
          // Determina a fonte
          let source = 'NACIONAL';
          const name = item.toLowerCase();
          if (name.includes('municipal') || name.includes('prefeitura')) {
            source = 'MUNICIPAL';
          } else if (name.includes('usuario') || name.includes('usuário') || name.includes('pessoal')) {
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

  // Realiza a busca vetorial (pgvector) aplicando o bônus de prioridade legal
  async search(query: string, limit = 5): Promise<any[]> {
    if (!query) return [];

    const queryEmbedding = this.generateEmbedding(query);
    const queryEmbeddingString = `[${queryEmbedding.join(',')}]`;

    try {
      // Query SQL crua usando a distância do cosseno (<=>) do pgvector
      const dbResults: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT id, titulo, categoria, fonte, tipo, numero, artigo, texto, metadata, data_criacao,
                (1 - (embedding <=> $1::vector)) as similarity
         FROM documents
         ORDER BY embedding <=> $1::vector ASC
         LIMIT $2`,
        queryEmbeddingString,
        limit * 2 // buscamos o dobro e refinamos com bônus de prioridade
      );

      if (!dbResults || dbResults.length === 0) return [];

      const scoredChunks = dbResults.map((chunk) => {
        const baseSimilarity = Number(chunk.similarity || 0);
        let priorityBonus = 0;
        
        const cat = (chunk.categoria || '').toLowerCase();
        const fonte = (chunk.fonte || '').toLowerCase();

        // Hierarquia de prioridade legal (Regra AGENTS.md)
        if (cat.includes('constituição') || cat.includes('fundamentais') || cat.includes('lindb')) {
          priorityBonus = 0.25; // Prioridade 1: CF/88
        } else if (fonte === 'nacional' && (
          cat.includes('administração pública') ||
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
          cat.includes('trabalho')
        )) {
          priorityBonus = 0.18; // Prioridade 2: Leis Federais
        } else if (cat.includes('decreto')) {
          priorityBonus = 0.14; // Prioridade 3: Decretos
        } else if (cat.includes('acórdão') || cat.includes('acordao') || cat.includes('tcu')) {
          priorityBonus = 0.11; // Prioridade 4: Acórdãos TCU
        } else if (cat.includes('súmula') || cat.includes('sumula') || cat.includes('repetitivos')) {
          priorityBonus = 0.08; // Prioridade 5: Súmulas STF/STJ
        } else if (cat.includes('agu')) {
          priorityBonus = 0.06; // Prioridade 6: AGU
        } else if (cat.includes('cgu')) {
          priorityBonus = 0.04; // Prioridade 7: CGU
        } else {
          priorityBonus = 0.02; // Leis Municipais, Manuais Técnicos e Base do Usuário
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

    } catch (err) {
      this.logger.error('Erro na busca vetorial pgvector. Verifique a tabela no banco.', err);
      return [];
    }
  }

  // Varre a pasta física para expor a estrutura de diretórios e arquivos
  getFilesStructure(): any {
    const getStructure = (dir: string) => {
      const name = path.basename(dir);
      const structure: any = { name, isDirectory: true, children: [] };
      if (!fs.existsSync(dir)) return structure;

      const items = fs.readdirSync(dir);
      items.forEach((item) => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          structure.children.push(getStructure(fullPath));
        } else if (path.extname(item).toLowerCase() === '.pdf') {
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

  getRootPath(): string {
    return this.rootPath;
  }
}
