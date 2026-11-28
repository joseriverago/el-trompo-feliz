import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { SoloAdministrador } from '../auth/solo-administrador.decorator.js';
import { CambiarEstadoDto } from './dto/cambiar-estado.dto.js';
import { FiltroPedidosDto } from './dto/filtro-pedidos.dto.js';
import {
  aPedidoAdminDto,
  aPedidoAdminResumenDto,
  type PedidoAdminDto,
  type PedidoAdminResumenDto,
} from './pedido-dto.js';
import { PedidosService } from './pedidos.service.js';

/** «Administración > Pedidos» (HU-14 y HU-15): los pedidos de la tienda, solo para el administrador. */
@Controller('admin/pedidos')
@SoloAdministrador()
export class AdminPedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Get()
  async listar(
    @Query() filtro: FiltroPedidosDto,
  ): Promise<PedidoAdminResumenDto[]> {
    const pedidos = await this.pedidosService.listarTodos(filtro.estado);
    return pedidos.map(aPedidoAdminResumenDto);
  }

  @Get(':numero')
  async obtener(@Param('numero') numero: string): Promise<PedidoAdminDto> {
    return aPedidoAdminDto(
      await this.pedidosService.obtenerParaAdministrador(numero),
    );
  }

  /** Marca el pedido Enviado o Entregado (HU-15). 409 si el orden de los estados no lo permite. */
  @Patch(':numero/estado')
  async cambiarEstado(
    @Param('numero') numero: string,
    @Body() { estado }: CambiarEstadoDto,
  ): Promise<PedidoAdminDto> {
    return aPedidoAdminDto(
      await this.pedidosService.cambiarEstado(numero, estado),
    );
  }
}
