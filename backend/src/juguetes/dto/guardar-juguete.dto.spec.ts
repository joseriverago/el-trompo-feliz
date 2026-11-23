import { BadRequestException } from '@nestjs/common';
import { crearPipeValidacion } from '../../config/pipe-validacion.js';
import {
  GuardarJugueteDto,
  RegistrarJugueteDto,
} from './guardar-juguete.dto.js';

/** Pasa el cuerpo por el mismo pipe de validación que usa la API. */
async function validar(
  cuerpo: unknown,
  metatype: typeof GuardarJugueteDto = RegistrarJugueteDto,
): Promise<RegistrarJugueteDto> {
  return (await crearPipeValidacion().transform(cuerpo, {
    type: 'body',
    metatype,
  })) as RegistrarJugueteDto;
}

/** Devuelve los mensajes por campo de la respuesta 400. */
async function errores(
  cuerpo: unknown,
  metatype: typeof GuardarJugueteDto = RegistrarJugueteDto,
): Promise<Record<string, string>> {
  try {
    await validar(cuerpo, metatype);
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
  nombre: 'Cuy de peluche Ñuñu',
  descripcion: 'Peluche suave de cuy andino, con bordados de colores.',
  precio: 39.9,
  imagenUrl: 'https://placehold.co/600x400?text=Cuy',
  categoriaId: 2,
  edadMinima: 0,
  edadMaxima: 5,
  stock: 12,
};

describe('GuardarJugueteDto y RegistrarJugueteDto (HU-12)', () => {
  it('acepta un juguete completo y recorta los textos', async () => {
    const dto = await validar({
      ...VALIDOS,
      nombre: '  Cuy de peluche Ñuñu ',
      imagenUrl: ' https://placehold.co/600x400?text=Cuy ',
    });

    expect(dto).toEqual(VALIDOS);
  });

  it('con todo vacío pide cada dato, también el stock inicial', async () => {
    expect(
      await errores({ nombre: ' ', descripcion: '', imagenUrl: '   ' }),
    ).toEqual({
      nombre: 'Ingresa el nombre',
      descripcion: 'Ingresa la descripción',
      precio: 'Ingresa el precio',
      imagenUrl: 'Ingresa la dirección (URL) de la imagen',
      categoriaId: 'Elige una categoría de la lista',
      edadMinima: 'Ingresa la edad mínima',
      edadMaxima: 'Ingresa la edad máxima',
      stock: 'Ingresa el stock inicial',
    });
  });

  it.each([0, -5])(
    'rechaza el precio %s: debe ser mayor que 0',
    async (precio) => {
      expect(await errores({ ...VALIDOS, precio })).toEqual({
        precio: 'El precio debe ser mayor que 0',
      });
    },
  );

  it('rechaza un precio con más de 2 decimales, uno que no es número y uno demasiado alto', async () => {
    expect(await errores({ ...VALIDOS, precio: 12.999 })).toEqual({
      precio: 'El precio debe ser un número con hasta 2 decimales',
    });
    expect((await errores({ ...VALIDOS, precio: '12.90' })).precio).toBe(
      'El precio debe ser un número con hasta 2 decimales',
    );
    expect(await errores({ ...VALIDOS, precio: 10000 })).toEqual({
      precio: 'El precio puede ser hasta S/ 9999.99',
    });
  });

  it.each(['placehold.co/cuy.png', 'ftp://sitio.pe/cuy.png', 'una foto'])(
    'rechaza la imagen «%s» porque no es una URL http o https',
    async (imagenUrl) => {
      expect(await errores({ ...VALIDOS, imagenUrl })).toEqual({
        imagenUrl:
          'Ingresa una URL válida, por ejemplo https://sitio.com/foto.jpg',
      });
    },
  );

  it('pide edades enteras entre 0 y 99', async () => {
    expect(
      await errores({ ...VALIDOS, edadMinima: -1, edadMaxima: 3.5 }),
    ).toEqual({
      edadMinima: 'La edad mínima no puede ser negativa',
      edadMaxima: 'La edad máxima debe ser un número entero de años',
    });
    expect((await errores({ ...VALIDOS, edadMaxima: 100 })).edadMaxima).toBe(
      'La edad máxima puede ser hasta 99 años (99 es «sin límite»)',
    );
  });

  it.each([-1, 2.5, '8'])(
    'rechaza el stock inicial %s: debe ser un entero de 0 o más',
    async (stock) => {
      expect(await errores({ ...VALIDOS, stock })).toEqual({
        stock: 'El stock debe ser un número entero de 0 o más',
      });
    },
  );

  it('al editar no se valida ni se conserva el stock, y se descartan campos como activo', async () => {
    const dto = await validar(
      { ...VALIDOS, stock: -3, activo: false, id: 99 },
      GuardarJugueteDto,
    );

    const { stock: _stock, ...sinStock } = VALIDOS;
    expect(dto).toEqual(sinStock);
  });

  it('rechaza un id de categoría que no es un entero válido', async () => {
    expect(await errores({ ...VALIDOS, categoriaId: 'Peluches' })).toEqual({
      categoriaId: 'Elige una categoría de la lista',
    });
  });
});
