import { Controller, Post, Get, Body, Query, Param, Put } from '@nestjs/common';
import { DocumentService } from './document.service';

@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post('generate-ia')
  async generateIA(
    @Body() body: { prompt: string; type: string; municipalityName?: string; secretariatName?: string },
  ) {
    return this.documentService.generateIA(
      body.prompt,
      body.type,
      body.municipalityName,
      body.secretariatName,
    );
  }

  @Post()
  async create(
    @Body() body: { title: string; content: string; type: string; status: string; secretariatId?: string; authorId?: string },
  ) {
    // Caso o front não passe (ex: simulação offline), injeta valores fictícios consistentes
    const secretariatId = body.secretariatId || 'sec-default-id';
    const authorId = body.authorId || 'usr-default-id';

    return this.documentService.create({
      ...body,
      secretariatId,
      authorId,
    });
  }

  @Get('recent')
  async findRecent(@Query('secretariatId') secretariatId?: string) {
    const secId = secretariatId || 'sec-default-id';
    return this.documentService.findRecent(secId);
  }

  @Get('stats')
  async getStats(@Query('secretariatId') secretariatId?: string, @Query('userId') userId?: string) {
    const secId = secretariatId || 'sec-default-id';
    const usrId = userId || 'usr-default-id';
    return this.documentService.getStats(secId, usrId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.documentService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { title?: string; content?: string; status?: string; authorId?: string },
  ) {
    const authorId = body.authorId || 'usr-default-id';
    return this.documentService.update(id, {
      title: body.title,
      content: body.content,
      status: body.status,
      authorId,
    });
  }

  @Post('sign')
  async sign(
    @Body() body: { documentId: string; signerName: string; signerDocument: string; signatureHash: string },
  ) {
    return this.documentService.sign(
      body.documentId,
      body.signerName,
      body.signerDocument,
      body.signatureHash,
    );
  }
}
