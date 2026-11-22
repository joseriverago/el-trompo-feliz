import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, type Repository } from 'typeorm';
import { REVISA_FORMULARIO } from '../config/pipe-validacion.js';
import { esViolacionUnica } from '../database/errores.js';
import { JuguetesService } from '../juguetes/juguetes.service.js';
import type { Pedido } from '../pedidos/entities/pedido.entity.js';
import {
  PEDIDO_YA_PAGADO,
  PedidosService,
} from '../pedidos/pedidos.service.js';
import type { TarjetaDto } from './dto/tarjeta.dto.js';
import { Pago } from './entities/pago.entity.js';

export const PAGO_RECHAZADO =
  'Pago rechazado: la tarjeta no fue aprobada. Prueba con otra tarjeta.';
export const TARJETA_VENCIDA = 'La tarjeta está vencida';

/** Tarjeta de rechazo de prueba: cualquier número que termine en 0000 (HU-09, criterio 2). */
const TERMINACION_RECHAZADA = '0000';

/** Año y mes de Lima, para saber si una tarjeta ya venció. */
const MES_LIMA = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Lima',
  year: 'numeric',
  month: '2-digit',
});

/** Hoy en Lima como un solo número (año × 12 + mes), fácil de comparar con el vencimiento. */
function mesActualLima(): number {
  const partes = MES_LIMA.formatToParts(new Date());
  const valor = (tipo: string) =>
    Number(partes.find((parte) => parte.type === tipo)?.value);
  return valor('year') * 12 + valor('month');
}

@Injectable()
export class PagosService {
  constructor(
    @InjectRepository(Pago)
    private readonly pagos: Repository<Pago>,
    private readonly fuenteDatos: DataSource,
    private readonly pedidosService: PedidosService,
    private readonly juguetesService: JuguetesService,
  ) {}

  /**
   * IPagos: paga con una tarjeta simulada un pedido Pendiente del cliente (HU-09, CU-10).
   * - Tarjeta vencida: 400. Pedido de otro cliente o inexistente: 404. Pedido ya pagado: 409.
   * - Tarjeta que termina en 0000: guarda el intento rechazado y responde 402 «Pago rechazado»;
   *   el pedido sigue Pendiente y el stock no cambia, así que el cliente puede reintentar.
   * - Tarjeta aprobada: en una sola transacción marca el pedido Pagado, descuenta el stock de
   *   cada juguete y guarda el pago. Si falta stock (409) o el pedido ya se pagó, no se guarda nada.
   */
  async pagar(
    usuarioId: number,
    numero: string,
    tarjeta: TarjetaDto,
  ): Promise<Pago> {
    this.validarTarjeta(tarjeta);
    const pedido = await this.pedidosService.obtenerPedido(usuarioId, numero);
    if (!pedido.estaPendiente()) throw this.yaPagado();

    const ultimosDigitos = tarjeta.numero.slice(-4);
    if (this.esTarjetaRechazada(tarjeta.numero)) {
      await this.pagos.save(
        this.pagos.create({
          pedidoId: pedido.id,
          monto: pedido.total,
          ultimosDigitos,
          aprobado: false,
        }),
      );
      throw new HttpException(
        { statusCode: HttpStatus.PAYMENT_REQUIRED, message: PAGO_RECHAZADO },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    try {
      return await this.aprobar(pedido, ultimosDigitos);
    } catch (error) {
      // El índice único de pagos aprobados es la última barrera contra un doble cobro.
      if (esViolacionUnica(error)) throw this.yaPagado();
      throw error;
    }
  }

  /** Pago aprobado: o se guardan los tres cambios o ninguno (fuenteDatos.transaction). */
  private aprobar(pedido: Pedido, ultimosDigitos: string): Promise<Pago> {
    return this.fuenteDatos.transaction(async (gestor) => {
      await this.pedidosService.marcarPagado(gestor, pedido);
      await this.juguetesService.descontarStock(
        gestor,
        pedido.detalles.map((detalle) => ({
          jugueteId: detalle.jugueteId,
          nombre: detalle.nombreJuguete,
          cantidad: detalle.cantidad,
        })),
      );
      const pago = await gestor.save(
        gestor.create(Pago, {
          pedidoId: pedido.id,
          monto: pedido.total,
          ultimosDigitos,
          aprobado: true,
        }),
      );
      pago.pedido = pedido;
      return pago;
    });
  }

  /** El formato ya lo revisó TarjetaDto; aquí, que MM/AA no haya pasado (vale hasta fin de mes). */
  private validarTarjeta(tarjeta: TarjetaDto): void {
    const [mes, anio] = tarjeta.vencimiento.split('/').map(Number);
    if ((2000 + anio) * 12 + mes < mesActualLima()) {
      throw new BadRequestException({
        statusCode: 400,
        message: REVISA_FORMULARIO,
        errores: { vencimiento: TARJETA_VENCIDA },
      });
    }
  }

  private esTarjetaRechazada(numero: string): boolean {
    return numero.endsWith(TERMINACION_RECHAZADA);
  }

  private yaPagado(): ConflictException {
    return new ConflictException({
      statusCode: 409,
      message: PEDIDO_YA_PAGADO,
    });
  }
}
