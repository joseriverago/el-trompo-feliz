import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { PeticionConUsuario } from './jwt-auth.guard.js';
import { Roles } from './roles.decorator.js';

export const SIN_PERMISO = 'No tienes permiso para esta acción';

/**
 * Deja pasar solo a los roles del decorador @Roles de la ruta. Se usa después de
 * JwtAuthGuard, que deja en la petición el usuario del token (con su rol).
 * Si la ruta no declara roles, no restringe nada. Si el rol no está permitido, responde 403.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexto: ExecutionContext): boolean {
    const rolesPermitidos = this.reflector.getAllAndOverride(Roles, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);
    if (!rolesPermitidos?.length) return true;

    const { usuario } = contexto
      .switchToHttp()
      .getRequest<PeticionConUsuario>();
    if (usuario && rolesPermitidos.includes(usuario.rol)) return true;
    throw new ForbiddenException({ statusCode: 403, message: SIN_PERMISO });
  }
}
