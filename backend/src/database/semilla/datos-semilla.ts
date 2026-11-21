/**
 * Datos de prueba de la tienda. Los carga `npm run db:preparar`.
 * Incluyen un juguete agotado (stock 0) y varios con stock bajo (5 unidades o menos)
 * para probar las reglas del catálogo, del carrito y del inventario.
 */

export interface CategoriaSemilla {
  nombre: string;
}

export interface JugueteSemilla {
  nombre: string;
  descripcion: string;
  precio: number;
  imagenUrl: string;
  edadMinima: number;
  edadMaxima: number;
  stock: number;
  categoria: string;
}

/** Imagen de muestra con el nombre del juguete, en el color de su categoría. */
function imagen(texto: string, fondo: string, color: string): string {
  return `https://placehold.co/600x400/${fondo}/${color}?text=${encodeURIComponent(texto)}`;
}

export const CATEGORIAS_SEMILLA: CategoriaSemilla[] = [
  { nombre: 'Juegos tradicionales' },
  { nombre: 'Peluches' },
  { nombre: 'Construcción' },
  { nombre: 'Didácticos' },
  { nombre: 'Vehículos' },
  { nombre: 'Juegos de mesa' },
];

export const JUGUETES_SEMILLA: JugueteSemilla[] = [
  {
    nombre: 'Trompo de madera clásico',
    descripcion:
      'Trompo de madera torneada con cordel de algodón. El juguete que da nombre a la tienda.',
    precio: 12.9,
    imagenUrl: imagen('Trompo de madera', 'FDE68A', '7C2D12'),
    edadMinima: 6,
    edadMaxima: 12,
    stock: 40,
    categoria: 'Juegos tradicionales',
  },
  {
    nombre: 'Yoyo luminoso',
    descripcion:
      'Yoyo con luces LED que se encienden al girar. Incluye pilas de repuesto.',
    precio: 9.9,
    imagenUrl: imagen('Yoyo luminoso', 'FDE68A', '7C2D12'),
    edadMinima: 6,
    edadMaxima: 12,
    stock: 3,
    categoria: 'Juegos tradicionales',
  },
  {
    nombre: 'Osito de peluche Bruno',
    descripcion:
      'Oso de peluche de 35 cm, suave y lavable, con costuras reforzadas.',
    precio: 49.9,
    imagenUrl: imagen('Osito Bruno', 'FBCFE8', '831843'),
    edadMinima: 0,
    edadMaxima: 5,
    stock: 15,
    categoria: 'Peluches',
  },
  {
    nombre: 'Llama de peluche andina',
    descripcion:
      'Llama de peluche de 30 cm con manta tejida de colores inspirada en los Andes.',
    precio: 39.9,
    imagenUrl: imagen('Llama de peluche', 'FBCFE8', '831843'),
    edadMinima: 0,
    edadMaxima: 8,
    stock: 0,
    categoria: 'Peluches',
  },
  {
    nombre: 'Bloques de construcción 120 piezas',
    descripcion:
      'Bloques encajables de colores en un balde con tapa. Compatibles con las marcas más conocidas.',
    precio: 89.9,
    imagenUrl: imagen('Bloques 120 piezas', 'BFDBFE', '1E3A8A'),
    edadMinima: 3,
    edadMaxima: 8,
    stock: 20,
    categoria: 'Construcción',
  },
  {
    nombre: 'Set de ingeniería robótica',
    descripcion:
      'Kit para armar un robot con motor y sensor de luz. Incluye manual paso a paso.',
    precio: 159.9,
    imagenUrl: imagen('Set de robótica', 'BFDBFE', '1E3A8A'),
    edadMinima: 9,
    edadMaxima: 14,
    stock: 4,
    categoria: 'Construcción',
  },
  {
    nombre: 'Rompecabezas del Perú 500 piezas',
    descripcion:
      'Rompecabezas con el mapa del Perú y sus regiones. Mide 48 × 34 cm armado.',
    precio: 34.9,
    imagenUrl: imagen('Rompecabezas del Perú', 'BBF7D0', '14532D'),
    edadMinima: 9,
    edadMaxima: 99,
    stock: 12,
    categoria: 'Didácticos',
  },
  {
    nombre: 'Ábaco de colores',
    descripcion:
      'Ábaco de madera con 100 cuentas de colores para aprender a contar, sumar y restar.',
    precio: 24.9,
    imagenUrl: imagen('Ábaco de colores', 'BBF7D0', '14532D'),
    edadMinima: 3,
    edadMaxima: 6,
    stock: 25,
    categoria: 'Didácticos',
  },
  {
    nombre: 'Carro a control remoto todoterreno',
    descripcion:
      'Carro 4×4 a escala 1:18 con batería recargable y control de 2,4 GHz.',
    precio: 129.9,
    imagenUrl: imagen('Carro a control remoto', 'FED7AA', '7C2D12'),
    edadMinima: 6,
    edadMaxima: 12,
    stock: 8,
    categoria: 'Vehículos',
  },
  {
    nombre: 'Tren de madera con vías',
    descripcion:
      'Locomotora, dos vagones y 20 piezas de vía de madera para armar circuitos.',
    precio: 79.9,
    imagenUrl: imagen('Tren de madera', 'FED7AA', '7C2D12'),
    edadMinima: 3,
    edadMaxima: 6,
    stock: 5,
    categoria: 'Vehículos',
  },
  {
    nombre: 'Ludo familiar',
    descripcion:
      'Tablero plegable de ludo para 2 a 4 jugadores, con fichas y dados.',
    precio: 29.9,
    imagenUrl: imagen('Ludo familiar', 'DDD6FE', '4C1D95'),
    edadMinima: 5,
    edadMaxima: 99,
    stock: 18,
    categoria: 'Juegos de mesa',
  },
  {
    nombre: 'Ajedrez de madera',
    descripcion:
      'Tablero de ajedrez de madera con piezas talladas y estuche para guardarlas.',
    precio: 59.9,
    imagenUrl: imagen('Ajedrez de madera', 'DDD6FE', '4C1D95'),
    edadMinima: 8,
    edadMaxima: 99,
    stock: 10,
    categoria: 'Juegos de mesa',
  },
];
