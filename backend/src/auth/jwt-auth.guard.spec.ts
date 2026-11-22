import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { UsuariosService } from '../usuarios/usuarios.service.js';
import { Rol } from '../usuarios/enums/rol.enum.js';
import { AuthService, SESION_REQUERIDA } from './auth.service.js';
import { JwtAuthGuard, type PeticionConUsuario } from './jwt-auth.guard.js';

const SECRETO = 'clave-de-prueba-de-al-menos-32-caracteres';
const jwt = new JwtService({ secret: SECRETO });
const guard = new JwtAuthGuard(new AuthService({} as UsuariosService, jwt));

function peticion(authorization?: string): PeticionConUsuario {
  return { headers: { authorization } } as PeticionConUsuario;
}

function contexto(datos: PeticionConUsuario): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => datos }),
  } as ExecutionContext;
}

function tokenDe(
  contenido: object,
  opciones?: { secret?: string; expiresIn?: number },
) {
  return jwt.sign(contenido, {
    secret: opciones?.secret ?? SECRETO,
    expiresIn: opciones?.expiresIn ?? 3600,
  });
}

/** Devuelve el error 401 con el que el guard rechaza la petición. */
function rechazo(datos: PeticionConUsuario): UnauthorizedException {
  try {
    guard.canActivate(contexto(datos));
  } catch (error) {
    return error as UnauthorizedException;
  }
  throw new Error('Se esperaba que el guard rechazara la petición');
}

describe('JwtAuthGuard', () => {
  it('con un token válido deja pasar y agrega el usuario a la petición', () => {
    const datos = peticion(
      `Bearer ${tokenDe({ sub: 7, nombre: 'Begoña Ñahui Ávila', rol: Rol.CLIENTE })}`,
    );

    expect(guard.canActivate(contexto(datos))).toBe(true);
    expect(datos.usuario).toEqual({
      id: 7,
      nombre: 'Begoña Ñahui Ávila',
      rol: Rol.CLIENTE,
    });
  });

  it.each([
    ['sin la cabecera Authorization', undefined],
    ['con otro esquema', `Basic ${tokenDe({ sub: 7 })}`],
    ['con «Bearer» sin token', 'Bearer'],
    ['con un token que no es un JWT', 'Bearer abc.def.ghi'],
    [
      'con un token firmado con otra clave',
      `Bearer ${tokenDe({ sub: 7 }, { secret: 'otra-clave-de-al-menos-32-caracteres!!' })}`,
    ],
    [
      'con un token vencido',
      `Bearer ${tokenDe({ sub: 7 }, { expiresIn: -10 })}`,
    ],
  ])(
    'responde 401 «Inicia sesión para continuar» %s',
    (_caso, authorization) => {
      const datos = peticion(authorization);

      const error = rechazo(datos);

      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(error.getResponse()).toEqual({
        statusCode: 401,
        message: SESION_REQUERIDA,
      });
      expect(datos.usuario).toBeUndefined();
    },
  );
});
