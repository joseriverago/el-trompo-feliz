import { BadRequestException } from '@nestjs/common';
import { crearPipeValidacion } from '../../config/pipe-validacion.js';
import { CambiarCantidadDto } from './cambiar-cantidad.dto.js';

/** Pasa el cuerpo por el mismo pipe de validación que usa la API. */
async function validar(cuerpo: unknown): Promise<CambiarCantidadDto> {
  return (await crearPipeValidacion().transform(cuerpo, {
    type: 'body',
    metatype: CambiarCantidadDto,
  })) as CambiarCantidadDto;
}

describe('CambiarCantidadDto', () => {
  it('acepta una cantidad entera y descarta los demás campos', async () => {
    await expect(
      validar({ cantidad: 3, jugueteId: 99, precio: 0.1 }),
    ).resolves.toEqual({ cantidad: 3 });
  });

  it.each([
    ['sin cantidad', {}],
    ['con un texto', { cantidad: 'tres' }],
    ['con un decimal', { cantidad: 1.5 }],
    ['con cero', { cantidad: 0 }],
    ['con un número negativo', { cantidad: -2 }],
  ])(
    'responde 400 «La cantidad debe ser un número entero de 1 o más» %s',
    async (_caso, cuerpo) => {
      const intento = validar(cuerpo);

      await expect(intento).rejects.toBeInstanceOf(BadRequestException);
      await expect(intento).rejects.toMatchObject({
        response: {
          errores: {
            cantidad: 'La cantidad debe ser un número entero de 1 o más',
          },
        },
      });
    },
  );
});
