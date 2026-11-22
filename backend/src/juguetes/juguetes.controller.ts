import { Controller, Get } from '@nestjs/common';
import type { JugueteCatalogo } from './juguete-catalogo.js';
import { JuguetesService } from './juguetes.service.js';

@Controller('juguetes')
export class JuguetesController {
  constructor(private readonly juguetesService: JuguetesService) {}

  /** Catálogo público: no necesita iniciar sesión. */
  @Get()
  listarCatalogo(): Promise<JugueteCatalogo[]> {
    return this.juguetesService.listarCatalogo();
  }
}
