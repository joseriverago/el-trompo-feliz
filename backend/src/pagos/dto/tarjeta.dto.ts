import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import { recortar, soloDigitos } from '../../auth/dto/normalizar.js';

/** Quita los espacios: «12 / 29» queda como 12/29. */
function sinEspacios({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.replace(/\s/g, '') : value;
}

/**
 * Formulario de pago simulado (HU-09, CU-10): cuerpo de POST /pedidos/:numero/pago.
 * Solo existe durante la petición: del pago se guardan los últimos 4 dígitos y el resultado.
 * Que el vencimiento no haya pasado lo revisa PagosService, porque depende de la fecha de hoy.
 */
export class TarjetaDto {
  @Transform(soloDigitos)
  @IsString({ message: 'Ingresa el número de la tarjeta' })
  @IsNotEmpty({ message: 'Ingresa el número de la tarjeta' })
  @Matches(/^\d{16}$/, {
    message: 'El número de la tarjeta debe tener 16 dígitos',
  })
  numero: string;

  @Transform(recortar)
  @IsString({ message: 'Ingresa el nombre del titular' })
  @IsNotEmpty({ message: 'Ingresa el nombre del titular' })
  @MaxLength(100, { message: 'El nombre puede tener hasta 100 caracteres' })
  @Matches(/^[\p{L}][\p{L} .'-]*$/u, {
    message: 'Escribe el nombre como aparece en la tarjeta, solo con letras',
  })
  titular: string;

  @Transform(sinEspacios)
  @IsString({ message: 'Ingresa el vencimiento' })
  @IsNotEmpty({ message: 'Ingresa el vencimiento' })
  @Matches(/^(0[1-9]|1[0-2])\/\d{2}$/, {
    message: 'Escribe el vencimiento como MM/AA, por ejemplo 08/29',
  })
  vencimiento: string;

  @Transform(sinEspacios)
  @IsString({ message: 'Ingresa el CVV' })
  @IsNotEmpty({ message: 'Ingresa el CVV' })
  @Matches(/^\d{3}$/, { message: 'El CVV debe tener 3 dígitos' })
  cvv: string;
}
