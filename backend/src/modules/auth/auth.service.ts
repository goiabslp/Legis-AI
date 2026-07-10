import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma.service';

interface RegisterDto {
  userId: string;
  email: string;
  name: string;
  municipalityName: string;
  cnpj: string;
  secretariatName: string;
  secretariatCode: string;
}

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(dto: RegisterDto) {
    // 1. Verifica se já existe CNPJ cadastrado
    const existingMunicipality = await this.prisma.municipality.findUnique({
      where: { cnpj: dto.cnpj },
    });

    if (existingMunicipality) {
      throw new ConflictException('Já existe um município cadastrado com este CNPJ.');
    }

    // 2. Realiza a criação transacional no banco
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Cria o município
        const municipality = await tx.municipality.create({
          data: {
            name: dto.municipalityName,
            cnpj: dto.cnpj,
          },
        });

        // Cria a secretaria
        const secretariat = await tx.secretariat.create({
          data: {
            name: dto.secretariatName,
            code: dto.secretariatCode.toUpperCase(),
            municipalityId: municipality.id,
          },
        });

        // Cria o usuário administrador
        const user = await tx.user.create({
          data: {
            id: dto.userId,
            email: dto.email,
            name: dto.name,
            role: 'ADMIN', // Primeiro usuário é o administrador geral do município
            secretariatId: secretariat.id,
            municipalityId: municipality.id,
          },
        });

        return {
          user,
          secretariat,
          municipality,
        };
      });
    } catch (error) {
      console.error('Erro na transação de registro:', error);
      throw new InternalServerErrorException('Falha interna ao criar as entidades no banco.');
    }
  }
}
