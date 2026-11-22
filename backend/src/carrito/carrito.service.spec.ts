import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { type EntityManager, In } from 'typeorm';
import type { Juguete } from '../juguetes/entities/juguete.entity.js';
import { JuguetesService } from '../juguetes/juguetes.service.js';
import { aCarritoDto } from './carrito-dto.js';
import { CARRITO_CAMBIO, CarritoService } from './carrito.service.js';
import { Carrito } from './entities/carrito.entity.js';
import { ItemCarrito } from './entities/item-carrito.entity.js';

const CLIENTE = 7;
const ABACO = {
  id: 8,
  nombre: 'Ábaco de colores',
  precio: 24.9,
  stock: 5,
} as Juguete;
const AJEDREZ = {
  id: 12,
  nombre: 'Ajedrez de madera',
  precio: 59.9,
  stock: 2,
} as Juguete;
const JUGUETES = new Map(
  [ABACO, AJEDREZ].map((juguete) => [juguete.id, juguete]),
);

const errorUnico = () =>
  Object.assign(new Error('duplicate key'), { driverError: { code: '23505' } });

/** Base de datos en memoria: un carrito como mucho y sus líneas. */
class BaseDeDatosFalsa {
  carrito: { id: number; usuarioId: number } | null = null;
  lineas: { id: number; jugueteId: number; cantidad: number }[] = [];

  crearCarrito() {
    this.carrito = { id: 3, usuarioId: CLIENTE };
  }

  agregarLinea(jugueteId: number, cantidad: number) {
    this.lineas.push({ id: 100 + this.lineas.length, jugueteId, cantidad });
  }

  /** Lo que devuelve findOne: entidades nuevas cada vez, como TypeORM. */
  leerCarrito(): Carrito | null {
    if (!this.carrito) return null;
    return Object.assign(new Carrito(), {
      ...this.carrito,
      items: this.lineas.map((linea) =>
        Object.assign(new ItemCarrito(), {
          ...linea,
          carritoId: this.carrito?.id,
          juguete: JUGUETES.get(linea.jugueteId),
        }),
      ),
    });
  }
}

