import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

interface RegisterDto {
  userId: string;
  email: string;
  name: string;
  municipalityName: string;
  cnpj: string;
  secretariatName: string;
  secretariatCode: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }
}
