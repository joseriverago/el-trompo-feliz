import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  Between,
  type EntityManager,
  LessThanOrEqual,
  MoreThanOrEqual,
} from 'typeorm';
import type { Categoria } from '../categorias/entities/categoria.entity.js';
import { Juguete } from './entities/juguete.entity.js';
import type { FiltrosCatalogoDto } from './dto/filtros-catalogo.dto.js';
import type { RegistrarJugueteDto } from './dto/guardar-juguete.dto.js';
import {
  CATEGORIA_INEXISTENTE,
  EDADES_INVERTIDAS,
  JUGUETE_NO_ENCONTRADO,
  PRECIOS_INVERTIDOS,
  JuguetesService,
  mensajeSinStock,
  STOCK_INSUFICIENTE,
} from './juguetes.service.js';

const peluches = { id: 2, nombre: 'Peluches' } as Categoria;

function juguete(datos: Partial<Juguete>): Juguete {
  return {
    id: 1,
    nombre: 'Osito de peluche Bruno',
    descripcion: 'Osito suave.',
    precio: 35.5,
    imagenUrl: 'https://placehold.co/600x400?text=Osito',
    edadMinima: 0,
    edadMaxima: 5,
    stock: 15,
    activo: true,
    categoria: peluches,
    categoriaId: peluches.id,
    creadoEn: new Date(),
    actualizadoEn: new Date(),
    ...datos,
  };
}

