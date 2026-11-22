import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { normalizarCorreo } from './normalizar.js';

/**
 * Datos del formulario de inicio de sesión (HU-04, CU-05 Iniciar sesión).
 * Solo se revisa que estén completos y que el correo tenga forma de correo:
 * si no coinciden con una cuenta, la respuesta es el mensaje genérico de AuthService.
 */
export class InicioSesionDto {
  @Transform(normalizarCorreo)
  @IsString({ message: 'Ingresa tu correo' })
  @IsNotEmpty({ message: 'Ingresa tu correo' })
  @IsEmail(
    {},
    { message: 'Ingresa un correo válido, por ejemplo nombre@correo.com' },
  )
  correo: string;

  /** No se recorta: los espacios también cuentan en una contraseña. */
  @IsString({ message: 'Ingresa tu contraseña' })
  @IsNotEmpty({ message: 'Ingresa tu contraseña' })
  contrasena: string;
}
