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
          const service = new KnowledgeService();
          const rootPath = service.getRootPath();
          // Pega a categoria do body da requisição (ex: 'Constituição', 'Licitações/Acordaos_TCU')
          const category = req.body.category || 'Geral';
          const destinationPath = path.join(rootPath, category);
          
          if (!fs.existsSync(destinationPath)) {
            fs.mkdirSync(destinationPath, { recursive: true });
          }
          cb(null, destinationPath);
        },
        filename: (req: any, file: any, cb: any) => {
          // Mantém o nome amigável do arquivo limpando caracteres estranhos
          const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
          cb(null, safeName);
        },
      }),
    }),
  )
  async uploadFile(
    @UploadedFile() file: any,
    @Body('category') category: string,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    const cat = category || 'Geral';
    // Indexa o arquivo que acabou de ser adicionado
    const chunksCount = await this.knowledgeService.indexFile(file.path, cat);

    return {
      success: true,
      message: `Arquivo ${file.filename} adicionado e indexado na categoria "${cat}" com sucesso.`,
      filename: file.filename,
      sizeBytes: file.size,
      path: file.path,
      category: cat,
      chunksCount,
    };
  }
}
