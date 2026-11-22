import { IsInt, Max, Min } from 'class-validator';
import { ID_MAXIMO } from '../../database/limites.js';

const ELIGE_UN_JUGUETE = 'Elige un juguete del catálogo';

/** Cuerpo de POST /carrito/items (HU-05, CU-07 Agregar producto al carrito). */
export class AgregarItemDto {
  @IsInt({ message: ELIGE_UN_JUGUETE })
  @Min(1, { message: ELIGE_UN_JUGUETE })
  @Max(ID_MAXIMO, { message: ELIGE_UN_JUGUETE })
  jugueteId: number;
}
