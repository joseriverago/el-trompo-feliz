import type { EstadoPedido } from '../pedidos/enums/estado-pedido.enum.js';
import type { Pago } from './entities/pago.entity.js';

/** Respuesta de POST /pedidos/:numero/pago: la confirmación que ve el cliente. */
export interface PagoDto {
  /** Número del pedido pagado. */
  numero: string;
  estado: EstadoPedido;
  monto: number;
  ultimosDigitos: string;
  pagadoEn: Date;
}

export function aPagoDto(pago: Pago): PagoDto {
  return {
    numero: pago.pedido.numero,
    estado: pago.pedido.estado,
    monto: pago.monto,
    ultimosDigitos: pago.ultimosDigitos,
    pagadoEn: pago.creadoEn,
  };
}
