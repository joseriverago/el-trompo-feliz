import type { Carrito } from './entities/carrito.entity.js';

/** Una línea del carrito tal como la muestra la tienda. */
export interface ItemCarritoDto {
  id: number;
  jugueteId: number;
  nombre: string;
  imagenUrl: string;
  /** Precio unitario actual, en soles. */
  precio: number;
  cantidad: number;
  /** Unidades disponibles: la cantidad no puede superarlas. */
  stock: number;
  subtotal: number;
}

/** Respuesta de las rutas del carrito. */
export interface CarritoDto {
  items: ItemCarritoDto[];
  /** Suma de las cantidades: es el número del contador del encabezado. */
  unidades: number;
  total: number;
}

export function aCarritoDto(carrito: Carrito): CarritoDto {
  return {
    items: carrito.items.map((item) => ({
      id: item.id,
      jugueteId: item.jugueteId,
      nombre: item.juguete.nombre,
      imagenUrl: item.juguete.imagenUrl,
      precio: item.juguete.precio,
      cantidad: item.cantidad,
      stock: item.juguete.stock,
      subtotal: item.calcularSubtotal(),
    })),
    unidades: carrito.items.reduce((suma, item) => suma + item.cantidad, 0),
    total: carrito.calcularTotal(),
  };
}
