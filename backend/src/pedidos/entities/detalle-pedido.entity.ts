import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  Unique,
} from 'typeorm';
import { multiplicarPrecio } from '../../comun/dinero.js';
import { transformadorDecimal } from '../../database/transformador-decimal.js';
import { Juguete } from '../../juguetes/entities/juguete.entity.js';
import { Pedido } from './pedido.entity.js';

/**
 * Una línea del pedido. Copia el nombre y el precio que tenía el juguete al generar el
 * pedido (HU-08): si después cambia el precio en el catálogo, el pedido no cambia.
 */
@Entity({ name: 'detalles_pedido' })
@Unique('uq_detalles_pedido_juguete', ['pedido', 'jugueteId'])
@Check('ck_detalles_pedido_cantidad', '"cantidad" >= 1')
export class DetallePedido {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Pedido, (pedido) => pedido.detalles, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'pedido_id' })
  pedido: Relation<Pedido>;

  /** RESTRICT: un juguete con pedidos no se borra; se desactiva (HU-20). */
  @ManyToOne(() => Juguete, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'juguete_id' })
  juguete: Relation<Juguete>;

  @Column({ name: 'juguete_id', type: 'integer' })
  jugueteId: number;

  @Column({ name: 'nombre_juguete', type: 'varchar', length: 120 })
  nombreJuguete: string;

  /** Precio vigente al generar el pedido, en soles. */
  @Column({
    name: 'precio_unitario',
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: transformadorDecimal,
  })
  precioUnitario: number;

  @Column({ type: 'integer' })
  cantidad: number;

  /** Precio unitario × cantidad, en soles. */
  calcularSubtotal(): number {
    return multiplicarPrecio(this.precioUnitario, this.cantidad);
  }
}
