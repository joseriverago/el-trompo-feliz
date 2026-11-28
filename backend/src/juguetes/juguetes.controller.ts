import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { SoloAdministrador } from '../auth/solo-administrador.decorator.js';
import { ActualizarStockDto } from './dto/actualizar-stock.dto.js';
import { FiltrosCatalogoDto } from './dto/filtros-catalogo.dto.js';
import {
  GuardarJugueteDto,
  RegistrarJugueteDto,
} from './dto/guardar-juguete.dto.js';
import {
  aJugueteDetalle,
  type JugueteCatalogo,
  type JugueteDetalle,
} from './juguete-catalogo.js';
import { JuguetesService } from './juguetes.service.js';

/** Un id que no es número responde 404, como un juguete que no existe. */
const ID_JUGUETE = new ParseIntPipe({
  errorHttpStatusCode: HttpStatus.NOT_FOUND,
});

@Controller('juguetes')
export class JuguetesController {
  constructor(private readonly juguetesService: JuguetesService) {}

  /** Catálogo público: no necesita iniciar sesión. Admite búsqueda por nombre (HU-16). */
  @Get()
  listarCatalogo(
    @Query() filtros: FiltrosCatalogoDto,
  ): Promise<JugueteCatalogo[]> {
    return this.juguetesService.listarCatalogo(filtros);
  }

  /** Detalle público de un juguete. */
  @Get(':id')
  obtenerDetalle(@Param('id', ID_JUGUETE) id: number): Promise<JugueteDetalle> {
    return this.juguetesService.obtenerDetalle(id);
  }

  /** Registra un juguete con su stock inicial (HU-12). Solo el administrador: 201. */
  @Post()
  @SoloAdministrador()
  async registrar(@Body() datos: RegistrarJugueteDto): Promise<JugueteDetalle> {
    return aJugueteDetalle(await this.juguetesService.registrar(datos));
  }

  /** Cambia los datos de un juguete, sin su stock (HU-12). Solo el administrador. */
  @Put(':id')
  @SoloAdministrador()
  async editar(
    @Param('id', ID_JUGUETE) id: number,
    @Body() datos: GuardarJugueteDto,
  ): Promise<JugueteDetalle> {
    return aJugueteDetalle(await this.juguetesService.editar(id, datos));
  }

  /** Fija el stock de un juguete (HU-13, «Administración > Inventario»). Solo el administrador. */
  @Patch(':id/stock')
  @SoloAdministrador()
  async actualizarStock(
    @Param('id', ID_JUGUETE) id: number,
    @Body() datos: ActualizarStockDto,
  ): Promise<JugueteDetalle> {
    return aJugueteDetalle(
      await this.juguetesService.actualizarStock(id, datos.stock),
    );
  }

  /** Elimina (desactiva) un juguete (HU-20). Solo el administrador: 204 sin contenido. */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @SoloAdministrador()
  eliminar(@Param('id', ID_JUGUETE) id: number): Promise<void> {
    return this.juguetesService.desactivar(id);
  }
}
