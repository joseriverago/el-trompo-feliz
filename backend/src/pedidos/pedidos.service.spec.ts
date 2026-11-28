import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, type EntityManager } from 'typeorm';
import { CarritoService } from '../carrito/carrito.service.js';
import { Carrito } from '../carrito/entities/carrito.entity.js';
import { ItemCarrito } from '../carrito/entities/item-carrito.entity.js';
import type { Juguete } from '../juguetes/entities/juguete.entity.js';
import { JuguetesService } from '../juguetes/juguetes.service.js';
import { Pedido } from './entities/pedido.entity.js';
import { EstadoPedido } from './enums/estado-pedido.enum.js';
import {
  aPedidoAdminDto,
  aPedidoAdminResumenDto,
  aPedidoDto,
  aPedidoResumenDto,
} from './pedido-dto.js';
import {
  AJUSTAR_CARRITO,
  CAMBIO_NO_PERMITIDO,
  CARRITO_VACIO,
  PEDIDO_NO_ENCONTRADO,
  PEDIDO_YA_PAGADO,
  PedidosService,
} from './pedidos.service.js';

const CLIENTE = 7;
const ABACO = { id: 8, nombre: 'Ábaco de colores', precio: 24.9 } as Juguete;
const AJEDREZ = {
  id: 12,
  nombre: 'Ajedrez de madera',
  precio: 59.9,
} as Juguete;
const ENTREGA = {
  destinatario: 'Rosa Quispe',
  telefono: '987654321',
  direccion: 'Av. Los Olivos 123',
  distrito: 'San Miguel',
};

function carritoCon(...lineas: [Juguete, number][]): Carrito {
  return Object.assign(new Carrito(), {
    id: 3,
    usuarioId: CLIENTE,
    items: lineas.map(([juguete, cantidad], posicion) =>
      Object.assign(new ItemCarrito(), {
        id: 100 + posicion,
        carritoId: 3,
        jugueteId: juguete.id,
        cantidad,
        juguete,
      }),
    ),
  });
}

const errorUnico = () =>
  Object.assign(new Error('duplicate key'), { driverError: { code: '23505' } });

