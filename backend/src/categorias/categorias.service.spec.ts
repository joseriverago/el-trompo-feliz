import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CategoriasService } from './categorias.service.js';
import { Categoria } from './entities/categoria.entity.js';

describe('CategoriasService', () => {
  let servicio: CategoriasService;
  const repositorio = { find: vi.fn() };

  beforeEach(async () => {
    repositorio.find.mockReset();
    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriasService,
        { provide: getRepositoryToken(Categoria), useValue: repositorio },
      ],
    }).compile();
    servicio = modulo.get(CategoriasService);
  });

  it('lista las categorías por nombre según el alfabeto español', async () => {
    repositorio.find.mockResolvedValue([
      { id: 3, nombre: 'Peluches' },
      { id: 5, nombre: 'Ñandú y animales' },
      { id: 1, nombre: 'Árbol de juegos' },
      { id: 2, nombre: 'Didácticos' },
    ]);

    const categorias = await servicio.listar();

    expect(categorias.map((categoria) => categoria.nombre)).toEqual([
      'Árbol de juegos',
      'Didácticos',
      'Ñandú y animales',
      'Peluches',
    ]);
  });
});
