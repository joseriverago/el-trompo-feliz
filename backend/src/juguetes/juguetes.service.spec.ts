import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Categoria } from '../categorias/entities/categoria.entity.js';
import { Juguete } from './entities/juguete.entity.js';
import { JuguetesService } from './juguetes.service.js';

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
  const repositorio = { find: vi.fn() };

  beforeEach(async () => {
    repositorio.find.mockReset();
    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        JuguetesService,
        { provide: getRepositoryToken(Juguete), useValue: repositorio },
      ],
    }).compile();

    servicio = modulo.get(JuguetesService);
  });

  it('consulta solo los juguetes activos, con su categoría y ordenados por nombre', async () => {
    repositorio.find.mockResolvedValue([]);

    await servicio.listarCatalogo();

    expect(repositorio.find).toHaveBeenCalledWith({
      where: { activo: true },
      relations: { categoria: true },
      order: { nombre: 'ASC' },
    });
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
});
