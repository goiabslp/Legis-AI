import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './infra/database/database.module';
import { SupabaseModule } from './infra/supabase/supabase.module';
import { AuthModule } from './modules/auth/auth.module';
import { MunicipalityModule } from './modules/municipality/municipality.module';
import { DocumentModule } from './modules/document/document.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    SupabaseModule,
    AuthModule,
    MunicipalityModule,
    DocumentModule,
    KnowledgeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
