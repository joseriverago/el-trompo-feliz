import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Juguete } from '../../juguetes/entities/juguete.entity.js';

@Entity({ name: 'categorias' })
export class Categoria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 60, unique: true })
  nombre: string;

  @OneToMany(() => Juguete, (juguete) => juguete.categoria)
  juguetes: Relation<Juguete[]>;
}
