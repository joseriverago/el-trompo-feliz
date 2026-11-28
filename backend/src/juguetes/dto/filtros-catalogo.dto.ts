import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Parámetros de GET /juguetes (CU-03 Buscar y filtrar juguetes). Todos son opcionales:
 * sin ninguno se lista el catálogo completo.
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
}
