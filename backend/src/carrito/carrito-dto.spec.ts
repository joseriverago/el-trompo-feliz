import type { Juguete } from '../juguetes/entities/juguete.entity.js';
import { aCarritoDto } from './carrito-dto.js';
import { Carrito } from './entities/carrito.entity.js';
import { ItemCarrito } from './entities/item-carrito.entity.js';

function linea(
  id: number,
  juguete: Partial<Juguete>,
  cantidad: number,
): ItemCarrito {
  return Object.assign(new ItemCarrito(), {
    id,
    jugueteId: juguete.id,
    cantidad,
    juguete: {
      imagenUrl: `https://placehold.co/600x400?text=${juguete.id}`,
      ...juguete,
    },
  });
}

describe('aCarritoDto', () => {
  it('devuelve cada línea con su subtotal, las unidades y el total sin errores de redondeo', () => {
    const carrito = Object.assign(new Carrito(), {
      id: 3,
      usuarioId: 7,
      items: [
        linea(
          100,
          { id: 8, nombre: 'Ábaco de colores', precio: 24.9, stock: 5 },
          3,
        ),
        linea(
          101,
          { id: 12, nombre: 'Ajedrez de madera', precio: 59.9, stock: 2 },
          1,
        ),
      ],
    });

    expect(aCarritoDto(carrito)).toEqual({
      items: [
        {
          id: 100,
          jugueteId: 8,
          nombre: 'Ábaco de colores',
          imagenUrl: 'https://placehold.co/600x400?text=8',
          precio: 24.9,
          cantidad: 3,
          stock: 5,
          subtotal: 74.7,
        },
        {
          id: 101,
          jugueteId: 12,
          nombre: 'Ajedrez de madera',
          imagenUrl: 'https://placehold.co/600x400?text=12',
          precio: 59.9,
          cantidad: 1,
          stock: 2,
          subtotal: 59.9,
        },
      ],
      unidades: 4,
      total: 134.6,
    });
  });

  it('un carrito vacío tiene 0 unidades y total 0', () => {
    const carrito = Object.assign(new Carrito(), {
      id: 3,
      usuarioId: 7,
      items: [],
    });

    expect(aCarritoDto(carrito)).toEqual({ items: [], unidades: 0, total: 0 });
  });
});
