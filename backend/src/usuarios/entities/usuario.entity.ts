import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Rol } from '../enums/rol.enum.js';

@Entity({ name: 'usuarios' })
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  correo: string;

  /** Hash bcrypt de la contraseña. No se lee en las consultas salvo que se pida. */
  @Column({
    name: 'contrasena_hash',
    type: 'varchar',
    length: 100,
    select: false,
  })
  contrasenaHash: string;

  @Column({
    type: 'enum',
    enum: Rol,
    enumName: 'rol_usuario',
    default: Rol.CLIENTE,
  })
  rol: Rol;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  creadoEn: Date;
}
