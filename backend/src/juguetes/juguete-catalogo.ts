import type { Juguete } from './entities/juguete.entity.js';

/** Datos de un juguete que se muestran en el catálogo de la tienda. */
export interface JugueteCatalogo {
  id: number;
  nombre: string;
  /** Precio en soles (S/). */
  precio: number;
  imagenUrl: string;
  edadMinima: number;
  edadMaxima: number;
  stock: number;
  /** Un juguete sin stock se muestra como «Agotado» y no se puede agregar al carrito. */
  agotado: boolean;
  categoria: { id: number; nombre: string };
}

export function aJugueteCatalogo(juguete: Juguete): JugueteCatalogo {
  return {
    id: juguete.id,
    nombre: juguete.nombre,
    precio: juguete.precio,
    imagenUrl: juguete.imagenUrl,
    edadMinima: juguete.edadMinima,
    edadMaxima: juguete.edadMaxima,
    stock: juguete.stock,
    agotado: juguete.stock <= 0,
    categoria: { id: juguete.categoria.id, nombre: juguete.categoria.nombre },
  };
}