describe('CarritoService', () => {
  let servicio: CarritoService;
  let bd: BaseDeDatosFalsa;
  const carritos = {
    findOne: vi.fn(),
    findOneOrFail: vi.fn(),
    insert: vi.fn(),
  };
  const items = { insert: vi.fn(), update: vi.fn(), delete: vi.fn() };
  const juguetesService = { verificarStock: vi.fn() };

  beforeEach(async () => {
    bd = new BaseDeDatosFalsa();
    carritos.findOne
      .mockReset()
      .mockImplementation(() => Promise.resolve(bd.leerCarrito()));
    carritos.findOneOrFail
      .mockReset()
      .mockImplementation(() => Promise.resolve(bd.leerCarrito()));
    carritos.insert.mockReset().mockImplementation(() => {
      bd.crearCarrito();
      return Promise.resolve();
    });
    items.insert
      .mockReset()
      .mockImplementation((linea: { jugueteId: number; cantidad: number }) => {
        bd.agregarLinea(linea.jugueteId, linea.cantidad);
        return Promise.resolve();
      });
    items.update
      .mockReset()
      .mockImplementation(
        (donde: { id: number }, cambios: { cantidad: number }) => {
          const linea = bd.lineas.find((actual) => actual.id === donde.id);
          if (linea) linea.cantidad = cambios.cantidad;
          return Promise.resolve();
        },
      );
    items.delete.mockReset().mockImplementation((donde: { id: number }) => {
      bd.lineas = bd.lineas.filter((linea) => linea.id !== donde.id);
      return Promise.resolve();
    });
    juguetesService.verificarStock.mockReset().mockResolvedValue({});

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        CarritoService,
        { provide: getRepositoryToken(Carrito), useValue: carritos },
        { provide: getRepositoryToken(ItemCarrito), useValue: items },
        { provide: JuguetesService, useValue: juguetesService },
      ],
    }).compile();

    servicio = modulo.get(CarritoService);
  });

  it('la primera vez que el cliente pide su carrito, lo crea vacío', async () => {
    const carrito = await servicio.obtenerCarrito(CLIENTE);

    expect(carritos.insert).toHaveBeenCalledWith({ usuarioId: CLIENTE });
    expect(carrito.items).toEqual([]);
  });

  it('agrega un juguete nuevo con cantidad 1, después de verificar el stock', async () => {
    const carrito = await servicio.agregarJuguete(CLIENTE, ABACO.id);

    expect(juguetesService.verificarStock).toHaveBeenCalledWith(ABACO.id, 1);
    expect(items.insert).toHaveBeenCalledWith({
      carritoId: 3,
      jugueteId: ABACO.id,
      cantidad: 1,
    });
    expect(
      carrito.items.map(({ jugueteId, cantidad }) => ({ jugueteId, cantidad })),
    ).toEqual([{ jugueteId: ABACO.id, cantidad: 1 }]);
  });

  it('si el juguete ya está en el carrito, suma 1 a la misma línea sin duplicarla', async () => {
    bd.crearCarrito();
    bd.agregarLinea(ABACO.id, 2);
    bd.agregarLinea(AJEDREZ.id, 1);

    const carrito = await servicio.agregarJuguete(CLIENTE, ABACO.id);

    expect(juguetesService.verificarStock).toHaveBeenCalledWith(ABACO.id, 3);
    expect(items.insert).not.toHaveBeenCalled();
    expect(
      carrito.items.map(({ jugueteId, cantidad }) => ({ jugueteId, cantidad })),
    ).toEqual([
      { jugueteId: ABACO.id, cantidad: 3 },
      { jugueteId: AJEDREZ.id, cantidad: 1 },
    ]);
  });

  it('si la cantidad ya es igual al stock, responde 409 y el carrito no cambia', async () => {
    bd.crearCarrito();
    bd.agregarLinea(AJEDREZ.id, 2);
    juguetesService.verificarStock.mockRejectedValue(
      new ConflictException({
        statusCode: 409,
        message: 'Solo quedan 2 unidades',
        stock: 2,
      }),
    );

    const intento = servicio.agregarJuguete(CLIENTE, AJEDREZ.id);

    await expect(intento).rejects.toBeInstanceOf(ConflictException);
    await expect(intento).rejects.toThrow('Solo quedan 2 unidades');
    expect(juguetesService.verificarStock).toHaveBeenCalledWith(AJEDREZ.id, 3);
    expect(items.update).not.toHaveBeenCalled();
    expect(items.insert).not.toHaveBeenCalled();
    expect(bd.lineas).toEqual([
      { id: 100, jugueteId: AJEDREZ.id, cantidad: 2 },
    ]);
  });

  it('si dos clics crean la misma línea a la vez, el segundo suma a la línea que ya existe', async () => {
    bd.crearCarrito();
    items.insert.mockImplementationOnce((linea: { jugueteId: number }) => {
      // La otra petición guardó la línea justo antes que esta.
      bd.agregarLinea(linea.jugueteId, 1);
      return Promise.reject(errorUnico());
    });

    const carrito = await servicio.agregarJuguete(CLIENTE, ABACO.id);

    expect(carrito.items).toHaveLength(1);
    expect(carrito.items[0].cantidad).toBe(2);
  });

  it('si otra petición creó el carrito un instante antes, usa ese carrito', async () => {
    carritos.insert.mockImplementationOnce(() => {
      bd.crearCarrito();
      return Promise.reject(errorUnico());
    });

    const carrito = await servicio.obtenerCarrito(CLIENTE);

    expect(carrito.id).toBe(3);
  });

  describe('cambiarCantidad (HU-06)', () => {
    beforeEach(() => {
      bd.crearCarrito();
      bd.agregarLinea(ABACO.id, 2); // línea 100
      bd.agregarLinea(AJEDREZ.id, 1); // línea 101
    });

    it('guarda la nueva cantidad después de verificar el stock', async () => {
      const carrito = await servicio.cambiarCantidad(CLIENTE, 100, 4);

      expect(juguetesService.verificarStock).toHaveBeenCalledWith(ABACO.id, 4);
      expect(items.update).toHaveBeenCalledWith({ id: 100 }, { cantidad: 4 });
      expect(carrito.buscarItem(ABACO.id)?.cantidad).toBe(4);
      expect(carrito.buscarItem(AJEDREZ.id)?.cantidad).toBe(1);
    });

    it('también guarda una cantidad menor', async () => {
      const carrito = await servicio.cambiarCantidad(CLIENTE, 100, 1);

      expect(carrito.buscarItem(ABACO.id)?.cantidad).toBe(1);
    });

    it('si la cantidad supera el stock, responde 409 y la línea no cambia', async () => {
      juguetesService.verificarStock.mockRejectedValue(
        new ConflictException({
          statusCode: 409,
          message: 'Solo quedan 2 unidades',
          stock: 2,
        }),
      );

      const intento = servicio.cambiarCantidad(CLIENTE, 101, 3);

      await expect(intento).rejects.toThrow('Solo quedan 2 unidades');
      expect(juguetesService.verificarStock).toHaveBeenCalledWith(
        AJEDREZ.id,
        3,
      );
      expect(items.update).not.toHaveBeenCalled();
      expect(bd.lineas[1].cantidad).toBe(1);
    });

    it('si la línea no está en el carrito del cliente, responde 404 «Este juguete ya no está en tu carrito»', async () => {
      const intento = servicio.cambiarCantidad(CLIENTE, 555, 2);

      await expect(intento).rejects.toBeInstanceOf(NotFoundException);
      await expect(intento).rejects.toThrow(
        'Este juguete ya no está en tu carrito',
      );
      expect(juguetesService.verificarStock).not.toHaveBeenCalled();
      expect(items.update).not.toHaveBeenCalled();
    });
  });

  describe('quitarItem (HU-06)', () => {
    beforeEach(() => {
      bd.crearCarrito();
      bd.agregarLinea(ABACO.id, 2); // línea 100
      bd.agregarLinea(AJEDREZ.id, 1); // línea 101
    });

    it('quita la línea y devuelve el carrito sin ella', async () => {
      const carrito = await servicio.quitarItem(CLIENTE, 100);

      expect(items.delete).toHaveBeenCalledWith({ id: 100 });
      expect(carrito.items.map((item) => item.jugueteId)).toEqual([AJEDREZ.id]);
    });

    it('al quitar la última línea, el carrito queda vacío', async () => {
      await servicio.quitarItem(CLIENTE, 100);
      const carrito = await servicio.quitarItem(CLIENTE, 101);

      expect(carrito.items).toEqual([]);
    });

    it('si la línea ya no está (por ejemplo, otro clic la quitó), responde 404 y no borra nada', async () => {
      await expect(servicio.quitarItem(CLIENTE, 555)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(items.delete).not.toHaveBeenCalled();
    });
  });

  describe('subtotales y total (HU-07)', () => {
    beforeEach(() => {
      bd.crearCarrito();
      bd.agregarLinea(ABACO.id, 2); // línea 100: 2 × 24.90
      bd.agregarLinea(AJEDREZ.id, 1); // línea 101: 1 × 59.90
    });

    const resumen = (carrito: Carrito) => {
      const dto = aCarritoDto(carrito);
      return {
        subtotales: dto.items.map((item) => item.subtotal),
        total: dto.total,
      };
    };

    it('el carrito guardado trae cada subtotal (precio × cantidad) y el total', async () => {
      expect(resumen(await servicio.obtenerCarrito(CLIENTE))).toEqual({
        subtotales: [49.8, 59.9],
        total: 109.7,
      });
    });

    it('al cambiar una cantidad, el carrito devuelto ya tiene el subtotal y el total recalculados', async () => {
      expect(resumen(await servicio.cambiarCantidad(CLIENTE, 100, 3))).toEqual({
        subtotales: [74.7, 59.9],
        total: 134.6,
      });
    });

    it('al quitar un juguete, el total deja de sumar su subtotal', async () => {
      expect(resumen(await servicio.quitarItem(CLIENTE, 101))).toEqual({
        subtotales: [49.8],
        total: 49.8,
      });
    });
  });

  it('no oculta los demás errores de la base de datos', async () => {
    bd.crearCarrito();
    items.insert.mockRejectedValue(new Error('sin conexión'));

    await expect(servicio.agregarJuguete(CLIENTE, ABACO.id)).rejects.toThrow(
      'sin conexión',
    );
  });

  describe('vaciar (HU-08)', () => {
    const gestor = { delete: vi.fn() };

    beforeEach(() => {
      gestor.delete.mockReset();
      bd.crearCarrito();
      bd.agregarLinea(ABACO.id, 2);
      bd.agregarLinea(AJEDREZ.id, 1);
    });

    it('borra, dentro de la transacción del pedido, las líneas que se copiaron al pedido', async () => {
      gestor.delete.mockResolvedValue({ affected: 2 });

      await servicio.vaciar(
        gestor as unknown as EntityManager,
        bd.leerCarrito() as Carrito,
      );

      expect(gestor.delete).toHaveBeenCalledWith(ItemCarrito, {
        carritoId: 3,
        id: In([100, 101]),
      });
    });

    it('si alguna línea ya no estaba (doble clic en «Continuar al pago»), responde 409', async () => {
      gestor.delete.mockResolvedValue({ affected: 0 });

      await expect(
        servicio.vaciar(
          gestor as unknown as EntityManager,
          bd.leerCarrito() as Carrito,
        ),
      ).rejects.toThrow(CARRITO_CAMBIO);
    });
  });
});
