import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as pdf from 'pdf-parse';

interface KnowledgeChunk {
  id: string;
  titulo: string;
  artigo: string;
  assunto: string[];
  palavras_chave: string[];
  texto: string;
  embedding: number[];
  categoria: string;
}

@Injectable()
export class KnowledgeService implements OnModuleInit {
  private rootPath = path.join(
    process.cwd().endsWith('backend') ? path.resolve(process.cwd(), '..') : process.cwd(),
    'Conhecimento'
  );
  private storePath = path.join(this.rootPath, 'vector-store.json');
  private vectorDimensions = 384;

  onModuleInit() {
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

    // Inicializa o arquivo de banco vetorial vazio se não existir
    if (!fs.existsSync(this.storePath)) {
      fs.writeFileSync(this.storePath, JSON.stringify([]));
    }
  }

  // Gera embeddings determinísticos off-line para similaridade de cosseno
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

    // L2 Normalization (comprimento unitário)
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? embedding.map((val) => val / magnitude) : embedding;
  }

  // Calcula similaridade de cosseno entre dois vetores
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
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

  // Extrai texto de um PDF, fatia por artigo/seção e salva no arquivo do banco vetorial
  async indexFile(filePath: string, category: string): Promise<number> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo não encontrado: ${filePath}`);
    }

    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await (pdf as any)(dataBuffer);
    const text = pdfData.text;

    // Fatiamento por artigos (regex que captura 'Art. XX' ou 'Artigo XX')
    // Se não contiver padrão de artigos, fatia por parágrafos/seções
    const articleRegex = /(?=Art\.\s*\d+|Artigo\s*\d+)/gi;
    let chunksText = text.split(articleRegex);

    // Se o documento não foi dividido (não possui palavra "Art."), divide a cada 1000 caracteres
    if (chunksText.length <= 1) {
      chunksText = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text];
      // Agrupa em blocos de tamanho razoável (1000 chars)
      const groupedChunks: string[] = [];
      let temp = '';
      chunksText.forEach((c: string) => {
        if (temp.length + c.length > 1000) {
          groupedChunks.push(temp.trim());
          temp = c;
        } else {
          temp += c;
        }
      });
      if (temp.trim()) groupedChunks.push(temp.trim());
      chunksText = groupedChunks;
    }

    const fileName = path.basename(filePath, path.extname(filePath));
    const newChunks: KnowledgeChunk[] = [];

    chunksText.forEach((chunk: string, index: number) => {
      const trimmedChunk = chunk.trim();
      if (trimmedChunk.length < 30) return; // descarta fragmentos inúteis

      // Tenta capturar a numeração do artigo no início do chunk
      const artMatch = trimmedChunk.match(/^(Art\.\s*\d+|Artigo\s*\d+)/i);
      const artigoLabel = artMatch ? artMatch[1] : `Seção ${index + 1}`;

      // Extrai palavras-chave e ementa do chunk
      const cleanWords = trimmedChunk
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter((w: string) => w.length > 4 && !this.isStopword(w));

      // Pega as 5 mais frequentes como palavras-chave
      const wordCounts: Record<string, number> = {};
      cleanWords.forEach((w: string) => {
        wordCounts[w] = (wordCounts[w] || 0) + 1;
      });
      const sortedWords = Object.keys(wordCounts).sort((a, b) => wordCounts[b] - wordCounts[a]);
      const keywords = sortedWords.slice(0, 5);

      // Infere assunto simples baseado nas principais palavras-chave
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

    // Mescla com banco vetorial local existente, removendo duplicados do mesmo arquivo
    const currentStore: KnowledgeChunk[] = JSON.parse(fs.readFileSync(this.storePath, 'utf8'));
    const filteredStore = currentStore.filter((c) => !c.id.startsWith(`${fileName}-`));
    const updatedStore = [...filteredStore, ...newChunks];

    fs.writeFileSync(this.storePath, JSON.stringify(updatedStore, null, 2));

    return newChunks.length;
  }

  // Faz a varredura recursiva da pasta Conhecimento para indexar novos PDFs
  async indexAll(): Promise<any> {
    const indexedFiles: string[] = [];
    let totalChunks = 0;

    const scanDir = async (dir: string, category: string) => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          // Mantém a categoria principal na recursão de subpastas (ex: Licitações/Acordaos_TCU)
          await scanDir(fullPath, category || item);
        } else if (stat.isFile() && path.extname(item).toLowerCase() === '.pdf') {
          try {
            const chunksCount = await this.indexFile(fullPath, category || 'Geral');
            indexedFiles.push(item);
            totalChunks += chunksCount;
          } catch (e) {
            console.error(`Erro ao indexar arquivo: ${fullPath}`, e);
          }
        }
      }
    };

    const items = fs.readdirSync(this.rootPath);
    for (const item of items) {
      const fullPath = path.join(this.rootPath, item);
      const stat = fs.statSync(fullPath);
      // Evita indexar o próprio vector-store.json como pasta
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

  // Pesquisa semântica no banco vetorial via similaridade de cosseno com bônus de prioridade legal
  async search(query: string, limit = 5): Promise<any[]> {
    if (!fs.existsSync(this.storePath)) {
      return [];
    }

    const store: KnowledgeChunk[] = JSON.parse(fs.readFileSync(this.storePath, 'utf8'));
    if (store.length === 0) return [];

    const queryEmbedding = this.generateEmbedding(query);

    const scoredChunks = store.map((chunk) => {
      const baseSimilarity = this.cosineSimilarity(queryEmbedding, chunk.embedding);
      
      // Aplica bônus de prioridade com base na categoria
      let priorityBonus = 0;
      const cat = chunk.categoria.toLowerCase();
      
      if (cat.includes('constituição')) {
        priorityBonus = 0.25; // Prioridade 1: CF/88 e LINDB
      } else if (
        cat.includes('administração pública') || 
        cat.includes('direito civil') || 
        cat.includes('tributário') || 
        cat.includes('trabalho') || 
        cat.includes('saúde') || 
        cat.includes('educação') || 
        cat.includes('assistência social') || 
        cat.includes('meio ambiente') || 
        cat.includes('eleitoral')
      ) {
        priorityBonus = 0.18; // Prioridade 2: Leis Federais
      } else if (cat.includes('decreto')) {
        priorityBonus = 0.14; // Prioridade 3: Decretos
      } else if (cat.includes('acórdãos tcu') || cat.includes('acordao')) {
        priorityBonus = 0.11; // Prioridade 4: Acórdãos TCU
      } else if (cat.includes('jurisprudência') || cat.includes('súmula')) {
        priorityBonus = 0.08; // Prioridade 5: Súmulas STF/STJ
      } else if (cat.includes('agu')) {
        priorityBonus = 0.06; // Prioridade 6: AGU
      } else if (cat.includes('cgu') || cat.includes('transparência')) {
        priorityBonus = 0.04; // Prioridade 7: CGU
      } else if (cat.includes('redação oficial') || cat.includes('manuais') || cat.includes('licitações')) {
        priorityBonus = 0.02; // Prioridade 8: Manuais Técnicos e Oficiais
      }

      // O score final combina a similaridade base com o bônus de prioridade ponderado
      const finalScore = Math.min(1.0, baseSimilarity + priorityBonus * 0.4);

      return {
        titulo: chunk.titulo,
        artigo: chunk.artigo,
        assunto: chunk.assunto,
        palavras_chave: chunk.palavras_chave,
        texto: chunk.texto,
        categoria: chunk.categoria,
        score: finalScore,
      };
    });

    // Ordena pelo score decrescente e limita
    return scoredChunks
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Retorna os diretórios e arquivos de conhecimento existentes
  getFilesStructure(): any {
    const getStructure = (dir: string) => {
      const structure: any = { name: path.basename(dir), isDirectory: true, children: [] };
      const items = fs.readdirSync(dir);
      items.forEach((item) => {
        // Ignora o store JSON
        if (item === 'vector-store.json') return;

        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          structure.children.push(getStructure(fullPath));
        } else {
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

  private isStopword(word: string): boolean {
    const stopwords = [
      'para', 'como', 'uma', 'umas', 'pelo', 'pela', 'pelos', 'pelas', 'com', 'sem', 'sob', 'sobre',
      'mais', 'menos', 'este', 'esta', 'estes', 'estas', 'aquele', 'aquela', 'aqueles', 'aquelas',
      'seus', 'suas', 'meus', 'minhas', 'teus', 'tua', 'isso', 'isto', 'aquilo', 'tendo', 'sendo',
      'forma', 'lei', 'artigo', 'decreto', 'portaria', 'onde', 'quando', 'quem', 'cujo', 'cuja',
      'art', 'lei', 'leis', 'artigos', 'conforme', 'nos', 'nas', 'dos', 'das', 'uma', 'um'
    ];
    return stopwords.includes(word);
  }
}
