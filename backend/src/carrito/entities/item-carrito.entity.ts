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
import { Juguete } from '../../juguetes/entities/juguete.entity.js';
import { Carrito } from './carrito.entity.js';

/**
 * Una línea del carrito: un juguete y cuántas unidades. Un juguete aparece una sola
 * vez por carrito; agregarlo otra vez aumenta la cantidad (HU-05).
 */
@Entity({ name: 'items_carrito' })
@Unique('uq_items_carrito_juguete', ['carritoId', 'jugueteId'])
@Check('ck_items_carrito_cantidad', '"cantidad" >= 1')
export class ItemCarrito {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Carrito, (carrito) => carrito.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'carrito_id' })
  carrito: Relation<Carrito>;

  @Column({ name: 'carrito_id', type: 'integer' })
  carritoId: number;

  /** El precio no se copia: el carrito siempre muestra el precio actual del juguete. */
  @ManyToOne(() => Juguete, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'juguete_id' })
  juguete: Relation<Juguete>;

  @Column({ name: 'juguete_id', type: 'integer' })
  jugueteId: number;

  @Column({ type: 'integer' })
  cantidad: number;

  /** Precio del juguete × cantidad, en soles. */
  calcularSubtotal(): number {
    return multiplicarPrecio(this.juguete.precio, this.cantidad);
  }
}
