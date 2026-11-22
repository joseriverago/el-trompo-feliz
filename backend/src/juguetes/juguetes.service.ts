import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Juguete } from './entities/juguete.entity.js';
import { aJugueteCatalogo, type JugueteCatalogo } from './juguete-catalogo.js';

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
      order: { nombre: 'ASC' },
    });
    return juguetes.map(aJugueteCatalogo);
  }
}
