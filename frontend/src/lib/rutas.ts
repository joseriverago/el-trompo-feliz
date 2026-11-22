/** Parámetro de la página de inicio de sesión con la página a la que se vuelve después. */
export const PARAMETRO_VOLVER = "volver";

/** Dirección de la página de inicio de sesión que, al terminar, vuelve a `ruta`. */
export function rutaIniciarSesion(ruta: string): string {
  return ruta === "/" ? "/iniciar-sesion" : `/iniciar-sesion?${PARAMETRO_VOLVER}=${encodeURIComponent(ruta)}`;
}

/**
 * Página a la que se vuelve después de iniciar sesión, o el catálogo si no se indicó.
 * Solo se aceptan rutas de la propia tienda («/juguetes/8»): una dirección de otro sitio
 * («//sitio.com», «https://…») se ignora.
 */
export function rutaDeVuelta(valor: string | string[] | undefined): string {
  const ruta = Array.isArray(valor) ? valor[0] : valor;
  return ruta && ruta.startsWith("/") && !ruta.startsWith("//") && !ruta.startsWith("/\\") ? ruta : "/";
}
