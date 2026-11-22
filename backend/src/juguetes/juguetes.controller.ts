import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import type { JugueteCatalogo, JugueteDetalle } from './juguete-catalogo.js';
import { JuguetesService } from './juguetes.service.js';

@Controller('juguetes')
export class JuguetesController {
  constructor(private readonly juguetesService: JuguetesService) {}

  /** Catálogo público: no necesita iniciar sesión. */
  @Get()
  listarCatalogo(): Promise<JugueteCatalogo[]> {
    return this.juguetesService.listarCatalogo();
  }

  /** Detalle público de un juguete. Un id que no es número también responde 404. */
  @Get(':id')
  obtenerDetalle(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_FOUND }),
    )
    id: number,
  ): Promise<JugueteDetalle> {
    return this.juguetesService.obtenerDetalle(id);
  }
}
