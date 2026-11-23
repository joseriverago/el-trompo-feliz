import { BadRequestException } from '@nestjs/common';
import { crearPipeValidacion } from '../../config/pipe-validacion.js';
import { ActualizarStockDto } from './actualizar-stock.dto.js';

async function validar(cuerpo: unknown): Promise<ActualizarStockDto> {
  return (await crearPipeValidacion().transform(cuerpo, {
    type: 'body',
    metatype: ActualizarStockDto,
  })) as ActualizarStockDto;
}

async function errores(cuerpo: unknown): Promise<Record<string, string>> {
  try {
    await validar(cuerpo);
  } catch (error) {
    expect(error).toBeInstanceOf(BadRequestException);
    return (
      (error as BadRequestException).getResponse() as {
        errores: Record<string, string>;
      }
    ).errores;
  }
  throw new Error('Se esperaba un error de validación');
}

describe('ActualizarStockDto (HU-13)', () => {
  it.each([0, 5, 100_000])('acepta el stock %s', async (stock) => {
    expect(await validar({ stock })).toEqual({ stock });
  });

  it('pide el stock si falta', async () => {
    expect(await errores({})).toEqual({ stock: 'Ingresa el stock' });
  });

  it.each([-1, 2.5, '7', 'siete'])(
    'rechaza %s: el stock debe ser un entero de 0 o más (criterio 4)',
    async (stock) => {
      expect(await errores({ stock })).toEqual({
        stock: 'El stock debe ser un número entero de 0 o más',
      });
    },
  );

  it('rechaza más de 100000 unidades y descarta otros campos', async () => {
    expect(await errores({ stock: 100_001 })).toEqual({
      stock: 'El stock puede ser hasta 100000 unidades',
    });
    expect(await validar({ stock: 3, precio: 1 })).toEqual({ stock: 3 });
  });
});
