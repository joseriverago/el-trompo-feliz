import { ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash } from 'bcryptjs';
import type { Usuario } from '../usuarios/entities/usuario.entity.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import type { RegistroDto } from './dto/registro.dto.js';
import type { SesionDto, UsuarioPublico } from './sesion.js';

/** Mismo costo que los usuarios de la semilla. */
const COSTO_BCRYPT = 10;

export const CORREO_REGISTRADO = 'Este correo ya está registrado';

/** Código de PostgreSQL para una restricción UNIQUE violada. */
const VIOLACION_UNICA = '23505';

function esViolacionUnica(error: unknown): boolean {
  const conCodigo = error as {
    code?: string;
    driverError?: { code?: string };
  };
  return (
    conCodigo?.code === VIOLACION_UNICA ||
    conCodigo?.driverError?.code === VIOLACION_UNICA
  );
}

function correoYaRegistrado(): ConflictException {
  return new ConflictException({
    statusCode: 409,
    message: CORREO_REGISTRADO,
    errores: { correo: CORREO_REGISTRADO },
  });
}

function aUsuarioPublico(usuario: Usuario): UsuarioPublico {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Crea la cuenta como CLIENTE y deja la sesión iniciada (HU-03).
   * La contraseña se guarda cifrada con bcrypt, nunca en texto plano.
   */
  async registrar(datos: RegistroDto): Promise<SesionDto> {
    if (await this.usuariosService.buscarPorCorreo(datos.correo)) {
      throw correoYaRegistrado();
    }

    const contrasenaHash = await hash(datos.contrasena, COSTO_BCRYPT);
    let usuario: Usuario;
    try {
      usuario = await this.usuariosService.crearCliente(
        datos.nombre,
        datos.correo,
        contrasenaHash,
      );
    } catch (error) {
      // Dos registros simultáneos con el mismo correo: la restricción UNIQUE de la base de datos frena al segundo.
      if (esViolacionUnica(error)) throw correoYaRegistrado();
      throw error;
    }

    return { token: this.firmarToken(usuario), usuario: aUsuarioPublico(usuario) };
  }

  /** El JWT lleva el id (sub), el nombre y el rol; dura 7 días. */
  private firmarToken(usuario: Usuario): string {
    return this.jwt.sign({
      sub: usuario.id,
      nombre: usuario.nombre,
      rol: usuario.rol,
    });
  }
}
