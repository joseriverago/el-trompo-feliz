import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { UsuarioSesion } from '../auth/sesion.js';
import { UsuarioActual } from '../auth/usuario-actual.decorator.js';
import { DatosEntregaDto } from './dto/datos-entrega.dto.js';
import {
  aPedidoDto,
  aPedidoResumenDto,
  type PedidoDto,
  type PedidoResumenDto,
} from './pedido-dto.js';
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

  /** «Mis pedidos» (HU-10): los pedidos del cliente del token, del más reciente al más antiguo. */
  @Get()
  async listarMios(
    @UsuarioActual() usuario: UsuarioSesion,
  ): Promise<PedidoResumenDto[]> {
    const pedidos = await this.pedidosService.listarMisPedidos(usuario.id);
    return pedidos.map(aPedidoResumenDto);
  }

  /** Un pedido del cliente por su número, para su detalle (HU-11) y la página de pago. 404 si no es suyo. */
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
