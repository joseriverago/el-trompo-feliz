import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Categoria } from '../categorias/entities/categoria.entity.js';
import { Juguete } from './entities/juguete.entity.js';
import { JuguetesService, mensajeSinStock } from './juguetes.service.js';

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
  const repositorio = { find: vi.fn(), findOne: vi.fn(), findOneBy: vi.fn() };

  beforeEach(async () => {
    repositorio.find.mockReset();
    repositorio.findOne.mockReset();
    repositorio.findOneBy.mockReset();
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

  describe('mensajeSinStock', () => {
    it('usa singular, plural y «agotado» según las unidades', () => {
      expect(mensajeSinStock(5)).toBe('Solo quedan 5 unidades');
      expect(mensajeSinStock(1)).toBe('Solo queda 1 unidad');
      expect(mensajeSinStock(0)).toBe('Este juguete está agotado');
    });
  });
});
