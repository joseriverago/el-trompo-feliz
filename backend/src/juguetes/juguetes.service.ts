import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Juguete } from './entities/juguete.entity.js';
import { aJugueteCatalogo, type JugueteCatalogo } from './juguete-catalogo.js';

/**
 * Orden alfabético en español: «Ábaco» va junto a «Ajedrez». PostgreSQL en Neon
 * ordena por código de carácter y dejaría las vocales con tilde después de la «Z».
 */
const ORDEN_ALFABETICO = new Intl.Collator('es', { sensitivity: 'base' });

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
}
