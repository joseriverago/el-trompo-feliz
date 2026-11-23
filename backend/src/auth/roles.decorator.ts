import { Reflector } from '@nestjs/core';
import type { Rol } from '../usuarios/enums/rol.enum.js';

/** Roles que pueden usar una ruta; RolesGuard los lee de aquí. */
export const Roles = Reflector.createDecorator<Rol[]>();