describe('PedidosService', () => {
  let servicio: PedidosService;
  let carrito: Carrito;
  const pedidos = { findOne: vi.fn(), find: vi.fn(), update: vi.fn() };
  const carritoService = { obtenerCarrito: vi.fn(), vaciar: vi.fn() };
  const juguetesService = { verificarStock: vi.fn() };
  /** Gestor de la transacción: create arma la entidad y save le pone id y fecha, como TypeORM. */
  const gestor = {
    create: vi.fn(
      <T>(Entidad: new () => T, datos: object): T =>
        Object.assign(new Entidad() as object, datos) as T,
    ),
    save: vi.fn(),
    update: vi.fn(),
  };
  const fuenteDatos = {
    transaction: vi.fn((trabajo: (gestor: EntityManager) => Promise<unknown>) =>
      trabajo(gestor as unknown as EntityManager),
    ),
  };

  beforeEach(async () => {
    carrito = carritoCon([ABACO, 3], [AJEDREZ, 1]);
    pedidos.findOne.mockReset();
    pedidos.find.mockReset();
    carritoService.obtenerCarrito
      .mockReset()
      .mockImplementation(() => Promise.resolve(carrito));
    carritoService.vaciar.mockReset().mockResolvedValue(undefined);
    juguetesService.verificarStock.mockReset().mockResolvedValue({});
    gestor.save
      .mockReset()
      .mockImplementation((pedido: Pedido) =>
        Promise.resolve(
          Object.assign(pedido, { id: 1, creadoEn: new Date('2026-11-22') }),
        ),
      );
    gestor.update.mockReset().mockResolvedValue({ affected: 1 });
    fuenteDatos.transaction.mockClear();

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        PedidosService,
        { provide: getRepositoryToken(Pedido), useValue: pedidos },
        { provide: DataSource, useValue: fuenteDatos },
        { provide: CarritoService, useValue: carritoService },
        { provide: JuguetesService, useValue: juguetesService },
      ],
    }).compile();

    servicio = modulo.get(PedidosService);
  });

  describe('generarPedido (HU-08)', () => {
    it('genera el pedido Pendiente con un número, el precio vigente de cada juguete y el total', async () => {
      const pedido = await servicio.generarPedido(CLIENTE, ENTREGA);

      expect(pedido.estado).toBe(EstadoPedido.PENDIENTE);
      expect(pedido.usuarioId).toBe(CLIENTE);
      expect(pedido.numero).toMatch(/^TF-\d{8}-\d{6}$/);
      expect(aPedidoDto(pedido)).toMatchObject({
        total: 134.6, // 24.90 × 3 + 59.90, sin errores de redondeo
        unidades: 4,
        entrega: { ...ENTREGA, referencia: null },
        detalles: [
          {
            jugueteId: 8,
            nombre: 'Ábaco de colores',
            precioUnitario: 24.9,
            cantidad: 3,
            subtotal: 74.7,
          },
          {
            jugueteId: 12,
            nombre: 'Ajedrez de madera',
            precioUnitario: 59.9,
            cantidad: 1,
            subtotal: 59.9,
          },
        ],
      });
    });

    it('verifica con IInventario el stock de cada juguete con su cantidad', async () => {
      await servicio.generarPedido(CLIENTE, ENTREGA);

      expect(juguetesService.verificarStock.mock.calls).toEqual([
        [8, 3],
        [12, 1],
      ]);
    });

    it('guarda el pedido y vacía el carrito en la misma transacción', async () => {
      await servicio.generarPedido(CLIENTE, ENTREGA);

      expect(fuenteDatos.transaction).toHaveBeenCalledTimes(1);
      expect(gestor.save).toHaveBeenCalledTimes(1);
      expect(carritoService.vaciar).toHaveBeenCalledWith(gestor, carrito);
    });

    it('si el precio del catálogo cambia después, el pedido conserva el precio con que se compró', async () => {
      carrito = carritoCon([
        { id: 8, nombre: 'Ábaco', precio: 24.9 } as Juguete,
        3,
      ]);
      const pedido = await servicio.generarPedido(CLIENTE, ENTREGA);
      carrito.items[0].juguete.precio = 99.9;

      expect(aPedidoDto(pedido).detalles[0].precioUnitario).toBe(24.9);
      expect(aPedidoDto(pedido).total).toBe(74.7);
    });

    it('con el carrito vacío responde 400 y no guarda nada', async () => {
      carrito = carritoCon();

      const intento = servicio.generarPedido(CLIENTE, ENTREGA);

      await expect(intento).rejects.toBeInstanceOf(BadRequestException);
      await expect(intento).rejects.toThrow(CARRITO_VACIO);
      expect(fuenteDatos.transaction).not.toHaveBeenCalled();
    });

    it('si algún juguete supera su stock, responde 409 con los juguetes a ajustar y no genera el pedido', async () => {
      juguetesService.verificarStock.mockImplementation((id: number) =>
        id === ABACO.id
          ? Promise.reject(
              new ConflictException({
                statusCode: 409,
                message: 'Solo quedan 2 unidades',
                stock: 2,
              }),
            )
          : Promise.resolve({}),
      );

      const error = (await servicio
        .generarPedido(CLIENTE, ENTREGA)
        .catch((e: unknown) => e)) as ConflictException;

      expect(error).toBeInstanceOf(ConflictException);
      expect(error.getResponse()).toEqual({
        statusCode: 409,
        message: AJUSTAR_CARRITO,
        juguetes: [
          {
            itemId: 100,
            jugueteId: 8,
            nombre: 'Ábaco de colores',
            stock: 2,
            mensaje: 'Solo quedan 2 unidades',
          },
        ],
      });
      expect(fuenteDatos.transaction).not.toHaveBeenCalled();
      expect(carritoService.vaciar).not.toHaveBeenCalled();
    });

    it('lista todos los juguetes a ajustar, también los agotados y los que ya no se venden', async () => {
      juguetesService.verificarStock.mockImplementation((id: number) =>
        Promise.reject(
          id === ABACO.id
            ? new ConflictException({
                statusCode: 409,
                message: 'Este juguete está agotado',
                stock: 0,
              })
            : new NotFoundException('Juguete no encontrado'),
        ),
      );

      const error = (await servicio
        .generarPedido(CLIENTE, ENTREGA)
        .catch((e: unknown) => e)) as ConflictException;

      expect(
        (error.getResponse() as { juguetes: { mensaje: string }[] }).juguetes,
      ).toEqual([
        expect.objectContaining({
          jugueteId: 8,
          stock: 0,
          mensaje: 'Este juguete está agotado',
        }),
        expect.objectContaining({
          jugueteId: 12,
          stock: 0,
          mensaje: 'Este juguete ya no está a la venta',
        }),
      ]);
    });

    it('si el número ya existe, la transacción se deshace y se intenta con otro número', async () => {
      gestor.save.mockRejectedValueOnce(errorUnico());

      const pedido = await servicio.generarPedido(CLIENTE, ENTREGA);

      expect(fuenteDatos.transaction).toHaveBeenCalledTimes(2);
      expect(pedido.numero).toMatch(/^TF-\d{8}-\d{6}$/);
    });

    it('si el carrito cambió durante la compra, no guarda el pedido y propaga el 409', async () => {
      carritoService.vaciar.mockRejectedValueOnce(
        new ConflictException('Tu carrito cambió mientras comprabas'),
      );

      await expect(
        servicio.generarPedido(CLIENTE, ENTREGA),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(fuenteDatos.transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('marcarPagado (HU-09)', () => {
    const pendiente = () =>
      Object.assign(new Pedido(), { id: 41, estado: EstadoPedido.PENDIENTE });

    it('pasa el pedido a Pagado solo si sigue Pendiente', async () => {
      const pedido = pendiente();

      await servicio.marcarPagado(gestor as unknown as EntityManager, pedido);

      expect(gestor.update).toHaveBeenCalledWith(
        Pedido,
        { id: 41, estado: EstadoPedido.PENDIENTE },
        { estado: EstadoPedido.PAGADO },
      );
      expect(pedido.estado).toBe(EstadoPedido.PAGADO);
    });

    it('si otro pago ya lo marcó (doble clic), responde 409 «Este pedido ya está pagado»', async () => {
      gestor.update.mockResolvedValue({ affected: 0 });
      const pedido = pendiente();

      const intento = servicio.marcarPagado(
        gestor as unknown as EntityManager,
        pedido,
      );

      await expect(intento).rejects.toBeInstanceOf(ConflictException);
      await expect(intento).rejects.toThrow(PEDIDO_YA_PAGADO);
      expect(pedido.estado).toBe(EstadoPedido.PENDIENTE);
    });
  });

  describe('listarMisPedidos (HU-10)', () => {
    it('busca solo los pedidos del cliente del token, del más reciente al más antiguo', async () => {
      pedidos.find.mockResolvedValue([]);

      await servicio.listarMisPedidos(CLIENTE);

      expect(pedidos.find).toHaveBeenCalledWith({
        where: { usuarioId: CLIENTE },
        relations: { detalles: true },
        order: { creadoEn: 'DESC', id: 'DESC' },
      });
    });

    it('cada fila del historial trae número, fecha, total, estado y unidades, sin la entrega', async () => {
      const pagado = await servicio.generarPedido(CLIENTE, ENTREGA);
      pagado.estado = EstadoPedido.PAGADO;
      pedidos.find.mockResolvedValue([pagado]);

      const [fila] = (await servicio.listarMisPedidos(CLIENTE)).map(
        aPedidoResumenDto,
      );

      expect(fila).toEqual({
        numero: pagado.numero,
        estado: EstadoPedido.PAGADO,
        total: 134.6,
        unidades: 4,
        creadoEn: new Date('2026-11-22'),
      });
    });

    it('sin pedidos devuelve una lista vacía', async () => {
      pedidos.find.mockResolvedValue([]);

      expect(await servicio.listarMisPedidos(CLIENTE)).toEqual([]);
    });
  });

  describe('pedidos para el administrador (HU-14)', () => {
    const consulta = {
      relations: { detalles: true, usuario: true },
      order: { creadoEn: 'DESC', id: 'DESC' },
    };

    it('lista los pedidos de todos los clientes, del más reciente al más antiguo', async () => {
      pedidos.find.mockResolvedValue([]);

      await servicio.listarTodos();

      expect(pedidos.find).toHaveBeenCalledWith({ where: {}, ...consulta });
    });

    it('con un estado solo lista los pedidos en ese estado', async () => {
      pedidos.find.mockResolvedValue([]);

      await servicio.listarTodos(EstadoPedido.PAGADO);

      expect(pedidos.find).toHaveBeenCalledWith({
        where: { estado: EstadoPedido.PAGADO },
        ...consulta,
      });
    });

    it('la fila y el detalle incluyen el nombre del cliente, sin su correo', async () => {
      const pedido = await servicio.generarPedido(CLIENTE, ENTREGA);
      pedido.usuario = {
        nombre: 'Rosa Quispe',
        correo: 'rosa@ejemplo.pe',
      } as Pedido['usuario'];

      const fila = aPedidoAdminResumenDto(pedido);
      const detalle = aPedidoAdminDto(pedido);

      expect(fila.cliente).toBe('Rosa Quispe');
      expect(detalle.cliente).toBe('Rosa Quispe');
      expect(detalle.detalles).toHaveLength(2);
      expect(detalle.entrega.distrito).toBe('San Miguel');
      expect(JSON.stringify([fila, detalle])).not.toContain('rosa@ejemplo.pe');
    });

    it('abre cualquier pedido por su número', async () => {
      const pedido = new Pedido();
      pedidos.findOne.mockResolvedValue(pedido);

      expect(
        await servicio.obtenerParaAdministrador('TF-20261122-000001'),
      ).toBe(pedido);
      expect(pedidos.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { numero: 'TF-20261122-000001' } }),
      );
    });

    it('responde 404 si el número no existe', async () => {
      pedidos.findOne.mockResolvedValue(null);

      await expect(
        servicio.obtenerParaAdministrador('TF-20261122-000002'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('cambiarEstado (HU-15)', () => {
    const NUMERO = 'TF-20261122-000001';
    const pedidoEn = (estado: EstadoPedido) =>
      Object.assign(new Pedido(), { id: 9, numero: NUMERO, estado });

    beforeEach(() => {
      pedidos.update.mockReset().mockResolvedValue({ affected: 1 });
    });

    it.each([
      [EstadoPedido.PAGADO, EstadoPedido.ENVIADO],
      [EstadoPedido.ENVIADO, EstadoPedido.ENTREGADO],
    ])('avanza de %s a %s', async (desde, hasta) => {
      pedidos.findOne.mockResolvedValue(pedidoEn(desde));

      const pedido = await servicio.cambiarEstado(NUMERO, hasta);

      expect(pedido.estado).toBe(hasta);
      expect(pedidos.update).toHaveBeenCalledWith(
        { id: 9, estado: desde },
        { estado: hasta },
      );
    });

    it.each([
      [EstadoPedido.PENDIENTE, EstadoPedido.ENVIADO],
      [EstadoPedido.PENDIENTE, EstadoPedido.ENTREGADO],
      [EstadoPedido.PAGADO, EstadoPedido.ENTREGADO],
      [EstadoPedido.ENVIADO, EstadoPedido.ENVIADO],
      [EstadoPedido.ENTREGADO, EstadoPedido.ENVIADO],
      [EstadoPedido.ENTREGADO, EstadoPedido.ENTREGADO],
    ])('no permite pasar de %s a %s (409)', async (desde, hasta) => {
      pedidos.findOne.mockResolvedValue(pedidoEn(desde));

      await expect(servicio.cambiarEstado(NUMERO, hasta)).rejects.toThrow(
        CAMBIO_NO_PERMITIDO[desde],
      );
      expect(pedidos.update).not.toHaveBeenCalled();
    });

    it('si otro administrador lo cambió a la vez, responde 409 con el estado actual', async () => {
      pedidos.findOne
        .mockResolvedValueOnce(pedidoEn(EstadoPedido.PAGADO))
        .mockResolvedValueOnce(pedidoEn(EstadoPedido.ENVIADO));
      pedidos.update.mockResolvedValue({ affected: 0 });

      await expect(
        servicio.cambiarEstado(NUMERO, EstadoPedido.ENVIADO),
      ).rejects.toThrow(CAMBIO_NO_PERMITIDO[EstadoPedido.ENVIADO]);
    });

    it('responde 404 si el pedido no existe', async () => {
      pedidos.findOne.mockResolvedValue(null);

      await expect(
        servicio.cambiarEstado(NUMERO, EstadoPedido.ENVIADO),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('obtenerPedido', () => {
    it('busca el pedido por su número y por el cliente del token', async () => {
      const pedido = new Pedido();
      pedidos.findOne.mockResolvedValue(pedido);

      expect(await servicio.obtenerPedido(CLIENTE, 'TF-20261122-000001')).toBe(
        pedido,
      );
      expect(pedidos.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { numero: 'TF-20261122-000001', usuarioId: CLIENTE },
        }),
      );
    });

    it('responde 404 si no existe o es de otro cliente', async () => {
      pedidos.findOne.mockResolvedValue(null);

      await expect(
        servicio.obtenerPedido(CLIENTE, 'TF-20261122-000002'),
      ).rejects.toThrow(PEDIDO_NO_ENCONTRADO);
    });
  });
});
