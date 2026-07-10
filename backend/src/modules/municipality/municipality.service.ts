import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma.service';

@Injectable()
export class MunicipalityService {
  constructor(private prisma: PrismaService) {}

  async update(id: string, data: { name?: string; cnpj?: string; logoUrl?: string; primaryColor?: string }) {
    const municipality = await this.prisma.municipality.findUnique({
      where: { id },
    });

    if (!municipality) {
      throw new NotFoundException('Município não localizado.');
    }

    return this.prisma.municipality.update({
      where: { id },
      data,
    });
  }

  async addSecretariat(municipalityId: string, data: { name: string; code: string }) {
    const municipality = await this.prisma.municipality.findUnique({
      where: { id: municipalityId },
    });

    if (!municipality) {
      throw new NotFoundException('Município não localizado.');
    }

    return this.prisma.secretariat.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        municipalityId,
      },
    });
  }
}
