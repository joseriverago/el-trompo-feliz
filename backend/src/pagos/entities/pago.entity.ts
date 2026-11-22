import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { transformadorDecimal } from '../../database/transformador-decimal.js';
import { Pedido } from '../../pedidos/entities/pedido.entity.js';

/**
 * Un intento de pago simulado de un pedido (HU-09, CU-10). Se guarda cada intento,
 * aprobado o rechazado, pero de la tarjeta solo los últimos 4 dígitos: nunca el número
 * completo, el titular, el vencimiento ni el CVV.
 */
@Entity({ name: 'pagos' })
// Un pedido puede tener varios intentos rechazados, pero un solo pago aprobado.
@Index('uq_pagos_pedido_aprobado', ['pedidoId'], {
  unique: true,
  where: '"aprobado"',
})
@Check('ck_pagos_monto', '"monto" > 0')
@Check('ck_pagos_ultimos_digitos', `"ultimos_digitos" ~ '^[0-9]{4}$'`)
export class Pago {
  @PrimaryGeneratedColumn()
  id: number;

  /** RESTRICT: un pedido con pagos no se borra. */
  @ManyToOne(() => Pedido, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'pedido_id' })
  pedido: Relation<Pedido>;

  @Column({ name: 'pedido_id', type: 'integer' })
  pedidoId: number;

  /** Total del pedido al momento del pago, en soles. */
  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: transformadorDecimal,
  })
  monto: number;

  /** Solo los últimos 4 dígitos de la tarjeta, por ejemplo «4242». */
  @Column({ name: 'ultimos_digitos', type: 'varchar', length: 4 })
  ultimosDigitos: string;

  /** Resultado del pago simulado: falso si la tarjeta fue rechazada. */
  @Column({ type: 'boolean' })
  aprobado: boolean;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  creadoEn: Date;
}
