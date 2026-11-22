import { BadRequestException } from '@nestjs/common';
import { crearPipeValidacion } from '../../config/pipe-validacion.js';
import { AgregarItemDto } from './agregar-item.dto.js';

/** Pasa el cuerpo por el mismo pipe de validación que usa la API. */
async function validar(cuerpo: unknown): Promise<AgregarItemDto> {
  return (await crearPipeValidacion().transform(cuerpo, {
    type: 'body',
    metatype: AgregarItemDto,
  })) as AgregarItemDto;
}

describe('AgregarItemDto', () => {
  it('acepta el id de un juguete y descarta los demás campos', async () => {
    await expect(
      validar({ jugueteId: 8, usuarioId: 99, cantidad: 50 }),
    ).resolves.toEqual({ jugueteId: 8 });
  });

  it.each([
    ['sin jugueteId', {}],
    ['con un texto', { jugueteId: 'ocho' }],
    ['con un decimal', { jugueteId: 1.5 }],
    ['con cero', { jugueteId: 0 }],
    [
      'con un id mayor que el máximo de PostgreSQL',
      { jugueteId: 2_147_483_648 },
    ],
  ])(
    'responde 400 «Elige un juguete del catálogo» %s',
    async (_caso, cuerpo) => {
      const intento = validar(cuerpo);

      await expect(intento).rejects.toBeInstanceOf(BadRequestException);
      await expect(intento).rejects.toMatchObject({
        response: { errores: { jugueteId: 'Elige un juguete del catálogo' } },
      });
    },
  );
});
