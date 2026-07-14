import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private supabaseClientInstance: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL') || 'https://placeholder-project-id.supabase.co';
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE1OTg4ODMwMDAsImV4cCI6MTkwNDQ0NzAwMH0.placeholder';

    if (!this.configService.get<string>('SUPABASE_URL') || !this.configService.get<string>('SUPABASE_ANON_KEY')) {
      this.logger.warn(
        'Supabase URL ou Anon Key não configuradas no .env. Funcionalidades integradas com o Supabase podem falhar.',
      );
    }

    this.supabaseClientInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  getClient(): SupabaseClient {
    return this.supabaseClientInstance;
  }
}
