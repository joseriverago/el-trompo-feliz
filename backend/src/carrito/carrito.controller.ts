import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { UsuarioSesion } from '../auth/sesion.js';
import { UsuarioActual } from '../auth/usuario-actual.decorator.js';
import { aCarritoDto, type CarritoDto } from './carrito-dto.js';
import { CarritoService } from './carrito.service.js';
import { AgregarItemDto } from './dto/agregar-item.dto.js';

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
}
