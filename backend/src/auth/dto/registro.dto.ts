import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { normalizarCorreo, recortar } from './normalizar.js';

/** Datos del formulario de registro (HU-03, CU-04 Registrarse). */
export class RegistroDto {
  @Transform(recortar)
  @IsString({ message: 'Ingresa tu nombre' })
  @IsNotEmpty({ message: 'Ingresa tu nombre' })
  @MaxLength(100, { message: 'El nombre puede tener hasta 100 caracteres' })
  nombre: string;

  @Transform(normalizarCorreo)
  @IsString({ message: 'Ingresa tu correo' })
  @IsNotEmpty({ message: 'Ingresa tu correo' })
  @IsEmail(
    {},
    { message: 'Ingresa un correo válido, por ejemplo nombre@correo.com' },
  )
  @MaxLength(150, { message: 'El correo puede tener hasta 150 caracteres' })
  correo: string;

  /** No se recorta: los espacios también cuentan en una contraseña. bcrypt solo usa los primeros 72 bytes. */
  @IsString({ message: 'Ingresa una contraseña' })
  @IsNotEmpty({ message: 'Ingresa una contraseña' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(72, { message: 'La contraseña puede tener hasta 72 caracteres' })
  contrasena: string;
}
