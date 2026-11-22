import { BadRequestException } from '@nestjs/common';
import { crearPipeValidacion } from '../../config/pipe-validacion.js';
import { InicioSesionDto } from './inicio-sesion.dto.js';

/** Pasa el cuerpo por el mismo pipe de validación que usa la API. */
async function validar(cuerpo: unknown): Promise<InicioSesionDto> {
  return (await crearPipeValidacion().transform(cuerpo, {
    type: 'body',
    metatype: InicioSesionDto,
  })) as InicioSesionDto;
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

describe('InicioSesionDto', () => {
  it('pasa el correo a minúsculas sin espacios y deja la contraseña tal cual', async () => {
    const dto = await validar({
      correo: '  BEGONA.Nahui@Correo.PE ',
      contrasena: ' clave con espacios ',
    });

    expect(dto).toEqual({
      correo: 'begona.nahui@correo.pe',
      contrasena: ' clave con espacios ',
    });
  });

  it('pide completar los campos vacíos', async () => {
    expect(await errores({ correo: '   ', contrasena: '' })).toEqual({
      correo: 'Ingresa tu correo',
      contrasena: 'Ingresa tu contraseña',
    });
  });

  it('pide completar los campos que no llegan', async () => {
    expect(await errores({})).toEqual({
      correo: 'Ingresa tu correo',
      contrasena: 'Ingresa tu contraseña',
    });
  });

  it('avisa si el correo no tiene forma de correo', async () => {
    expect(
      await errores({ correo: 'begona@correo', contrasena: 'algo' }),
    ).toEqual({
      correo: 'Ingresa un correo válido, por ejemplo nombre@correo.com',
    });
  });

  it('no exige un largo mínimo de contraseña: eso solo se revisa al registrarse', async () => {
    const dto = await validar({ correo: 'a@correo.pe', contrasena: 'corta' });

    expect(dto.contrasena).toBe('corta');
  });

  it('descarta los campos que no son del formulario', async () => {
    const dto = await validar({
      correo: 'a@correo.pe',
      contrasena: 'clave segura',
      rol: 'ADMINISTRADOR',
    });

    expect(dto).not.toHaveProperty('rol');
  });
});
