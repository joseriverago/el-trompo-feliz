import { Controller, Get, Param, Query } from '@nestjs/common';
import { SoloAdministrador } from '../auth/solo-administrador.decorator.js';
import { FiltroPedidosDto } from './dto/filtro-pedidos.dto.js';
import {
  aPedidoAdminDto,
  aPedidoAdminResumenDto,
  type PedidoAdminDto,
  type PedidoAdminResumenDto,
} from './pedido-dto.js';
import { PedidosService } from './pedidos.service.js';

/** «Administración > Pedidos» (HU-14): todos los pedidos de la tienda, solo para el administrador. */
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
}
