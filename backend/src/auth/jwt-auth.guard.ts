import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService, SESION_REQUERIDA } from './auth.service.js';
import type { UsuarioSesion } from './sesion.js';

/** Petición HTTP a la que JwtAuthGuard ya le agregó el usuario del token. */
export type PeticionConUsuario = Request & { usuario?: UsuarioSesion };

/**
 * Protege las rutas que necesitan una sesión iniciada (carrito, pedidos, pagos).
 * Lee el JWT de la cabecera «Authorization: Bearer <token>», lo verifica con
 * AuthService (ISesion) y deja el usuario en la petición. Sin token válido responde 401.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(contexto: ExecutionContext): boolean {
    const peticion = contexto.switchToHttp().getRequest<PeticionConUsuario>();
    const [esquema, token] = peticion.headers.authorization?.split(' ') ?? [];
    if (esquema !== 'Bearer' || !token) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: SESION_REQUERIDA,
      });
    }
    peticion.usuario = this.authService.verificarToken(token);
    return true;
  }
}
