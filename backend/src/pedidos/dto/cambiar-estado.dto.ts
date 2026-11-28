import { IsIn } from 'class-validator';
import { EstadoPedido } from '../enums/estado-pedido.enum.js';

/**
 * Cuerpo de PATCH /admin/pedidos/:numero/estado (HU-15). El administrador solo marca Enviado
 * o Entregado: a Pagado se llega únicamente con el pago (HU-09).
 */
export class CambiarEstadoDto {
  @IsIn([EstadoPedido.ENVIADO, EstadoPedido.ENTREGADO], {
    message: 'Solo puedes marcar un pedido como Enviado o Entregado',
  })
  estado: EstadoPedido;
}
