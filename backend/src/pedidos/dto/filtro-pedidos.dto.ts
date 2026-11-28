import { IsEnum, IsOptional } from 'class-validator';
import { EstadoPedido } from '../enums/estado-pedido.enum.js';

/** Filtro de GET /admin/pedidos (HU-14). Sin estado se listan todos. */
export class FiltroPedidosDto {
  @IsOptional()
  @IsEnum(EstadoPedido, { message: 'El estado del pedido no existe' })
  estado?: EstadoPedido;
}
