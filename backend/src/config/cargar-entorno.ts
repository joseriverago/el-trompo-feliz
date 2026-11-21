import { existsSync } from 'node:fs';

/**
 * Carga las variables de backend/.env cuando se trabaja en local.
 * En Render el archivo no existe: las variables se configuran en el panel del servicio.
 */
export function cargarEntorno(): void {
  if (existsSync('.env')) {
    process.loadEnvFile('.env');
  }
}
