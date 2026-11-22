import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { UsuarioSesion } from '../auth/sesion.js';
import { UsuarioActual } from '../auth/usuario-actual.decorator.js';
import { TarjetaDto } from './dto/tarjeta.dto.js';
import { aPagoDto, type PagoDto } from './pago-dto.js';
import { PagosService } from './pagos.service.js';

/** Pago simulado de los pedidos del cliente con sesión iniciada (JwtAuthGuard). */
@Controller('pedidos')
@UseGuards(JwtAuthGuard)
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  /**
   * Paga un pedido Pendiente con una tarjeta simulada (HU-09). Responde 201 con la
   * confirmación; 400 si un dato de la tarjeta está mal o venció; 402 «Pago rechazado» con
   * la tarjeta de prueba que termina en 0000; 404 si el pedido no es del cliente; y 409 si
   * ya está pagado o algún juguete ya no tiene stock suficiente.
   */
  @Post(':numero/pago')
  async pagar(
    @UsuarioActual() usuario: UsuarioSesion,
    @Param('numero') numero: string,
    @Body() tarjeta: TarjetaDto,
  ): Promise<PagoDto> {
    return aPagoDto(await this.pagosService.pagar(usuario.id, numero, tarjeta));
  }
}
