import { randomInt } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, type EntityManager, type Repository } from 'typeorm';
import { CarritoService } from '../carrito/carrito.service.js';
import type { Carrito } from '../carrito/entities/carrito.entity.js';
import type { ItemCarrito } from '../carrito/entities/item-carrito.entity.js';
import { esViolacionUnica } from '../database/errores.js';
import { JuguetesService } from '../juguetes/juguetes.service.js';
import type { DatosEntregaDto } from './dto/datos-entrega.dto.js';
import { DetallePedido } from './entities/detalle-pedido.entity.js';
import { Pedido } from './entities/pedido.entity.js';
import { EstadoPedido } from './enums/estado-pedido.enum.js';

export const CARRITO_VACIO =
  'Tu carrito está vacío: agrega juguetes antes de comprar';
export const AJUSTAR_CARRITO =
  'Ajusta tu carrito: no hay stock suficiente de algunos juguetes';
export const PEDIDO_NO_ENCONTRADO = 'Pedido no encontrado';
export const PEDIDO_YA_PAGADO = 'Este pedido ya está pagado';
const YA_NO_SE_VENDE = 'Este juguete ya no está a la venta';

/** Intentos para obtener un número de pedido libre (cada intento sale al azar). */
const INTENTOS_NUMERO = 3;

/** Fecha de Lima en formato AAAAMMDD, para el número de pedido. */
const FECHA_LIMA = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Lima',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Un juguete del carrito cuya cantidad hay que ajustar antes de comprar (HU-08, criterio 4). */
export interface JugueteSinStock {
  itemId: number;
  jugueteId: number;
  nombre: string;
  stock: number;
  mensaje: string;
}

@Injectable()
export class PedidosService {
  constructor(
    @InjectRepository(Pedido)
    private readonly pedidos: Repository<Pedido>,
    private readonly fuenteDatos: DataSource,
    private readonly carritoService: CarritoService,
    private readonly juguetesService: JuguetesService,
  ) {}

  /**
   * Genera el pedido con los juguetes del carrito (HU-08). Antes verifica con IInventario
   * el stock de cada juguete: si alguno no alcanza, responde 409 con la lista de juguetes
   * que hay que ajustar y no guarda nada. Si todo está bien, en una sola transacción guarda
   * el pedido Pendiente con el precio vigente de cada juguete y vacía el carrito.
   * El stock no se descuenta aquí: se descuenta al aprobarse el pago (HU-09).
   */
  async generarPedido(
    usuarioId: number,
    datos: DatosEntregaDto,
  ): Promise<Pedido> {
    const carrito = await this.carritoService.obtenerCarrito(usuarioId);
    if (carrito.items.length === 0) {
      throw new BadRequestException({
        statusCode: 400,
        message: CARRITO_VACIO,
      });
    }
    await this.verificarStock(carrito);

    for (let intento = 1; ; intento++) {
      try {
        return await this.guardar(usuarioId, datos, carrito);
      } catch (error) {
        // Otro pedido ya tiene ese número: la transacción se deshizo y se prueba con otro.
        if (esViolacionUnica(error) && intento < INTENTOS_NUMERO) continue;
        throw error;
      }
    }
  }

  /** Pedido del cliente del token. Con el número de otro cliente responde 404, igual que si no existiera. */
  async obtenerPedido(usuarioId: number, numero: string): Promise<Pedido> {
    const pedido = await this.pedidos.findOne({
      where: { numero, usuarioId },
      relations: { detalles: true },
      order: { detalles: { id: 'ASC' } },
    });
    if (!pedido) {
      throw new NotFoundException({
        statusCode: 404,
        message: PEDIDO_NO_ENCONTRADO,
      });
    }
    return pedido;
  }

  /**
   * IPedidos: pasa el pedido de Pendiente a Pagado dentro de la transacción del pago (HU-09).
   * El UPDATE solo cambia la fila si el pedido sigue Pendiente. Si llegan dos pagos a la vez
   * (doble clic), el segundo espera al primero, ya no lo encuentra Pendiente y responde 409:
   * su transacción se deshace y el stock no se descuenta dos veces.
   */
  async marcarPagado(gestor: EntityManager, pedido: Pedido): Promise<void> {
    const { affected } = await gestor.update(
      Pedido,
      { id: pedido.id, estado: EstadoPedido.PENDIENTE },
      { estado: EstadoPedido.PAGADO },
    );
    if (affected !== 1) {
      throw new ConflictException({
        statusCode: 409,
        message: PEDIDO_YA_PAGADO,
      });
    }
    pedido.estado = EstadoPedido.PAGADO;
  }

  /** Verifica el stock de todos los juguetes a la vez y junta los que no alcanzan. */
  private async verificarStock(carrito: Carrito): Promise<void> {
    const resultados = await Promise.allSettled(
      carrito.items.map((item) =>
        this.juguetesService.verificarStock(item.jugueteId, item.cantidad),
      ),
    );
    const sinStock: JugueteSinStock[] = [];
    resultados.forEach((resultado, posicion) => {
      if (resultado.status === 'fulfilled') return;
      sinStock.push(
        this.describirFalta(carrito.items[posicion], resultado.reason),
      );
    });
    if (sinStock.length > 0) {
      throw new ConflictException({
        statusCode: 409,
        message: AJUSTAR_CARRITO,
        juguetes: sinStock,
      });
    }
  }

  /** Por qué no alcanza: el 409 de IInventario trae el stock; el 404 significa que se desactivó. */
  private describirFalta(item: ItemCarrito, error: unknown): JugueteSinStock {
    const linea = {
      itemId: item.id,
      jugueteId: item.jugueteId,
      nombre: item.juguete.nombre,
    };
    if (error instanceof ConflictException) {
      const { message, stock } = error.getResponse() as {
        message: string;
        stock: number;
      };
      return { ...linea, stock, mensaje: message };
    }
    if (error instanceof NotFoundException) {
      return { ...linea, stock: 0, mensaje: YA_NO_SE_VENDE };
    }
    throw error;
  }

  /** Si algo falla dentro de la transacción (por ejemplo, el carrito cambió), no se guarda nada. */
  private guardar(
    usuarioId: number,
    datos: DatosEntregaDto,
    carrito: Carrito,
  ): Promise<Pedido> {
    return this.fuenteDatos.transaction(async (gestor) => {
      const pedido = gestor.create(Pedido, {
        numero: this.generarNumero(),
        estado: EstadoPedido.PENDIENTE,
        usuarioId,
        entrega: {
          destinatario: datos.destinatario,
          telefono: datos.telefono,
          direccion: datos.direccion,
          distrito: datos.distrito,
          referencia: datos.referencia ?? null,
        },
        // Se copia el precio vigente: si después cambia en el catálogo, el pedido no cambia.
        detalles: carrito.items.map((item) =>
          gestor.create(DetallePedido, {
            jugueteId: item.jugueteId,
            nombreJuguete: item.juguete.nombre,
            precioUnitario: item.juguete.precio,
            cantidad: item.cantidad,
          }),
        ),
      });
      pedido.total = pedido.calcularTotal();

      const guardado = await gestor.save(pedido);
      await this.carritoService.vaciar(gestor, carrito);
      return guardado;
    });
  }

  /** Número único que ve el cliente: TF-, la fecha de Lima y 6 dígitos al azar (TF-20261122-483920). */
  private generarNumero(): string {
    const fecha = FECHA_LIMA.format(new Date()).replaceAll('-', '');
    const aleatorio = String(randomInt(0, 1_000_000)).padStart(6, '0');
    return `TF-${fecha}-${aleatorio}`;
  }
}