describe('JuguetesService', () => {
  let servicio: JuguetesService;
  const repositorio = {
    find: vi.fn(),
    findOne: vi.fn(),
    findOneBy: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
  };

  beforeEach(async () => {
    for (const metodo of Object.values(repositorio)) metodo.mockReset();
    repositorio.create.mockImplementation((datos: Partial<Juguete>) => datos);
    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        JuguetesService,
        { provide: getRepositoryToken(Juguete), useValue: repositorio },
      ],
    }).compile();

    servicio = modulo.get(JuguetesService);
  });

  it('consulta solo los juguetes activos, con su categoría', async () => {
    repositorio.find.mockResolvedValue([]);

    await servicio.listarCatalogo();

    expect(repositorio.find).toHaveBeenCalledWith({
      where: { activo: true },
      relations: { categoria: true },
    });
  });

  it('ordena por nombre según el alfabeto español, con las tildes en su lugar', async () => {
    repositorio.find.mockResolvedValue([
      juguete({ id: 3, nombre: 'Yoyo luminoso' }),
      juguete({ id: 8, nombre: 'Ábaco de colores' }),
      juguete({ id: 12, nombre: 'Ajedrez de madera' }),
    ]);

    const catalogo = await servicio.listarCatalogo();

    expect(catalogo.map((item) => item.nombre)).toEqual([
      'Ábaco de colores',
      'Ajedrez de madera',
      'Yoyo luminoso',
    ]);
  });

  it('devuelve imagen, nombre, precio, categoría y edad recomendada de cada juguete', async () => {
    repositorio.find.mockResolvedValue([juguete({})]);

    await expect(servicio.listarCatalogo()).resolves.toEqual([
      {
        id: 1,
        nombre: 'Osito de peluche Bruno',
        precio: 35.5,
        imagenUrl: 'https://placehold.co/600x400?text=Osito',
        edadMinima: 0,
        edadMaxima: 5,
        stock: 15,
        agotado: false,
        categoria: { id: 2, nombre: 'Peluches' },
      },
    ]);
  });

  it('marca como agotado el juguete con stock 0', async () => {
    repositorio.find.mockResolvedValue([
      juguete({ id: 4, nombre: 'Llama de peluche andina', stock: 0 }),
    ]);

    const [llama] = await servicio.listarCatalogo();

    expect(llama.agotado).toBe(true);
  });

  it('devuelve una lista vacía si no hay juguetes registrados', async () => {
    repositorio.find.mockResolvedValue([]);

    await expect(servicio.listarCatalogo()).resolves.toEqual([]);
  });

  describe('búsqueda por nombre (HU-16)', () => {
    beforeEach(() => {
      repositorio.find.mockResolvedValue([
        juguete({ id: 3, nombre: 'Osito de peluche Bruno' }),
        juguete({ id: 4, nombre: 'Llama de Peluche andina' }),
        juguete({ id: 8, nombre: 'Ábaco de colores' }),
      ]);
    });
    const nombres = async (nombre: string) =>
      (await servicio.listarCatalogo({ nombre })).map((item) => item.nombre);

    it('encuentra los juguetes que contienen el texto, sin importar mayúsculas', async () => {
      expect(await nombres('PELU')).toEqual([
        'Llama de Peluche andina',
        'Osito de peluche Bruno',
      ]);
    });

    it('tampoco distingue las tildes', async () => {
      expect(await nombres('abaco')).toEqual(['Ábaco de colores']);
    });

    it('sin coincidencias devuelve una lista vacía', async () => {
      expect(await nombres('robot')).toEqual([]);
    });

    it('con el texto vacío devuelve todo el catálogo', async () => {
      expect(await nombres('')).toHaveLength(3);
    });
  });

  describe('filtros del catálogo (HU-17)', () => {
    const condiciones = async (filtros: FiltrosCatalogoDto) => {
      repositorio.find.mockResolvedValue([]);
      await servicio.listarCatalogo(filtros);
      return (repositorio.find.mock.lastCall as [{ where: object }])[0].where;
    };

    it('filtra por categoría', async () => {
      expect(await condiciones({ categoriaId: 2 })).toEqual({
        activo: true,
        categoriaId: 2,
      });
    });

    it.each([
      ['0-2', 0, 2],
      ['3-5', 3, 5],
      ['6-8', 6, 8],
      ['9-12', 9, 12],
      ['13+', 13, 99],
    ] as const)(
      'el rango %s trae las edades recomendadas que se cruzan con él',
      async (edad, desde, hasta) => {
        expect(await condiciones({ edad })).toEqual({
          activo: true,
          edadMinima: LessThanOrEqual(hasta),
          edadMaxima: MoreThanOrEqual(desde),
        });
      },
    );

    it.each([
      [{ precioMin: 20 }, MoreThanOrEqual(20)],
      [{ precioMax: 60 }, LessThanOrEqual(60)],
      [{ precioMin: 20, precioMax: 60 }, Between(20, 60)],
      [{ precioMin: 30, precioMax: 30 }, Between(30, 30)],
    ])('filtra por precio con %o', async (filtros, precio) => {
      expect(await condiciones(filtros)).toEqual({ activo: true, precio });
    });

    it('combina todos los filtros a la vez', async () => {
      expect(
        await condiciones({ categoriaId: 1, edad: '3-5', precioMax: 60 }),
      ).toEqual({
        activo: true,
        categoriaId: 1,
        edadMinima: LessThanOrEqual(5),
        edadMaxima: MoreThanOrEqual(3),
        precio: LessThanOrEqual(60),
      });
    });

    it('con el mínimo mayor que el máximo responde 400 y no consulta', async () => {
      repositorio.find.mockClear();

      await expect(
        servicio.listarCatalogo({ precioMin: 60, precioMax: 20 }),
      ).rejects.toMatchObject({
        response: { errores: { precioMin: PRECIOS_INVERTIDOS } },
      });
      expect(repositorio.find).not.toHaveBeenCalled();
    });
  });

  describe('obtenerDetalle', () => {
    it('busca el juguete activo con su categoría', async () => {
      repositorio.findOne.mockResolvedValue(juguete({}));

      await servicio.obtenerDetalle(1);

      expect(repositorio.findOne).toHaveBeenCalledWith({
        where: { id: 1, activo: true },
        relations: { categoria: true },
      });
    });

    it('devuelve descripción y unidades disponibles además de los datos del catálogo', async () => {
      repositorio.findOne.mockResolvedValue(juguete({}));

      await expect(servicio.obtenerDetalle(1)).resolves.toEqual({
        id: 1,
        nombre: 'Osito de peluche Bruno',
        descripcion: 'Osito suave.',
        precio: 35.5,
        imagenUrl: 'https://placehold.co/600x400?text=Osito',
        edadMinima: 0,
        edadMaxima: 5,
        stock: 15,
        agotado: false,
        categoria: { id: 2, nombre: 'Peluches' },
      });
    });

    it('marca como agotado el juguete con stock 0', async () => {
      repositorio.findOne.mockResolvedValue(juguete({ stock: 0 }));

      const detalle = await servicio.obtenerDetalle(1);

      expect(detalle.agotado).toBe(true);
    });

    it('responde 404 si el juguete no existe o está desactivado', async () => {
      repositorio.findOne.mockResolvedValue(null);

      await expect(servicio.obtenerDetalle(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('responde 404 sin consultar la base de datos si el id está fuera de rango', async () => {
      await expect(servicio.obtenerDetalle(0)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      await expect(
        servicio.obtenerDetalle(99_999_999_999),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repositorio.findOne).not.toHaveBeenCalled();
    });
  });

  describe('verificarStock', () => {
    it('devuelve el juguete activo si hay unidades suficientes', async () => {
      const osito = juguete({ stock: 3 });
      repositorio.findOneBy.mockResolvedValue(osito);

      await expect(servicio.verificarStock(1, 3)).resolves.toBe(osito);
      expect(repositorio.findOneBy).toHaveBeenCalledWith({
        id: 1,
        activo: true,
      });
    });

    it('responde 409 «Solo quedan N unidades» si se piden más unidades que el stock', async () => {
      repositorio.findOneBy.mockResolvedValue(juguete({ stock: 3 }));

      const intento = servicio.verificarStock(1, 4);

      await expect(intento).rejects.toBeInstanceOf(ConflictException);
      await expect(intento).rejects.toMatchObject({
        response: {
          statusCode: 409,
          message: 'Solo quedan 3 unidades',
          stock: 3,
        },
      });
    });

    it('responde 404 si el juguete no existe o está desactivado', async () => {
      repositorio.findOneBy.mockResolvedValue(null);

      await expect(servicio.verificarStock(999, 1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('descontarStock (HU-09)', () => {
    const gestor = { decrement: vi.fn(), findBy: vi.fn() };
    const comoGestor = gestor as unknown as EntityManager;
    const lineas = [
      { jugueteId: 12, nombre: 'Ajedrez de madera', cantidad: 1 },
      { jugueteId: 8, nombre: 'Ábaco de colores', cantidad: 3 },
    ];

    /** Ejecuta descontarStock y devuelve el 409 que lanza. */
    async function conflicto(): Promise<ConflictException> {
      const error: unknown = await servicio
        .descontarStock(comoGestor, lineas)
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ConflictException);
      return error as ConflictException;
    }

    beforeEach(() => {
      gestor.decrement.mockReset().mockResolvedValue({ affected: 1 });
      gestor.findBy.mockReset().mockResolvedValue([]);
    });

    it('descuenta cada juguete solo si sigue activo y le alcanza el stock, en orden de id', async () => {
      await servicio.descontarStock(comoGestor, lineas);

      expect(gestor.decrement.mock.calls).toEqual([
        [
          Juguete,
          { id: 8, activo: true, stock: MoreThanOrEqual(3) },
          'stock',
          3,
        ],
        [
          Juguete,
          { id: 12, activo: true, stock: MoreThanOrEqual(1) },
          'stock',
          1,
        ],
      ]);
      expect(gestor.findBy).not.toHaveBeenCalled();
    });

    it('si otro cliente compró las últimas unidades, responde 409 con el juguete y el stock que le queda', async () => {
      gestor.decrement.mockImplementation(
        (_entidad: unknown, condiciones: { id: number }) =>
          Promise.resolve({ affected: condiciones.id === 8 ? 0 : 1 }),
      );
      gestor.findBy.mockResolvedValue([juguete({ id: 8, stock: 2 })]);

      expect((await conflicto()).getResponse()).toEqual({
        statusCode: 409,
        message: STOCK_INSUFICIENTE,
        juguetes: [
          {
            jugueteId: 8,
            nombre: 'Ábaco de colores',
            stock: 2,
            mensaje: 'Solo quedan 2 unidades',
          },
        ],
      });
    });

    it('lista todos los juguetes que faltan; uno desactivado o borrado cuenta como agotado', async () => {
      gestor.decrement.mockResolvedValue({ affected: 0 });
      gestor.findBy.mockResolvedValue([
        juguete({ id: 12, stock: 5, activo: false }),
      ]);

      const respuesta = (await conflicto()).getResponse() as {
        juguetes: unknown[];
      };

      expect(respuesta.juguetes).toEqual([
        {
          jugueteId: 8,
          nombre: 'Ábaco de colores',
          stock: 0,
          mensaje: 'Este juguete está agotado',
        },
        {
          jugueteId: 12,
          nombre: 'Ajedrez de madera',
          stock: 0,
          mensaje: 'Este juguete está agotado',
        },
      ]);
    });
  });

  describe('registrar y editar (HU-12)', () => {
    const datos = {
      nombre: 'Cuy de peluche Ñuñu',
      descripcion: 'Peluche suave de cuy andino.',
      precio: 39.9,
      imagenUrl: 'https://placehold.co/600x400?text=Cuy',
      categoriaId: 2,
      edadMinima: 0,
      edadMaxima: 5,
      stock: 12,
    } satisfies RegistrarJugueteDto;
    /** Error que lanza pg cuando la categoría no existe (llave foránea). */
    const sinCategoria = Object.assign(new Error('fk'), { code: '23503' });

    /** Devuelve el error con el que el servicio rechaza la operación. */
    async function rechazo(operacion: Promise<unknown>): Promise<Error> {
      try {
        await operacion;
      } catch (error) {
        return error as Error;
      }
      throw new Error('Se esperaba un error');
    }

    it('registra el juguete activo con su stock inicial y lo devuelve con su categoría', async () => {
      repositorio.save.mockResolvedValue({ ...datos, id: 21 });
      repositorio.findOne.mockResolvedValue(juguete({ ...datos, id: 21 }));

      const registrado = await servicio.registrar(datos);

      expect(repositorio.save).toHaveBeenCalledWith({ ...datos, activo: true });
      expect(repositorio.findOne).toHaveBeenCalledWith({
        where: { id: 21, activo: true },
        relations: { categoria: true },
      });
      expect(registrado).toMatchObject({
        id: 21,
        nombre: 'Cuy de peluche Ñuñu',
      });
    });

    it('no guarda nada si la edad mínima es mayor que la máxima', async () => {
      const error = await rechazo(
        servicio.registrar({ ...datos, edadMinima: 6, edadMaxima: 3 }),
      );

      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toMatchObject({
        errores: { edadMinima: EDADES_INVERTIDAS },
      });
      expect(repositorio.save).not.toHaveBeenCalled();
    });

    it('si la categoría ya no existe responde 400 junto al campo categoría', async () => {
      repositorio.save.mockRejectedValue(sinCategoria);

      const error = await rechazo(servicio.registrar(datos));

      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toMatchObject({
        errores: { categoriaId: CATEGORIA_INEXISTENTE },
      });
    });

    it('edita solo un juguete activo y nunca cambia su stock', async () => {
      repositorio.update.mockResolvedValue({ affected: 1 });
      repositorio.findOne.mockResolvedValue(juguete({ id: 4, precio: 42.5 }));
      const { stock: _stock, ...sinStock } = datos;

      await servicio.editar(4, { ...datos, precio: 42.5 });

      expect(repositorio.update).toHaveBeenCalledWith(
        { id: 4, activo: true },
        { ...sinStock, precio: 42.5 },
      );
    });

    it('responde 404 si el juguete no existe o ya fue eliminado', async () => {
      repositorio.update.mockResolvedValue({ affected: 0 });

      const error = await rechazo(servicio.editar(99, datos));

      expect(error).toBeInstanceOf(NotFoundException);
      expect(error.message).toBe(JUGUETE_NO_ENCONTRADO);
      expect(repositorio.findOne).not.toHaveBeenCalled();
    });

    it('responde 404 sin consultar si el id está fuera de rango', async () => {
      const error = await rechazo(servicio.editar(2_147_483_648, datos));

      expect(error).toBeInstanceOf(NotFoundException);
      expect(repositorio.update).not.toHaveBeenCalled();
    });

    it('al editar también rechaza las edades invertidas y la categoría inexistente', async () => {
      expect(
        await rechazo(
          servicio.editar(4, { ...datos, edadMinima: 13, edadMaxima: 8 }),
        ),
      ).toBeInstanceOf(BadRequestException);

      repositorio.update.mockRejectedValue(sinCategoria);
      const error = await rechazo(servicio.editar(4, datos));
      expect((error as BadRequestException).getResponse()).toMatchObject({
        errores: { categoriaId: CATEGORIA_INEXISTENTE },
      });
    });
  });

  describe('actualizarStock (HU-13)', () => {
    it('fija el stock de un juguete activo y lo devuelve actualizado', async () => {
      repositorio.update.mockResolvedValue({ affected: 1 });
      repositorio.findOne.mockResolvedValue(juguete({ id: 5, stock: 3 }));

      const actualizado = await servicio.actualizarStock(5, 3);

      expect(repositorio.update).toHaveBeenCalledWith(
        { id: 5, activo: true },
        { stock: 3 },
      );
      expect(actualizado.stock).toBe(3);
    });

    it('acepta 0: el juguete queda agotado en el catálogo', async () => {
      repositorio.update.mockResolvedValue({ affected: 1 });
      repositorio.findOne.mockResolvedValue(juguete({ id: 5, stock: 0 }));

      const actualizado = await servicio.actualizarStock(5, 0);

      expect(repositorio.update).toHaveBeenCalledWith(
        { id: 5, activo: true },
        { stock: 0 },
      );
      expect(actualizado.stock).toBe(0);
    });

    it('responde 404 si el juguete no existe o fue eliminado', async () => {
      repositorio.update.mockResolvedValue({ affected: 0 });

      await expect(servicio.actualizarStock(77, 4)).rejects.toThrow(
        NotFoundException,
      );
      expect(repositorio.findOne).not.toHaveBeenCalled();
    });

    it('responde 404 sin consultar si el id está fuera de rango', async () => {
      await expect(servicio.actualizarStock(0, 4)).rejects.toThrow(
        NotFoundException,
      );
      expect(repositorio.update).not.toHaveBeenCalled();
    });
  });

  describe('desactivar (HU-20)', () => {
    it('desactiva el juguete activo en vez de borrarlo', async () => {
      repositorio.update.mockResolvedValue({ affected: 1 });

      await servicio.desactivar(14);

      expect(repositorio.update).toHaveBeenCalledWith(
        { id: 14, activo: true },
        { activo: false },
      );
    });

    it('responde 404 si no existe o ya estaba eliminado', async () => {
      repositorio.update.mockResolvedValue({ affected: 0 });

      await expect(servicio.desactivar(14)).rejects.toThrow(NotFoundException);
    });

    it('responde 404 sin consultar si el id está fuera de rango', async () => {
      await expect(servicio.desactivar(-1)).rejects.toThrow(NotFoundException);
      expect(repositorio.update).not.toHaveBeenCalled();
    });

    it('un juguete desactivado ya no se puede agregar al carrito ni ver en detalle', async () => {
      repositorio.findOneBy.mockResolvedValue(null);
      repositorio.findOne.mockResolvedValue(null);

      await expect(servicio.verificarStock(14, 1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(servicio.obtenerDetalle(14)).rejects.toThrow(
        NotFoundException,
      );
      expect(repositorio.findOneBy).toHaveBeenCalledWith({
        id: 14,
        activo: true,
      });
    });
  });

  describe('mensajeSinStock', () => {
    it('usa singular, plural y «agotado» según las unidades', () => {
      expect(mensajeSinStock(5)).toBe('Solo quedan 5 unidades');
      expect(mensajeSinStock(1)).toBe('Solo queda 1 unidad');
      expect(mensajeSinStock(0)).toBe('Este juguete está agotado');
    });
  });
});
