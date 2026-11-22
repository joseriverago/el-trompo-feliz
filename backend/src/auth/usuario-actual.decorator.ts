import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { PeticionConUsuario } from './jwt-auth.guard.js';
import type { UsuarioSesion } from './sesion.js';

/**
 * Parámetro de un controller con el usuario de la sesión. Solo se usa en rutas
 * con JwtAuthGuard, que es quien lo deja en la petición.
 */
export const UsuarioActual = createParamDecorator(
  (_dato: unknown, contexto: ExecutionContext): UsuarioSesion =>
    contexto.switchToHttp().getRequest<PeticionConUsuario>()
      .usuario as UsuarioSesion,
);
