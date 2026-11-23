import { type ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Rol } from '../usuarios/enums/rol.enum.js';
import type { PeticionConUsuario } from './jwt-auth.guard.js';
import { Roles } from './roles.decorator.js';
import { RolesGuard, SIN_PERMISO } from './roles.guard.js';
import type { UsuarioSesion } from './sesion.js';

class RutasDePrueba {
  @Roles([Rol.ADMINISTRADOR])
  soloAdministrador() {}

  publica() {}
}

const guard = new RolesGuard(new Reflector());

function contexto(
  ruta: keyof RutasDePrueba,
  usuario?: UsuarioSesion,
): ExecutionContext {
  const peticion = { headers: {}, usuario } as PeticionConUsuario;
  return {
    getHandler: () => RutasDePrueba.prototype[ruta],
    getClass: () => RutasDePrueba,
    switchToHttp: () => ({ getRequest: () => peticion }),
  } as unknown as ExecutionContext;
}

const administrador: UsuarioSesion = {
  id: 1,
  nombre: 'Administración El Trompo Feliz',
  rol: Rol.ADMINISTRADOR,
};
const cliente: UsuarioSesion = {
  id: 5,
  nombre: 'Rosa Quispe Huamán',
  rol: Rol.CLIENTE,
};

describe('RolesGuard (HU-12, criterio 5)', () => {
  it('deja pasar al administrador en una ruta de administración', () => {
    expect(
      guard.canActivate(contexto('soloAdministrador', administrador)),
    ).toBe(true);
  });

  it('responde 403 «No tienes permiso para esta acción» a un cliente', () => {
    try {
      guard.canActivate(contexto('soloAdministrador', cliente));
      throw new Error('Se esperaba que el guard rechazara al cliente');
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenException);
      expect((error as ForbiddenException).getResponse()).toEqual({
        statusCode: 403,
        message: SIN_PERMISO,
      });
    }
  });

  it('también rechaza si la petición no trae usuario (JwtAuthGuard no se ejecutó)', () => {
    expect(() => guard.canActivate(contexto('soloAdministrador'))).toThrow(
      ForbiddenException,
    );
  });

  it('no restringe las rutas que no declaran roles', () => {
    expect(guard.canActivate(contexto('publica', cliente))).toBe(true);
  });
});
