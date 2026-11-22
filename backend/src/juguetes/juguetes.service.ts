import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Juguete } from './entities/juguete.entity.js';
import {
  aJugueteCatalogo,
  aJugueteDetalle,
  type JugueteCatalogo,
  type JugueteDetalle,
} from './juguete-catalogo.js';

/**
 * Orden alfabético en español: «Ábaco» va junto a «Ajedrez». PostgreSQL en Neon
 * ordena por código de carácter y dejaría las vocales con tilde después de la «Z».
 */
const ORDEN_ALFABETICO = new Intl.Collator('es', { sensitivity: 'base' });

/** Mayor valor de una columna integer de PostgreSQL; un id mayor no puede existir. */
const ID_MAXIMO = 2_147_483_647;

@Injectable()
export class JuguetesService {
  constructor(
    @InjectRepository(Juguete)
    private readonly juguetes: Repository<Juguete>,
  ) {}

  /** Juguetes activos con su categoría, ordenados por nombre. Los desactivados no se muestran. */
  async listarCatalogo(): Promise<JugueteCatalogo[]> {
    const juguetes = await this.juguetes.find({
      where: { activo: true },
      relations: { categoria: true },
    });
    return juguetes
      .sort((a, b) => ORDEN_ALFABETICO.compare(a.nombre, b.nombre))
      .map(aJugueteCatalogo);
  }

  /** Detalle de un juguete activo. Responde 404 si no existe o fue desactivado. */
  async obtenerDetalle(id: number): Promise<JugueteDetalle> {
    const juguete =
      id >= 1 && id <= ID_MAXIMO
        ? await this.juguetes.findOne({
            where: { id, activo: true },
            relations: { categoria: true },
          })
        : null;
    if (!juguete) {
      throw new NotFoundException('Juguete no encontrado');
    }
    return aJugueteDetalle(juguete);
  }
}
