import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { UsuarioSesion } from '../auth/sesion.js';
import { UsuarioActual } from '../auth/usuario-actual.decorator.js';
import { aCarritoDto, type CarritoDto } from './carrito-dto.js';
import { CarritoService, LINEA_NO_ENCONTRADA } from './carrito.service.js';
import { AgregarItemDto } from './dto/agregar-item.dto.js';
import { CambiarCantidadDto } from './dto/cambiar-cantidad.dto.js';

/** Un id de línea que no es número tampoco puede estar en el carrito: 404, igual que uno que no existe. */
const ID_DE_LINEA = new ParseIntPipe({
  exceptionFactory: () =>
    new NotFoundException({ statusCode: 404, message: LINEA_NO_ENCONTRADA }),
});

/**
 * Carrito del cliente con sesión iniciada. Todas las rutas usan JwtAuthGuard:
 * el carrito siempre es el del usuario del token, nunca uno indicado en la petición.
 */
@Controller('carrito')
@UseGuards(JwtAuthGuard)
export class CarritoController {
  constructor(private readonly carritoService: CarritoService) {}

  /** Carrito actual con sus juguetes, las unidades y el total. */
  @Get()
  async obtener(@UsuarioActual() usuario: UsuarioSesion): Promise<CarritoDto> {
    return aCarritoDto(await this.carritoService.obtenerCarrito(usuario.id));
  }

  /**
   * Agrega una unidad de un juguete (HU-05). Responde 200 con el carrito actualizado,
   * 400 si falta el juguete, 404 si no existe y 409 «Solo quedan N unidades» si no hay stock.
   */
  @Post('items')
  @HttpCode(HttpStatus.OK)
  async agregar(
    @UsuarioActual() usuario: UsuarioSesion,
    @Body() datos: AgregarItemDto,
  ): Promise<CarritoDto> {
    return aCarritoDto(
      await this.carritoService.agregarJuguete(usuario.id, datos.jugueteId),
    );
  }

  /**
   * Cambia la cantidad de una línea (HU-06). Responde 200 con el carrito actualizado,
   * 400 si la cantidad no es un entero de 1 o más, 404 si la línea no está en el carrito
   * del cliente y 409 «Solo quedan N unidades» si supera el stock.
   */
  @Patch('items/:itemId')
  async cambiarCantidad(
    @UsuarioActual() usuario: UsuarioSesion,
    @Param('itemId', ID_DE_LINEA) itemId: number,
    @Body() datos: CambiarCantidadDto,
  ): Promise<CarritoDto> {
    return aCarritoDto(
      await this.carritoService.cambiarCantidad(
        usuario.id,
        itemId,
        datos.cantidad,
      ),
    );
  }

  /** Quita una línea (HU-06). Responde 200 con el carrito sin ella, o 404 si no estaba. */
  @Delete('items/:itemId')
  async quitar(
    @UsuarioActual() usuario: UsuarioSesion,
    @Param('itemId', ID_DE_LINEA) itemId: number,
  ): Promise<CarritoDto> {
    return aCarritoDto(
      await this.carritoService.quitarItem(usuario.id, itemId),
    );
  }
}
