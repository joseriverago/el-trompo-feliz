import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ID_MAXIMO } from '../../database/limites.js';
import { RANGOS_EDAD, type RangoEdad } from '../rangos-edad.js';

const PRECIO_VALIDO = 'El precio debe ser un número de 0 o más';

/** Los parámetros llegan como texto: vacío es «sin filtro» y lo demás se convierte a número. */
const numeroOpcional = ({ value }: { value: unknown }) =>
  value === '' || value === undefined ? undefined : Number(value);

/**
 * Parámetros de GET /juguetes (CU-03 Buscar y filtrar juguetes). Todos son opcionales y se
 * cumplen a la vez; sin ninguno se lista el catálogo completo.
 */
export class FiltrosCatalogoDto {
  /** Parte del nombre del juguete (HU-16). */
  @IsOptional()
  @MaxLength(120, { message: 'La búsqueda puede tener hasta 120 caracteres' })
  @IsString({ message: 'La búsqueda debe ser un texto' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  nombre?: string;

  @IsOptional()
  @Max(ID_MAXIMO, { message: 'La categoría no existe' })
  @IsInt({ message: 'La categoría no existe' })
  @Transform(numeroOpcional)
  categoriaId?: number;

  @IsOptional()
  @IsIn(Object.keys(RANGOS_EDAD), { message: 'El rango de edad no existe' })
  @Transform(({ value }: { value: unknown }) =>
    value === '' ? undefined : value,
  )
  edad?: RangoEdad;

  @IsOptional()
  @Min(0, { message: PRECIO_VALIDO })
  @IsNumber({}, { message: PRECIO_VALIDO })
  @Transform(numeroOpcional)
  precioMin?: number;

  @IsOptional()
  @Min(0, { message: PRECIO_VALIDO })
  @IsNumber({}, { message: PRECIO_VALIDO })
  @Transform(numeroOpcional)
  precioMax?: number;
}
