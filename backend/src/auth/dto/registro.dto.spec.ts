import { BadRequestException } from '@nestjs/common';
import { crearPipeValidacion } from '../../config/pipe-validacion.js';
import { RegistroDto } from './registro.dto.js';

/** Pasa el cuerpo por el mismo pipe de validación que usa la API. */
async function validar(cuerpo: unknown): Promise<RegistroDto> {
  return (await crearPipeValidacion().transform(cuerpo, {
    type: 'body',
    metatype: RegistroDto,
  })) as RegistroDto;
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

describe('RegistroDto', () => {
  it('acepta datos válidos, recorta el nombre y guarda el correo en minúsculas', async () => {
    const dto = await validar({
      nombre: '  José Peña  ',
      correo: '  JOSE.Pena@Correo.PE ',
      contrasena: 'clave segura',
    });

    expect(dto).toEqual({
      nombre: 'José Peña',
      correo: 'jose.pena@correo.pe',
      contrasena: 'clave segura',
    });
  });

  it('indica cada campo vacío', async () => {
    expect(await errores({ nombre: '   ', correo: '', contrasena: '' })).toEqual({
      nombre: 'Ingresa tu nombre',
      correo: 'Ingresa tu correo',
      contrasena: 'Ingresa una contraseña',
    });
  });

  it('indica los campos que faltan en la petición', async () => {
    expect(Object.keys(await errores({}))).toEqual(['nombre', 'correo', 'contrasena']);
  });

  it('rechaza un correo que no es válido', async () => {
    expect(
      await errores({ nombre: 'Ana', correo: 'ana@correo', contrasena: '12345678' }),
    ).toEqual({ correo: 'Ingresa un correo válido, por ejemplo nombre@correo.com' });
  });

  it('pide una contraseña de al menos 8 caracteres', async () => {
    expect(
      await errores({ nombre: 'Ana', correo: 'ana@correo.pe', contrasena: '1234567' }),
    ).toEqual({ contrasena: 'La contraseña debe tener al menos 8 caracteres' });
  });

  it('descarta un rol enviado en la petición: nadie se registra como administrador', async () => {
    const dto = await validar({
      nombre: 'Ana',
      correo: 'ana@correo.pe',
      contrasena: '12345678',
      rol: 'ADMINISTRADOR',
    });

    expect(dto).not.toHaveProperty('rol');
  });
});
