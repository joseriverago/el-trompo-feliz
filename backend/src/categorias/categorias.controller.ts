import { Controller, Get } from '@nestjs/common';
import { CategoriasService } from './categorias.service.js';
import type { Categoria } from './entities/categoria.entity.js';

@Controller('categorias')
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  /** Lista pública de categorías ({ id, nombre }), ordenada por nombre. */
  @Get()
  listar(): Promise<Categoria[]> {
    return this.categoriasService.listar();
  }
}
