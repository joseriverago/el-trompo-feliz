const ORIGEN_LOCAL = 'http://localhost:3000';

/**
 * Orígenes que pueden llamar a la API desde el navegador (CORS).
 * FRONTEND_URL admite varias URL separadas por comas, por ejemplo la del frontend en Vercel.
 * Si no está definida, solo se permite el frontend local.
 */
export function origenesPermitidos(valor = process.env.FRONTEND_URL): string[] {
  const origenes = (valor ?? '')
    .split(',')
    .map((origen) => origen.trim().replace(/\/+$/, ''))
    .filter((origen) => origen !== '');
  return origenes.length > 0 ? origenes : [ORIGEN_LOCAL];
}
