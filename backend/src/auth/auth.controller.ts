import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegistroDto } from './dto/registro.dto.js';
import type { SesionDto } from './sesion.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Registro de cliente (HU-03). Responde 201 con la sesión iniciada,
   * 400 si un campo no es válido o 409 si el correo ya está registrado.
   */
  @Post('registro')
  registrar(@Body() datos: RegistroDto): Promise<SesionDto> {
    return this.authService.registrar(datos);
  }
}
