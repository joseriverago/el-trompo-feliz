import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  Unique,
} from 'typeorm';
import { sumarMontos } from '../../comun/dinero.js';
import { transformadorDecimal } from '../../database/transformador-decimal.js';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';
import { EstadoPedido } from '../enums/estado-pedido.enum.js';
import { DatosEntrega } from './datos-entrega.js';
import { DetallePedido } from './detalle-pedido.entity.js';

/**
 * Pasos que da el administrador (HU-15). Pendiente no aparece porque pasa a Pagado solo con el
 * pago, y Entregado es el final.
 */
const SIGUIENTE_DEL_ADMINISTRADOR: Partial<Record<EstadoPedido, EstadoPedido>> =
  {
    [EstadoPedido.PAGADO]: EstadoPedido.ENVIADO,
    [EstadoPedido.ENVIADO]: EstadoPedido.ENTREGADO,
  };

/**
 * Pedido de un cliente (HU-08). Se genera Pendiente con los juguetes del carrito;
 * el pago simulado lo pasa a Pagado (HU-09).
 */
@Entity({ name: 'pedidos' })
@Unique('uq_pedidos_numero', ['numero'])
@Check('ck_pedidos_total', '"total" > 0')
export class Pedido {
  @PrimaryGeneratedColumn()
  id: number;

  /** Número que ve el cliente, por ejemplo TF-20261122-483920. Es único. */
  @Column({ type: 'varchar', length: 20 })
  numero: string;

  @Column({
    type: 'enum',
    enum: EstadoPedido,
    enumName: 'estado_pedido',
    default: EstadoPedido.PENDIENTE,
  })
  estado: EstadoPedido;

  /** Suma de los subtotales al generar el pedido, en soles. */
  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: transformadorDecimal,
  })
  total: number;

  /** Columnas destinatario, telefono, direccion, distrito y referencia, sin prefijo. */
  @Column(() => DatosEntrega, { prefix: false })
  entrega: DatosEntrega;

  /** RESTRICT: los pedidos se conservan, así que un cliente con pedidos no se borra. */
  @ManyToOne(() => Usuario, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<Usuario>;

  /** Índice: el historial de pedidos busca por cliente (HU-10). */
  @Index('ix_pedidos_usuario_id')
  @Column({ name: 'usuario_id', type: 'integer' })
  usuarioId: number;

  /** cascade insert: al guardar el pedido se guardan también sus líneas. */
  @OneToMany(() => DetallePedido, (detalle) => detalle.pedido, {
    cascade: ['insert'],
  })
  detalles: Relation<DetallePedido>[];

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  creadoEn: Date;

  /** Suma de los subtotales de las líneas, en soles. */
  calcularTotal(): number {
    return sumarMontos(
      this.detalles.map((detalle) => detalle.calcularSubtotal()),
    );
  }

  /** El orden es fijo: un pedido solo avanza al estado siguiente (HU-15). */
  puedeAvanzarA(estado: EstadoPedido): boolean {
    return SIGUIENTE_DEL_ADMINISTRADOR[this.estado] === estado;
  }

  /** Solo un pedido Pendiente se puede pagar (HU-09). */
  estaPendiente(): boolean {
    return this.estado === EstadoPedido.PENDIENTE;
  }
}
