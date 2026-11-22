/** Estados de un pedido (diagrama 04a): se genera Pendiente y pasa a Pagado al aprobarse el pago (HU-09). */
export enum EstadoPedido {
  PENDIENTE = 'PENDIENTE',
  PAGADO = 'PAGADO',
  ENVIADO = 'ENVIADO',
  ENTREGADO = 'ENTREGADO',
}
