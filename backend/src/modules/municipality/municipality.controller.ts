import { Controller, Put, Post, Body, Param } from '@nestjs/common';
import { MunicipalityService } from './municipality.service';

@Controller('municipalities')
export class MunicipalityController {
  constructor(private readonly municipalityService: MunicipalityService) {}

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: { name?: string; cnpj?: string; logoUrl?: string; primaryColor?: string },
  ) {
    return this.municipalityService.update(id, data);
  }

  @Post(':id/secretariats')
  async addSecretariat(
    @Param('id') id: string,
    @Body() data: { name: string; code: string },
  ) {
    return this.municipalityService.addSecretariat(id, data);
  }
}
