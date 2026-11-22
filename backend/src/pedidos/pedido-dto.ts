import type { DatosEntrega } from './entities/datos-entrega.js';
import type { Pedido } from './entities/pedido.entity.js';
import type { EstadoPedido } from './enums/estado-pedido.enum.js';

/** Una línea del pedido con el precio que tenía el juguete al comprarlo. */
export interface DetallePedidoDto {
  jugueteId: number;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
}

/** Respuesta de POST /pedidos y GET /pedidos/:numero. */
export interface PedidoDto {
  numero: string;
  estado: EstadoPedido;
  total: number;
  /** Suma de las cantidades. */
  unidades: number;
  creadoEn: Date;
  entrega: DatosEntrega;
  detalles: DetallePedidoDto[];
}

export function aPedidoDto(pedido: Pedido): PedidoDto {
  const { destinatario, telefono, direccion, distrito, referencia } =
    pedido.entrega;
  return {
    numero: pedido.numero,
    estado: pedido.estado,
    total: pedido.total,
    unidades: pedido.detalles.reduce((suma, linea) => suma + linea.cantidad, 0),
    creadoEn: pedido.creadoEn,
    entrega: { destinatario, telefono, direccion, distrito, referencia },
    detalles: pedido.detalles.map((detalle) => ({
      jugueteId: detalle.jugueteId,
      nombre: detalle.nombreJuguete,
      precioUnitario: detalle.precioUnitario,
      cantidad: detalle.cantidad,
      subtotal: detalle.calcularSubtotal(),
    })),
  };
}
