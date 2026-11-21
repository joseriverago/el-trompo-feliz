import type { DataSourceOptions } from 'typeorm';
import { Categoria } from '../categorias/entities/categoria.entity.js';
import { Juguete } from '../juguetes/entities/juguete.entity.js';
import { Usuario } from '../usuarios/entities/usuario.entity.js';

export const ENTIDADES = [Categoria, Juguete, Usuario];

/**
 * Conexión a PostgreSQL (Neon) con la cadena de DATABASE_URL.
 * La aplicación nunca cambia el esquema (synchronize: false); el esquema se
 * crea y actualiza con `npm run db:preparar`.
 */
export function opcionesBaseDeDatos(): DataSourceOptions {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      'Falta la variable de entorno DATABASE_URL (cadena de conexión de Neon).',
    );
  }

  return {
    type: 'postgres',
    url,
    entities: ENTIDADES,
    synchronize: false,
  };
}
