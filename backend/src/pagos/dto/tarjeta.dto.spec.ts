import { BadRequestException } from '@nestjs/common';
import { crearPipeValidacion } from '../../config/pipe-validacion.js';
import { TarjetaDto } from './tarjeta.dto.js';

/** Pasa el cuerpo por el mismo pipe de validación que usa la API. */
async function validar(cuerpo: unknown): Promise<TarjetaDto> {
  return (await crearPipeValidacion().transform(cuerpo, {
    type: 'body',
    metatype: TarjetaDto,
  })) as TarjetaDto;
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

const VALIDA = {
  numero: '4242424242424242',
  titular: 'Rosa Quispe',
  vencimiento: '08/29',
  cvv: '123',
};

describe('TarjetaDto (HU-09)', () => {
  it('acepta una tarjeta válida y quita los espacios y guiones que se escriben al tipear', async () => {
    const dto = await validar({
      numero: ' 4242 4242-4242 4242 ',
      titular: '  Rosa Quispe ',
      vencimiento: ' 08 / 29 ',
      cvv: ' 123 ',
    });

    expect(dto).toEqual(VALIDA);
  });

  it('acepta titulares con tildes, ñ, apóstrofos, puntos y guiones', async () => {
    const titular = "María Ñahui O'Brien-Ávila Jr.";

    expect((await validar({ ...VALIDA, titular })).titular).toBe(titular);
  });

  it('indica cada campo vacío o que falta', async () => {
    expect(
      await errores({ numero: ' ', titular: '', vencimiento: '  ' }),
    ).toEqual({
      numero: 'Ingresa el número de la tarjeta',
      titular: 'Ingresa el nombre del titular',
      vencimiento: 'Ingresa el vencimiento',
      cvv: 'Ingresa el CVV',
    });
  });

  it.each(['424242424242424', '42424242424242425', '4242abcd42424242'])(
    'rechaza el número %s porque no tiene 16 dígitos',
    async (numero) => {
      expect(await errores({ ...VALIDA, numero })).toEqual({
        numero: 'El número de la tarjeta debe tener 16 dígitos',
      });
    },
  );

  it.each(['13/29', '00/29', '8/29', '08/2029', '0829'])(
    'rechaza el vencimiento %s porque no es un MM/AA válido',
    async (vencimiento) => {
      expect(await errores({ ...VALIDA, vencimiento })).toEqual({
        vencimiento: 'Escribe el vencimiento como MM/AA, por ejemplo 08/29',
      });
    },
  );

  it.each(['12', '1234', '12a'])(
    'rechaza el CVV %s porque no tiene 3 dígitos',
    async (cvv) => {
      expect(await errores({ ...VALIDA, cvv })).toEqual({
        cvv: 'El CVV debe tener 3 dígitos',
      });
    },
  );

  it('rechaza un titular con números', async () => {
    expect(await errores({ ...VALIDA, titular: 'Rosa 123' })).toEqual({
      titular: 'Escribe el nombre como aparece en la tarjeta, solo con letras',
    });
  });

  it('descarta los campos que no declara', async () => {
    expect(await validar({ ...VALIDA, guardarTarjeta: true })).toEqual(VALIDA);
  });
});
