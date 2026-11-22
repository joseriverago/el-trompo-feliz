import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { UsuarioSesion } from '../auth/sesion.js';
import { UsuarioActual } from '../auth/usuario-actual.decorator.js';
import { DatosEntregaDto } from './dto/datos-entrega.dto.js';
import { aPedidoDto, type PedidoDto } from './pedido-dto.js';
import { PedidosService } from './pedidos.service.js';

/**
 * Pedidos del cliente con sesión iniciada. Todas las rutas usan JwtAuthGuard:
 * el pedido siempre es del usuario del token.
 */
@Controller('pedidos')
@UseGuards(JwtAuthGuard)
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  /**
   * Genera el pedido con el carrito y los datos de entrega (HU-08). Responde 201 con el
   * pedido Pendiente, 400 si falta un dato o el carrito está vacío, y 409 con los juguetes
   * que hay que ajustar si alguno no tiene stock suficiente.
   */
  @Post()
  async generar(
    @UsuarioActual() usuario: UsuarioSesion,
    @Body() datos: DatosEntregaDto,
  ): Promise<PedidoDto> {
    return aPedidoDto(
      await this.pedidosService.generarPedido(usuario.id, datos),
    );
  }

  /** Un pedido del cliente por su número, por ejemplo para la página de pago. 404 si no es suyo. */
  @Get(':numero')
  async obtenerMio(
    @UsuarioActual() usuario: UsuarioSesion,
    @Param('numero') numero: string,
  ): Promise<PedidoDto> {
    return aPedidoDto(
      await this.pedidosService.obtenerPedido(usuario.id, numero),
    );
  }
}
