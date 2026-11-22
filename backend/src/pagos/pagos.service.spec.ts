import {
  BadRequestException,
  ConflictException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, type EntityManager } from 'typeorm';
import {
  JuguetesService,
  STOCK_INSUFICIENTE,
} from '../juguetes/juguetes.service.js';
import { DetallePedido } from '../pedidos/entities/detalle-pedido.entity.js';
import { Pedido } from '../pedidos/entities/pedido.entity.js';
import { EstadoPedido } from '../pedidos/enums/estado-pedido.enum.js';
import {
  PEDIDO_YA_PAGADO,
  PedidosService,
} from '../pedidos/pedidos.service.js';
import { Pago } from './entities/pago.entity.js';
import { aPagoDto } from './pago-dto.js';
import {
  PAGO_RECHAZADO,
  PagosService,
  TARJETA_VENCIDA,
} from './pagos.service.js';

const CLIENTE = 7;
const NUMERO = 'TF-20261122-034744';
const AHORA = new Date('2026-11-22T15:00:00Z');
const TARJETA = {
  numero: '4242424242424242',
  titular: 'Rosa Quispe',
  vencimiento: '08/29',
  cvv: '123',
};
const RECHAZADA = { ...TARJETA, numero: '4000123412340000' };

function pedidoPendiente(): Pedido {
  const linea = (
    jugueteId: number,
    nombreJuguete: string,
    precioUnitario: number,
    cantidad: number,
  ) =>
    Object.assign(new DetallePedido(), {
      jugueteId,
      nombreJuguete,
      precioUnitario,
      cantidad,
    });
  return Object.assign(new Pedido(), {
    id: 41,
    numero: NUMERO,
    estado: EstadoPedido.PENDIENTE,
    total: 62.7,
    usuarioId: CLIENTE,
    detalles: [
      linea(8, 'Ábaco de colores', 12.9, 2),
      linea(1, 'Trompo de madera clásico', 36.9, 1),
    ],
  });
}

const errorUnico = () =>
  Object.assign(new Error('duplicate key'), { driverError: { code: '23505' } });

