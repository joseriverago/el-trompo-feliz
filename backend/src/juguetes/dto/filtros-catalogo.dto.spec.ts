import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { erroresPorCampo } from '../../config/pipe-validacion.js';
import { FiltrosCatalogoDto } from './filtros-catalogo.dto.js';

const leer = (consulta: Record<string, string>) => {
  const dto = plainToInstance(FiltrosCatalogoDto, consulta);
  return { dto, errores: erroresPorCampo(validateSync(dto)) };
};

describe('FiltrosCatalogoDto (HU-16 y HU-17)', () => {
  it('sin parámetros es válido', () => {
    expect(leer({}).errores).toEqual({});
  });

  it('convierte a número la categoría y los precios', () => {
    const { dto, errores } = leer({
      categoriaId: '2',
      precioMin: '20',
      precioMax: '59.9',
      edad: '3-5',
    });

    expect(errores).toEqual({});
    expect(dto).toMatchObject({
      categoriaId: 2,
      precioMin: 20,
      precioMax: 59.9,
      edad: '3-5',
    });
  });

  it('un parámetro vacío no filtra', () => {
    const { dto, errores } = leer({
      categoriaId: '',
      precioMin: '',
      edad: '',
    });

    expect(errores).toEqual({});
    expect(dto.categoriaId).toBeUndefined();
    expect(dto.precioMin).toBeUndefined();
    expect(dto.edad).toBeUndefined();
  });

  it('rechaza valores que no sirven para filtrar', () => {
    const { errores } = leer({
      categoriaId: 'x',
      edad: '4-7',
      precioMin: '-1',
      precioMax: 'caro',
    });

    expect(errores).toEqual({
      categoriaId: 'La categoría no existe',
      edad: 'El rango de edad no existe',
      precioMin: 'El precio debe ser un número de 0 o más',
      precioMax: 'El precio debe ser un número de 0 o más',
    });
  });
});
