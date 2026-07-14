import {
  Controller,
  Post,
  Get,
  Query,
  UploadedFile,
  UseInterceptors,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { KnowledgeService } from './knowledge.service';
import * as path from 'path';
import * as fs from 'fs';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Post('index-all')
  async indexAll() {
    return this.knowledgeService.indexAll();
  }

  @Get('search')
  async search(@Query('query') query: string, @Query('limit') limit?: string) {
    if (!query) {
      throw new BadRequestException('A query de busca é obrigatória.');
    }
    const limitNum = limit ? parseInt(limit, 10) : 5;
    const results = await this.knowledgeService.search(query, limitNum);
    return {
      query,
      resultsCount: results.length,
      results,
    };
  }

  @Get('files')
  getFilesStructure() {
    return this.knowledgeService.getFilesStructure();
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req: any, file: any, cb: any) => {
          const dest = path.join(
            process.cwd().endsWith('backend') ? process.cwd() : path.join(process.cwd(), 'backend'),
            'uploads'
          );
          if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
          }
          cb(null, dest);
        },
        filename: (req: any, file: any, cb: any) => {
          const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
          cb(null, safeName);
        },
      }),
    }),
  )
  async uploadFile(
    @UploadedFile() file: any,
    @Body('category') category: string,
    @Body('source') source?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    const cat = category || 'Geral';
    const src = source || 'NACIONAL';

    // Determina a pasta raiz final do Conhecimento
    const rootPath = path.join(
      process.cwd().endsWith('backend') ? path.resolve(process.cwd(), '..') : process.cwd(),
      'Conhecimento'
    );
    const destinationFolder = path.join(rootPath, cat);
    if (!fs.existsSync(destinationFolder)) {
      fs.mkdirSync(destinationFolder, { recursive: true });
    }
    const finalPath = path.join(destinationFolder, file.filename);

    // Move o arquivo temporário para o destino final da categoria
    fs.renameSync(file.path, finalPath);

    try {
      const fileBuffer = fs.readFileSync(finalPath);
      const folder = src.toLowerCase();
      await this.knowledgeService.uploadToSupabase(fileBuffer, file.filename, file.mimetype, folder);
    } catch (e) {
      // Ignora erro no upload do supabase para continuar localmente
    }

    // Indexa o arquivo que acabou de ser adicionado no pgvector a partir do caminho final correto
    const chunksCount = await this.knowledgeService.indexFile(finalPath, cat, src);

    return {
      success: true,
      message: `Arquivo ${file.filename} adicionado e indexado na categoria "${cat}" (${src}) com sucesso.`,
      filename: file.filename,
      sizeBytes: file.size,
      path: finalPath,
      category: cat,
      source: src,
      chunksCount,
    };
  }
}
