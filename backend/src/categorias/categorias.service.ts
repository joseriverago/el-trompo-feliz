import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categoria } from './entities/categoria.entity.js';

/** Orden alfabético en español, igual que el catálogo: «Ábaco» junto a «Arte», no después de la «Z». */
const ORDEN_ALFABETICO = new Intl.Collator('es', { sensitivity: 'base' });

@Injectable()
export class CategoriasService {
  constructor(
    @InjectRepository(Categoria)
    private readonly categorias: Repository<Categoria>,
  ) {}

  /**
   * ICatalogo: las categorías ordenadas por nombre. Las usan el formulario de juguetes
   * (HU-12) y el filtro del catálogo (HU-17).
   */
  async listar(): Promise<Categoria[]> {
    const categorias = await this.categorias.find();
    return categorias.sort((a, b) =>
      ORDEN_ALFABETICO.compare(a.nombre, b.nombre),
    );
  }
}
