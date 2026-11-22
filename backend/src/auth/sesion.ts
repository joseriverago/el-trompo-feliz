import type { Rol } from '../usuarios/enums/rol.enum.js';

/** Datos del usuario que el frontend puede ver. Nunca incluye el hash de la contraseña. */
export interface UsuarioPublico {
  id: number;
  nombre: string;
  correo: string;
  rol: Rol;
}

/**
 * Respuesta al registrarse o iniciar sesión: el JWT, que el frontend envía después
 * en la cabecera Authorization, y los datos públicos del usuario.
 */
export interface SesionDto {
  token: string;
  usuario: UsuarioPublico;
}
