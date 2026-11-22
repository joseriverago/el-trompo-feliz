import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { recortar } from '../../auth/dto/normalizar.js';

/** Quita espacios y guiones: «987 654 321» y «987-654-321» se guardan como 987654321. */
function soloDigitos({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.replace(/[\s-]/g, '') : value;
}

/** Una referencia vacía es lo mismo que no darla: se guarda null. */
function recortarOpcional({ value }: { value: unknown }): unknown {
  if (typeof value !== 'string') return value;
  return value.trim() === '' ? null : value.trim();
}

/** Formulario de entrega de «Comprar» (HU-08, CU-09 Realizar compra): cuerpo de POST /pedidos. */
export class DatosEntregaDto {
  @Transform(recortar)
  @IsString({ message: 'Ingresa el nombre de quien recibe' })
  @IsNotEmpty({ message: 'Ingresa el nombre de quien recibe' })
  @MaxLength(100, { message: 'El nombre puede tener hasta 100 caracteres' })
  destinatario: string;

  @Transform(soloDigitos)
  @IsString({ message: 'Ingresa el teléfono' })
  @IsNotEmpty({ message: 'Ingresa el teléfono' })
  @Matches(/^\d{9}$/, { message: 'El teléfono debe tener 9 dígitos' })
  telefono: string;

  @Transform(recortar)
  @IsString({ message: 'Ingresa la dirección de entrega' })
  @IsNotEmpty({ message: 'Ingresa la dirección de entrega' })
  @MaxLength(200, { message: 'La dirección puede tener hasta 200 caracteres' })
  direccion: string;

  @Transform(recortar)
  @IsString({ message: 'Ingresa el distrito' })
  @IsNotEmpty({ message: 'Ingresa el distrito' })
  @MaxLength(80, { message: 'El distrito puede tener hasta 80 caracteres' })
  distrito: string;

  @Transform(recortarOpcional)
  @IsOptional()
  @IsString({ message: 'La referencia debe ser un texto' })
  @MaxLength(200, { message: 'La referencia puede tener hasta 200 caracteres' })
  referencia?: string | null;
}
