import { BadRequestException } from '@nestjs/common';
import { crearPipeValidacion } from '../../config/pipe-validacion.js';
import { DatosEntregaDto } from './datos-entrega.dto.js';

/** Pasa el cuerpo por el mismo pipe de validación que usa la API. */
async function validar(cuerpo: unknown): Promise<DatosEntregaDto> {
  return (await crearPipeValidacion().transform(cuerpo, {
    type: 'body',
    metatype: DatosEntregaDto,
  })) as DatosEntregaDto;
}

/** Devuelve los mensajes por campo de la respuesta 400. */
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

const VALIDOS = {
  destinatario: 'Rosa Quispe',
  telefono: '987654321',
  direccion: 'Av. Los Olivos 123, dpto. 302',
  distrito: 'San Miguel',
};

describe('DatosEntregaDto (HU-08)', () => {
  it('acepta datos válidos, recorta los textos y deja el teléfono solo con dígitos', async () => {
    const dto = await validar({
      destinatario: '  Rosa Quispe ',
      telefono: ' 987 654-321 ',
      direccion: ' Av. Los Olivos 123, dpto. 302 ',
      distrito: ' San Miguel ',
      referencia: '  Frente al parque  ',
    });

    expect(dto).toEqual({ ...VALIDOS, referencia: 'Frente al parque' });
  });

  it('la referencia es opcional: vacía se guarda como null', async () => {
    expect((await validar(VALIDOS)).referencia).toBeUndefined();
    expect(
      (await validar({ ...VALIDOS, referencia: '   ' })).referencia,
    ).toBeNull();
  });

  it('indica cada campo obligatorio vacío o que falta', async () => {
    expect(
      await errores({ destinatario: ' ', telefono: '', direccion: '  ' }),
    ).toEqual({
      destinatario: 'Ingresa el nombre de quien recibe',
      telefono: 'Ingresa el teléfono',
      direccion: 'Ingresa la dirección de entrega',
      distrito: 'Ingresa el distrito',
    });
  });

  it.each(['98765432', '9876543210', '98765432a', '+51987654321'])(
    'rechaza el teléfono %s porque no tiene 9 dígitos',
    async (telefono) => {
      expect(await errores({ ...VALIDOS, telefono })).toEqual({
        telefono: 'El teléfono debe tener 9 dígitos',
      });
    },
  );

  it('rechaza textos demasiado largos', async () => {
    expect(
      await errores({
        ...VALIDOS,
        direccion: 'a'.repeat(201),
        referencia: 'b'.repeat(201),
      }),
    ).toEqual({
      direccion: 'La dirección puede tener hasta 200 caracteres',
      referencia: 'La referencia puede tener hasta 200 caracteres',
    });
  });

  it('descarta los campos que no son del formulario, como un estado o un total', async () => {
    const dto = await validar({ ...VALIDOS, estado: 'PAGADO', total: 1 });

    expect(dto).toEqual(VALIDOS);
  });
});
