import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { sumarMontos } from '../../comun/dinero.js';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';
import { ItemCarrito } from './item-carrito.entity.js';

/**
 * Carrito de un cliente. Se guarda en la base de datos, así que el cliente lo
 * encuentra igual al volver a entrar desde otro navegador (HU-07).
 */
@Entity({ name: 'carritos' })
export class Carrito {
  @PrimaryGeneratedColumn()
  id: number;

  /** Cada cliente tiene un solo carrito: la columna usuario_id es única. */
  @OneToOne(() => Usuario, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<Usuario>;

  @Column({ name: 'usuario_id', type: 'integer' })
  usuarioId: number;

  @OneToMany(() => ItemCarrito, (item) => item.carrito)
  items: Relation<ItemCarrito>[];

  /** La línea de ese juguete, si ya está en el carrito. */
  buscarItem(jugueteId: number): ItemCarrito | undefined {
    return this.items.find((item) => item.jugueteId === jugueteId);
  }

  /** Suma de los subtotales, en soles. */
  calcularTotal(): number {
    return sumarMontos(this.items.map((item) => item.calcularSubtotal()));
  }
}
