import { Module } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeController } from './knowledge.controller';
import { DatabaseModule } from '../../infra/database/database.module';
import { SupabaseModule } from '../../infra/supabase/supabase.module';

@Module({
  imports: [DatabaseModule, SupabaseModule],
  controllers: [KnowledgeController],
  providers: [KnowledgeService],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
