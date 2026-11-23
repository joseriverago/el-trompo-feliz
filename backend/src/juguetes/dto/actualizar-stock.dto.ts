import { IsInt, IsNotEmpty, Max, Min } from 'class-validator';
import { STOCK_MAXIMO } from './guardar-juguete.dto.js';

const STOCK_VALIDO = 'El stock debe ser un número entero de 0 o más';

/**
 * Cuerpo de PATCH /juguetes/:id/stock (HU-13, CU-14 Actualizar stock): la cantidad que hay
 * ahora en la tienda. La regla del tipo va debajo de la de rango, porque se informa primero.
 */
export class ActualizarStockDto {
  @Max(STOCK_MAXIMO, { message: 'El stock puede ser hasta 100000 unidades' })
  @Min(0, { message: STOCK_VALIDO })
  @IsInt({ message: STOCK_VALIDO })
  @IsNotEmpty({ message: 'Ingresa el stock' })
  stock: number;
}
