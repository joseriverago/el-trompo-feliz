import { applyDecorators, UseGuards } from '@nestjs/common';
import { Rol } from '../usuarios/enums/rol.enum.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { Roles } from './roles.decorator.js';
import { RolesGuard } from './roles.guard.js';

/**
 * Rutas de administración (HU-12 a HU-15, HU-19, HU-20): primero JwtAuthGuard identifica
 * al usuario (401 sin sesión) y después RolesGuard exige el rol ADMINISTRADOR (403).
 */
export function SoloAdministrador() {
  return applyDecorators(
    UseGuards(JwtAuthGuard, RolesGuard),
    Roles([Rol.ADMINISTRADOR]),
  );
}
