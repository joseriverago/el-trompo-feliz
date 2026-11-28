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

/** Una fila del historial de pedidos (GET /pedidos, HU-10): sin las líneas ni la entrega. */
export interface PedidoResumenDto {
  numero: string;
  estado: EstadoPedido;
  total: number;
  /** Suma de las cantidades. */
  unidades: number;
  creadoEn: Date;
}

/** Respuesta de POST /pedidos y GET /pedidos/:numero. */
export interface PedidoDto extends PedidoResumenDto {
  entrega: DatosEntrega;
  detalles: DetallePedidoDto[];
}

export function aPedidoResumenDto(pedido: Pedido): PedidoResumenDto {
  return {
    numero: pedido.numero,
    estado: pedido.estado,
    total: pedido.total,
    unidades: pedido.detalles.reduce((suma, linea) => suma + linea.cantidad, 0),
    creadoEn: pedido.creadoEn,
  };
}

export function aPedidoDto(pedido: Pedido): PedidoDto {
  const { destinatario, telefono, direccion, distrito, referencia } =
    pedido.entrega;
  return {
    ...aPedidoResumenDto(pedido),
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

/** Fila de GET /admin/pedidos (HU-14): el resumen y el nombre del cliente. */
export interface PedidoAdminResumenDto extends PedidoResumenDto {
  cliente: string;
}

/** Respuesta de GET /admin/pedidos/:numero (HU-14). */
export interface PedidoAdminDto extends PedidoDto {
  cliente: string;
}

/** Solo sale el nombre del cliente: ni su correo ni su contraseña. */
export function aPedidoAdminResumenDto(pedido: Pedido): PedidoAdminResumenDto {
  return { ...aPedidoResumenDto(pedido), cliente: pedido.usuario.nombre };
}

export function aPedidoAdminDto(pedido: Pedido): PedidoAdminDto {
  return { ...aPedidoDto(pedido), cliente: pedido.usuario.nombre };
}
