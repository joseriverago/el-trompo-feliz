import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { InicioSesionDto } from './dto/inicio-sesion.dto.js';
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

  /**
   * Inicio de sesión (HU-04). Responde 200 con la sesión, 400 si falta un campo
   * o 401 «Correo o contraseña incorrectos» si no coinciden con una cuenta.
   */
  @Post('inicio-sesion')
  @HttpCode(HttpStatus.OK)
  iniciarSesion(@Body() datos: InicioSesionDto): Promise<SesionDto> {
    return this.authService.iniciarSesion(datos.correo, datos.contrasena);
  }
}
