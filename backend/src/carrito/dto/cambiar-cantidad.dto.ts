import { IsInt, Min } from 'class-validator';

const CANTIDAD_VALIDA = 'La cantidad debe ser un número entero de 1 o más';

/**
 * Cuerpo de PATCH /carrito/items/:itemId (HU-06, CU-08 Gestionar carrito).
 * Aquí solo se valida el mínimo: el máximo es el stock, y lo verifica IInventario.
 */
export class CambiarCantidadDto {
  @IsInt({ message: CANTIDAD_VALIDA })
  @Min(1, { message: CANTIDAD_VALIDA })
  cantidad: number;
}