describe('PagosService (HU-09)', () => {
  let servicio: PagosService;
  let pedido: Pedido;
  const pagos = {
    create: vi.fn((datos: object) => Object.assign(new Pago(), datos)),
    save: vi.fn(),
  };
  const pedidosService = { obtenerPedido: vi.fn(), marcarPagado: vi.fn() };
  const juguetesService = { descontarStock: vi.fn() };
  /** Gestor de la transacción: create arma la entidad y save le pone id y fecha, como TypeORM. */
  const gestor = {
    create: vi.fn(
      <T>(Entidad: new () => T, datos: object): T =>
        Object.assign(new Entidad() as object, datos) as T,
    ),
    save: vi.fn(),
  };
  const comoGestor = gestor as unknown as EntityManager;
  const fuenteDatos = {
    transaction: vi.fn((trabajo: (gestor: EntityManager) => Promise<unknown>) =>
      trabajo(comoGestor),
    ),
  };

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(AHORA);
    pedido = pedidoPendiente();
    pedidosService.obtenerPedido
      .mockReset()
      .mockImplementation(() => Promise.resolve(pedido));
    pedidosService.marcarPagado
      .mockReset()
      .mockImplementation((_gestor: EntityManager, actual: Pedido) => {
        actual.estado = EstadoPedido.PAGADO;
        return Promise.resolve();
      });
    juguetesService.descontarStock.mockReset().mockResolvedValue(undefined);
    pagos.create.mockClear();
    pagos.save
      .mockReset()
      .mockImplementation((pago: Pago) =>
        Promise.resolve(Object.assign(pago, { id: 1, creadoEn: AHORA })),
      );
    gestor.create.mockClear();
    gestor.save
      .mockReset()
      .mockImplementation((pago: Pago) =>
        Promise.resolve(Object.assign(pago, { id: 2, creadoEn: AHORA })),
      );
    fuenteDatos.transaction.mockClear();

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        PagosService,
        { provide: getRepositoryToken(Pago), useValue: pagos },
        { provide: DataSource, useValue: fuenteDatos },
        { provide: PedidosService, useValue: pedidosService },
        { provide: JuguetesService, useValue: juguetesService },
      ],
    }).compile();

    servicio = modulo.get(PagosService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('tarjeta aprobada (criterio 1)', () => {
    it('busca el pedido del cliente del token por su número', async () => {
      await servicio.pagar(CLIENTE, NUMERO, TARJETA);

      expect(pedidosService.obtenerPedido).toHaveBeenCalledWith(
        CLIENTE,
        NUMERO,
      );
    });

    it('marca el pedido Pagado, descuenta el stock de cada juguete y guarda el pago en una sola transacción', async () => {
      await servicio.pagar(CLIENTE, NUMERO, TARJETA);

      expect(fuenteDatos.transaction).toHaveBeenCalledTimes(1);
      expect(pedidosService.marcarPagado).toHaveBeenCalledWith(
        comoGestor,
        pedido,
      );
      expect(juguetesService.descontarStock).toHaveBeenCalledWith(comoGestor, [
        { jugueteId: 8, nombre: 'Ábaco de colores', cantidad: 2 },
        { jugueteId: 1, nombre: 'Trompo de madera clásico', cantidad: 1 },
      ]);
      expect(gestor.save).toHaveBeenCalledTimes(1);
      expect(pagos.save).not.toHaveBeenCalled();
    });

    it('devuelve la confirmación con el número de pedido, el estado Pagado y el monto', async () => {
      const pago = await servicio.pagar(CLIENTE, NUMERO, TARJETA);

      expect(aPagoDto(pago)).toEqual({
        numero: NUMERO,
        estado: EstadoPedido.PAGADO,
        monto: 62.7,
        ultimosDigitos: '4242',
        pagadoEn: AHORA,
      });
    });
  });

  describe('tarjeta de rechazo que termina en 0000 (criterio 2)', () => {
    it('responde 402 «Pago rechazado» y guarda el intento como no aprobado', async () => {
      const error = (await servicio
        .pagar(CLIENTE, NUMERO, RECHAZADA)
        .catch((e: unknown) => e)) as HttpException;

      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(402);
      expect(error.getResponse()).toEqual({
        statusCode: 402,
        message: PAGO_RECHAZADO,
      });
      expect(pagos.save).toHaveBeenCalledTimes(1);
      expect(pagos.create).toHaveBeenCalledWith({
        pedidoId: 41,
        monto: 62.7,
        ultimosDigitos: '0000',
        aprobado: false,
      });
    });

    it('el pedido sigue Pendiente y el stock no cambia', async () => {
      await servicio.pagar(CLIENTE, NUMERO, RECHAZADA).catch(() => undefined);

      expect(pedido.estado).toBe(EstadoPedido.PENDIENTE);
      expect(fuenteDatos.transaction).not.toHaveBeenCalled();
      expect(pedidosService.marcarPagado).not.toHaveBeenCalled();
      expect(juguetesService.descontarStock).not.toHaveBeenCalled();
    });

    it('después del rechazo se puede reintentar con otra tarjeta', async () => {
      await servicio.pagar(CLIENTE, NUMERO, RECHAZADA).catch(() => undefined);
      const pago = await servicio.pagar(CLIENTE, NUMERO, TARJETA);

      expect(pago.aprobado).toBe(true);
      expect(pedido.estado).toBe(EstadoPedido.PAGADO);
    });
  });

  describe('stock insuficiente al pagar (criterio 3)', () => {
    it('propaga el 409 con los juguetes que faltan y no guarda el pago: la transacción se deshace', async () => {
      const sinStock = new ConflictException({
        statusCode: 409,
        message: STOCK_INSUFICIENTE,
        juguetes: [
          {
            jugueteId: 8,
            nombre: 'Ábaco de colores',
            stock: 1,
            mensaje: 'Solo queda 1 unidad',
          },
        ],
      });
      juguetesService.descontarStock.mockRejectedValue(sinStock);

      await expect(servicio.pagar(CLIENTE, NUMERO, TARJETA)).rejects.toBe(
        sinStock,
      );
      expect(fuenteDatos.transaction).toHaveBeenCalledTimes(1);
      expect(gestor.save).not.toHaveBeenCalled();
    });
  });

  describe('pedido ya pagado (criterio 4)', () => {
    it('si el pedido ya está Pagado, responde 409 y no vuelve a cobrar ni a descontar', async () => {
      pedido.estado = EstadoPedido.PAGADO;

      const intento = servicio.pagar(CLIENTE, NUMERO, TARJETA);

      await expect(intento).rejects.toBeInstanceOf(ConflictException);
      await expect(intento).rejects.toThrow(PEDIDO_YA_PAGADO);
      expect(fuenteDatos.transaction).not.toHaveBeenCalled();
      expect(pagos.save).not.toHaveBeenCalled();
    });

    it('con doble clic, el segundo pago recibe el 409 de marcarPagado y no descuenta stock', async () => {
      pedidosService.marcarPagado.mockRejectedValue(
        new ConflictException(PEDIDO_YA_PAGADO),
      );

      await expect(
        servicio.pagar(CLIENTE, NUMERO, TARJETA),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(juguetesService.descontarStock).not.toHaveBeenCalled();
      expect(gestor.save).not.toHaveBeenCalled();
    });

    it('si el índice único de pagos aprobados rechaza el pago, responde 409 «ya está pagado»', async () => {
      gestor.save.mockRejectedValue(errorUnico());

      const intento = servicio.pagar(CLIENTE, NUMERO, TARJETA);

      await expect(intento).rejects.toBeInstanceOf(ConflictException);
      await expect(intento).rejects.toThrow(PEDIDO_YA_PAGADO);
    });
  });

  describe('datos de la tarjeta que se guardan (criterio 5)', () => {
    it('del pago aprobado solo guarda los últimos 4 dígitos y el resultado: ni el número, ni el titular, ni el CVV', async () => {
      await servicio.pagar(CLIENTE, NUMERO, TARJETA);

      expect(gestor.create).toHaveBeenCalledWith(Pago, {
        pedidoId: 41,
        monto: 62.7,
        ultimosDigitos: '4242',
        aprobado: true,
      });
    });
  });

  describe('vencimiento', () => {
    it('con una tarjeta vencida responde 400 con el mensaje en el campo y no busca el pedido', async () => {
      const error = (await servicio
        .pagar(CLIENTE, NUMERO, { ...TARJETA, vencimiento: '10/26' })
        .catch((e: unknown) => e)) as BadRequestException;

      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.getResponse()).toMatchObject({
        errores: { vencimiento: TARJETA_VENCIDA },
      });
      expect(pedidosService.obtenerPedido).not.toHaveBeenCalled();
    });

    it('la tarjeta vale hasta el último día del mes de vencimiento, en hora de Lima', async () => {
      // 1 de diciembre a las 03:00 UTC todavía es 30 de noviembre en Lima (UTC-5).
      vi.setSystemTime(new Date('2026-12-01T03:00:00Z'));

      await expect(
        servicio.pagar(CLIENTE, NUMERO, { ...TARJETA, vencimiento: '11/26' }),
      ).resolves.toBeInstanceOf(Pago);
    });
  });

  it('con el pedido de otro cliente propaga el 404 sin guardar nada', async () => {
    pedidosService.obtenerPedido.mockRejectedValue(
      new NotFoundException('Pedido no encontrado'),
    );

    await expect(
      servicio.pagar(CLIENTE, 'TF-20261122-999999', TARJETA),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(pagos.save).not.toHaveBeenCalled();
    expect(fuenteDatos.transaction).not.toHaveBeenCalled();
  });
});
