import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';
import { Categoria } from '../../categorias/entities/categoria.entity.js';
import { transformadorDecimal } from '../../database/transformador-decimal.js';

@Entity({ name: 'juguetes' })
export class Juguete {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 120 })
  nombre: string;

  @Column({ type: 'text' })
  descripcion: string;

  /** Precio en soles (S/) con dos decimales. */
  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: transformadorDecimal,
  })
  precio: number;

  @Column({ name: 'imagen_url', type: 'varchar', length: 500 })
  imagenUrl: string;

  /** Edad recomendada en años: desde edadMinima hasta edadMaxima. */
  @Column({ name: 'edad_minima', type: 'smallint' })
  edadMinima: number;

  @Column({ name: 'edad_maxima', type: 'smallint' })
  edadMaxima: number;

  @Column({ type: 'integer', default: 0 })
  stock: number;

  /** Eliminar un juguete lo desactiva; así los pedidos anteriores lo conservan. */
  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @ManyToOne(() => Categoria, (categoria) => categoria.juguetes, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'categoria_id' })
  categoria: Relation<Categoria>;

  @Column({ name: 'categoria_id', type: 'integer' })
  categoriaId: number;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  creadoEn: Date;

  @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamptz' })
  actualizadoEn: Date;
}
