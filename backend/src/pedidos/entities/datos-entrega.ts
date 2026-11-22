import { Column } from 'typeorm';

/**
 * A quién y dónde se entrega el pedido (HU-08). Es parte del pedido, no una tabla:
 * sus columnas se guardan en la tabla pedidos.
 */
export class DatosEntrega {
  /** Nombre de quien recibe el pedido. */
  @Column({ type: 'varchar', length: 100 })
  destinatario: string;

  /** Celular de 9 dígitos, sin espacios. */
  @Column({ type: 'varchar', length: 9 })
  telefono: string;

  @Column({ type: 'varchar', length: 200 })
  direccion: string;

  @Column({ type: 'varchar', length: 80 })
  distrito: string;

  /** Referencia opcional para encontrar la dirección, por ejemplo «frente al parque». */
  @Column({ type: 'varchar', length: 200, nullable: true })
  referencia: string | null;
}
