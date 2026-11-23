import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { recortar } from '../../auth/dto/normalizar.js';
import { ID_MAXIMO } from '../../database/limites.js';

export const PRECIO_MAXIMO = 9999.99;
/** Una edad máxima de 99 se muestra como «desde N años» (sin límite). */
export const EDAD_MAXIMA = 99;
export const STOCK_MAXIMO = 100_000;

const ELIGE_CATEGORIA = 'Elige una categoría de la lista';
const STOCK_VALIDO = 'El stock debe ser un número entero de 0 o más';

/**
 * Datos de un juguete en «Administración > Juguetes» (HU-12, CU-12 Gestionar productos):
 * cuerpo de PUT /juguetes/:id. Editar no cambia el stock: se cambia en el inventario (HU-13).
 * Que la edad mínima no supere la máxima lo valida JuguetesService, porque compara dos campos.
 *
 * class-validator informa las reglas de abajo hacia arriba y el pipe muestra la primera:
 * por eso la regla del tipo («debe ser un número entero») va debajo de la de rango.
 */
export class GuardarJugueteDto {
  @Transform(recortar)
  @MaxLength(120, { message: 'El nombre puede tener hasta 120 caracteres' })
  @IsNotEmpty({ message: 'Ingresa el nombre' })
  @IsString({ message: 'Ingresa el nombre' })
  nombre: string;

  @Transform(recortar)
  @MaxLength(1000, {
    message: 'La descripción puede tener hasta 1000 caracteres',
  })
  @IsNotEmpty({ message: 'Ingresa la descripción' })
  @IsString({ message: 'Ingresa la descripción' })
  descripcion: string;

  @Max(PRECIO_MAXIMO, { message: 'El precio puede ser hasta S/ 9999.99' })
  @IsPositive({ message: 'El precio debe ser mayor que 0' })
  @IsNumber(
    { maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false },
    { message: 'El precio debe ser un número con hasta 2 decimales' },
  )
  @IsNotEmpty({ message: 'Ingresa el precio' })
  precio: number;

  @Transform(recortar)
  @MaxLength(500, { message: 'La URL puede tener hasta 500 caracteres' })
  @IsUrl(
    { protocols: ['https', 'http'], require_protocol: true },
    {
      message: 'Ingresa una URL válida, por ejemplo https://sitio.com/foto.jpg',
    },
  )
  @IsNotEmpty({ message: 'Ingresa la dirección (URL) de la imagen' })
  @IsString({ message: 'Ingresa la dirección (URL) de la imagen' })
  imagenUrl: string;

  @Max(ID_MAXIMO, { message: ELIGE_CATEGORIA })
  @Min(1, { message: ELIGE_CATEGORIA })
  @IsInt({ message: ELIGE_CATEGORIA })
  @IsNotEmpty({ message: ELIGE_CATEGORIA })
  categoriaId: number;

  @Max(EDAD_MAXIMA, { message: 'La edad mínima puede ser hasta 99 años' })
  @Min(0, { message: 'La edad mínima no puede ser negativa' })
  @IsInt({ message: 'La edad mínima debe ser un número entero de años' })
  @IsNotEmpty({ message: 'Ingresa la edad mínima' })
  edadMinima: number;

  @Max(EDAD_MAXIMA, {
    message: 'La edad máxima puede ser hasta 99 años (99 es «sin límite»)',
  })
  @Min(0, { message: 'La edad máxima no puede ser negativa' })
  @IsInt({ message: 'La edad máxima debe ser un número entero de años' })
  @IsNotEmpty({ message: 'Ingresa la edad máxima' })
  edadMaxima: number;
}

/** Cuerpo de POST /juguetes: los mismos datos más el stock inicial (HU-12, criterio 2). */
export class RegistrarJugueteDto extends GuardarJugueteDto {
  @Max(STOCK_MAXIMO, { message: 'El stock puede ser hasta 100000 unidades' })
  @Min(0, { message: STOCK_VALIDO })
  @IsInt({ message: STOCK_VALIDO })
  @IsNotEmpty({ message: 'Ingresa el stock inicial' })
  stock: number;
}
