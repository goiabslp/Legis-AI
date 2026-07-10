import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      console.warn(
        '⚠️ Não foi possível conectar ao banco de dados PostgreSQL. O backend do DocIA Gov continuará rodando com dados locais simulados.',
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
